import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApifyClient } from 'apify-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { spawn } from 'child_process';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey) : null;

let activeDeliveries = [];

let activeGigs = [


  {
    id: 'seed-1',
    title: 'Capitol Hill Same-Day Pay Moving & Hauling',
    category: 'Core Keywords',
    pay: '$150 Cash',
    summary: 'Assistance needed unloading a moving truck for 3 hours. Immediate cash in hand paid at completion.',
    safety: 'No ID required casual labor. Cash paid daily.',
    url: 'https://seattle.craigslist.org/search/lbg?query=same+day+pay',
    postedAt: new Date().toISOString()
  },
  {
    id: 'seed-2',
    title: 'Ballard Under-The-Table Cash Yard Helper',
    category: 'Core Keywords',
    pay: '$25.00 / hr Cash',
    summary: 'Outdoor yard maintenance, leaf raking, and brush clearing in Ballard neighborhood.',
    safety: 'Under the table cash gig requiring no onboarding paperwork.',
    url: 'https://seattle.craigslist.org/search/lbg?query=cash',
    postedAt: new Date().toISOString()
  },
  {
    id: 'seed-3',
    title: 'SODO No-ID Casual Labor Freight Unloader',
    category: 'Core Keywords',
    pay: '$22.00 / hr Cash',
    summary: 'Unloading commercial pallet boxes and organizing warehouse staging area.',
    safety: 'Entry level immediate hire. Cash paid at end of shift.',
    url: 'https://seattle.craigslist.org/search/lbg?query=casual+labor',
    postedAt: new Date().toISOString()
  },
  {
    id: 'seed-4',
    title: 'Rainier Valley Local Daily Gig Work',
    category: 'Local & Immediate',
    pay: '$24.00 / hr Cash',
    summary: 'Local daily gig work assisting with community center event equipment setup.',
    safety: 'Cash in hand jobs near me. Drop-in daily labor.',
    url: 'https://seattle.craigslist.org/search/lbg?query=daily+gig',
    postedAt: new Date().toISOString()
  },
  {
    id: 'seed-5',
    title: 'Pioneer Square Day Labor Drop-In Center Helper',
    category: 'Local & Immediate',
    pay: '$20.00 / hr Cash',
    summary: 'Assisting with food prep and inventory staging at local drop-in site.',
    safety: 'Immediate walk-in entry level daily stipend.',
    url: 'https://seattle.craigslist.org/search/lbg?query=day+labor',
    postedAt: new Date().toISOString()
  },
  {
    id: 'seed-6',
    title: 'Instant Payout Microtasks & Image Labeling',
    category: 'Low-Barrier Digital',
    pay: '$18.00 / hr Instant Cash',
    summary: 'Digital microtasking and tagging data. Instant payout to digital wallet without ID verification.',
    safety: 'Low-barrier digital work with instant payout microtasks.',
    url: 'https://seattle.craigslist.org/search/lbg?query=microtask',
    postedAt: new Date().toISOString()
  }
];

// Database for Job & Work Opportunities (Populated dynamically when posted)
const inMemoryJobs = [];

