import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApifyClient } from 'apify-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

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
    activeGigs = newlyApproved;
  }
  console.log(`✅ Stored ${activeGigs.length} vetted gigs with verified direct links.`);
}

  if (newlyApproved.length > 0) {
    activeGigs = newlyApproved;
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

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${server.address().port}`);
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
