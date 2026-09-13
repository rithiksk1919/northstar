/**
 * NorthStar Supabase Browser Client Initialization
 *
 * Credentials are fetched from the server-side /api/config endpoint so that
 * no Supabase URL or key is ever hardcoded in this file.
 *
 * The server reads SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from .env and
 * sends them to the browser. The service role key is never sent here.
 */

(async function initNorthStarSupabase() {
  if (typeof window === 'undefined') return;

  // If another script already initialized the client, skip.
  if (window.supabaseClient) return;

  let supabaseUrl = '';
  let supabaseKey = '';

  // Fetch config from the Node server (single source of truth for credentials)
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      supabaseUrl = (config.supabaseUrl || '').trim();
      supabaseKey  = (config.supabaseAnonKey || '').trim();
    }
  } catch (e) {
    console.warn('[Supabase] Could not fetch /api/config:', e.message);
  }

  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    console.error('[Supabase] SUPABASE_URL is missing or invalid. Check your .env file.');
    return;
  }

  if (!supabaseKey) {
    console.error('[Supabase] SUPABASE_PUBLISHABLE_KEY is missing. Check your .env file.');
    return;
  }

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ [Supabase] Client initialized for project:', supabaseUrl);
  } else {
    console.error('[Supabase] supabase-js library not loaded. Check CDN script tag.');
  }
})();