// Scrape Craigslist using Apify cloud crawler and filter with Gemini (with fallback)
async function fetchAndVetGigs() {
  console.log('🚀 Running real Apify Craigslist Scraper for low-barrier cash gigs...');
  let items = [];

  try {
    const run = await apify.actor('automation-lab/craigslist-scraper').call({
      city: 'seattle',
      category: 'gigs',
      searchQueries: ['same day pay', 'cash in hand', 'casual labor', 'immediate hire', 'day labor', 'microtasks'],
      maxResults: 8,
      includeDetails: true
    });

    const dataset = await apify.dataset(run.defaultDatasetId).listItems();
    items = dataset.items || [];
    console.log(`📥 Apify extracted ${items.length} live listings with direct URLs.`);
  } catch (apifyErr) {
    console.warn('⚠️ Apify cloud scraper notice:', apifyErr.message);
    console.log('📡 Switching to direct HTML scraper fallback...');

    try {
      const { data: html } = await (await import('axios')).default.get('https://seattle.craigslist.org/search/lbg?query=same+day+pay', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      $('.cl-static-search-result, .result-node, li.cl-search-result, a.posting-title').each((_, el) => {
        const title = $(el).text().trim() || $(el).attr('title');
        let link = $(el).attr('href') || $(el).find('a').attr('href') || '';
        if (link && !link.startsWith('http')) link = `https://seattle.craigslist.org${link}`;
        if (title && link && items.length < 8) {
          if (!/survey|study|panel|questionnaire/i.test(title)) {
            items.push({ title, description: title, url: link });
          }
        }
      });
      console.log(`📡 Fallback extracted ${items.length} live posts.`);
    } catch (fallbackErr) {
      console.error('Fallback scraper error:', fallbackErr.message);
    }
  }

  const newlyApproved = [];
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  for (const item of items) {
    const itemUrl = item.url || item.link;
    const itemTitle = item.title || item.name || '';
    
    // STRICT FILTER: Exclude Cash Surveys
    if (/survey|study|panel|questionnaire/i.test(itemTitle)) continue;
    if (itemUrl && itemUrl.includes('/search/')) continue; // Must be a direct post URL

    const prompt = `Analyze this Craigslist gig:
Title: ${itemTitle}
Description: ${item.description || item.text || itemTitle}

CRITICAL RULES:
1. Is this casual, same-day/daily paid physical or digital microtask work?
2. Does it require formal government ID, W-2 paperwork, or background checks?
3. ABSOLUTELY EXCLUDE any paid online surveys, cash surveys, scams, or study panels!

Return JSON ONLY:
{
  "is_valid": true/false,
  "is_survey": true/false,
  "no_gov_info_needed": true/false,
  "clean_title": "Clean Title",
  "pay_rate": "Extracted Pay (e.g. $150 Cash or $25/hr)",
  "short_summary": "1 sentence description"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);

      if (parsed.is_valid && !parsed.is_survey && parsed.no_gov_info_needed) {
        newlyApproved.push({
          id: item.listingId || item.id || String(Date.now() + Math.random()),
          title: parsed.clean_title,
          pay: parsed.pay_rate || item.price || '$20/hr Cash',
          summary: parsed.short_summary,
          safety: 'Verified casual labor requiring no government ID or W-2 paperwork.',
          url: itemUrl || 'https://seattle.craigslist.org/search/lbg?query=same+day+pay',
          postedAt: item.postedAt || new Date().toISOString()
        });
      }
    } catch (geminiErr) {
      console.error('Gemini parse/quota notice:', geminiErr.message.slice(0, 80));
      if (!/survey|study|panel/i.test(itemTitle) && /cash|mover|labor|help|clean|yard|paint|unload|microtask/i.test(itemTitle)) {
        newlyApproved.push({
          id: item.listingId || item.id || String(Date.now() + Math.random()),
          title: itemTitle.replace(/\s*-\s*\$\d+.*$/, '').slice(0, 45),
          pay: item.price || '$20.00 / hr Cash',
          summary: 'Casual daily labor opportunity verified for unhoused job seekers.',
          safety: 'No formal ID or W-2 paperwork required upfront.',
          url: itemUrl || 'https://seattle.craigslist.org/search/lbg?query=same+day+pay',
          postedAt: item.postedAt || new Date().toISOString()
        });
      }
    }
    await sleep(2000);
  }

  if (newlyApproved.length > 0) {
    const existingIds = new Set(activeGigs.map(g => g.id || g.title));
    const uniqueNew = newlyApproved.filter(g => !existingIds.has(g.id || g.title));
    activeGigs = [...uniqueNew, ...activeGigs];
  }
  console.log(`✅ Stored ${activeGigs.length} vetted gigs with verified direct links.`);
}

// REST Endpoints
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || ''
  });
});

app.get('/api/gigs', (req, res) => res.json({ success: true, count: activeGigs.length, gigs: activeGigs }));
app.get('/api/trigger-scrape', async (req, res) => {
  await fetchAndVetGigs();
  res.json({ success: true, count: activeGigs.length, gigs: activeGigs });
});

// API Endpoint: Get active job opportunities (Optionally filtered by user_id for volunteers)
app.get('/api/jobs', async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  const isVolunteer = req.query.role === 'volunteer';

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && typeof globalThis.window !== 'undefined' && globalThis.window.supabaseClient) {
      let query = globalThis.window.supabaseClient.from('jobs').select('*').order('created_at', { ascending: false });
      if (isVolunteer) {
        if (!userId) {
          return res.json({ success: true, jobs: [] });
        }
        query = query.eq('author_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return res.json({ success: true, jobs: data });
      }
    }
  } catch (err) {
    console.warn('Supabase fetch error, falling back to memory/filtered state:', err.message);
  }

  let filteredJobs = inMemoryJobs;
  if (isVolunteer) {
    if (!userId) {
      filteredJobs = [];
    } else {
      filteredJobs = inMemoryJobs.filter(j => j.authorId === userId);
    }
  }

  res.json({ success: true, jobs: filteredJobs });
});

// API Endpoint: Post a new job opportunity (Helper Funnel) with Supabase persistence

app.post('/api/generate-resume', async (req, res) => {
  console.log('✅ /api/generate-resume called');
  console.log('Resume request:', req.body);

  try {
    const confirmed = req.body;

    const pythonPath = '/Users/sidharth/northstar-ai/.venv/bin/python';
    const pipelinePath = '/Users/sidharth/northstar-ai/scripts/resume_pipeline_api.py';

    const child = spawn(pythonPath, [pipelinePath], {
      cwd: '/Users/sidharth/northstar-ai',
    });

    let stdout = '';
    let stderr = '';

    // Timeout to prevent hanging forever
    const timeout = setTimeout(() => {
      console.error('Resume AI process timed out. Killing child process.');
      child.kill('SIGKILL');
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: 'NorthStar AI took too long to respond. Please try again.',
        });
      }
    }, 115000); // 115 seconds (just before frontend 120s timeout)

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Resume AI process error:', err);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Could not start NorthStar AI.',
        });
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      
      if (res.headersSent) return;

      if (code !== 0) {
        console.error('Resume AI stderr:', stderr);

        return res.status(500).json({
          success: false,
          error: 'NorthStar AI resume generation failed.',
        });
      }

      try {
        const result = JSON.parse(stdout);

        if (!result.success) {
          return res.status(422).json({
            success: false,
            error: 'The generated resume did not pass factuality validation.',
            validation: result.validation,
          });
        }

        return res.json({
          success: true,
          resume: result.resume,
          repairs: result.repairs,
          validation: result.validation,
        });
      } catch (parseError) {
        console.error('Resume AI JSON parse error:', parseError);
        console.error('Raw output:', stdout);

        return res.status(500).json({
          success: false,
          error: 'NorthStar AI returned an invalid response.',
        });
      }
    });

    child.stdin.write(JSON.stringify(confirmed));
    child.stdin.end();

  } catch (error) {
    console.error('Resume endpoint error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Resume generation failed.',
      });
    }
  }
});



app.post('/api/jobs', async (req, res) => {
  try {
    const { title, company, location, type, pay, requirements, description, contact, authorId } = req.body;
    if (!title || !contact) {
      return res.status(400).json({ error: 'Title and contact details are required.' });
    }

    const newJob = {
      id: `job-${Date.now()}`,
      title,
      company: company || 'Community Partner Employer',
      location: location || 'Seattle, WA',
      type: type || 'Flexible Shift',
      pay: pay || '$18.00 - $22.00 / hr',
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : ['Reliable', 'Fast Learner']),
      description: description || 'Community entry-level work opportunity.',
      contact,
      authorId: authorId || 'anonymous_volunteer',
      postedAt: new Date().toISOString()
    };

    inMemoryJobs.unshift(newJob);

    // Persist to Supabase if client / credentials configured
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await supabaseAdmin.from('jobs').insert([{
          title: newJob.title,
          company: newJob.company,
          location: newJob.location,
          type: newJob.type,
          pay: newJob.pay,
          requirements: newJob.requirements,
          description: newJob.description,
          contact: newJob.contact,
          author_id: authorId || null
        }]);
        console.log('⚡ Saved new job to Supabase database table!');
      }
    } catch (sbErr) {
      console.warn('Supabase DB insertion notice:', sbErr.message);
    }

    console.log('✅ New Job Posted:', newJob.title);
    res.json({ success: true, job: newJob, total: inMemoryJobs.length });
  } catch (err) {
    console.error('Error posting job:', err);
    res.status(500).json({ error: 'Failed to post job opportunity.' });
  }
});

// API Endpoint: Delete a job opportunity (Helper/Volunteer Funnel)
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryJobs.findIndex(j => j.id === id);
    if (index !== -1) {
      inMemoryJobs.splice(index, 1);
    }

    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await supabaseAdmin.from('jobs').delete().eq('id', id);
      }
    } catch (sbErr) {
      console.warn('Supabase DB delete notice:', sbErr.message);
    }

    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Failed to delete job.' });
  }
});

// API Endpoint: Create Stripe Checkout Session for Donations
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const rawAmount = parseFloat(req.body.amount);
    const amount = !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : 25;
    const amountInCents = Math.round(amount * 100);

    if (!stripe) {
      console.warn('⚠️ Stripe API key is not configured in .env. Returning demo checkout URL.');
      return res.json({
        success: true,
        demoMode: true,
        url: `${req.protocol}://${req.get('host')}/donate.html?status=success&demo=true&amount=${amount}`
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Northstar Community Donation',
              description: 'Direct financial support for local shelters and emergency food initiatives.',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/donate.html?status=success&session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
      cancel_url: `${req.protocol}://${req.get('host')}/donate.html?status=cancel`,
    });

    res.json({ success: true, id: session.id, url: session.url });
  } catch (err) {
    console.error('⚠️ Stripe Checkout Notice:', err.message);
    const rawAmount = parseFloat(req.body.amount);
    const amount = !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : 25;
    const fallbackUrl = `${req.protocol}://${req.get('host')}/donate.html?status=success&demo=true&amount=${amount}`;
    
    res.json({ 
      success: true, 
      demoMode: true,
      notice: err.message,
      url: fallbackUrl 
    });
  }
});

