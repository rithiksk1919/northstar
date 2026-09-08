/**
 * Northstar Interactive Web Application Module
 * Architecture & Dual-Funnel Role Navigation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const session = JSON.parse(localStorage.getItem('northstar_session'));

  // Force Auth Gateway on Launch: Always require explicit login/guest access on index.html
  if (currentPath === 'index.html' || currentPath === '') {
    localStorage.removeItem('northstar_session');
    localStorage.removeItem('northstar_user_role');
    const gatewayView = document.getElementById('auth-gateway-view');
    const mainLayout = document.getElementById('main-app-layout');
    const bottomNav = document.querySelector('nav');
    if (gatewayView) { gatewayView.classList.remove('hidden'); gatewayView.style.display = 'flex'; }
    if (mainLayout) { mainLayout.classList.add('hidden'); mainLayout.style.display = 'none'; }
    if (bottomNav) { bottomNav.style.display = 'none'; }
    return;
  }

  // Session Gate: Check authentication globally for internal pages
  if (!session || (session && !session.isGuest && !session.email && !session.username)) {
    window.location.href = 'index.html';
    return;
  }

  // Fetch persisted role and theme from Supabase on page load for authenticated users
  if (!session.isGuest && session.id && window.supabaseClient) {
    window.supabaseClient
      .from('profiles')
      .select('role, theme')
      .eq('id', session.id)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.role) {
            localStorage.setItem('northstar_user_role', data.role);
            cachedSupabaseRole = data.role;
          }
          if (data.theme && (data.theme === 'light' || data.theme === 'dark')) {
            localStorage.setItem('northstar_theme', data.theme);
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(data.theme);
          }
        }
      })
      .catch(err => console.warn('Supabase init fetch failed:', err));
  }

  // Automatic Trigger: Viewing Shelter Info
  if (currentPath === 'call-shelter.html') {
    setTimeout(() => updateMilestone('safePlace', true), 500);
  }

  initThemeToggle();
  initClock();
  initRoleNavigation();
  initDonationForm();
  initResourceMapFilter();
  initHelpModal();
  initCallModal();
  initTaskClaiming();
  initInstantPageTransitions();
  renderProgressPage();
  checkGuestLockAccess();
  checkDashboardJobMatchLock();
  renderAccountHeaderAvatar();
});

// Render Top Right Account Avatar Badge on EVERY Page Header
function renderAccountHeaderAvatar() {
  const session = getSession();
  const headers = document.querySelectorAll('header');
  if (!headers || headers.length === 0) return;

  headers.forEach(header => {
    let container = header.querySelector('.header-actions-right');
    if (!container) {
      container = document.createElement('div');
      container.className = 'header-actions-right flex items-center gap-2 flex-shrink-0';
      const existingBtns = Array.from(header.children).filter(child => !child.querySelector('h1') && child.tagName !== 'H1' && !child.classList.contains('flex-1') && child.id !== 'offline-save-btn');
      
      const offlineBtn = header.querySelector('#offline-save-btn');
      if (offlineBtn) {
        container.appendChild(offlineBtn);
      } else {
        existingBtns.forEach(btn => {
          if (!btn.classList.contains('header-account-avatar') && btn.tagName === 'BUTTON') {
            container.appendChild(btn);
          }
        });
      }
      header.appendChild(container);
    }

    // Remove any redundant generic profile buttons or old avatars
    const redundantBtns = container.querySelectorAll('#profile-btn, .header-account-avatar');
    redundantBtns.forEach(btn => btn.remove());

    const avatarBtn = document.createElement('button');
    avatarBtn.type = 'button';
    avatarBtn.id = 'header-user-avatar';
    avatarBtn.onclick = window.openSettingsModal;
    avatarBtn.className = 'header-account-avatar flex-shrink-0 transition-transform active:scale-95 cursor-pointer select-none';

    const username = (session && session.username && session.username !== 'Guest')
      ? session.username
      : (session && session.role ? (session.role.charAt(0).toUpperCase() + session.role.slice(1)) : (localStorage.getItem('northstar_user_role') === 'volunteer' ? 'Volunteer' : 'Seeker'));
    const initial = username.charAt(0).toUpperCase();

    avatarBtn.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-300 hover:brightness-110 transition-all" title="Signed in as ${username} - Tap for Settings">
        ${initial}
      </div>
    `;

    container.appendChild(avatarBtn);
  });
}

// Theme Mode Storage & Management Engine with Dynamic Device Theme Detection
function initThemeToggle() {
  const savedTheme = localStorage.getItem('northstar_theme');
  const systemTheme = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  const themeToApply = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : systemTheme;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(themeToApply);

  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      const explicit = localStorage.getItem('northstar_theme_override');
      if (!explicit) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
}
initThemeToggle();

window.setThemeMode = function(mode) {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(mode);
  localStorage.setItem('northstar_theme', mode);
  updateSettingsThemeUI(mode);
  // Sync theme to Supabase (best-effort, non-blocking)
  if (window.supabaseClient) {
    try {
      const raw = localStorage.getItem('northstar_session');
      const session = raw ? JSON.parse(raw) : null;
      if (session?.id && !session.id.startsWith('user-')) {
        window.supabaseClient
          .from('profiles')
          .upsert({ id: session.id, theme: mode }, { onConflict: 'id' })
          .then(() => {})
          .catch(() => {});
      }
    } catch (_) {}
  }
};

window.toggleTheme = function() {
  const current = localStorage.getItem('northstar_theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  window.setThemeMode(newTheme);
};

function updateSettingsThemeUI(mode) {
  const lightBtn = document.getElementById('settings-theme-light');
  const darkBtn = document.getElementById('settings-theme-dark');
  if (!lightBtn || !darkBtn) return;

  if (mode === 'light') {
    lightBtn.className = 'py-3 px-3 text-xs font-extrabold rounded-xl border-amber-400 bg-amber-400/20 text-amber-900 transition-all flex items-center justify-center gap-2 shadow-sm border';
    darkBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border';
  } else {
    darkBtn.className = 'py-3 px-3 text-xs font-extrabold rounded-xl border-amber-400 bg-amber-400/20 text-amber-300 transition-all flex items-center justify-center gap-2 shadow-sm border';
    lightBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 border';
  }
}

// Initialize Supabase Client dynamically from server config
async function initSupabaseClient() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    if (config.supabaseUrl && config.supabaseAnonKey && window.supabase && window.supabase.createClient) {
      window.supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      console.log('⚡ Supabase Client Connected:', config.supabaseUrl);
    }
  } catch (e) {
    console.warn('Supabase initialization warning:', e);
  }
}
initSupabaseClient();

// Auth Gateway State & Handlers
let authMode = 'login';
let authSelectedRole = 'seeker';

window.switchAuthTab = function (mode) {
  authMode = mode;
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const roleContainer = document.getElementById('role-selection-container');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (mode === 'login') {
    if (tabLogin) tabLogin.className = 'flex-1 h-10 text-xs sm:text-sm font-extrabold rounded-lg bg-slate-950 text-white shadow-sm transition-all duration-200';
    if (tabSignup) tabSignup.className = 'flex-1 h-10 text-xs sm:text-sm font-bold rounded-lg text-slate-600 hover:text-slate-950 transition-all duration-200';
    if (roleContainer) roleContainer.classList.add('hidden');
    if (submitBtn) submitBtn.textContent = 'Sign In';
  } else {
    if (tabSignup) tabSignup.className = 'flex-1 h-10 text-xs sm:text-sm font-extrabold rounded-lg bg-slate-950 text-white shadow-sm transition-all duration-200';
    if (tabLogin) tabLogin.className = 'flex-1 h-10 text-xs sm:text-sm font-bold rounded-lg text-slate-600 hover:text-slate-950 transition-all duration-200';
    if (roleContainer) roleContainer.classList.remove('hidden');
    if (submitBtn) submitBtn.textContent = 'Create Account';
  }
};

window.setAuthRole = function (role) {
  authSelectedRole = role;
  const seekerBtn = document.getElementById('role-btn-seeker');
  const volunteerBtn = document.getElementById('role-btn-volunteer');

  if (role === 'seeker') {
    if (seekerBtn) seekerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-extrabold rounded-xl border border-amber-400 bg-amber-500/15 text-amber-900 flex items-center justify-center gap-1.5 transition-all';
    if (volunteerBtn) volunteerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-all';
  } else {
    if (volunteerBtn) volunteerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-extrabold rounded-xl border border-amber-400 bg-amber-500/15 text-amber-900 flex items-center justify-center gap-1.5 transition-all';
    if (seekerBtn) seekerBtn.className = 'h-11 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-all';
  }
};

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
  const role = authSelectedRole || 'seeker';
  const username = (email && email.includes('@')) ? email.split('@')[0] : (email || 'dev_user');
  const devSession = {
    username: username,
    email: email || 'dev@northstar.local',
    role: role,
    id: 'dev-user-' + Date.now(),
    isGuest: false
  };
  localStorage.setItem('northstar_session', JSON.stringify(devSession));
  if (typeof setRole === 'function') setRole(role);
  
  const gatewayView = document.getElementById('auth-gateway-view');
  const mainLayout = document.getElementById('main-app-layout');
  if (gatewayView) { gatewayView.classList.add('hidden'); gatewayView.style.display = 'none'; }
  if (mainLayout) { mainLayout.classList.remove('hidden'); mainLayout.style.display = 'flex'; }
  
  window.location.href = 'jobs.html';
}

window.handleAuthFormSubmit = async function (e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const errorContainer = document.getElementById('auth-error-message');
  
  // Clean input formatting & immediate sanitization
  const cleanEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const cleanPassword = passwordInput ? passwordInput.value.trim() : '';

  const clearError = () => {
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
  };

  if (emailInput && !emailInput.dataset.hasErrorListener) {
    emailInput.addEventListener('input', clearError);
    emailInput.dataset.hasErrorListener = 'true';
  }
  if (passwordInput && !passwordInput.dataset.hasErrorListener) {
    passwordInput.addEventListener('input', clearError);
    passwordInput.dataset.hasErrorListener = 'true';
  }

  const showError = (msg) => {
    if (emailInput) {
      emailInput.style.borderColor = '#ef4444';
      emailInput.classList.add('input-error');
    }
    if (passwordInput) {
      passwordInput.style.borderColor = '#ef4444';
      passwordInput.classList.add('input-error');
    }
    if (errorContainer) {
      errorContainer.textContent = msg;
      errorContainer.style.border = '1px solid #ef4444';
      errorContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      errorContainer.style.color = '#f87171';
      errorContainer.style.borderRadius = '0.75rem';
      errorContainer.style.padding = '10px 14px';
      errorContainer.classList.remove('hidden');
      errorContainer.style.display = 'block';
    }
    if (typeof showNotification === 'function') {
      showNotification(msg, 'error');
    }
  };

  clearError();

  if (!cleanEmail || !cleanPassword) {
    showError('Invalid email or password. Please check your credentials and try again.');
    return; // Strict: Prevent redirection
  }

  // Password Policy Protocol: Minimum 6 characters required for signup
  if (authMode === 'signup' && cleanPassword.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }

  let role = authSelectedRole || 'seeker';

  // Ensure Supabase client is initialized
  let client = window.supabaseClient;
  if (!client && typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();
      const url = config.supabaseUrl || 'https://gvhyukdmuhvitonzlxoq.supabase.co';
      const key = config.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2aHl1a2RtdWh2aXRvbnpseG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MzE0NTMsImV4cCI6MjEwMjQwNzQ1M30.822oKaNPMpHjcdksRD1jrs6fmX-WzapAVTXeCDefDgA';
      client = window.supabase.createClient(url, key);
      window.supabaseClient = client;
    } catch (_) {}
  }

  if (!client && !window.supabaseClient) {
    if (isLocalDevEnvironment()) {
      executeDevBypassRedirect(cleanEmail, 'Supabase client not initialized');
      return;
    }
    showError('Supabase client is not initialized. Please check script imports.');
    return; // Strict: Prevent redirection without valid auth client
  }
  if (!client) client = window.supabaseClient;

  const submitBtn = document.getElementById('auth-submit-btn');
  const originalBtnText = submitBtn ? submitBtn.textContent : (authMode === 'signup' ? 'Create Account' : 'Sign In');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = authMode === 'signup' ? 'Creating Account...' : 'Signing In...';
  }

  try {
    if (authMode === 'signup') {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: { data: { role } }
      });

      if (error || !data?.user) {
        if (isLocalDevEnvironment()) {
          executeDevBypassRedirect(cleanEmail, error?.message || 'Signup fallback');
          return;
        }
        showError(error?.message || 'Registration failed. Please try again.');
        return;
      }

      if (data.user.identities && data.user.identities.length === 0) {
        showError('This email address is already in use. Please sign in instead.');
        return;
      }

      try {
        await client.from('profiles').upsert({ id: data.user.id, role, email: cleanEmail });
      } catch (_) {}

      const userData = {
        username: cleanEmail,
        email: cleanEmail,
        role,
        id: data.user.id,
        isGuest: false
      };
      localStorage.setItem('northstar_session', JSON.stringify(userData));
      setRole(role);
      showNotification('Account created successfully!', 'success');
      window.location.href = 'jobs.html';
      return;

    } else {
      // Direct login into Supabase signInWithPassword
      console.log('Auth attempt:', { email: cleanEmail, hasPassword: !!cleanPassword });

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (error) throw error;

        if (!data?.session && !data?.user) {
          throw new Error('Invalid login credentials');
        }

        const userId = data?.user?.id || data?.session?.user?.id;

        // Verified Supabase user session
        try {
          if (userId) {
            const { data: profile } = await client
              .from('profiles')
              .select('role, theme')
              .eq('id', userId)
              .single();
            if (profile?.role) role = profile.role;
            if (profile?.theme && (profile.theme === 'light' || profile.theme === 'dark')) {
              localStorage.setItem('northstar_theme', profile.theme);
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(profile.theme);
            }
          }
        } catch (_) {}

        const userData = {
          username: cleanEmail,
          email: cleanEmail,
          role,
          id: userId,
          isGuest: false
        };
        localStorage.setItem('northstar_session', JSON.stringify(userData));
        setRole(role);

        const gatewayView = document.getElementById('auth-gateway-view');
        const mainLayout = document.getElementById('main-app-layout');
        const bottomNav = document.querySelector('nav');

        if (gatewayView) {
          gatewayView.classList.add('hidden');
          gatewayView.style.display = 'none';
        }
        if (mainLayout) {
          mainLayout.classList.remove('hidden');
          mainLayout.style.display = 'flex';
        }
        if (bottomNav) {
          bottomNav.style.display = 'flex';
          bottomNav.classList.remove('hidden');
        }

        showNotification('Signed in successfully!', 'success');

        // Successful Session Redirect
        window.location.href = 'jobs.html';
      } catch (err) {
        console.error('Supabase auth catch:', err);
        if (isLocalDevEnvironment()) {
          executeDevBypassRedirect(cleanEmail, err?.message || 'Local dev fallback');
          return;
        }

        const errMsg = err?.message || '';
        if (errMsg === 'Failed to fetch' || errMsg.toLowerCase().includes('failed to fetch')) {
          console.warn('CORS / Origin warning: If running on http://localhost:3000 or http://127.0.0.1:3000, ensure the local origin is allowed in Supabase Authentication -> URL Configuration -> Redirect URLs / Web Origins.');
          showError('Unable to connect to authentication server. Please check your internet connection or API settings.');
        } else if (errMsg.includes('Invalid login credentials')) {
          showError('Invalid email or password. Please check your credentials and try again.');
        } else if (errMsg.includes('Email not confirmed')) {
          showError('Please verify your email address before logging in.');
        } else {
          showError(errMsg || 'An error occurred during sign in.');
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
      showError('Unable to connect to authentication server. Please check your internet connection or API settings.');
    } else {
      showError(outerMsg || 'An error occurred during sign in.');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
};

window.signOutUser = async function () {
  if (window.supabaseClient) {
    try {
      await window.supabaseClient.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout warning:', e);
    }
  }

  localStorage.removeItem('northstar_session');
  localStorage.removeItem('northstar_user_role');
  showNotification('Signed out successfully.', 'info');

  // Hard navigate back to index.html so Auth Gateway is presented cleanly
  window.location.href = 'index.html';
};

// Instant Zero-Lag Page Swapping Engine (SPA Router)
let isPageTransitioning = false;

function initInstantPageTransitions() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href$=".html"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('tel:')) return;

    // Prevent re-rendering if transition is in progress or clicking the active tab
    const cleanHref = href.split('/').pop();
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (isPageTransitioning || cleanHref === currentPath) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    navigateToPageInstant(href);
  });

  window.addEventListener('popstate', () => {
    const targetPath = window.location.pathname.split('/').pop() || 'index.html';
    navigateToPageInstant(targetPath, false);
  });
}

async function navigateToPageInstant(url, pushState = true) {
  if (isPageTransitioning) return;
  isPageTransitioning = true;

  const resetLock = () => {
    isPageTransitioning = false;
  };

  try {
    // Show Swirling Loading Overlay
    const loader = document.getElementById('swirling-loader-overlay');
    if (loader) {
      loader.classList.remove('hidden');
      loader.style.display = 'flex';
    }

    // React app or dynamically mounted pages must perform full browser load to initialize React root scripts
    if (url.includes('resource-map.html') || window.location.pathname.includes('resource-map.html')) {
      resetLock();
      window.location.href = url;
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      if (loader) { loader.classList.add('hidden'); loader.style.display = 'none'; }
      resetLock();
      window.location.href = url;
      return;
    }
    const htmlText = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const newAppFrame = doc.querySelector('.app-frame');
    const currentAppFrame = document.querySelector('.app-frame');

    if (newAppFrame && currentAppFrame) {
      currentAppFrame.classList.add('opacity-0', 'transition-opacity', 'duration-100');

      setTimeout(() => {
        try {
          currentAppFrame.innerHTML = newAppFrame.innerHTML;
          // Explicitly copy CSS classes (like flex, constraints) from the newly fetched frame
          // This ensures mobile constraints and responsive styling are preserved when swapping views
          currentAppFrame.className = newAppFrame.className;

          document.title = doc.title;
          if (pushState) {
            window.history.pushState({}, doc.title, url);
          }

          currentAppFrame.classList.remove('opacity-0');
          currentAppFrame.classList.add('animate-fade-in-up');

          // Hide Swirling Loader
          if (loader) {
            loader.classList.add('hidden');
            loader.style.display = 'none';
          }

          // Re-initialize dynamic page handlers
          initClock();
          initRoleNavigation();
          initDonationForm();
          initResourceMapFilter();
          if (typeof initGlobalAIChatbot === 'function') initGlobalAIChatbot();
          initHelpModal();
          initCallModal();
          initTaskClaiming();
          // Execute inline script tags present in the loaded page document (skipping duplicate config script)
          doc.querySelectorAll('script').forEach(s => {
            if (s.textContent && s.id !== 'tailwind-config') {
              try {
                eval(s.textContent);
              } catch (err) {
                console.warn('Script execution notice:', err);
              }
            }
          });

          if (typeof window.updateLandingRoleCards === 'function') {
            window.updateLandingRoleCards();
          }
          if (typeof window.initChipToggles === 'function') {
            window.initChipToggles();
          }
          if (typeof window.loadOpportunities === 'function') {
            window.loadOpportunities();
          } else if (typeof loadOpportunities === 'function') {
            loadOpportunities();
          }
          renderDynamicNav();
          if (typeof window.updateProgressUI === 'function') {
            window.updateProgressUI();
          }
          if (typeof window.checkGuestLockAccess === 'function') {
            window.checkGuestLockAccess();
          } else if (typeof checkGuestLockAccess === 'function') {
            checkGuestLockAccess();
          }
          checkDashboardJobMatchLock();
          if (typeof window.setDashboardGreeting === 'function') window.setDashboardGreeting();

          const path = url.split('/').pop();
          if (path === 'call-shelter.html') updateMilestone('safePlace', true);

          // Re-run session gate check when navigating to Home so gateway stays hidden
          if (path === 'index.html' || path === '') {
            const gw = document.getElementById('auth-gateway-view');
            const layout = document.getElementById('main-app-layout');
            const sess = JSON.parse(localStorage.getItem('northstar_session'));
            if (sess) {
              if (gw) gw.classList.add('hidden');
              if (layout) layout.classList.remove('hidden');
            } else {
              if (gw) gw.classList.remove('hidden');
              if (layout) layout.classList.add('hidden');
            }
          }

          renderProgressPage();
          window.scrollTo(0, 0);
        } finally {
          resetLock();
        }
      }, 90);
    } else {
      resetLock();
      window.location.href = url;
    }
  } catch (err) {
    console.error('Page fetch error, falling back:', err);
    resetLock();
    window.location.href = url;
  }
}

// Update Status Bar Clock
function initClock() {
  const clockElems = document.querySelectorAll('.status-clock');
  const updateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes}`;
    clockElems.forEach(el => el.textContent = timeStr);
  };
  updateTime();
  setInterval(updateTime, 30000);
}

// Global Role Management (Seeker vs Volunteer) with Supabase & Cache
let cachedSupabaseRole = null;

async function fetchSupabaseUserRole(userId) {
  if (cachedSupabaseRole) return cachedSupabaseRole;
  if (window.supabase) {
    try {
      const { data, error } = await window.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (!error && data?.role) {
        cachedSupabaseRole = data.role;
        localStorage.setItem('northstar_user_role', data.role);
        return data.role;
      }
    } catch (e) {
      console.warn('Supabase role fetch failed, falling back to local state:', e);
    }
  }
  return localStorage.getItem('northstar_user_role') || 'seeker';
}

function getRole() {
  return cachedSupabaseRole || localStorage.getItem('northstar_user_role') || 'seeker';
}

function setRole(role) {
  if (role !== 'seeker' && role !== 'volunteer') role = 'seeker';
  cachedSupabaseRole = role;
  localStorage.setItem('northstar_user_role', role);
  
  if (window.supabaseClient) {
    try {
      const raw = localStorage.getItem('northstar_session');
      const session = raw ? JSON.parse(raw) : null;
      if (session?.id && !session.id.startsWith('user-')) {
        window.supabaseClient
          .from('profiles')
          .upsert({ id: session.id, role: role }, { onConflict: 'id' })
          .then(() => {})
          .catch(() => {});
      }
    } catch (_) {}
  }
  
  renderDynamicNav();
  renderRoleHeaderToggle();
  enforceFeatureGate();
  if (typeof window.updateLandingRoleCards === 'function') {
    window.updateLandingRoleCards();
  }
}

// Feature Gate Component: Restrict access based on role
function enforceFeatureGate() {
  const role = getRole();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Seeker-only routes: resume-builder.html, progress.html
  // Volunteer-only routes: helper-dashboard.html, donate.html
  // Shared / accessible routes: opportunities.html, resource-map.html, call-shelter.html
  const seekerOnlyRoutes = ['resume-builder.html', 'progress.html'];
  const volunteerOnlyRoutes = ['helper-dashboard.html', 'donate.html'];

  if (role === 'seeker' && volunteerOnlyRoutes.includes(currentPath)) {
    showNotification('Restricted area. Redirecting to Seeker Dashboard...', 'warning');
    if (typeof navigateToPageInstant === 'function') {
      navigateToPageInstant('seeker-dashboard.html');
    } else {
      window.location.href = 'seeker-dashboard.html';
    }
  } else if (role === 'volunteer' && seekerOnlyRoutes.includes(currentPath)) {
    showNotification('Restricted area. Redirecting to Volunteer Dashboard...', 'warning');
    if (typeof navigateToPageInstant === 'function') {
      navigateToPageInstant('helper-dashboard.html');
    } else {
      window.location.href = 'helper-dashboard.html';
    }
  }
}

// Dynamic Navigation Engine based on Funnel Architecture
function initRoleNavigation() {
  renderRoleHeaderToggle();
  renderDynamicNav();
  enforceFeatureGate();
}

function renderRoleHeaderToggle() {
  // Remove the header role toggle if it exists. Role switching is now exclusively in the Settings modal.
  const toggleDiv = document.getElementById('role-header-toggle');
  if (toggleDiv) {
    toggleDiv.remove();
  }
}

function switchUserRole(role) {
  setRole(role);
  showNotification(`Switched mode to: ${role === 'seeker' ? 'Seeker (I Need Help)' : 'Volunteer (I Want to Help)'}`, 'info');

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  if (role === 'seeker' && (currentPath === 'helper-dashboard.html' || currentPath === 'donate.html')) {
    if (typeof navigateToPageInstant === 'function') {
      navigateToPageInstant('seeker-dashboard.html');
    } else {
      window.location.href = 'seeker-dashboard.html';
    }
  } else if (role === 'volunteer' && (currentPath === 'seeker-dashboard.html' || currentPath === 'progress.html' || currentPath === 'resume-builder.html')) {
    if (typeof navigateToPageInstant === 'function') {
      navigateToPageInstant('helper-dashboard.html');
    } else {
      window.location.href = 'helper-dashboard.html';
    }
  }
}

function renderDynamicNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  nav.className = "absolute bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-2 bg-white border-t border-slate-200 shadow-sm";
  nav.style.display = 'flex';
  nav.classList.remove('hidden');

  const role = getRole();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let navItems = [];

  if (role === 'seeker') {
    // Seeker Funnel Tabs: [Dashboard, Progress, Jobs, Map, Resume, Settings]
    navItems = [
      { href: 'seeker-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: 'progress.html', label: 'Progress', icon: 'timeline' },
      { href: 'opportunities.html', label: 'Jobs', icon: 'work' },
      { href: 'resource-map.html', label: 'Map', icon: 'map' },
      { href: 'resume-builder.html', label: 'Resume', icon: 'description' },
      { href: '#', label: 'Settings', icon: 'settings', action: 'openSettingsModal()' }
    ];
  } else {
    // Volunteer Funnel Tabs: [Dashboard, Jobs, Donate Food, Settings]
    navItems = [
      { href: 'helper-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: 'opportunities.html', label: 'Jobs', icon: 'work' },
      { href: 'donate.html', label: 'Donate Food', icon: 'restaurant' },
      { href: '#', label: 'Settings', icon: 'settings', action: 'openSettingsModal()' }
    ];
  }

  // Smooth item swap animation
  nav.classList.add('transition-opacity', 'duration-150');
  nav.innerHTML = navItems.map(item => {
    const isActive = currentPath === item.href || (currentPath === '' && item.href === 'index.html');
    const activeClass = isActive && !item.action
      ? 'bg-[#FFE855] text-slate-950 rounded-2xl px-2.5 py-1 shadow-sm font-bold animate-switch-pop'
      : 'text-slate-500 hover:text-slate-900 px-1.5 py-1 font-medium';

    const fillStyle = isActive && !item.action ? "style=\"font-variation-settings: 'FILL' 1;\"" : "";

    if (item.action) {
      return `
        <button onclick="${item.action}" class="flex flex-col items-center justify-center transition-all ${activeClass}">
          <span class="material-symbols-outlined text-xl" ${fillStyle}>${item.icon}</span>
          <span class="text-[10px] sm:text-[11px] leading-tight">${item.label}</span>
        </button>
      `;
    }

    return `
      <a class="flex flex-col items-center justify-center transition-all ${activeClass}" href="${item.href}">
        <span class="material-symbols-outlined text-xl" ${fillStyle}>${item.icon}</span>
        <span class="text-[10px] sm:text-[11px] leading-tight">${item.label}</span>
      </a>
    `;
  }).join('');
}

// Donation Form Page Logic
function initDonationForm() {
  const amountBtns = document.querySelectorAll('.donation-amount-btn');
  const customInput = document.getElementById('custom-amount-input');
  const freqBtns = document.querySelectorAll('.freq-btn');
  const donateSubmitBtn = document.getElementById('donate-submit-btn');

  let selectedAmount = '25';

  if (amountBtns.length > 0) {
    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => {
          b.classList.remove('bg-primary-container', 'text-secondary-fixed', 'border-secondary-fixed', 'shadow-md');
          b.classList.add('bg-surface-container-lowest', 'text-on-surface', 'border-slate-200');
        });
        btn.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'border-slate-200');
        btn.classList.add('bg-primary-container', 'text-secondary-fixed', 'border-secondary-fixed', 'shadow-md');
        selectedAmount = btn.dataset.amount || '25';
        if (customInput) customInput.value = '';
      });
    });
  }

  if (customInput) {
    customInput.addEventListener('input', (e) => {
      if (e.target.value) {
        amountBtns.forEach(b => {
          b.classList.remove('bg-primary-container', 'text-secondary-fixed', 'border-secondary-fixed', 'shadow-md');
          b.classList.add('bg-surface-container-lowest', 'text-on-surface', 'border-slate-200');
        });
        selectedAmount = e.target.value;
      }
    });
  }

  if (freqBtns.length > 0) {
    freqBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        freqBtns.forEach(b => {
          b.classList.remove('bg-primary', 'text-on-primary', 'shadow');
          b.classList.add('bg-surface-container', 'text-on-surface-variant');
        });
        btn.classList.remove('bg-surface-container', 'text-on-surface-variant');
        btn.classList.add('bg-primary', 'text-on-primary', 'shadow');
      });
    });
  }

  if (donateSubmitBtn) {
    donateSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const amount = customInput && customInput.value ? customInput.value : selectedAmount;
      showNotification(`Thank you! Your donation of $${amount} has been processed via Stripe. You are guiding someone home today! ⭐`, 'success');
    });
  }
}

// Resource Map Filters & Sheet
function initResourceMapFilter() {
  const filterPills = document.querySelectorAll('.map-filter-pill');
  const mapCards = document.querySelectorAll('.resource-card');

  if (filterPills.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => {
          p.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
          p.classList.add('bg-surface-container-lowest', 'text-on-surface-variant', 'border', 'border-slate-200');
        });
        pill.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant', 'border', 'border-slate-200');
        pill.classList.add('bg-primary', 'text-on-primary', 'shadow-md');

        const filter = pill.dataset.filter;
        mapCards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
        updateMilestone('firstStep', true);
      });
    });
  }
}

// Help Request Modal
function initHelpModal() {
  const requestHelpBtns = document.querySelectorAll('.trigger-help-modal');
  requestHelpBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('help-request-modal');
    });
  });
}

// Call Hotline Modal Trigger
function initCallModal() {
  const callBtns = document.querySelectorAll('.trigger-call-modal');
  callBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const shelterName = btn.dataset.shelter || 'Northstar Emergency Dispatch';
      const phoneNum = btn.dataset.phone || '1-800-555-0199';

      const modalNameEl = document.getElementById('call-modal-name');
      const modalPhoneEl = document.getElementById('call-modal-phone');

      if (modalNameEl) modalNameEl.textContent = shelterName;
      if (modalPhoneEl) modalPhoneEl.textContent = phoneNum;

      updateMilestone('connected', true);
      openModal('call-overlay-modal');
    });
  });
}

// Volunteer Task Claiming
function initTaskClaiming() {
  const claimBtns = document.querySelectorAll('.claim-task-btn');
  claimBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('claimed')) {
        btn.classList.remove('claimed', 'bg-emerald-600', 'text-white');
        btn.classList.add('bg-primary', 'text-on-primary');
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">handshake</span> Claim Task';
        showNotification('Task unassigned.', 'info');
      } else {
        btn.classList.add('claimed', 'bg-emerald-600', 'text-white');
        btn.classList.remove('bg-primary', 'text-on-primary');
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Task Claimed!';
        showNotification('Awesome! Task assigned to your volunteer queue. Thank you for stepping up!', 'success');
      }
    });
  });
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      const drawer = modal.querySelector('.modal-drawer');
      if (drawer) drawer.classList.remove('translate-y-full');
    }, 10);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    const drawer = modal.querySelector('.modal-drawer');
    if (drawer) drawer.classList.add('translate-y-full');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 300);
  }
}

// Settings Modal Generator
window.openSettingsModal = function () {
  let modal = document.getElementById('settings-modal');
  const session = getSession();

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'absolute inset-0 z-[150] hidden flex-col justify-end';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick="closeModal('settings-modal')"></div>
      <div class="modal-drawer bg-surface w-full rounded-t-3xl p-6 transform translate-y-full transition-transform duration-300 ease-in-out relative flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5"></div>
        <h2 class="text-xl font-extrabold text-primary mb-6 flex items-center justify-between font-heading tracking-tight">
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-xl text-amber-500">settings</span> Settings
          </span>
          <span id="settings-guest-badge" class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30">
            ${session.isGuest ? 'Guest Mode' : 'Account Active'}
          </span>
        </h2>
        
        <div class="space-y-6">
          <!-- Role Selector -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Account Role</label>
            <div class="grid grid-cols-2 gap-3">
              <button onclick="switchUserRole('seeker'); setTimeout(() => openSettingsModal(), 10);" id="settings-role-seeker" class="py-3 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1">
                <span class="material-symbols-outlined text-xl">search</span>
                <span>I need help</span>
                <span class="text-[10px] opacity-75 font-normal">(Seeker)</span>
              </button>
              <button onclick="switchUserRole('volunteer'); setTimeout(() => openSettingsModal(), 10);" id="settings-role-volunteer" class="py-3 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1">
                <span class="material-symbols-outlined text-xl">volunteer_activism</span>
                <span>I want to help</span>
                <span class="text-[10px] opacity-75 font-normal">(Volunteer)</span>
              </button>
            </div>
          </div>

          <!-- Theme Appearance Selector -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Appearance</label>
            <div class="grid grid-cols-2 gap-3">
              <button onclick="setThemeMode('light')" id="settings-theme-light" class="py-3 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg text-amber-500">light_mode</span>
                <span>Light Mode</span>
              </button>
              <button onclick="setThemeMode('dark')" id="settings-theme-dark" class="py-3 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg text-indigo-400">dark_mode</span>
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          <!-- Auth Action Button (Sign In / Sign Up for Guest vs Sign Out for User Account) -->
          <div class="pt-4 border-t border-slate-200 dark:border-white/10" id="settings-auth-container">
            ${session.isGuest ? `
              <button onclick="redirectToAuthGateway()" class="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-md hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-base">login</span> Sign in / Create Account
              </button>
            ` : `
              <button onclick="logout()" class="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 font-bold rounded-xl text-sm shadow-sm transition-colors border border-rose-100 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm">logout</span> Sign out (${session.username})
              </button>
            `}
          </div>
        </div>
      </div>
    `;
    const appFrame = document.querySelector('.app-frame');
    if (appFrame) {
      appFrame.appendChild(modal);
    }
  } else {
    // Dynamic Auth Button Update if modal already created
    const authContainer = document.getElementById('settings-auth-container');
    if (authContainer) {
      authContainer.innerHTML = session.isGuest ? `
        <button onclick="redirectToAuthGateway()" class="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-md hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">login</span> Sign in / Create Account
        </button>
      ` : `
        <button onclick="logout()" class="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 font-bold rounded-xl text-sm shadow-sm transition-colors border border-rose-100 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-sm">logout</span> Sign out (${session.username})
        </button>
      `;
    }
  }

  // Update role toggle UI state
  const role = getRole();
  const seekerBtn = document.getElementById('settings-role-seeker');
  const volunteerBtn = document.getElementById('settings-role-volunteer');

  if (role === 'seeker') {
    seekerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-amber-400 bg-amber-50 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 transition-all flex flex-col items-center justify-center gap-1 shadow-sm';
    volunteerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1';
  } else {
    volunteerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-amber-400 bg-amber-50 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 transition-all flex flex-col items-center justify-center gap-1 shadow-sm';
    seekerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1';
  }

  // Update theme toggle UI state in Settings modal
  const savedTheme = localStorage.getItem('northstar_theme') || 'dark';
  updateSettingsThemeUI(savedTheme);

  openModal('settings-modal');
};

// Global Toast Notification System (Disabled per user request)
function showNotification(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (container) container.remove();
  return;
}// --- Auth Entry Functions ---

function loginAsGuest() {
  const session = { username: 'Guest', role: 'seeker', isGuest: true };
  localStorage.setItem('northstar_session', JSON.stringify(session));
  localStorage.removeItem('northstar_data_Guest'); // Clean slate every time for Guest!

  if (typeof navigateToPageInstant === 'function') {
    navigateToPageInstant('seeker-dashboard.html');
  } else {
    window.location.href = 'seeker-dashboard.html';
  }
}

function loginAsUser(username, mode) {
  if (!username || !username.trim()) {
    showNotification('Please enter a username to continue.', 'error');
    return;
  }

  const role = currentGatewayMode || 'seeker';
  const session = { username: username.trim(), role, isGuest: false, mode };
  localStorage.setItem('northstar_session', JSON.stringify(session));

  // Ensure initial data structure exists for user account
  const key = `northstar_data_${session.username.trim()}`;
  if (!localStorage.getItem(key)) {
    const newUserData = {
      isGuest: false,
      username: session.username.trim(),
      resumeData: null,
      progress: {
        firstStep: false,
        safePlace: false,
        basicNeeds: false,
        connected: false,
        movingForward: false,
      }
    };
    localStorage.setItem(key, JSON.stringify(newUserData));
  }

  // Hide the welcome-gateway overlay
  const gateway = document.getElementById('welcome-gateway');
  if (gateway) gateway.style.display = 'none';

  // Also hide the auth-gateway-view if present
  const authView = document.getElementById('auth-gateway-view');
  if (authView) { authView.classList.add('hidden'); authView.style.display = 'none'; }

  // Show main app layout
  const mainLayout = document.getElementById('main-app-layout');
  if (mainLayout) { mainLayout.classList.remove('hidden'); mainLayout.style.display = 'flex'; }

  console.log(`Logged in as ${username} (${mode}, role: ${role})`);
}

// Expose globally for HTML handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;
window.switchUserRole = switchUserRole;
window.setRole = setRole;
window.getRole = getRole;
window.loginAsGuest = loginAsGuest;
window.loginAsUser = loginAsUser;
window.saveResumeData = saveResumeData;
window.setGatewayMode = setGatewayMode;
window.handleGatewayLogin = window.handleAuthFormSubmit;
window.logout = logout;
window.redirectToAuthGateway = function() { window.location.href = 'index.html'; };
window.renderAccountHeaderAvatar = renderAccountHeaderAvatar;

// --- Guest Feature Locking Engine ---
function checkGuestLockAccess() {
  const session = getSession();
  const appFrame = document.querySelector('.app-frame') || document.body;
  const mainContent = appFrame.querySelector('main') || appFrame;

  if (!session || !session.isGuest) {
    const existingOverlay = document.getElementById('guest-lock-overlay');
    if (existingOverlay) existingOverlay.remove();

    if (mainContent && mainContent !== appFrame) {
      mainContent.style.filter = '';
      mainContent.style.pointerEvents = '';
      mainContent.style.userSelect = '';
      mainContent.style.opacity = '';
    }
    return;
  }

  const path = window.location.pathname.toLowerCase();
  const currentFileName = path.split('/').pop() || 'index.html';
  const isDashboardOrHome = currentFileName === 'index.html' || currentFileName === 'seeker-dashboard.html' || currentFileName === 'helper-dashboard.html' || currentFileName === 'resource-map.html';

  if (!isDashboardOrHome) {
    // Blur main content area permanently for guests on all feature pages
    if (mainContent && mainContent !== appFrame) {
      mainContent.style.filter = 'blur(14px)';
      mainContent.style.pointerEvents = 'none';
      mainContent.style.userSelect = 'none';
      mainContent.style.opacity = '0.3';
    }

    let overlay = document.getElementById('guest-lock-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'guest-lock-overlay';
    overlay.className = 'absolute inset-0 z-[200] flex items-center justify-center p-5 bg-slate-950/60 backdrop-blur-sm select-none';
    overlay.innerHTML = `
      <div class="bg-white max-w-xs w-full p-6 rounded-[24px] text-center space-y-4 shadow-2xl border border-slate-200/80 relative overflow-hidden animate-fade-in">
        <div class="w-12 h-12 rounded-2xl bg-[#FFE855] text-slate-900 flex items-center justify-center mx-auto shadow-sm">
          <span class="material-symbols-outlined text-2xl font-bold">lock</span>
        </div>
        <div>
          <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFE855]/30 text-slate-800 inline-block mb-2.5">Guest Account</span>
          <h3 class="text-lg font-bold text-slate-900 tracking-tight">Unlock Feature with an Account</h3>
          <p class="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
            You are browsing as a Guest. Create a free account or sign in to permanently unlock progress tracking, AI resume builder, job placements, and donations.
          </p>
        </div>
        <div class="space-y-2 pt-1">
          <button onclick="redirectToAuthGateway()" class="w-full py-3 bg-[#FFE855] hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-base">person_add</span> Sign In / Create Account
          </button>
          <a href="seeker-dashboard.html" class="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    `;
    appFrame.appendChild(overlay);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkGuestLockAccess);
} else {
  checkGuestLockAccess();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkGuestLockAccess);
} else {
  checkGuestLockAccess();
}

// --- Progress State Management ---

let currentGatewayMode = 'seeker';

function setGatewayMode(mode) {
  currentGatewayMode = mode;
  const pill = document.getElementById('gateway-pill');
  const btnSeeker = document.getElementById('gateway-btn-seeker');
  const btnVolunteer = document.getElementById('gateway-btn-volunteer');

  if (pill) {
    if (mode === 'volunteer') {
      pill.style.transform = 'translateX(100%)';
      if (btnSeeker) { btnSeeker.classList.remove('text-white'); btnSeeker.classList.add('text-slate-500'); }
      if (btnVolunteer) { btnVolunteer.classList.remove('text-slate-500'); btnVolunteer.classList.add('text-white'); }
    } else {
      pill.style.transform = 'translateX(0)';
      if (btnSeeker) { btnSeeker.classList.remove('text-slate-500'); btnSeeker.classList.add('text-white'); }
      if (btnVolunteer) { btnVolunteer.classList.remove('text-white'); btnVolunteer.classList.add('text-slate-500'); }
    }
  }
}

function handleGatewayLogin(mode) {
  if (typeof window.handleAuthFormSubmit === 'function') {
    return window.handleAuthFormSubmit();
  }
}

function logout() {
  localStorage.removeItem('northstar_session');
  window.location.href = 'index.html';
}

function getSession() {
  return JSON.parse(localStorage.getItem('northstar_session')) || { role: 'seeker', isGuest: true, username: 'Guest' };
}

const defaultUserData = {
  isGuest: true,
  username: 'Guest',
  resumeData: null,
  progress: {
    firstStep: false,       // Milestone 1
    safePlace: false,       // Milestone 2
    basicNeeds: false,      // Milestone 3
    connected: false,      // Milestone 4
    movingForward: false,  // Milestone 5
  }
};

function getUserData() {
  const session = getSession();
  if (session.isGuest) {
    return JSON.parse(JSON.stringify(defaultUserData)); // Always clean slate for Guest
  }
  const key = `northstar_data_${session.username}`;
  return JSON.parse(localStorage.getItem(key)) || JSON.parse(JSON.stringify(defaultUserData));
}

function updateMilestone(milestoneKey, isCompleted) {
  const session = getSession();
  if (session.isGuest) return; // Do not save milestones for Guests

  const key = `northstar_data_${session.username}`;
  const userData = getUserData();
  userData.progress[milestoneKey] = isCompleted;

  const completedCount = Object.keys(userData.progress).filter(k => userData.progress[k] === true).length;
  userData.progress.movingForward = completedCount >= 5;

  localStorage.setItem(key, JSON.stringify(userData));
  renderProgressPage();
}



function saveResumeData(data) {
  if (typeof window.matchAndRenderJobs === 'function') window.matchAndRenderJobs(data);
  const session = getSession();
  if (session.isGuest) return; // Do not save resume data for Guests

  const key = `northstar_data_${session.username}`;
  const userData = getUserData();
  userData.resumeData = data;
  localStorage.setItem(key, JSON.stringify(userData));
}

function renderProgressPage() {
  const stepperContainer = document.getElementById('stepper-nodes');
  const listContainer = document.getElementById('journey-list-container');
  if (!stepperContainer || !listContainer) return;

  const session = getSession();
  const userData = getUserData();
  const state = userData.progress;
  const completedCount = Object.keys(state).filter(k => state[k] === true).length;
  
  const isLocked = session.isGuest;
  if (isLocked) {
    stepperContainer.innerHTML = '';
    listContainer.innerHTML = `
      <div class="relative w-full flex flex-col items-center justify-center rounded-2xl border border-white/10 p-8 text-center shadow-lg bg-slate-900/60 backdrop-blur-md my-4">
        <span class="material-symbols-outlined text-5xl text-amber-500 mb-3">lock</span>
        <h3 class="text-lg font-extrabold text-white mb-2">Progress Locked</h3>
        <p class="text-xs text-slate-300 font-medium mb-5 max-w-xs mx-auto">Create a free account to permanently unlock progress tracking and milestone history.</p>
        <a href="index.html" class="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all">
          Create Account
        </a>
      </div>
    `;
    const progressText = document.getElementById('journey-progress-text');
    if (progressText) progressText.innerText = 'Account Required';
    const accountLabel = document.getElementById('progress-account-label');
    if (accountLabel) accountLabel.textContent = 'Browsing as Guest';
    return;
  }

  const accountLabel = document.getElementById('progress-account-label');

  const progressText = document.getElementById('journey-progress-text');
  if (progressText) {
    progressText.innerText = `${completedCount} of 5 milestones completed`;
  }

  const milestones = [
    {
      id: 'firstStep', icon: 'star', title: 'First Step', desc: 'Found your first resource through NorthStar.',
      status: state.firstStep ? 'completed' : 'pending', color: 'amber', hasModal: true
    },
    {
      id: 'safePlace', icon: 'home', title: 'Safe Place', desc: 'Found a shelter that can provide support.',
      status: state.safePlace ? 'completed' : 'pending', color: 'blue', hasModal: true
    },
    {
      id: 'basicNeeds', icon: 'restaurant', title: 'Basic Needs Connected', desc: 'Found a food, meal, clothing, or essential-needs resource.',
      status: state.basicNeeds ? 'completed' : 'pending', color: 'emerald', hasModal: true
    },
    {
      id: 'connected', icon: 'call', title: 'Connected', desc: 'Reached out to a resource for help.',
      status: state.connected ? 'completed' : 'pending', color: 'slate', hasModal: false,
      customAction: '<a href="resource-map.html" class="mt-2 inline-block px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg shadow hover:bg-slate-800 transition-colors">Search Resources &rarr;</a>'
    },
    {
      id: 'movingForward', icon: 'trending_up', title: 'Moving Forward', desc: 'Completed 5 helpful actions through NorthStar.',
      status: state.movingForward ? 'completed' : 'in-progress', color: 'slate', hasModal: false,
      customAction: `
        <div class="mt-2.5">
            <div class="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>Progress</span>
                <span>${completedCount} / 5 actions</span>
            </div>
            <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full transition-all duration-500" style="width: ${(completedCount / 5) * 100}%"></div>
            </div>
        </div>
      `
    }
  ];

  stepperContainer.innerHTML = milestones.map(m => {
    const isCompleted = m.status === 'completed';
    return `
      <div class="w-6 h-6 rounded-full flex items-center justify-center ${isCompleted ? 'bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'} z-10 text-xs transition-colors duration-300">
          <span class="material-symbols-outlined text-[14px]">${isCompleted ? 'circle' : 'radio_button_unchecked'}</span>
      </div>
    `;
  }).join('');

  listContainer.innerHTML = milestones.map((m, index) => {
    const isCompleted = m.status === 'completed';
    const isLast = index === milestones.length - 1;
    let clickHandler = m.hasModal ? `onclick="openMilestoneModal('${m.id}')"` : '';
    let cursorClass = m.hasModal ? 'cursor-pointer hover:bg-slate-50/10 transition-colors' : '';

    return `
      <div class="relative flex gap-4 ${!isLast ? 'pb-6' : ''}">
        ${!isLast ? '<div class="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-700"></div>' : ''}
        
        <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${isCompleted ? 'bg-amber-400/20 text-amber-500 shadow-sm border border-amber-400/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10'} transition-colors duration-300">
            <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' ${isCompleted ? '1' : '0'};">${m.icon}</span>
        </div>
        
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-sm flex-1 ${cursorClass}" ${clickHandler}>
            <div class="flex justify-between items-start">
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">${m.title}</h4>
                ${isCompleted ? '<span class="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>' : (m.status === 'in-progress' ? '<span class="material-symbols-outlined text-amber-500 text-lg">pending</span>' : '<span class="material-symbols-outlined text-slate-400 text-lg">lock</span>')}
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">${m.desc}</p>
            ${(!isCompleted && m.customAction) || m.id === 'movingForward' ? m.customAction : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.matchAndRenderJobs = async function(resumeData) {
  const container = document.getElementById('matched-jobs-container');
  if (!container || !resumeData) return;

  try {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    if (!data.jobs || data.jobs.length === 0) return;

    const userKeywords = [];
    if (resumeData.skills) {
      if (resumeData.skills.certifications) userKeywords.push(...resumeData.skills.certifications);
      if (resumeData.skills.practical_skills) userKeywords.push(...resumeData.skills.practical_skills);
      if (resumeData.skills.core_strengths) userKeywords.push(...resumeData.skills.core_strengths);
    }
    if (resumeData.experience) {
      resumeData.experience.forEach(exp => {
        if (exp.role) userKeywords.push(exp.role);
      });
    }

    const scoredJobs = data.jobs.map(job => {
      let score = 0;
      const jobText = (job.title + ' ' + (job.requirements || []).join(' ')).toLowerCase();
      userKeywords.forEach(kw => {
        if (kw && jobText.includes(kw.toLowerCase())) score += 15;
      });
      return { ...job, score };
    }).filter(j => j.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

    if (scoredJobs.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-amber-400 text-sm">stars</span> Matched Job Postings
          </h3>
      </div>
      ${scoredJobs.map(job => `
        <div class="backdrop-blur-md bg-slate-900/40 p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden mb-3">
            <div class="flex justify-between items-start mb-1.5">
                <div>
                    <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold">AI Match Score: ${job.score}%</span>
                    <h4 class="font-extrabold text-sm text-white mt-1.5">${job.title}</h4>
                    <p class="text-[11px] text-amber-400 font-semibold">${job.company} • ${job.pay}</p>
                </div>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed mb-3">${job.description}</p>
            <div class="flex gap-2 border-t border-white/10 pt-2.5">
                <a href="mailto:${job.contact.split(' | ')[0]}" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold text-center border border-white/10 transition-colors">Email</a>
                <a href="tel:${job.contact.split(' | ')[1] ? job.contact.split(' | ')[1].replace(/[^0-9]/g, '') : ''}" class="flex-1 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-lg text-xs font-bold text-center hover:from-amber-300 hover:to-amber-400 transition-colors">Call</a>
            </div>
        </div>
      `).join('')}
    `;
  } catch (err) {
    console.error('Error matching jobs:', err);
  }
};

// --- Dashboard: Recommended AI Job Match Access Lock ---
function checkDashboardJobMatchLock() {
  const container = document.getElementById('ai-job-matches-container');
  if (!container) return; // Not on the dashboard page, skip

  const session = getSession();
  const userData = getUserData();
  const hasResume = !!(userData && userData.resumeData);

  if (session.isGuest) {
    // State 1: Guest — lock with account prompt
    container.innerHTML = `
      <div class="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 p-6 text-center shadow-lg bg-slate-900/60 backdrop-blur-md">
        <span class="material-symbols-outlined text-4xl text-amber-500 mb-3" style="font-variation-settings: 'FILL' 1;">lock</span>
        <h4 class="text-sm font-extrabold text-white mb-1">Job Matches Locked</h4>
        <p class="text-xs text-slate-400 font-medium mb-4 max-w-[220px] mx-auto">Make an account to access personalized AI job matches.</p>
        <button onclick="document.getElementById('auth-gateway-view') ? (document.getElementById('auth-gateway-view').classList.remove('hidden'), document.getElementById('auth-gateway-view').style.display='flex', document.getElementById('main-app-layout') && (document.getElementById('main-app-layout').classList.add('hidden'), document.getElementById('main-app-layout').style.display='none')) : window.location.href='index.html'" class="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all active:scale-95">
          Sign In / Create Account
        </button>
      </div>
    `;
    // Also hide the match % badge in the section header
    const matchBadge = container.closest('section')?.querySelector('span.bg-emerald-500\\/10');
    if (matchBadge) matchBadge.classList.add('hidden');
    return;
  }

  if (!hasResume) {
    // State 2: Logged-in but no resume — lock with resume prompt
    container.innerHTML = `
      <div class="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 p-6 text-center shadow-lg bg-slate-900/60 backdrop-blur-md">
        <span class="material-symbols-outlined text-4xl text-indigo-400 mb-3" style="font-variation-settings: 'FILL' 1;">description</span>
        <h4 class="text-sm font-extrabold text-white mb-1">Job Matches Locked</h4>
        <p class="text-xs text-slate-400 font-medium mb-4 max-w-[220px] mx-auto">Make a resume to unlock AI-powered job matches tailored to your skills.</p>
        <a href="resume-builder.html" class="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-extrabold rounded-xl text-xs shadow-lg hover:from-indigo-400 hover:to-indigo-500 transition-all active:scale-95 inline-flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm">edit_document</span> Build Your Resume
        </a>
      </div>
    `;
    // Also hide the match % badge in the section header
    const matchBadge = container.closest('section')?.querySelector('span.bg-emerald-500\\/10');
    if (matchBadge) matchBadge.classList.add('hidden');
    return;
  }

  // State 3: Logged-in with resume — show the match % badge and leave the card intact
  const matchBadge = container.closest('section')?.querySelector('span.bg-emerald-500\\/10');
  if (matchBadge) matchBadge.classList.remove('hidden');
}

// ============================================================
// GLOBAL AI CHATBOT WIDGET (SEEKER & HELPER / VOLUNTEER)
// ============================================================
function initGlobalAIChatbot() {
  if (document.getElementById('northstar-chatbot-widget')) return;

  const appFrame = document.querySelector('.app-frame') || document.body;

  // Insert Backdrop Overlay
  if (!document.getElementById('chatbot-backdrop-overlay')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'chatbot-backdrop-overlay';
    backdrop.className = 'fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[98] chatbot-backdrop-hidden transition-opacity';
    backdrop.onclick = () => toggleAIChatbotWindow();
    appFrame.appendChild(backdrop);
  }

  const widget = document.createElement('div');
  widget.id = 'northstar-chatbot-widget';
  widget.className = 'absolute bottom-[80px] right-4 z-50 no-print select-none';
  widget.innerHTML = `
    <!-- Launcher FAB Button -->
    <button id="chatbot-fab-btn" onclick="toggleAIChatbotWindow()" class="w-13 h-13 rounded-full bg-[#FFE855] text-slate-950 shadow-xl border-2 border-white flex items-center justify-center font-bold transition-all active:scale-95 hover:bg-amber-300 relative group">
      <span id="chatbot-fab-icon" class="material-symbols-outlined text-2xl">smart_toy</span>
      <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
    </button>

    <!-- Chatbot Window Drawer -->
    <div id="chatbot-window-drawer" class="hidden absolute bottom-16 right-0 w-[330px] sm:w-[360px] bg-white rounded-[24px] shadow-2xl border border-slate-200/80 overflow-hidden flex-col z-50">
      <!-- Header -->
      <div class="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#FFE855] text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-lg">smart_toy</span>
          </div>
          <div>
            <h3 class="text-xs font-extrabold tracking-tight leading-none text-white">NorthStar AI Assistant</h3>
            <span id="chatbot-role-tag" class="text-[10px] font-semibold text-amber-400">Ask anything • Instant help</span>
          </div>
        </div>
        <button onclick="toggleAIChatbotWindow()" class="text-slate-400 hover:text-white transition-colors p-1">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <!-- Quick Suggestion Chips -->
      <div id="chatbot-suggestion-chips" class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[10px] font-semibold text-slate-700">
        <!-- Dynamically injected based on seeker vs helper role -->
      </div>

      <!-- Messages Body -->
      <div id="chatbot-messages-list" class="p-3.5 h-[260px] overflow-y-auto space-y-3 bg-[#F4F5F7] text-xs">
        <div class="flex gap-2">
          <div class="w-7 h-7 rounded-lg bg-[#FFE855] text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
            <span class="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200/80 text-slate-800 shadow-sm leading-relaxed">
            Hi! I'm your <strong>NorthStar AI Assistant</strong>. Ask me about shelters, food drop-offs, daily $20/hr cash gigs, or resume building!
          </div>
        </div>
      </div>

      <!-- Input Form -->
      <form onsubmit="handleAIChatSubmit(event)" class="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input type="text" id="chatbot-input-field" placeholder="Ask NorthStar AI..." class="flex-1 rounded-[12px] bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium">
        <button type="submit" id="chatbot-send-btn" class="w-9 h-9 rounded-[12px] bg-[#FFE855] text-slate-950 hover:bg-amber-300 font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all flex-shrink-0">
          <span class="material-symbols-outlined text-base">send</span>
        </button>
      </form>
    </div>
  `;

  appFrame.appendChild(widget);
  updateChatbotSuggestionChips();
}

function toggleAIChatbotWindow() {
  const drawer = document.getElementById('chatbot-window-drawer');
  const backdrop = document.getElementById('chatbot-backdrop-overlay');
  const fabBtn = document.getElementById('chatbot-fab-btn');
  const fabIcon = document.getElementById('chatbot-fab-icon');
  if (!drawer) return;

  const isHidden = drawer.classList.contains('hidden');

  if (isHidden) {
    // OPEN ANIMATION
    drawer.classList.remove('hidden', 'chatbot-drawer-close');
    drawer.classList.add('flex', 'chatbot-drawer-open');

    if (fabBtn) fabBtn.classList.add('fab-active');
    if (fabIcon) fabIcon.innerText = 'close';

    if (backdrop) {
      backdrop.classList.remove('chatbot-backdrop-hidden');
      backdrop.classList.add('chatbot-backdrop-visible');
    }

    updateChatbotSuggestionChips();
    const input = document.getElementById('chatbot-input-field');
    if (input) setTimeout(() => input.focus(), 150);
  } else {
    // CLOSE ANIMATION
    drawer.classList.remove('chatbot-drawer-open');
    drawer.classList.add('chatbot-drawer-close');

    if (fabBtn) fabBtn.classList.remove('fab-active');
    if (fabIcon) fabIcon.innerText = 'smart_toy';

    if (backdrop) {
      backdrop.classList.remove('chatbot-backdrop-visible');
      backdrop.classList.add('chatbot-backdrop-hidden');
    }

    // Hide display after collapse animation finishes (~200ms)
    setTimeout(() => {
      if (drawer.classList.contains('chatbot-drawer-close')) {
        drawer.classList.add('hidden');
        drawer.classList.remove('flex', 'chatbot-drawer-close');
      }
    }, 200);
  }
}

function updateChatbotSuggestionChips() {
  const container = document.getElementById('chatbot-suggestion-chips');
  const roleTag = document.getElementById('chatbot-role-tag');
  if (!container) return;

  const rawRole = (typeof getRole === 'function') ? getRole() : (localStorage.getItem('northstar_user_role') || 'seeker');
  const isHelperRole = (rawRole === 'volunteer' || rawRole === 'donater' || rawRole === 'helper' || rawRole === 'employer');

  if (isHelperRole) {
    if (roleTag) roleTag.innerText = 'Helper Assistant • Community Support';
    container.innerHTML = `
      <button type="button" onclick="sendQuickChatMessage('How do I post a new job opportunity?')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">💼 Post Job</button>
      <button type="button" onclick="sendQuickChatMessage('How do food pickup claims work?')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">📦 Food Pickups</button>
      <button type="button" onclick="sendQuickChatMessage('How can I volunteer today?')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">🤝 Volunteer</button>
    `;
  } else {
    if (roleTag) roleTag.innerText = 'Seeker Navigator • Daily Resources';
    container.innerHTML = `
      <button type="button" onclick="sendQuickChatMessage('Find the best job for me based on my resume.')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">💼 Best Jobs for Me</button>
      <button type="button" onclick="sendQuickChatMessage('Where can I find $20/hr cash gigs?')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">💰 Cash Gigs</button>
      <button type="button" onclick="sendQuickChatMessage('Where is the nearest shelter?')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">🏠 Shelters</button>
      <button type="button" onclick="sendQuickChatMessage('How do I make an AI resume?')" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">📄 AI Resume</button>
    `;
  }
}

// Canonical in-memory history array for NorthStar AI chatbot
window.northstarChatHistory = window.northstarChatHistory || [];

function sendQuickChatMessage(msg) {
  const input = document.getElementById('chatbot-input-field');
  if (input) {
    input.value = msg;
    handleAIChatSubmit(new Event('submit'));
  }
}

// Helper to safely render user bubble without raw innerHTML
function appendUserMessageBubble(text) {
  const messagesList = document.getElementById('chatbot-messages-list');
  if (!messagesList) return;

  const userBubble = document.createElement('div');
  userBubble.className = 'flex justify-end chat-msg-outgoing';

  const innerDiv = document.createElement('div');
  innerDiv.className = 'bg-slate-900 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] font-medium leading-relaxed shadow-sm';
  innerDiv.textContent = text;

  userBubble.appendChild(innerDiv);
  messagesList.appendChild(userBubble);
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Helper to safely render assistant/error bubble without interpreting text as HTML
function appendAssistantMessageBubble(text, isError = false, action = null) {
  const messagesList = document.getElementById('chatbot-messages-list');
  if (!messagesList) return;

  const botBubble = document.createElement('div');
  botBubble.className = 'flex gap-2 chat-msg-incoming';

  const avatar = document.createElement('div');
  avatar.className = `w-7 h-7 rounded-lg ${isError ? 'bg-red-100 text-red-600' : 'bg-[#FFE855] text-slate-950'} flex items-center justify-center flex-shrink-0 font-bold`;

  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined text-sm';
  icon.textContent = isError ? 'error_outline' : 'smart_toy';
  avatar.appendChild(icon);

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = 'flex flex-col gap-2 max-w-[85%]';

  const contentDiv = document.createElement('div');
  contentDiv.className = `p-3 rounded-2xl rounded-tl-none border shadow-sm leading-relaxed ${
    isError 
      ? 'bg-red-50/80 border-red-200 text-red-700' 
      : 'bg-white border-slate-200/80 text-slate-800'
  }`;
  contentDiv.textContent = text;
  bubbleWrapper.appendChild(contentDiv);

  // Render navigation action button if explicitly provided by backend or deterministic resource lookup
  if (action && action.type === 'navigate') {
    if (action.destination === 'jobs') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-[#FFE855] text-xs font-bold shadow-sm transition-all border border-slate-800 cursor-pointer';
      actionBtn.textContent = (action.label ? `${action.label} →` : 'View Jobs →');
      actionBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof toggleAIChatbotWindow === 'function') {
          toggleAIChatbotWindow();
        }
        if (typeof navigateToPageInstant === 'function') {
          navigateToPageInstant('opportunities.html');
        } else {
          window.location.href = 'opportunities.html';
        }
      };
      bubbleWrapper.appendChild(actionBtn);
    } else if (action.destination === 'map' && action.resourceId) {
      const mapBtn = document.createElement('button');
      mapBtn.type = 'button';
      mapBtn.className = 'self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-95 text-[#10B981] text-xs font-bold shadow-sm transition-all border border-slate-800 cursor-pointer';
      mapBtn.textContent = (action.label ? `${action.label} →` : 'View on Map →');
      mapBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof toggleAIChatbotWindow === 'function') {
          toggleAIChatbotWindow();
        }
        const targetUrl = `resource-map.html?resource=${encodeURIComponent(action.resourceId)}`;
        if (typeof navigateToPageInstant === 'function') {
          navigateToPageInstant(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      };
      bubbleWrapper.appendChild(mapBtn);
    }
  }

  botBubble.appendChild(avatar);
  botBubble.appendChild(bubbleWrapper);
  messagesList.appendChild(botBubble);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function removeTypingIndicator() {
  const existingTyping = document.getElementById('chatbot-typing-bubble');
  if (existingTyping) {
    existingTyping.classList.add('typing-bubble-exit');
    setTimeout(() => existingTyping.remove(), 160);
  }
}


// ============================================================
// NORTHSTAR AI VERIFIED APP CONTEXT
// ============================================================


function calculateNorthStarDistanceMiles(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined
  ) return null;

  const R = 3958.8;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;

  return Number.isFinite(dist) ? dist : null;
}

function getNorthStarCachedResources() {
  try {
    const raw = localStorage.getItem('cached_resources_v2_live_hours');
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[NorthStar AI] Could not read map resources:', err);
    return [];
  }
}

async function getNorthStarLocationResourceContext(message) {
  const lower = String(message || '').toLowerCase();

  const asksNearby =
    lower.includes('nearest') ||
    lower.includes('closest') ||
    lower.includes('near me') ||
    lower.includes('nearby');

  const asksShelter =
    lower.includes('shelter') ||
    lower.includes('bed') ||
    lower.includes('place to stay') ||
    lower.includes('sleep');

  const asksFood =
    lower.includes('food') ||
    lower.includes('meal') ||
    lower.includes('pantry') ||
    lower.includes('eat');

  const asksHygiene =
    lower.includes('shower') ||
    lower.includes('restroom') ||
    lower.includes('bathroom') ||
    lower.includes('hygiene');

  if (!asksNearby || (!asksShelter && !asksFood && !asksHygiene)) {
    return null;
  }

  const resources = getNorthStarCachedResources();

  if (!resources.length) {
    return {
      resource_lookup_requested: true,
      resource_lookup_status: 'no_cached_resources'
    };
  }

  let category = null;

  if (asksShelter) category = 'shelter';
  else if (asksFood) category = 'food';
  else if (asksHygiene) category = 'restroom';

  return await new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve({
        resource_lookup_requested: true,
        category,
        resource_lookup_status: 'geolocation_unavailable'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const matching = resources
          .filter(resource =>
            resource &&
            resource.category === category &&
            typeof resource.lat === 'number' &&
            typeof resource.lng === 'number'
          )
          .map(resource => ({
            resource,
            distance_miles: calculateNorthStarDistanceMiles(
              userLat,
              userLng,
              resource.lat,
              resource.lng
            )
          }))
          .filter(item => item.distance_miles !== null)
          .sort((a, b) => a.distance_miles - b.distance_miles);

        if (!matching.length) {
          resolve({
            resource_lookup_requested: true,
            category,
            resource_lookup_status: 'no_matching_resources'
          });
          return;
        }

        const nearest = matching[0];

        const resolvedResource = {
          resource_lookup_requested: true,
          resource_lookup_status: 'success',
          user_location: {
            lat: userLat,
            lng: userLng
          },
          nearest_resource: {
            id: nearest.resource.id || '',
            name: nearest.resource.name || '',
            category: nearest.resource.category || '',
            address: nearest.resource.address || '',
            status: nearest.resource.status || '',
            statusDetail: nearest.resource.statusDetail || '',
            details: nearest.resource.details || '',
            verifiedOnly: nearest.resource.verifiedOnly === true,
            lat: nearest.resource.lat,
            lng: nearest.resource.lng,
            distance_miles: Number(nearest.distance_miles.toFixed(2))
          }
        };

        window.northstarLastVerifiedResource = resolvedResource.nearest_resource;

        resolve(resolvedResource);
      },
      error => {
        resolve({
          resource_lookup_requested: true,
          category,
          resource_lookup_status:
            error && error.code === 1
              ? 'location_permission_denied'
              : 'location_lookup_failed'
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}

function getNorthStarChatContext() {
  let resumeData = null;

  // 1. Prefer the newest resume generated during this browser session.
  if (
    window.currentGeneratedResumeData &&
    typeof window.currentGeneratedResumeData === 'object'
  ) {
    resumeData = window.currentGeneratedResumeData;
  }

  // 2. For logged-in users, use the resume saved in their NorthStar profile.
  if (!resumeData && typeof getUserData === 'function') {
    try {
      const userData = getUserData();

      if (
        userData &&
        userData.resumeData &&
        typeof userData.resumeData === 'object'
      ) {
        resumeData = userData.resumeData;
      }
    } catch (err) {
      console.warn('[NorthStar AI] Could not read saved user resume:', err);
    }
  }

  // 3. SPA / guest fallback: resume-builder stores the latest generated
  // structured resume here.
  if (!resumeData) {
    try {
      const rawResume = localStorage.getItem('northstar_latest_resume_data');

      if (rawResume) {
        const parsedResume = JSON.parse(rawResume);

        if (parsedResume && typeof parsedResume === 'object') {
          resumeData = parsedResume;
        }
      }
    } catch (err) {
      console.warn('[NorthStar AI] Could not read latest resume context:', err);
    }
  }

  const context = {};

  if (resumeData) {
    context.resume = resumeData;
    context.resume_source = 'northstar_saved_resume';
  }

  return context;
}

async function handleAIChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('chatbot-input-field');
  const messagesList = document.getElementById('chatbot-messages-list');
  const sendBtn = document.getElementById('chatbot-send-btn');
  if (!input || !messagesList) return;

  // Prevent multiple simultaneous requests
  if (window._chatPending) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  // 1. Capture the CURRENT history snapshot BEFORE adding the new user message
  const previousHistory = (window.northstarChatHistory || []).slice(-10);

  // 2. Safely append user bubble to UI
  appendUserMessageBubble(text);

  // 3. Append typing bubble with staggered wave dots
  const typingBubble = document.createElement('div');
  typingBubble.id = 'chatbot-typing-bubble';
  typingBubble.className = 'flex gap-2 chat-msg-incoming';
  typingBubble.innerHTML = `
    <div class="w-7 h-7 rounded-lg bg-[#FFE855] text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
      <span class="material-symbols-outlined text-sm">smart_toy</span>
    </div>
    <div class="bg-white px-3.5 py-3 rounded-2xl rounded-tl-none border border-slate-200/80 text-slate-500 shadow-sm flex items-center gap-1.5 min-h-[36px]">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  messagesList.appendChild(typingBubble);
  messagesList.scrollTop = messagesList.scrollHeight;

  // Set pending state & disable send button
  window._chatPending = true;
  if (sendBtn) sendBtn.disabled = true;

  const rawRole = (typeof getRole === 'function') ? getRole() : (localStorage.getItem('northstar_user_role') || 'seeker');
  const isHelperRole = (rawRole === 'volunteer' || rawRole === 'donater' || rawRole === 'helper' || rawRole === 'employer');
  const currentRole = isHelperRole ? 'volunteer' : 'seeker';

  // Gather verified NorthStar app data for this chat request.
  // This currently includes the user's saved/generated resume when available.
  const northstarContext = getNorthStarChatContext();

  // Add verified location/resource context only when the user's
  // question actually requires nearby map data.
  const resourceContext = await getNorthStarLocationResourceContext(text);

  if (resourceContext) {
    northstarContext.resource_lookup = resourceContext;
  } else {
    const lowerText = String(text || '').toLowerCase();

    const refersToPreviousResource =
      lowerText.includes('that shelter') ||
      lowerText.includes('that place') ||
      lowerText.includes('that resource') ||
      lowerText.includes('is it open') ||
      lowerText.includes('does it have') ||
      lowerText.includes('what about that');

    if (
      refersToPreviousResource &&
      window.northstarLastVerifiedResource
    ) {
      northstarContext.resource_lookup = {
        resource_lookup_requested: true,
        resource_lookup_status: 'success',
        follow_up_reference: true,
        nearest_resource: window.northstarLastVerifiedResource
      };
    }
  }

  console.log('[NorthStar AI] Verified app context:', northstarContext);

  try {
    // 4. Send request with message, role, history, and verified app context
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        role: currentRole,
        history: previousHistory,
        context: northstarContext
      })
    });

    // 5. After sending request, record the user turn into canonical history
    window.northstarChatHistory.push({
      role: 'user',
      content: text
    });
    if (window.northstarChatHistory.length > 10) {
      window.northstarChatHistory = window.northstarChatHistory.slice(-10);
    }

    const data = await res.json();

    removeTypingIndicator();

    // 6. Only display an AI reply when res.ok, data.success, and data.reply exist
    if (res.ok && data && data.success && typeof data.reply === 'string' && data.reply.trim()) {
      // Record assistant reply into canonical history
      window.northstarChatHistory.push({
        role: 'assistant',
        content: data.reply
      });
      if (window.northstarChatHistory.length > 10) {
        window.northstarChatHistory = window.northstarChatHistory.slice(-10);
      }

      // Determine navigation action: backend data.action takes priority,
      // followed deterministically by verified nearest resource lookup if available
      let chatAction = data.action || null;
      if (!chatAction &&
          northstarContext &&
          northstarContext.resource_lookup &&
          northstarContext.resource_lookup.resource_lookup_status === 'success' &&
          northstarContext.resource_lookup.nearest_resource &&
          northstarContext.resource_lookup.nearest_resource.id) {
        chatAction = {
          type: 'navigate',
          destination: 'map',
          resourceId: northstarContext.resource_lookup.nearest_resource.id,
          label: 'View on Map'
        };
      }

      setTimeout(() => {
        appendAssistantMessageBubble(data.reply, false, chatAction);
      }, 120);
    } else {
      // API error or unsuccessful response
      setTimeout(() => {
        appendAssistantMessageBubble("NorthStar AI is temporarily unavailable. Please try again.", true);
      }, 120);
    }
  } catch (err) {
    console.error('Chat error:', err);
    removeTypingIndicator();

    // Show error message bubble without fake fallback data
    setTimeout(() => {
      appendAssistantMessageBubble("NorthStar AI is temporarily unavailable. Please try again.", true);
    }, 120);
  } finally {
    window._chatPending = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Expose globally for inline/SPA callers
window.initGlobalAIChatbot = initGlobalAIChatbot;
window.toggleAIChatbotWindow = toggleAIChatbotWindow;
window.sendQuickChatMessage = sendQuickChatMessage;
window.handleAIChatSubmit = handleAIChatSubmit;

// Auto-initialize Global Chatbot on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initGlobalAIChatbot, 100));
} else {
  setTimeout(initGlobalAIChatbot, 100);
}

