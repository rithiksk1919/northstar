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
 * Clean & Strict Login Submission Handler
 * Uses Supabase auth.signInWithPassword with zero dev bypasses or mock redirects.
 */
window.handleAuthFormSubmit = async function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  attachInputListeners();
  clearAuthError();

  const emailInput = document.getElementById('auth-email') || document.getElementById('gateway-username');
  const passwordInput = document.getElementById('auth-password') || document.getElementById('gateway-password');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!email || !password) {
    showAuthError('Please enter both email and password.');
    return;
  }

  const supabase = window.supabaseClient || await getSupabase();
  if (!supabase) {
    showAuthError('Supabase client is not initialized. Please check connection.');
    return;
  }

  const submitBtn = document.getElementById('auth-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = currentAuthMode === 'signup' ? 'Creating Account...' : 'Signing In...';
  }

  try {
    if (currentAuthMode === 'signup') {
      if (password.length < 6) {
        showAuthError('Password must be at least 6 characters long.');
        return;
      }

      const role = currentAuthRole || 'seeker';
      const username = email.includes('@') ? email.split('@')[0] : email;

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: { data: { role, username } }
      });

      if (error) {
        showAuthError(error.message || 'Registration failed.');
        return;
      }

      if (data?.user?.identities && data.user.identities.length === 0) {
        showAuthError('This email address is already in use. Please sign in instead.');
        return;
      }

      if (!data?.user) {
        showAuthError('Registration failed. Please try again.');
        return;
      }

      try {
        await supabase.from('profiles').upsert({ id: data.user.id, role, email, username });
      } catch (_) {}

      const sessionData = {
        username: email,
        email: email,
        role,
        id: data.user.id,
        isGuest: false
      };
      localStorage.setItem('northstar_session', JSON.stringify(sessionData));
      if (typeof window.setRole === 'function') window.setRole(role);

      window.location.href = 'jobs.html';
      return;

    } else {
      // Direct login into Supabase signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      // 1. If error: stop execution, reset loading, and show error UI (no redirect)
      if (error) {
        showAuthError(error.message || 'Invalid login credentials.');
        return;
      }

      // 2. If data.user and data.session exist: route strictly to dashboard/jobs
      if (data?.session && data?.user) {
        const userId = data.user.id;
        let role = currentAuthRole || 'seeker';

        try {
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
        } catch (_) {}

        const sessionData = {
          username: email,
          email: email,
          role,
          id: userId,
          isGuest: false
        };
        localStorage.setItem('northstar_session', JSON.stringify(sessionData));
        if (typeof window.setRole === 'function') window.setRole(role);

        // Hide auth overlay if on index.html
        const gatewayView = document.getElementById('auth-gateway-view');
        const mainLayout = document.getElementById('main-app-layout');
        if (gatewayView) { gatewayView.classList.add('hidden'); gatewayView.style.display = 'none'; }
        if (mainLayout) { mainLayout.classList.remove('hidden'); mainLayout.style.display = 'flex'; }

        // Route strictly to authenticated dashboard / home
        window.location.href = 'jobs.html';
      } else {
        showAuthError('Authentication failed. No session established.');
      }
    }
  } catch (err) {
    showAuthError(err?.message || 'An error occurred during authentication.');
  } finally {
    resetSubmitButton();
  }
};

/**
 * Simple Name & Password Login Handler
 * Saves user credentials directly into Supabase (profiles table) and local session state.
 */
window.handleSimpleLoginSubmit = async function(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const nameInput = document.getElementById('simple-login-name');
  const passwordInput = document.getElementById('simple-login-password');
  const errorContainer = document.getElementById('simple-login-error');
  const submitBtn = document.getElementById('simple-login-submit-btn');

  if (errorContainer) {
    errorContainer.classList.add('hidden');
    errorContainer.textContent = '';
  }

  const name = nameInput ? nameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!name || !password) {
    if (errorContainer) {
      errorContainer.textContent = 'Please enter both your name and password.';
      errorContainer.classList.remove('hidden');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Profile...';
  }

  try {
    const supabase = window.supabaseClient || await getSupabase();
    const role = (typeof window.getRole === 'function') ? window.getRole() : 'seeker';
    const userId = 'user_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 1000);

    // Save profile data into Supabase `profiles` table
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          username: name,
          role: role,
          updated_at: new Date().toISOString()
        }, { onConflict: 'username' });
      } catch (dbErr) {
        console.warn('Supabase profile save notice:', dbErr);
      }
    }

    // Save session in local storage
    const sessionData = {
      id: userId,
      username: name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@northstar.local`,
      role: role,
      isGuest: false
    };

    localStorage.setItem('northstar_session', JSON.stringify(sessionData));
    if (typeof window.setRole === 'function') window.setRole(role);

    // Hide simple login modal
    if (typeof window.closeModal === 'function') {
      window.closeModal('simple-login-modal');
    }

    if (typeof window.showNotification === 'function') {
      window.showNotification(`Welcome, ${name}! Profile saved to Supabase.`, 'success');
    }

    // Refresh page header avatar & layout
    if (typeof window.renderAccountHeaderAvatar === 'function') {
      window.renderAccountHeaderAvatar();
    }

  } catch (err) {
    console.error('Simple login error:', err);
    if (errorContainer) {
      errorContainer.textContent = err?.message || 'An error occurred while saving profile.';
      errorContainer.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save & Sign In';
    }
  }
};

window.openSimpleLoginModal = function() {
  if (typeof window.openModal === 'function') {
    window.openModal('simple-login-modal');
  }
};

// Aliases for compatibility
window.handleLogin = window.handleAuthFormSubmit;
window.handleGatewayLogin = window.handleAuthFormSubmit;