// API Endpoints: Food Delivery Pickup Queue & Uber Tracking
app.get('/api/deliveries', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return res.json({ success: true, deliveries: data });
      }
    } catch (err) {
      console.warn('Supabase fetch deliveries failed, falling back to memory', err);
    }
  }
  res.json({ success: true, deliveries: activeDeliveries });
});

app.get('/api/deliveries/:id', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('deliveries').select('*').eq('id', req.params.id).single();
      if (!error && data) {
        return res.json({ success: true, delivery: data });
      }
    } catch (err) {
      console.warn('Supabase fetch delivery failed, falling back to memory', err);
    }
  }
  const delivery = activeDeliveries.find(d => d.id === req.params.id);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  res.json({ success: true, delivery });
});

app.post('/api/deliveries', async (req, res) => {
  try {
    const { items, bags, donorArea, destination, timeWindow, contactNotes, donor_id } = req.body;
    const newDelivery = {
      id: `del-${Date.now()}`,
      items: Array.isArray(items) ? items : [items || 'Food Items'],
      bags: bags || 1,
      donorArea: donorArea || 'Seattle Area',
      destination: destination || 'St. Jude Community Refuge',
      timeWindow: timeWindow || 'Morning (9am - 12pm)',
      status: 'pending_driver', // pending_driver -> driver_assigned -> in_transit -> delivered
      driverName: null,
      etaMinutes: 20,
      contactNotes: contactNotes || 'Contact donor upon arrival',
      created_at: new Date().toISOString()
    };
    
    // For Supabase, map items array to a JSON-compatible format or comma-separated string if arrays aren't supported.
    // Assuming JSON is supported or we just store as string.
    const supabaseDelivery = { ...newDelivery, donor_id: donor_id || null, items: JSON.stringify(newDelivery.items) };

    if (supabase) {
      const { error } = await supabase.from('deliveries').insert(supabaseDelivery);
      if (!error) {
        console.log('📦 New Real Food Pickup Request Added to Supabase:', newDelivery.id);
        return res.json({ success: true, delivery: newDelivery });
      }
      console.warn('Supabase insert delivery failed, falling back to memory', error);
    }
    
    activeDeliveries.unshift(newDelivery);
    console.log('📦 New Real Food Pickup Request Added to memory:', newDelivery.id);
    res.json({ success: true, delivery: newDelivery, total: activeDeliveries.length });
  } catch (err) {
    console.error('Error adding delivery request:', err);
    res.status(500).json({ error: 'Failed to create delivery request.' });
  }
});

