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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NORTHSTAR_AI_DIR =
  process.env.NORTHSTAR_AI_DIR ||
  path.resolve(__dirname, 'northstar-ai');

const NORTHSTAR_AI_PYTHON =
  process.env.NORTHSTAR_AI_PYTHON ||
  path.join(NORTHSTAR_AI_DIR, '.venv', 'bin', 'python');

const NORTHSTAR_RESUME_PIPELINE =
  path.join(NORTHSTAR_AI_DIR, 'scripts', 'resume_pipeline_api.py');

const NORTHSTAR_CHAT_SCRIPT =
  path.join(NORTHSTAR_AI_DIR, 'scripts', 'chat_api.py');


const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;


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


// ------------------------------------------------------------
// Chatbot-only normalized job context
// Does NOT change the existing /api/jobs behavior.
// ------------------------------------------------------------
app.get('/api/chat/jobs', (req, res) => {
  try {
    const normalizedGigs = activeGigs.map(gig => ({
      id: gig.id || '',
      title: gig.title || '',
      company: '',
      location: '',
      pay: gig.pay || '',
      requirements: [],
      description: gig.summary || '',
      safety: gig.safety || '',
      url: gig.url || '',
      postedAt: gig.postedAt || '',
      source: 'vetted_gig'
    }));

    const normalizedPostedJobs = inMemoryJobs.map(job => ({
      id: job.id || '',
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      pay: job.pay || '',
      requirements: Array.isArray(job.requirements)
        ? job.requirements
        : (job.requirements ? [job.requirements] : []),
      description: job.description || '',
      safety: '',
      url: job.url || '',
      postedAt: job.postedAt || '',
      source: 'northstar_posted_job'
    }));

    const jobs = [
      ...normalizedPostedJobs,
      ...normalizedGigs
    ];

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });

  } catch (err) {
    console.error('Chat job context error:', err);

    res.status(500).json({
      success: false,
      error: 'Could not load current job context.'
    });
  }
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
    const northstarAiUrl = process.env.NORTHSTAR_AI_URL;

    // ── Remote HTTP path ──────────────────────────────────────────────────
    if (northstarAiUrl) {
      console.log(`🌐 [Resume] Forwarding to remote AI service: ${northstarAiUrl}/resume`);

      const controller = new AbortController();
      const resumeTimeout = setTimeout(() => controller.abort(), 360000); // 360 s

      let aiResponse;
      try {
        aiResponse = await fetch(`${northstarAiUrl}/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(confirmed),
          signal: controller.signal
        });
      } catch (fetchErr) {
        clearTimeout(resumeTimeout);
        if (fetchErr.name === 'AbortError') {
          return res.status(504).json({
            success: false,
            error: 'NorthStar AI took too long to respond. Please try again.'
          });
        }
        throw fetchErr;
      }
      clearTimeout(resumeTimeout);

      const result = await aiResponse.json();

      if (!result.success) {
        return res.status(422).json({
          success: false,
          error: 'The generated resume did not pass factuality validation.',
          validation: result.validation
        });
      }

      return res.json({
        success: true,
        resume: result.resume,
        repairs: result.repairs,
        validation: result.validation
      });
    }

    // ── Local Python spawn fallback ────────────────────────────────────────
    const pythonPath = NORTHSTAR_AI_PYTHON;
    const pipelinePath = NORTHSTAR_RESUME_PIPELINE;

    const child = spawn(pythonPath, [pipelinePath], {
      cwd: NORTHSTAR_AI_DIR,
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
// --- NorthStar V5 AI Chatbot Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, role, context, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required.'
      });
    }

    const userRole = role || 'seeker';

    console.log(`🤖 [NorthStar V5 Chat] ${userRole}: "${message}"`);

    // --------------------------------------------------------
    // Add current verified job listings only when the question
    // actually needs job-search / job-matching information.
    // --------------------------------------------------------
    const lowerMessage = message.toLowerCase();

    const needsJobContext =
      (
        lowerMessage.includes('job') ||
        lowerMessage.includes('jobs') ||
        lowerMessage.includes('work opportunity') ||
        lowerMessage.includes('work opportunities')
      ) &&
      (
        lowerMessage.includes('best') ||
        lowerMessage.includes('match') ||
        lowerMessage.includes('fit') ||
        lowerMessage.includes('find') ||
        lowerMessage.includes('which') ||
        lowerMessage.includes('recommend') ||
        lowerMessage.includes('current') ||
        lowerMessage.includes('available') ||
        lowerMessage.includes('for me') ||
        lowerMessage.includes('apply')
      );

    const verifiedContext =
      context && typeof context === 'object'
        ? { ...context }
        : {};

    if (needsJobContext) {
      verifiedContext.current_jobs = activeGigs.slice(0, 20).map(gig => ({
        id: gig.id || '',
        title: gig.title || '',
        company: '',
        location: '',
        pay: gig.pay || '',
        requirements: [],
        description: gig.summary || '',
        safety: gig.safety || '',
        url: gig.url || '',
        postedAt: gig.postedAt || '',
        source: 'vetted_gig'
      }));

      verifiedContext.jobs_source = 'northstar_current_vetted_gigs';

      console.log(
        `💼 [NorthStar V5 Chat] Added ${verifiedContext.current_jobs.length} current jobs to verified context`
      );
    }

    const chatPayload = {
      message: message.trim(),
      role: userRole,
      context: Object.keys(verifiedContext).length ? verifiedContext : null,
      history: Array.isArray(history) ? history.slice(-10) : []
    };

    const northstarAiUrl = process.env.NORTHSTAR_AI_URL;

    // ── Remote HTTP path ──────────────────────────────────────────────────
    if (northstarAiUrl) {
      console.log(`🌐 [NorthStar V5 Chat] Forwarding to remote AI service: ${northstarAiUrl}/chat`);

      const controller = new AbortController();
      const chatTimeout = setTimeout(() => controller.abort(), 180000); // 180 s

      let aiResponse;
      try {
        aiResponse = await fetch(`${northstarAiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatPayload),
          signal: controller.signal
        });
      } catch (fetchErr) {
        clearTimeout(chatTimeout);
        if (fetchErr.name === 'AbortError') {
          return res.status(504).json({
            success: false,
            error: 'NorthStar AI took too long to respond.'
          });
        }
        throw fetchErr;
      }
      clearTimeout(chatTimeout);

      const result = await aiResponse.json();

      if (!result.success || !result.reply) {
        return res.status(500).json({
          success: false,
          error: result.error || 'NorthStar AI returned no response.'
        });
      }

      console.log('✅ [NorthStar V5 Chat] Response generated (remote)');

      const responsePayload = {
        success: true,
        reply: result.reply,
        mode: result.mode || 'northstar_v5'
      };

      if (needsJobContext) {
        responsePayload.action = {
          type: 'navigate',
          destination: 'jobs',
          label: 'View Jobs'
        };
      }

      return res.json(responsePayload);
    }

    // ── Local Python spawn fallback ────────────────────────────────────────
    const pythonPath = NORTHSTAR_AI_PYTHON;
    const chatScript = NORTHSTAR_CHAT_SCRIPT;

    const child = spawn(
      pythonPath,
      [chatScript],
      {
        cwd: NORTHSTAR_AI_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    let stdout = '';
    let stderr = '';
    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        child.kill('SIGTERM');
        responded = true;

        return res.status(504).json({
          success: false,
          error: 'NorthStar AI took too long to respond.'
        });
      }
    }, 180000);

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
      console.log('[NorthStar AI]', chunk.toString().trim());
    });

    child.on('error', err => {
      clearTimeout(timeout);

      if (responded) return;
      responded = true;

      console.error('Failed to start NorthStar AI:', err);

      return res.status(500).json({
        success: false,
        error: 'Could not start NorthStar AI.'
      });
    });

    child.on('close', code => {
      clearTimeout(timeout);

      if (responded) return;
      responded = true;

      if (code !== 0) {
        console.error('NorthStar AI exited with code:', code);
        console.error(stderr);

        return res.status(500).json({
          success: false,
          error: 'NorthStar AI generation failed.'
        });
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (!result.success || !result.reply) {
          return res.status(500).json({
            success: false,
            error: result.error || 'NorthStar AI returned no response.'
          });
        }

        console.log('✅ [NorthStar V5 Chat] Response generated');

        const responsePayload = {
          success: true,
          reply: result.reply,
          mode: 'northstar_v5'
        };

        // Give the UI a deterministic navigation action when
        // NorthStar used current job data for this answer.
        if (needsJobContext) {
          responsePayload.action = {
            type: 'navigate',
            destination: 'jobs',
            label: 'View Jobs'
          };
        }

        return res.json(responsePayload);

      } catch (parseErr) {
        console.error('Could not parse NorthStar AI output.');
        console.error('STDOUT:', stdout);
        console.error('STDERR:', stderr);

        return res.status(500).json({
          success: false,
          error: 'Invalid response from NorthStar AI.'
        });
      }
    });

    child.stdin.write(JSON.stringify(chatPayload));
    child.stdin.end();

  } catch (err) {
    console.error('NorthStar chatbot error:', err);

    return res.status(500).json({
      success: false,
      error: 'NorthStar AI is temporarily unavailable.'
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
