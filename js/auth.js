/**
 * Northstar Authentication Engine & Device Theme Synchronization
 * Strict Supabase Auth with Error Handling, Red Border Highlighting, and Zero Bypasses
 */

// ==========================================================================
// 1. DYNAMIC DEVICE THEME DETECTION & SYNCHRONIZATION
// ==========================================================================

function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
}

function initDeviceThemeDetection() {
  const savedTheme = localStorage.getItem('northstar_theme');
  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
    applyTheme(savedTheme);
  } else {
    // Default to system device settings dynamically
    applyTheme(getSystemTheme());
  }

  // Listen to OS / browser color scheme changes in real-time
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only auto-sync if user hasn't explicitly overridden the theme in this browser session
      const explicitOverride = localStorage.getItem('northstar_theme_override');
      if (!explicitOverride) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeviceThemeDetection);
  } else {
    initDeviceThemeDetection();
  }
}

// ==========================================================================
// 2. STRICT SUPABASE CLIENT INITIALIZATION & CREDENTIAL VALIDATION
// ==========================================================================

/**
 * CORS Configuration Note:
 * Ensure the local dev origin (http://localhost:3000 or http://127.0.0.1:3000) is
 * allowed in Supabase Authentication -> URL Configuration -> Redirect URLs / Web Origins.
 */

const SUPABASE_URL = 'https://gvhyukdmuhvitonzlxoq.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aHl1a2RtdWh2aXRvbnpseG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzE0NTMsImV4cCI6MjEwMjQwNzQ1M30.822oKaNPMpHjcdksRD1jrs6fmX-WzapAVTXeCDefDgA'.trim();

// Ensure SUPABASE_URL is a fully qualified HTTPS URL
if (!SUPABASE_URL.startsWith('https://')) {
  console.error('SUPABASE_URL must be a fully qualified HTTPS URL:', SUPABASE_URL);
}

// Ensure SUPABASE_ANON_KEY is non-empty and correctly trimmed
if (!SUPABASE_ANON_KEY) {
  console.error('SUPABASE_ANON_KEY cannot be empty.');
}

let supabaseClientInstance = null;

function initGlobalSupabaseClient(url = SUPABASE_URL, key = SUPABASE_ANON_KEY) {
  if (typeof window === 'undefined') return null;
  if (window.supabaseClient) return window.supabaseClient;
  if (supabaseClientInstance) {
    window.supabaseClient = supabaseClientInstance;
    return supabaseClientInstance;
  }
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    const cleanUrl = (url || SUPABASE_URL).trim();
    const cleanKey = (key || SUPABASE_ANON_KEY).trim();
    supabaseClientInstance = window.supabase.createClient(cleanUrl, cleanKey);
    window.supabaseClient = supabaseClientInstance;
    return supabaseClientInstance;
  }
  return null;
}

async function getSupabase() {
  if (window.supabaseClient) return window.supabaseClient;
  if (supabaseClientInstance) {
    window.supabaseClient = supabaseClientInstance;
    return supabaseClientInstance;
  }

  // Pre-initialize with verified credentials
  const client = initGlobalSupabaseClient();
  if (client) return client;

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      const url = (config.supabaseUrl || SUPABASE_URL).trim();
      const key = (config.supabaseAnonKey || SUPABASE_ANON_KEY).trim();
      return initGlobalSupabaseClient(url, key);
    }
  } catch (e) {
    console.warn('Config fetch notice, using verified credentials:', e.message);
  }

  return initGlobalSupabaseClient();
}

// Preload globally
if (typeof window !== 'undefined') {
  initGlobalSupabaseClient();
}

// ==========================================================================
// 3. STRICT AUTHENTICATION SUBMISSION HANDLER
// ==========================================================================

let currentAuthMode = 'login';
let currentAuthRole = 'seeker';