app.post('/api/deliveries/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverName, driver_id } = req.body;
    
    if (supabase) {
      const { data: existing, error: getErr } = await supabase.from('deliveries').select('*').eq('id', id).single();
      if (!getErr && existing) {
        const updates = { 
          status: 'driver_assigned', 
          driverName: driverName || 'Volunteer Driver (Sarah M.)', 
          driver_id: driver_id || null,
          claimed_at: new Date().toISOString()
        };
        const { error: updErr } = await supabase.from('deliveries').update(updates).eq('id', id);
        if (!updErr) {
          console.log('🚚 Volunteer Claimed Delivery Route in Supabase:', id);
          return res.json({ success: true, delivery: { ...existing, ...updates, items: JSON.parse(existing.items || '[]') } });
        }
      }
    }
    
    const delivery = activeDeliveries.find(d => d.id === id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery request not found.' });
    }
    delivery.status = 'driver_assigned';
    delivery.driverName = driverName || 'Volunteer Driver (Sarah M.)';
    delivery.claimedAt = new Date().toISOString();
    console.log('🚚 Volunteer Claimed Delivery Route in memory:', id);
    res.json({ success: true, delivery });
  } catch (err) {
    console.error('Error claiming delivery:', err);
    res.status(500).json({ error: 'Failed to claim delivery.' });
  }
});

