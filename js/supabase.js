/**
 * Northstar Supabase Global Client Initialization
 * Plain browser JS script using standard browser window references
 */

const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
  ? process.env.SUPABASE_URL.trim()
  : 'https://gvhyukdmuhvitonzlxoq.supabase.co';

const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY)
  ? process.env.SUPABASE_ANON_KEY.trim()
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aHl1a2RtdWh2aXRvbnpseG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzE0NTMsImV4cCI6MjEwMjQwNzQ1M30.822oKaNPMpHjcdksRD1jrs6fmX-WzapAVTXeCDefDgA';

// Ensure SUPABASE_URL includes https:// and points to an active Supabase project
if (!SUPABASE_URL.startsWith('https://')) {
  console.error('SUPABASE_URL must include https:// and point to an active Supabase project:', SUPABASE_URL);
}

// Ensure SUPABASE_ANON_KEY is not a placeholder string
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('YOUR_KEY_HERE') || SUPABASE_ANON_KEY.includes('YOUR_ACTUAL_ANON_KEY')) {
  console.error('SUPABASE_ANON_KEY must be a valid, non-placeholder Supabase anon key.');
}

/**
 * Global Supabase client initialization using standard browser window references
 */
if (typeof window !== 'undefined') {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client successfully initialized on window.supabaseClient');
  } else {
    console.error('Supabase library failed to load from CDN/npm.');
  }
}