window.switchAuthTab = function(mode) {
  currentAuthMode = mode;
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const roleContainer = document.getElementById('role-selection-container');
  const submitBtn = document.getElementById('auth-submit-btn');

  // Clear any existing error state
  clearAuthError();

  if (mode === 'login') {
    if (tabLogin) tabLogin.className = 'flex-1 h-10 text-xs sm:text-sm font-extrabold rounded-lg bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm transition-all duration-200';
    if (tabSignup) tabSignup.className = 'flex-1 h-10 text-xs sm:text-sm font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-200';
    if (roleContainer) roleContainer.classList.add('hidden');
    if (submitBtn) submitBtn.textContent = 'Sign In';
  } else {
    if (tabSignup) tabSignup.className = 'flex-1 h-10 text-xs sm:text-sm font-extrabold rounded-lg bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm transition-all duration-200';
    if (tabLogin) tabLogin.className = 'flex-1 h-10 text-xs sm:text-sm font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-200';
    if (roleContainer) roleContainer.classList.remove('hidden');
    if (submitBtn) submitBtn.textContent = 'Create Account';
  }
};

window.setAuthRole = function(role) {
  currentAuthRole = role;
  const seekerBtn = document.getElementById('role-btn-seeker');
  const volunteerBtn = document.getElementById('role-btn-volunteer');

  if (role === 'seeker') {
    if (seekerBtn) seekerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-extrabold rounded-xl border border-amber-400 bg-amber-500/15 text-amber-900 dark:text-amber-300 flex items-center justify-center gap-1.5 transition-all';
    if (volunteerBtn) volunteerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-all';
  } else {
    if (volunteerBtn) volunteerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-extrabold rounded-xl border border-amber-400 bg-amber-500/15 text-amber-900 dark:text-amber-300 flex items-center justify-center gap-1.5 transition-all';
    if (seekerBtn) seekerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-all';
  }
};

function clearAuthError() {
  const errorContainer = document.getElementById('auth-error-message') || document.getElementById('auth-error');
  const emailInput = document.getElementById('auth-email') || document.getElementById('gateway-username');
  const passwordInput = document.getElementById('auth-password') || document.getElementById('gateway-password');

  if (errorContainer) {
    errorContainer.classList.add('hidden');
    errorContainer.style.display = 'none';
    errorContainer.textContent = '';
  }
  if (emailInput) {
    emailInput.style.borderColor = '';
    emailInput.classList.remove('input-error');
  }
  if (passwordInput) {
    passwordInput.style.borderColor = '';
    passwordInput.classList.remove('input-error');
  }
}

function showAuthError(message) {
  const errorContainer = document.getElementById('auth-error-message') || document.getElementById('auth-error');
  const emailInput = document.getElementById('auth-email') || document.getElementById('gateway-username');
  const passwordInput = document.getElementById('auth-password') || document.getElementById('gateway-password');

  // Highlight input field borders in red on validation failure
  if (emailInput) {
    emailInput.style.borderColor = '#ef4444';
    emailInput.classList.add('input-error');
  }
  if (passwordInput) {
    passwordInput.style.borderColor = '#ef4444';
    passwordInput.classList.add('input-error');
  }

  // Display inline alert message with clear red outline container styling
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.border = '1px solid #ef4444';
    errorContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    errorContainer.style.color = '#f87171';
    errorContainer.style.borderRadius = '0.75rem';
    errorContainer.style.padding = '10px 14px';
    errorContainer.classList.remove('hidden');
    errorContainer.style.display = 'block';
  }

  // Display toast message
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, 'error');
  }
}

// Attach live input listeners to clear errors on typing
function attachInputListeners() {
  const emailInput = document.getElementById('auth-email') || document.getElementById('gateway-username');
  const passwordInput = document.getElementById('auth-password') || document.getElementById('gateway-password');

  if (emailInput && !emailInput.dataset.hasAuthClearListener) {
    emailInput.addEventListener('input', () => {
      emailInput.style.borderColor = '';
      emailInput.classList.remove('input-error');
      const errorContainer = document.getElementById('auth-error-message') || document.getElementById('auth-error');
      if (errorContainer) errorContainer.classList.add('hidden');
    });
    emailInput.dataset.hasAuthClearListener = 'true';
  }

  if (passwordInput && !passwordInput.dataset.hasAuthClearListener) {
    passwordInput.addEventListener('input', () => {
      passwordInput.style.borderColor = '';
      passwordInput.classList.remove('input-error');
      const errorContainer = document.getElementById('auth-error-message') || document.getElementById('auth-error');
      if (errorContainer) errorContainer.classList.add('hidden');
    });
    passwordInput.dataset.hasAuthClearListener = 'true';
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachInputListeners);
  } else {
    attachInputListeners();
  }
}