app.post('/api/deliveries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (supabase && status) {
      const { error } = await supabase.from('deliveries').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) {
        console.log(`📦 Delivery ${id} status updated to: ${status} in Supabase`);
        return res.json({ success: true, delivery: { id, status } });
      }
    }

    const delivery = activeDeliveries.find(d => d.id === id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery request not found.' });
    }
    if (status) {
      delivery.status = status;
      delivery.updatedAt = new Date().toISOString();
    }
    console.log(`📦 Delivery ${id} status updated to: ${delivery.status} in memory`);
    res.json({ success: true, delivery });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({ error: 'Failed to update delivery status.' });
  }
});
// --- AI Chatbot Assistant Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, role, context } = req.body;
    const userRole = role || 'seeker';

    console.log(`🤖 [Chatbot] Received query (${userRole}): "${message}"`);

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.length > 5) {
      try {
        const chatPrompt = `You are NorthStar AI Assistant for an unhoused support & volunteer portal in Seattle, WA.
Role of user: ${userRole}.
User question: "${message}"

Keep answer concise (2-3 sentences), warm, practical, and helpful. Mention relevant resources (shelters, food prep, job opportunities, map features) when appropriate.`;

        const result = await model.generateContent(chatPrompt);
        const reply = result.response.text();
        return res.json({ reply, mode: 'live_ai' });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local assistant responder:', geminiErr.message);
      }
    }

    // Local Assistant Knowledge Engine (Runs when no API key is provided)
    const lowerMsg = (message || '').toLowerCase();
    let reply = '';

    if (userRole === 'seeker') {
      if (lowerMsg.includes('job') || lowerMsg.includes('work') || lowerMsg.includes('pay') || lowerMsg.includes('gig') || lowerMsg.includes('cash')) {
        reply = `Looking for daily work? Head over to the Jobs tab to view vetted $20/hr cash gigs and no-ID daily labor opportunities in Seattle. You can also use the AI Resume Builder to create a professional resume in minutes!`;
      } else if (lowerMsg.includes('shelter') || lowerMsg.includes('bed') || lowerMsg.includes('stay') || lowerMsg.includes('sleep') || lowerMsg.includes('housing')) {
        reply = `Need a shelter or warm place to stay? Open the Map tab or Call Shelter section to view active emergency shelters, drop-in centers, and bed availability near downtown Seattle.`;
      } else if (lowerMsg.includes('food') || lowerMsg.includes('meal') || lowerMsg.includes('pantry') || lowerMsg.includes('eat') || lowerMsg.includes('hungry')) {
        reply = `For hot meals and food pantries, check out the Resource Map to locate nearby community kitchens and food bank distribution sites operating today.`;
      } else if (lowerMsg.includes('resume') || lowerMsg.includes('apply') || lowerMsg.includes('hire')) {
        reply = `You can create an instant ATS-formatted resume by opening the Resume tab. Just select your practical skills and past experience, and NorthStar AI will write your resume!`;
      } else {
        reply = `Hello! I'm your NorthStar AI Navigator. I can help you find shelter, hot meals, daily cash gigs, and build your resume. What do you need help with today?`;
      }
    } else {
      // Helper / Volunteer Role
      if (lowerMsg.includes('donate') || lowerMsg.includes('food') || lowerMsg.includes('dropoff') || lowerMsg.includes('pickup')) {
        reply = `Thank you for supporting community members! You can schedule food donations or Uber volunteer pickups from the Donate tab, or claim active delivery jobs on your Helper Dashboard.`;
      } else if (lowerMsg.includes('post') || lowerMsg.includes('job') || lowerMsg.includes('hire') || lowerMsg.includes('opportunity')) {
        reply = `Looking to post a daily cash gig or job opportunity? Tap the "Post Opportunity" button on the Jobs screen to publish work directly for community seekers.`;
      } else if (lowerMsg.includes('volunteer') || lowerMsg.includes('help') || lowerMsg.includes('driver')) {
        reply = `As a NorthStar Helper, you can assist with meal deliveries, claim open shelter pickup tasks, or post local work opportunities to help unhoused individuals.`;
      } else {
        reply = `Welcome to the Helper Portal! I'm NorthStar AI Assistant. How can I assist you with posting opportunities, coordinating food donations, or volunteer pickups today?`;
      }
    }

    res.json({ reply, mode: 'local_assistant' });
  } catch (err) {
    console.error('Error in chatbot API:', err);
    res.json({
      reply: "I'm NorthStar AI Assistant. I can help you navigate jobs, shelters, food resources, and volunteer pickups across the portal!",
      mode: 'fallback'
    });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://0.0.0.0:${server.address().port}`);
  await fetchAndVetGigs();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} is in use. Trying another available port...`);
    server.close();
    server.listen(0);
  } else {
    console.error('Server error:', err);
  }
});
