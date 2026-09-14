/**
 * Northstar Interactive Web Application Module
 * Architecture & Dual-Funnel Role Navigation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const session = JSON.parse(localStorage.getItem('northstar_session')) || { isGuest: true };

  // Index launch view
  if (currentPath === 'index.html' || currentPath === '') {
    const mainLayout = document.getElementById('main-app-layout');
    const bottomNav = document.querySelector('nav');
    if (mainLayout) { mainLayout.classList.remove('hidden'); mainLayout.style.display = 'flex'; }
    if (bottomNav) { bottomNav.style.display = 'flex'; }
  }

  // Fetch persisted role and theme from Supabase on page load for authenticated users
  if (session && !session.isGuest && session.id && window.supabaseClient) {
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
    setTimeout(() => updateMilestone('savedLocation', true), 500);
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
  renderBottomNav();
  renderProgressPage();
  syncDashboardProgressWidget();
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

    // Remove any old dynamically injected avatars
    const redundantBtns = container.querySelectorAll('.header-account-avatar');
    redundantBtns.forEach(btn => btn.remove());

    const userName = (session && session.full_name)
      || (session && session.username && session.username !== 'Guest' ? session.username : null)
      || localStorage.getItem('northstar_full_name')
      || localStorage.getItem('northstar_username')
      || localStorage.getItem('northstar_user_name')
      || (session && session.role ? (session.role.charAt(0).toUpperCase() + session.role.slice(1)) : (localStorage.getItem('northstar_user_role') === 'volunteer' ? 'Volunteer' : 'Seeker'));
    const initial = userName.charAt(0).toUpperCase();

    // If explicit #profile-btn exists in markup, populate it dynamically with the user's first initial
    const profileBtn = container.querySelector('#profile-btn') || header.querySelector('#profile-btn');
    if (profileBtn) {
      profileBtn.innerHTML = `<span class="text-[#FFB800] font-bold text-xs tracking-wide">${initial}</span>`;
      profileBtn.title = `Signed in as ${userName} - Tap for Settings`;
      profileBtn.onclick = window.openSettingsModal;
      const pathLower = (window.location.pathname || '').toLowerCase();
      const isLockedScreen = pathLower.includes('dashboard') || pathLower.includes('progress') || pathLower.includes('login') || pathLower.includes('signup');
      if (!isLockedScreen) {
        profileBtn.className = 'w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shadow-sm cursor-pointer select-none';
      }
      return;
    }

    const avatarBtn = document.createElement('div');
    avatarBtn.id = 'header-user-avatar';
    avatarBtn.onclick = window.openSettingsModal;
    avatarBtn.className = 'w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shadow-sm cursor-pointer select-none';
    avatarBtn.title = `Signed in as ${userName} - Tap for Settings`;
    avatarBtn.innerHTML = `<span class="text-[#FFB800] font-bold text-xs tracking-wide">${initial}</span>`;

    container.appendChild(avatarBtn);
  });
}

function syncHeaderThemeIcons(mode) {
  const pathLower = (window.location.pathname || '').toLowerCase();
  const isLockedScreen = pathLower.includes('dashboard') || pathLower.includes('progress') || pathLower.includes('login') || pathLower.includes('signup');
  if (isLockedScreen) return;

  const saved = localStorage.getItem('ns_theme') || localStorage.getItem('northstar_theme');
  const resolvedMode = mode || (saved ? saved : (document.documentElement.classList.contains('dark') ? 'dark' : 'dark'));
  const darkActive = Boolean(resolvedMode === 'dark');

  const themeBtns = document.querySelectorAll('#theme-toggle-btn');
  themeBtns.forEach(btn => {
    btn.className = 'w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.setAttribute('title', darkActive ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    btn.innerHTML = darkActive
      ? `<svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>`
      : `<svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>`;
  });
}

// Theme Mode Storage & Management Engine with Dynamic Device Theme Detection
function initThemeToggle() {
  const savedTheme = localStorage.getItem('ns_theme') || localStorage.getItem('northstar_theme');
  const themeToApply = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(themeToApply);
  localStorage.setItem('ns_theme', themeToApply);
  localStorage.setItem('northstar_theme', themeToApply);

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => syncHeaderThemeIcons(themeToApply));
    } else {
      syncHeaderThemeIcons(themeToApply);
    }
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      const explicit = localStorage.getItem('northstar_theme_override');
      if (!explicit) {
        const nextMode = e.matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(nextMode);
        syncHeaderThemeIcons(nextMode);
      }
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
}
initThemeToggle();

window.setThemeMode = function (mode) {
  const safeMode = Boolean(mode === 'dark') ? 'dark' : 'light';
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(safeMode);
  localStorage.setItem('ns_theme', safeMode);
  localStorage.setItem('northstar_theme', safeMode);
  updateSettingsThemeUI(safeMode);
  syncHeaderThemeIcons(safeMode);
  // Sync theme to Supabase (best-effort, non-blocking)
  if (window.supabaseClient) {
    try {
      const raw = localStorage.getItem('northstar_session');
      const session = raw ? JSON.parse(raw) : null;
      if (session?.id && !session.id.startsWith('user-')) {
        window.supabaseClient
          .from('profiles')
          .upsert({ id: session.id, theme: safeMode }, { onConflict: 'id' })
          .then(() => { })
          .catch(() => { });
      }
    } catch (_) { }
  }
};

window.toggleTheme = function () {
  const current = localStorage.getItem('ns_theme') || localStorage.getItem('northstar_theme') || 'dark';
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

// Auth handlers are strictly managed by js/auth.js


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

// Active Tab State & Routing Controller (Map Routing Fix + Conditional FAB Visibility)
const TAB_ROUTES = {
  dashboard: 'seeker-dashboard.html',
  progress: 'progress.html',
  jobs: 'opportunities.html',
  map: 'resource-map.html',
  resume: 'resume-builder.html'
};

function isMapActiveView(tabOverride) {
  if (tabOverride) return tabOverride === 'map';
  if (window.activeTab === 'map') return true;
  const path = (window.location.pathname || '').toLowerCase();
  return path.includes('resource-map') || path.endsWith('/map.html') || path.endsWith('map');
}

function syncChatbotFABVisibility(tabOverride) {
  const isMap = isMapActiveView(tabOverride);
  const fab = document.getElementById('chat-fab') || document.querySelector('.chatbot-fab');
  const drawer = document.getElementById('chatbot-window-drawer');
  const backdrop = document.getElementById('chatbot-backdrop-overlay');

  if (isMap) {
    document.body.setAttribute('data-active-tab', 'map');
    document.body.classList.add('map-page');
    if (fab) {
      fab.classList.add('hidden');
      fab.style.setProperty('display', 'none', 'important');
    }
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.style.setProperty('display', 'none', 'important');
    }
    if (backdrop) {
      backdrop.classList.add('chatbot-backdrop-hidden', 'pointer-events-none');
    }
  } else {
    const active = tabOverride || window.activeTab || 'dashboard';
    document.body.setAttribute('data-active-tab', active);
    document.body.classList.remove('map-page');
    if (fab) {
      fab.classList.remove('hidden');
      fab.style.setProperty('display', 'flex', 'important');
    } else if (typeof initGlobalAIChatbot === 'function') {
      initGlobalAIChatbot();
    }
  }
}
window.syncChatbotFABVisibility = syncChatbotFABVisibility;

window.setActiveTab = function (tabId) {
  const cleanTab = (tabId || 'dashboard').toLowerCase();
  window.activeTab = cleanTab;
  syncChatbotFABVisibility(cleanTab);

  // Synchronize active/inactive tab classes on bottom navigation bar
  document.querySelectorAll('.bottom-nav [data-nav-tab], .bottom-nav a, .bottom-nav button').forEach(el => {
    const elTab = el.getAttribute('data-nav-tab') || (el.getAttribute('href') || '').replace('.html', '');
    const isMatch = elTab === cleanTab || (cleanTab === 'map' && (el.getAttribute('href') || '').includes('map'));
    const activeClasses = 'nav-tab active active-tab mx-auto w-auto min-w-[48px] max-w-[58px] px-2 py-1 rounded-xl bg-[#FFB800] text-slate-950 font-extrabold shadow-sm flex flex-col items-center justify-center transition-all box-border';
    const inactiveClasses = 'nav-tab nav-item-inactive w-full flex flex-col items-center justify-center py-1 px-0.5 text-slate-500 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-white font-medium transition-all box-border';
    el.className = isMatch ? activeClasses : inactiveClasses;
    const icon = el.querySelector('.material-symbols-outlined');
    if (icon) icon.style.fontVariationSettings = isMatch ? "'FILL' 1" : "'FILL' 0";
  });
};

window.navigateTo = function (tabOrUrl) {
  const key = (tabOrUrl || '').toLowerCase().replace('.html', '');
  const targetUrl = TAB_ROUTES[key] || (tabOrUrl.endsWith('.html') ? tabOrUrl : `${tabOrUrl}.html`);
  const resolvedTab = Object.keys(TAB_ROUTES).find(k => TAB_ROUTES[k] === targetUrl) || (targetUrl.includes('map') ? 'map' : key);

  window.setActiveTab(resolvedTab);

  if (resolvedTab === 'map' || targetUrl.includes('resource-map.html') || targetUrl === 'map.html') {
    window.location.href = 'resource-map.html';
    return;
  }

  if (typeof navigateToPageInstant === 'function') {
    navigateToPageInstant(targetUrl);
  } else {
    window.location.href = targetUrl;
  }
};

// Instant Zero-Lag Page Swapping Engine (SPA Router)
let isPageTransitioning = false;

function initInstantPageTransitions() {
  document.addEventListener('click', (e) => {
    const mapTrigger = e.target.closest('[data-nav-target="map"], a[href="map.html"], a[href="resource-map.html"]');
    if (mapTrigger) {
      e.preventDefault();
      window.navigateTo('map');
      return;
    }

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

          // Synchronously render cached/seed jobs immediately if switching to Jobs view
          if (typeof window.renderJobsInstant === 'function') {
            window.renderJobsInstant(true);
          }

          // Dynamically load any external scripts present in the target document that aren't loaded yet
          const externalScripts = Array.from(doc.querySelectorAll('script[src]'));
          const loadExternalScriptsPromise = Promise.all(
            externalScripts.map(s => {
              const src = s.getAttribute('src');
              if (!src) return Promise.resolve();
              const alreadyLoaded = Array.from(document.querySelectorAll('script[src]')).some(
                existing => existing.getAttribute('src') === src || existing.src === s.src
              );
              if (alreadyLoaded) return Promise.resolve();
              return new Promise(resolve => {
                const newScript = document.createElement('script');
                newScript.src = src;
                newScript.onload = resolve;
                newScript.onerror = resolve;
                document.body.appendChild(newScript);
              });
            })
          );

          loadExternalScriptsPromise.then(() => {
            // Execute inline script tags present in the loaded page document (skipping duplicate config script)
            doc.querySelectorAll('script:not([src])').forEach(s => {
              if (s.textContent && s.id !== 'tailwind-config') {
                try {
                  eval(s.textContent);
                } catch (err) {
                  console.warn('Script execution notice:', err);
                }
              }
            });

            if (typeof window.renderJobsInstant === 'function') {
              window.renderJobsInstant();
            }
            if (typeof window.loadOpportunities === 'function') {
              window.loadOpportunities();
            } else if (typeof loadOpportunities === 'function') {
              loadOpportunities();
            }
            window.dispatchEvent(new CustomEvent('northstar:tabSwitched', { detail: { url } }));
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
          if (typeof syncDashboardProgressWidget === 'function') {
            syncDashboardProgressWidget();
          }
          if (typeof renderProgressPage === 'function') {
            renderProgressPage();
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
          if (path === 'opportunities.html' || path === 'jobs.html') {
            updateMilestone('jobMatcher', true);
          }

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

          renderBottomNav();
          renderProgressPage();
          if (typeof initGlobalAIChatbot === 'function') initGlobalAIChatbot();
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
          .then(() => { })
          .catch(() => { });
      }
    } catch (_) { }
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
window.redirectToAuthGateway = function () {
  if (typeof window.closeModal === 'function') window.closeModal('settings-modal');
  // Show the onboarding overlay and go back to step 1
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.transform = '';
    if (typeof window.showOnboardingStep === 'function') window.showOnboardingStep(1);
  } else {
    // Fallback: reload index to show onboarding
    window.location.href = 'index.html';
  }
};
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

const CORE_MILESTONES = [
  {
    id: 'appExplorer',
    icon: 'explore',
    title: 'App Explorer',
    desc: 'Navigated through key screens and features across Northstar.',
    actionUrl: 'seeker-dashboard.html',
    actionLabel: 'Explore App'
  },
  {
    id: 'aiCompanion',
    icon: 'smart_toy',
    title: 'AI Companion',
    desc: 'Used Northstar AI to ask questions and get instant guidance.',
    actionUrl: 'javascript:toggleAIChatbotWindow()',
    actionLabel: 'Ask Northstar AI'
  },
  {
    id: 'savedLocation',
    icon: 'bookmark',
    title: 'Saved Essential Location',
    desc: 'Bookmarked a resource or shelter on the interactive map.',
    actionUrl: 'map.html',
    actionLabel: 'Open Map'
  },
  {
    id: 'resumeBuilder',
    icon: 'description',
    title: 'Resume Builder',
    desc: 'Created or updated your professional resume in the app.',
    actionUrl: 'resume-builder.html',
    actionLabel: 'Build Resume'
  },
  {
    id: 'jobMatcher',
    icon: 'work',
    title: 'Job Matcher',
    desc: 'Explored personalized job recommendations in the Jobs section.',
    actionUrl: 'jobs.html',
    actionLabel: 'View Jobs'
  }
];

const defaultUserData = {
  isGuest: true,
  username: 'Guest',
  resumeData: null,
  progress: {
    appExplorer: true,
    aiCompanion: false,
    savedLocation: true,
    resumeBuilder: false,
    jobMatcher: true
  }
};

function getUserData() {
  const session = getSession();
  const storageKey = session.isGuest ? 'northstar_guest_progress_data' : `northstar_data_${session.username}`;
  const raw = localStorage.getItem(storageKey);
  let data = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultUserData));
  if (!data.progress) data.progress = {};

  // Ensure all 5 core milestone keys exist
  CORE_MILESTONES.forEach(m => {
    if (typeof data.progress[m.id] !== 'boolean') {
      data.progress[m.id] = defaultUserData.progress[m.id] === true;
    }
  });

  // Sync automatic detections from app usage if not explicitly toggled off
  const savedRes = localStorage.getItem('northstar_saved_resources');
  if (savedRes) {
    try {
      const parsed = JSON.parse(savedRes);
      if (Array.isArray(parsed) && parsed.length > 0) data.progress.savedLocation = true;
    } catch (e) { }
  }
  if (data.resumeData || localStorage.getItem('northstar_resume_saved') === 'true') {
    data.progress.resumeBuilder = true;
  }
  if (localStorage.getItem('northstar_jobs_explored') === 'true') {
    data.progress.jobMatcher = true;
  }
  if (localStorage.getItem('northstar_ai_used') === 'true') {
    data.progress.aiCompanion = true;
  }

  return data;
}

function saveUserData(userData) {
  const session = getSession();
  const storageKey = session.isGuest ? 'northstar_guest_progress_data' : `northstar_data_${session.username}`;
  localStorage.setItem(storageKey, JSON.stringify(userData));
}

function syncDashboardProgressWidget() {
  const userData = getUserData();
  const state = userData.progress || {};
  const totalMilestones = CORE_MILESTONES.length; // 5
  let completedCount = CORE_MILESTONES.filter(m => state[m.id] === true).length;

  // Migrate legacy 1/5 uncustomized guest state to match the default 60% (3 of 5 milestones) state
  if (completedCount === 1 && !localStorage.getItem('northstar_progress_customized')) {
    state.appExplorer = true;
    state.savedLocation = true;
    state.jobMatcher = true;
    completedCount = 3;
    saveUserData(userData);
  }

  const percentage = completedCount * 20;
  const nextPending = CORE_MILESTONES.find(m => !state[m.id]);

  const tasksTextEl = document.getElementById('dashboard-progress-tasks-text');
  if (tasksTextEl) {
    tasksTextEl.textContent = `You've completed ${completedCount} of 5 milestones!`;
  }

  const nextMilestoneEl = document.getElementById('dashboard-next-milestone-label');
  if (nextMilestoneEl) {
    nextMilestoneEl.textContent = nextPending
      ? `Next Milestone: ${nextPending.title}`
      : 'All Milestones Completed! 🎉';
  }

  const pctEl = document.getElementById('dashboard-progress-pct');
  if (pctEl) {
    pctEl.textContent = `${percentage}%`;
  }

  const barEl = document.getElementById('dashboard-progress-bar');
  if (barEl) {
    barEl.style.width = `${percentage}%`;
    barEl.style.setProperty('background-color', '#EAB308', 'important');
  }

  const levelBadgeEl = document.getElementById('dashboard-level-badge');
  if (levelBadgeEl) {
    const level = Math.min(5, Math.max(1, completedCount));
    levelBadgeEl.textContent = `Level ${level}`;
  }
}
window.syncDashboardProgressWidget = syncDashboardProgressWidget;
window.updateProgressUI = function () {
  renderProgressPage();
  syncDashboardProgressWidget();
};

function updateMilestone(milestoneKey, isCompleted) {
  localStorage.setItem('northstar_progress_customized', 'true');
  const userData = getUserData();
  if (!userData.progress) userData.progress = {};
  userData.progress[milestoneKey] = isCompleted;
  saveUserData(userData);
  renderProgressPage();
  syncDashboardProgressWidget();
}

window.toggleMilestoneCompletion = function (milestoneKey, event) {
  if (event) event.stopPropagation();
  // Manual milestone toggling is locked; milestones update exclusively via system completion events (updateMilestone).
  return false;
};

function saveResumeData(data) {
  if (typeof window.matchAndRenderJobs === 'function') window.matchAndRenderJobs(data);
  localStorage.setItem('northstar_resume_saved', 'true');
  const userData = getUserData();
  userData.resumeData = data;
  userData.progress.resumeBuilder = true;
  saveUserData(userData);
  syncDashboardProgressWidget();
}

// Track page exploration automatically
(function trackAppNavigation() {
  try {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const visitedRaw = localStorage.getItem('northstar_visited_pages');
    const visited = visitedRaw ? JSON.parse(visitedRaw) : [];
    if (!visited.includes(path)) {
      visited.push(path);
      localStorage.setItem('northstar_visited_pages', JSON.stringify(visited));
    }
    if (visited.length >= 2) {
      localStorage.setItem('northstar_app_explored', 'true');
    }
    if (path.includes('jobs')) {
      localStorage.setItem('northstar_jobs_explored', 'true');
    }
  } catch (e) { }
})();

function renderProgressPage() {
  const stepperContainer = document.getElementById('stepper-nodes');
  const listContainer = document.getElementById('journey-list-container');
  if (!stepperContainer || !listContainer) return;

  const session = getSession();
  const userData = getUserData();
  const state = userData.progress || {};

  const completedCount = CORE_MILESTONES.filter(m => state[m.id] === true).length;
  const percentage = completedCount * 20;

  const accountLabel = document.getElementById('progress-account-label');
  if (accountLabel) {
    accountLabel.textContent = session.isGuest
      ? 'Browsing as Guest • Milestones unlock automatically as you explore'
      : `Signed in as ${session.full_name || session.username}`;
  }

  // Update header text (X of 5 milestones completed) - amber-600 (#D97706) in light mode, #FACC15 in dark mode
  const progressText = document.getElementById('journey-progress-text');
  if (progressText) {
    progressText.innerText = `${completedCount} of 5 milestones completed`;
    progressText.style.removeProperty('color');
    progressText.className = 'text-xs font-semibold text-[#D97706] dark:text-[#FACC15] milestone-pct-text';
  }

  // Update percentage badge (0% to 100%, 20% per completed task) - amber-600 (#D97706) in light mode, #FACC15 in dark mode
  const pctBadge = document.getElementById('journey-pct-badge');
  if (pctBadge) {
    pctBadge.innerText = `${percentage}%`;
    pctBadge.style.removeProperty('color');
    pctBadge.className = 'text-xs font-extrabold px-2.5 py-1 rounded-full border border-amber-500/30 text-[#D97706] dark:text-[#FACC15] bg-amber-500/15 milestone-pct-text';
  }

  // Update progress bar fill in yellow (#EAB308 / #FACC15)
  const progressBar = document.getElementById('journey-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.style.setProperty('background-color', '#EAB308', 'important');
  }

  // Render Stepper Nodes (Read-only indicator nodes - manual click toggling locked)
  stepperContainer.innerHTML = CORE_MILESTONES.map(m => {
    const isCompleted = !!state[m.id];
    return `
      <div title="${m.title} (${isCompleted ? 'Completed' : 'In Progress'})" class="w-6 h-6 rounded-full flex items-center justify-center pointer-events-none select-none transition-all duration-300 z-10 text-xs ${isCompleted ? 'bg-[#EAB308] text-slate-950 shadow-[0_0_10px_rgba(234,179,8,0.5)] border-2 border-[#EAB308]' : 'bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'}">
          <span class="material-symbols-outlined text-[14px] font-bold">${isCompleted ? 'check' : 'radio_button_unchecked'}</span>
      </div>
    `;
  }).join('');

  // Render 5 Core Action Milestone Cards (Read-only timeline nodes + strictly "+20%" badge without inline checkmarks)
  listContainer.innerHTML = CORE_MILESTONES.map((m, index) => {
    const isCompleted = !!state[m.id];
    const isLast = index === CORE_MILESTONES.length - 1;

    return `
      <div class="relative flex gap-3.5 ${!isLast ? 'pb-4' : ''}">
        ${!isLast ? `<div class="timeline-connector-line absolute z-0 ${isCompleted ? 'bg-[#EAB308]' : 'bg-slate-300 dark:bg-slate-700'}" style="left: 17px !important; top: 36px !important; bottom: 0 !important; width: 2px !important;"></div>` : ''}
        
        <div title="${m.title}" style="width: 36px !important; height: 36px !important; flex-shrink: 0 !important;" class="timeline-node-circle w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center z-10 pointer-events-none select-none transition-all ${isCompleted ? 'bg-[#EAB308] text-slate-950 shadow-sm border border-[#EAB308]' : 'bg-slate-100 dark:bg-slate-800 text-[#D97706] dark:text-[#FACC15] border border-slate-300 dark:border-white/15'}">
            <span class="material-symbols-outlined text-[18px] leading-none flex items-center justify-center" style="font-variation-settings: 'FILL' ${isCompleted ? '1' : '0'};">${m.icon}</span>
        </div>
        
        <div class="milestone-card dashboard-card-border bg-white dark:bg-[#1E293B] p-4 rounded-[18px] shadow-sm flex-1 transition-all">
            <div class="flex justify-between items-start gap-2">
                <div>
                    <h4 class="font-extrabold text-sm text-slate-900 dark:text-white font-heading">${m.title}</h4>
                    <p class="dashboard-subtext text-xs text-[#4A5568] dark:text-[#94A3B8] mt-1 leading-snug font-medium">${m.desc}</p>
                </div>
                <div class="flex flex-col items-end flex-shrink-0 gap-1">
                    <span class="milestone-status-badge milestone-pct-text inline-flex items-center justify-center rounded-full text-[11px] font-semibold px-2 py-0.5 bg-amber-500/15 text-[#D97706] dark:text-[#FACC15]">
                        +20%
                    </span>
                </div>
            </div>
            <div class="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                <span class="pending-status-text text-[11px] font-bold ${isCompleted ? 'completed-status-pill' : 'text-[#4A5568] dark:text-[#94A3B8]'}" style="${isCompleted ? 'background: #EDF2F7; border: 1px solid #CBD5E1; color: #4A5568; padding: 2px 8px; border-radius: 6px; font-weight: 600;' : 'color: #4A5568;'}">
                    ${isCompleted ? 'Completed ✓' : 'Pending action'}
                </span>
                <a href="${m.actionUrl}" class="action-btn milestone-cta-btn inline-flex items-center gap-1 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all active:scale-95" style="background: #1A202C !important; color: #FFFFFF !important; border-radius: 9999px !important; font-weight: 500 !important; border: 1px solid #1A202C !important;">
                    ${m.actionLabel} <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderProgress = renderProgressPage;
window.renderProgressPage = renderProgressPage;

// 6-Tab Bottom Navigation Bar Renderer (Dashboard, Progress, Jobs, Map, Resume, Settings)
function renderBottomNav() {
  const path = (window.location.pathname || '').toLowerCase();
  const isLanding = (path.endsWith('/index.html') || path.endsWith('/login.html') || path.endsWith('/signup.html') || path === '/');
  if (isLanding && (document.getElementById('onboarding-step-1') || document.getElementById('simple-login-name'))) {
    return;
  }

  const appFrame = document.querySelector('.app-frame') || document.querySelector('.phone-frame');
  if (!appFrame) return;

  let nav = appFrame.querySelector('nav.bottom-nav') || appFrame.querySelector('nav');
  if (!nav) {
    nav = document.createElement('nav');
    appFrame.appendChild(nav);
  }

  // Equidistant full-width 6-column grid (grid grid-cols-6 w-full px-2)
  nav.className = 'bottom-nav nav-bar-wrapper nav-container nav-bar-container flex-shrink-0 relative w-full max-w-full box-border z-40 grid grid-cols-6 items-center justify-items-center px-2 py-1.5 bg-white dark:bg-[#12141C] shadow-[0px_-4px_25px_rgba(0,0,0,0.2)] border-t border-slate-200 dark:border-white/10';

  const isDashboard = path.includes('dashboard');
  const isProgress = path.includes('progress') || path.includes('profile');
  const isJobs = path.includes('opportunities') || path.includes('jobs');
  const isMap = path.includes('map');
  const isResume = path.includes('resume');

  const currentActiveTab = isMap ? 'map' : isProgress ? 'progress' : isJobs ? 'jobs' : isResume ? 'resume' : 'dashboard';
  window.activeTab = currentActiveTab;
  syncChatbotFABVisibility(currentActiveTab);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'seeker-dashboard.html', active: isDashboard },
    { id: 'progress', label: 'Progress', icon: 'trending_up', href: 'progress.html', active: isProgress },
    { id: 'jobs', label: 'Jobs', icon: 'work', href: 'opportunities.html', active: isJobs },
    { id: 'map', label: 'Map', icon: 'map', href: 'resource-map.html', active: isMap },
    { id: 'resume', label: 'Resume', icon: 'description', href: 'resume-builder.html', active: isResume },
    { id: 'settings', label: 'Settings', icon: 'settings', action: 'openSettingsModal()', active: false }
  ];

  nav.innerHTML = tabs.map(tab => {
    const activeClasses = 'nav-tab active active-tab mx-auto w-auto min-w-[48px] max-w-[58px] px-2.5 py-1 rounded-xl bg-[#FFB800] text-slate-950 font-extrabold shadow-sm flex flex-col items-center justify-center transition-all box-border';
    const inactiveClasses = 'nav-tab nav-item-inactive w-full flex flex-col items-center justify-center py-1 px-0.5 text-slate-500 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-white font-medium transition-all box-border';
    const iconFill = tab.active ? "font-variation-settings: 'FILL' 1;" : '';

    if (tab.action) {
      return `
        <button type="button" onclick="${tab.action}" data-nav-tab="${tab.id}" class="${inactiveClasses}">
          <span class="material-symbols-outlined text-[20px] leading-none">${tab.icon}</span>
          <span class="text-[9px] leading-none mt-1 tracking-tighter whitespace-nowrap text-center">${tab.label}</span>
        </button>
      `;
    }

    return `
      <a href="${tab.href}" onclick="event.preventDefault(); navigateTo('${tab.id}');" data-nav-tab="${tab.id}" class="${tab.active ? activeClasses : inactiveClasses}">
        <span class="material-symbols-outlined text-[20px] leading-none" style="${iconFill}">${tab.icon}</span>
        <span class="text-[9px] leading-none mt-1 tracking-tighter whitespace-nowrap text-center">${tab.label}</span>
      </a>
    `;
  }).join('');
}
window.renderBottomNav = renderBottomNav;

window.matchAndRenderJobs = async function (resumeData) {
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
  const path = (window.location.pathname || '').toLowerCase();
  if (path.includes('login') || path.includes('signup')) return;

  // ── 1. Mount the floating AI Chatbot FAB (.chatbot-fab) at bottom: calc(var(--nav-bar-height, 64px) + 16px); right: 16px; z-index: 50; ──
  function mountGlobalFloatingFAB() {
    // Remove any legacy #chat-fab inside <header> so it never duplicates
    document.querySelectorAll('header #chat-fab').forEach(el => el.remove());

    const appFrame = document.querySelector('.app-frame') || document.querySelector('.phone-frame');
    if (appFrame) {
      const mainEl = appFrame.querySelector('main');
      if (mainEl) {
        mainEl.style.setProperty('padding-bottom', '96px', 'important');
      }
    }

    const existingFab = document.getElementById('chat-fab');
    if (existingFab) {
      existingFab.className = 'chatbot-fab chatbot-floating-fab w-12 h-12 rounded-full bg-[#FFE855] text-slate-950 border border-amber-400/40 shadow-[0_4px_12px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center justify-center font-bold transition-all active:scale-95 hover:brightness-105 cursor-pointer select-none';
      existingFab.style.cssText = 'bottom: calc(var(--nav-bar-height, 64px) + 16px); right: 16px; z-index: 50;';
      if (appFrame && existingFab.parentElement !== appFrame) {
        appFrame.appendChild(existingFab);
      }
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'chat-fab';
    btn.setAttribute('data-fab-alias', 'chatbot-fab-btn');
    btn.type = 'button';
    btn.onclick = toggleAIChatbotWindow;
    btn.setAttribute('aria-label', 'Open AI Assistant');
    btn.title = 'NorthStar AI Assistant';
    btn.className = 'chatbot-fab chatbot-floating-fab w-12 h-12 rounded-full bg-[#FFE855] text-slate-950 border border-amber-400/40 shadow-[0_4px_12px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)] flex items-center justify-center font-bold transition-all active:scale-95 hover:brightness-105 cursor-pointer select-none';
    btn.style.cssText = 'bottom: calc(var(--nav-bar-height, 64px) + 16px); right: 16px; z-index: 50;';
    btn.innerHTML = `
      <span id="chatbot-fab-icon" class="material-symbols-outlined leading-none" style="font-size:22px;line-height:1;">smart_toy</span>
    `;

    const host = appFrame || document.body;
    host.appendChild(btn);
  }
  mountGlobalFloatingFAB();

  // ── 2. Backdrop overlay ──
  if (!document.getElementById('chatbot-backdrop-overlay')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'chatbot-backdrop-overlay';
    backdrop.className = 'fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[90] chatbot-backdrop-hidden transition-opacity pointer-events-none';
    backdrop.onclick = (e) => { e.stopPropagation(); closeAIChatbotWindow(); };
    document.body.appendChild(backdrop);
  }

  // ── 3. Drawer panel (fixed, opens directly above the floating FAB) ──
  if (!document.getElementById('chatbot-window-drawer')) {
    const drawer = document.createElement('div');
    drawer.id = 'chatbot-window-drawer';
    drawer.style.cssText = 'position: fixed; bottom: 156px; right: 16px; z-index: 9001;';
    drawer.className = 'hidden w-[330px] sm:w-[360px] bg-white rounded-[24px] shadow-2xl border border-slate-200/80 overflow-hidden flex-col pointer-events-auto';
    drawer.onclick = (e) => e.stopPropagation();
    drawer.innerHTML = `
      <!-- Header -->
      <div class="bg-slate-900 text-white px-4 py-3 flex items-center justify-between select-none">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#FFE855] text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-lg">smart_toy</span>
          </div>
          <div>
            <h3 class="text-xs font-extrabold tracking-tight leading-none text-white">NorthStar AI Assistant</h3>
            <span id="chatbot-role-tag" class="text-[10px] font-semibold text-amber-400">Ask anything • Instant help</span>
          </div>
        </div>
        <button id="chatbot-close-btn" type="button" onclick="closeAIChatbotWindow()" class="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer" aria-label="Close chatbot">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <!-- Quick Suggestion Chips -->
      <div id="chatbot-suggestion-chips" class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto text-[10px] font-semibold text-slate-700">
        <!-- Dynamically injected based on seeker vs helper role -->
      </div>

      <!-- Messages Body -->
      <div id="chatbot-messages-list" class="p-3.5 h-[260px] overflow-y-auto space-y-3 bg-[#F4F5F7] text-xs select-text">
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
      <form id="chatbot-input-form" onsubmit="handleAIChatSubmit(event)" class="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input type="text" id="chatbot-input-field" placeholder="Ask NorthStar AI..." class="flex-1 rounded-[12px] bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium select-text">
        <button type="submit" id="chatbot-send-btn" onclick="handleAIChatSubmit(event)" class="w-9 h-9 rounded-[12px] bg-[#FFE855] text-slate-950 hover:bg-amber-300 font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all flex-shrink-0 cursor-pointer" aria-label="Send message">
          <span class="material-symbols-outlined text-base">send</span>
        </button>
      </form>
    `;
    document.body.appendChild(drawer);
  }

  // Keep the widget reference for external code that looks for #northstar-chatbot-widget
  if (!document.getElementById('northstar-chatbot-widget')) {
    const stub = document.createElement('span');
    stub.id = 'northstar-chatbot-widget';
    stub.style.display = 'none';
    document.body.appendChild(stub);
  }

  updateChatbotSuggestionChips();
}

window.isChatOpen = false;

function openAIChatbotWindow() {
  const drawer = document.getElementById('chatbot-window-drawer');
  const backdrop = document.getElementById('chatbot-backdrop-overlay');
  const fabBtn = document.getElementById('chat-fab') || document.getElementById('chatbot-fab-btn');
  const fabIcon = document.getElementById('chatbot-fab-icon');
  if (!drawer) return;

  window.isChatOpen = true;

  // OPEN ANIMATION
  drawer.classList.remove('hidden', 'chatbot-drawer-close');
  drawer.classList.add('flex', 'chatbot-drawer-open');

  if (fabBtn) fabBtn.classList.add('fab-active');
  if (fabIcon) fabIcon.innerText = 'close';

  if (backdrop) {
    backdrop.classList.remove('chatbot-backdrop-hidden', 'pointer-events-none');
    backdrop.classList.add('chatbot-backdrop-visible', 'pointer-events-auto');
  }

  // Track AI Companion milestone
  localStorage.setItem('northstar_ai_used', 'true');
  if (typeof updateMilestone === 'function') {
    updateMilestone('aiCompanion', true);
  }

  updateChatbotSuggestionChips();
  const input = document.getElementById('chatbot-input-field');
  if (input) setTimeout(() => input.focus(), 150);
}

function closeAIChatbotWindow() {
  const drawer = document.getElementById('chatbot-window-drawer');
  const backdrop = document.getElementById('chatbot-backdrop-overlay');
  const fabBtn = document.getElementById('chat-fab') || document.getElementById('chatbot-fab-btn');
  const fabIcon = document.getElementById('chatbot-fab-icon');
  if (!drawer) return;

  window.isChatOpen = false;

  // CLOSE ANIMATION
  drawer.classList.remove('chatbot-drawer-open');
  drawer.classList.add('chatbot-drawer-close');

  if (fabBtn) fabBtn.classList.remove('fab-active');
  if (fabIcon) fabIcon.innerText = 'smart_toy';

  if (backdrop) {
    backdrop.classList.remove('chatbot-backdrop-visible', 'pointer-events-auto');
    backdrop.classList.add('chatbot-backdrop-hidden', 'pointer-events-none');
  }

  // Hide display after collapse animation finishes (~200ms)
  setTimeout(() => {
    if (drawer.classList.contains('chatbot-drawer-close')) {
      drawer.classList.add('hidden');
      drawer.classList.remove('flex', 'chatbot-drawer-close');
    }
  }, 200);
}

function toggleAIChatbotWindow() {
  const drawer = document.getElementById('chatbot-window-drawer');
  if (!drawer) return;
  const isHidden = drawer.classList.contains('hidden') || !window.isChatOpen;
  if (isHidden) {
    openAIChatbotWindow();
  } else {
    closeAIChatbotWindow();
  }
}
window.openAIChatbotWindow = openAIChatbotWindow;
window.closeAIChatbotWindow = closeAIChatbotWindow;
window.openChatDrawer = openAIChatbotWindow;
window.closeChatDrawer = closeAIChatbotWindow;

function updateChatbotSuggestionChips() {
  const container = document.getElementById('chatbot-suggestion-chips');
  const roleTag = document.getElementById('chatbot-role-tag');
  if (!container) return;

  const rawRole = (typeof getRole === 'function') ? getRole() : (localStorage.getItem('northstar_user_role') || 'seeker');
  const isHelperRole = (rawRole === 'volunteer' || rawRole === 'donater' || rawRole === 'helper' || rawRole === 'employer');

  if (isHelperRole) {
    if (roleTag) roleTag.innerText = 'Helper Assistant • Community Support';
    container.innerHTML = `
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('How do I post a new job opportunity?', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">💼 Post Job</button>
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('How do food pickup claims work?', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">📦 Food Pickups</button>
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('How can I volunteer today?', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">🤝 Volunteer</button>
    `;
  } else {
    if (roleTag) roleTag.innerText = 'Seeker Navigator • Daily Resources';
    container.innerHTML = `
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('Find the best job for me based on my resume.', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">💼 Best Jobs for Me</button>
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('Where can I find $20/hr cash gigs?', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">💰 Cash Gigs</button>
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('Where is the nearest shelter?', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">🏠 Shelters</button>
      <button type="button" onclick="event.stopPropagation(); sendQuickChatMessage('How do I make an AI resume?', event)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-full hover:bg-amber-50 whitespace-nowrap active:scale-95 transition-all">📄 AI Resume</button>
    `;
  }
}

// Canonical in-memory history array for NorthStar AI chatbot
window.northstarChatHistory = window.northstarChatHistory || [];

function sendQuickChatMessage(msg, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  openAIChatbotWindow();
  dispatchChatMessage(msg);
}

function appendChatMessage(msgObj) {
  openAIChatbotWindow();
  const text = typeof msgObj === 'string' ? msgObj : (msgObj && msgObj.text ? msgObj.text : '');
  if (text) {
    dispatchChatMessage(text);
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
  contentDiv.className = `p-3 rounded-2xl rounded-tl-none border shadow-sm leading-relaxed ${isError
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
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  await dispatchChatMessage(text);
}

async function dispatchChatMessage(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return;

  const messagesList = document.getElementById('chatbot-messages-list');
  const sendBtn = document.getElementById('chatbot-send-btn');
  if (!messagesList) return;

  // Prevent multiple simultaneous requests
  if (window._chatPending) return;

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

  try {
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
window.appendChatMessage = appendChatMessage;
window.dispatchChatMessage = dispatchChatMessage;
window.handleAIChatSubmit = handleAIChatSubmit;

// Auto-initialize Global Chatbot on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initGlobalAIChatbot, 100));
} else {
  setTimeout(initGlobalAIChatbot, 100);
}

// ============================================================
// FLUTTER-STYLE RIPPLE ANIMATION (INKWELL)
// ============================================================
document.addEventListener('mousedown', function(e) {
  const target = e.target.closest('button, .interactive-card, nav a, .chip-btn, .flutter-btn, .chat-fab');
  if (!target) return;

  // Create ripple element
  const ripple = document.createElement('span');
  ripple.classList.add('ripple-effect');

  // Calculate coordinates relative to the button
  const rect = target.getBoundingClientRect();
  
  // Set ripple size based on the element size (multiply by 1.5 to ensure full coverage)
  const diameter = Math.max(rect.width, rect.height) * 1.5;
  const radius = diameter / 2;

  // Set position based on click coordinates
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${e.clientX - rect.left - radius}px`;
  ripple.style.top = `${e.clientY - rect.top - radius}px`;

  // Remove existing ripples to prevent DOM bloat
  const existingRipple = target.querySelector('.ripple-effect');
  if (existingRipple) {
    existingRipple.remove();
  }

  // Append ripple and remove after animation completes
  target.appendChild(ripple);
  
  setTimeout(() => {
    if (ripple.parentElement) {
      ripple.remove();
    }
  }, 600); // Matches the 0.6s animation duration in CSS
});

// ============================================================
// OFFLINE NETWORK STATUS TRACKING & FEATURE ACCESS CONTROL
// Allowed Offline: Dashboard & Settings
// Restricted Offline: AI Tools, Map Views, Jobs, Resume Builder
// ============================================================
(function initOfflineAccessControl() {
  function isAllowedOfflineHref(href) {
    if (!href) return true;
    const lower = href.toLowerCase();
    if (
      lower.includes('seeker-dashboard') ||
      lower.includes('helper-dashboard') ||
      lower.includes('settings') ||
      lower === '#' ||
      lower.startsWith('javascript:')
    ) {
      return true;
    }
    return false;
  }

  function showOfflineModal() {
    let modal = document.getElementById('ns-global-offline-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ns-global-offline-modal';
      modal.className = 'ns-offline-modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="ns-offline-modal-card" onclick="event.stopPropagation()">
          <button type="button" class="ns-offline-modal-close" aria-label="Close" onclick="document.getElementById('ns-global-offline-modal').style.display='none'">
            <span class="material-symbols-outlined text-lg leading-none">close</span>
          </button>
          <div class="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md" style="background-color: rgba(255, 184, 0, 0.15); border: 1px solid rgba(255, 184, 0, 0.4); color: #FFB800;">
            <span class="material-symbols-outlined text-3xl leading-none">wifi_off</span>
          </div>
          <h3 class="text-lg font-extrabold text-white tracking-tight mb-2 font-heading">Connection Required</h3>
          <p class="text-sm font-medium text-slate-200 leading-relaxed mb-6">
            You are offline. Please connect to the internet to use this feature.
          </p>
          <button type="button" onclick="document.getElementById('ns-global-offline-modal').style.display='none'" class="w-full py-3 rounded-xl font-extrabold text-sm text-slate-950 transition-all active:scale-95 cursor-pointer shadow-md" style="background-color: #FFB800; box-shadow: 0 4px 16px rgba(255, 184, 0, 0.3);">
            Stay on Current Screen
          </button>
        </div>
      `;
      modal.onclick = () => {
        modal.style.display = 'none';
      };
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  function syncInlineMapPlaceholder(isOnline) {
    const mapCard = document.querySelector('.map-preview-card');
    if (!mapCard) return;

    let placeholder = mapCard.querySelector('.ns-offline-map-placeholder');
    if (!isOnline) {
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'ns-offline-map-placeholder';
        placeholder.innerHTML = `
          <div class="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm" style="background-color: rgba(255, 184, 0, 0.15); border: 1px solid rgba(255, 184, 0, 0.35); color: #FFB800;">
            <span class="material-symbols-outlined text-xl leading-none">wifi_off</span>
          </div>
          <span class="text-xs font-extrabold tracking-wide uppercase" style="color: #FFB800;">
            Map is unavailable offline
          </span>
          <span class="text-[11px] text-slate-400 font-medium mt-0.5">
            Reconnect to view live verified essentials
          </span>
        `;
        mapCard.appendChild(placeholder);
      }
      placeholder.style.display = 'flex';
    } else if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  function handleNetworkChange() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    syncInlineMapPlaceholder(isOnline);
  }

  // Intercept clicks on restricted links and AI tools when offline
  document.addEventListener(
    'click',
    function (e) {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) return;

      // Guard AI Assistant button / drawer trigger when offline
      const aiTrigger = e.target.closest('#chat-fab, #chatbot-fab-btn, [data-fab-alias="chatbot-fab-btn"]');
      if (aiTrigger) {
        e.preventDefault();
        e.stopPropagation();
        showOfflineModal();
        return;
      }

      // Guard restricted page navigation links when offline
      const link = e.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        if (!isAllowedOfflineHref(href)) {
          e.preventDefault();
          e.stopPropagation();
          showOfflineModal();
        }
      }
    },
    true
  );

  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleNetworkChange);
  } else {
    handleNetworkChange();
  }

  window.showOfflineModal = showOfflineModal;
})();