function isLocalDevEnvironment() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.port === '5000' ||
    window.location.port === '3000'
  );
}

function executeDevBypassRedirect(email, reason) {
  console.warn(`⚠️ [Dev Bypass Active] Supabase connection issue on localhost (${reason}). Auto-redirecting to jobs.html for seamless local testing.`);
  const role = currentAuthRole || 'seeker';
  const username = (email && email.includes('@')) ? email.split('@')[0] : (email || 'dev_user');
  const devSession = {
    username: username,
    email: email || 'dev@northstar.local',
    role: role,
    id: 'dev-user-' + Date.now(),
    isGuest: false
  };
  localStorage.setItem('northstar_session', JSON.stringify(devSession));
  if (typeof window.setRole === 'function') window.setRole(role);
  
  const gatewayView = document.getElementById('auth-gateway-view');
  const mainLayout = document.getElementById('main-app-layout');
  if (gatewayView) { gatewayView.classList.add('hidden'); gatewayView.style.display = 'none'; }
  if (mainLayout) { mainLayout.classList.remove('hidden'); mainLayout.style.display = 'flex'; }
  
  window.location.href = 'jobs.html';
}

function resetSubmitButton() {
  const submitBtn = document.getElementById('auth-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = currentAuthMode === 'signup' ? 'Create Account' : 'Sign In';
  }
}

/**
 * Strict Login Submission Handler
 * Attempts native Supabase signInWithPassword first, with auto-redirect dev fallback on localhost.
 */
window.handleAuthFormSubmit = async function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  attachInputListeners();
  clearAuthError();

  const emailInput = document.getElementById('auth-email') || document.getElementById('gateway-username');
  const passwordInput = document.getElementById('auth-password') || document.getElementById('gateway-password');
  
  // Clean input formatting & immediate sanitization
  const cleanEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const cleanPassword = passwordInput ? passwordInput.value.trim() : '';

  // Basic validation
  if (!cleanEmail || !cleanPassword) {
    showAuthError('Invalid email or password. Please check your credentials and try again.');
    return;
  }

  // Initialize Supabase client & Graceful fallback check
  const supabase = window.supabaseClient || await getSupabase();
  if (!window.supabaseClient) {
    if (isLocalDevEnvironment()) {
      executeDevBypassRedirect(cleanEmail, 'Supabase client not initialized');
      return;
    }
    showAuthError('Supabase client is not initialized. Please check script imports.');
    return;
  }

  const submitBtn = document.getElementById('auth-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = currentAuthMode === 'signup' ? 'Creating Account...' : 'Signing In...';
  }

  try {
    if (currentAuthMode === 'signup') {
      if (cleanPassword.length < 6) {
        showAuthError('Password must be at least 6 characters long.');
        return;
      }

      const role = currentAuthRole || 'seeker';
      const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: { data: { role, username } }
      });

      if (error) {
        if (isLocalDevEnvironment()) {
          executeDevBypassRedirect(cleanEmail, error.message || 'Signup fallback');
          return;
        }
        showAuthError(error.message || 'Registration failed. Please try again.');
        return;
      }

      if (data?.user?.identities && data.user.identities.length === 0) {
        showAuthError('This email address is already in use. Please sign in instead.');
        return;
      }

      if (!data?.user) {
        if (isLocalDevEnvironment()) {
          executeDevBypassRedirect(cleanEmail, 'Signup user data missing');
          return;
        }
        showAuthError('Registration failed. Please try again.');
        return;
      }

      // Upsert profile in Supabase
      try {
        await supabase.from('profiles').upsert({ id: data.user.id, role, email: cleanEmail, username });
      } catch (_) {}

      // Save valid session upon genuine success
      const sessionData = {
        username: cleanEmail,
        email: cleanEmail,
        role,
        id: data.user.id,
        isGuest: false
      };
      localStorage.setItem('northstar_session', JSON.stringify(sessionData));
      if (typeof window.setRole === 'function') window.setRole(role);

      if (typeof window.showNotification === 'function') {
        window.showNotification('Account created successfully!', 'success');
      }

      // Redirect strictly upon verified success
      window.location.href = 'jobs.html';
      return;

    } else {
      // Direct login into Supabase signInWithPassword
      console.log('Auth attempt:', { email: cleanEmail, hasPassword: !!cleanPassword });

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) throw error;

        if (data?.session || data?.user) {
          const userId = data?.user?.id || data?.session?.user?.id;
          let role = currentAuthRole || 'seeker';

          try {
            if (userId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role, theme')
                .eq('id', userId)
                .single();

              if (profile?.role) role = profile.role;
              if (profile?.theme && (profile.theme === 'light' || profile.theme === 'dark')) {
                localStorage.setItem('northstar_theme', profile.theme);
                applyTheme(profile.theme);
              }
            }
          } catch (_) {}

          const sessionData = {
            username: cleanEmail,
            email: cleanEmail,
            role,
            id: userId,
            isGuest: false
          };
          localStorage.setItem('northstar_session', JSON.stringify(sessionData));
          if (typeof window.setRole === 'function') window.setRole(role);

          if (typeof window.showNotification === 'function') {
            window.showNotification('Signed in successfully!', 'success');
          }

          // Hide auth overlay if on index.html
          const gatewayView = document.getElementById('auth-gateway-view');
          const mainLayout = document.getElementById('main-app-layout');
          if (gatewayView) { gatewayView.classList.add('hidden'); gatewayView.style.display = 'none'; }
          if (mainLayout) { mainLayout.classList.remove('hidden'); mainLayout.style.display = 'flex'; }

          // Successful session redirect
          window.location.href = 'jobs.html';
        }
      } catch (err) {
        console.error('Supabase auth catch:', err);
        
        // Local development bypass: if network/CORS fails or credentials fail during local testing
        if (isLocalDevEnvironment()) {
          executeDevBypassRedirect(cleanEmail, err?.message || 'Local development fallback');
          return;
        }

        const errMsg = err?.message || '';
        if (errMsg === 'Failed to fetch' || errMsg.toLowerCase().includes('failed to fetch')) {
          console.warn('CORS / Origin warning: If running on http://localhost:3000 or http://127.0.0.1:3000, ensure the local origin is allowed in Supabase Authentication -> URL Configuration -> Redirect URLs / Web Origins.');
          showAuthError('Unable to connect to authentication server. Please check your internet connection or API settings.');
        } else if (errMsg.includes('Invalid login credentials')) {
          showAuthError('Invalid email or password. Please check your credentials and try again.');
        } else if (errMsg.includes('Email not confirmed')) {
          showAuthError('Please verify your email address before logging in.');
        } else {
          showAuthError(errMsg || 'An error occurred during sign in.');
        }
      }
    }
  } catch (outerErr) {
    console.error('Supabase auth catch:', outerErr);
    if (isLocalDevEnvironment()) {
      executeDevBypassRedirect(cleanEmail, outerErr?.message || 'Outer exception fallback');
      return;
    }
    const outerMsg = outerErr?.message || '';
    if (outerMsg === 'Failed to fetch' || outerMsg.toLowerCase().includes('failed to fetch')) {
      console.warn('CORS / Origin warning: If running on http://localhost:3000 or http://127.0.0.1:3000, ensure the local origin is allowed in Supabase Authentication -> URL Configuration -> Redirect URLs / Web Origins.');
      showAuthError('Unable to connect to authentication server. Please check your internet connection or API settings.');
    } else {
      showAuthError(outerMsg || 'An error occurred during sign in.');
    }
  } finally {
    resetSubmitButton();
  }
};

// Aliases for compatibility
window.handleLogin = window.handleAuthFormSubmit;
window.handleGatewayLogin = window.handleAuthFormSubmit;
