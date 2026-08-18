/**
 * Northstar Interactive Web Application Module
 * Architecture & Dual-Funnel Role Navigation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
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

  // Automatic Trigger: Viewing Shelter Info
  if (currentPath === 'call-shelter.html') {
    setTimeout(() => updateMilestone('safePlace', true), 500);
  }

  initClock();
  initRoleNavigation();
  initDonationForm();
  initResourceMapFilter();
  initHelpModal();
  initCallModal();
  initTaskClaiming();
  initInstantPageTransitions();
  renderProgressPage();
});

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
    if (tabLogin) tabLogin.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-amber-400 text-slate-950 transition-all';
    if (tabSignup) tabSignup.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all';
    if (roleContainer) roleContainer.classList.add('hidden');
    if (submitBtn) submitBtn.textContent = 'Sign In';
  } else {
    if (tabSignup) tabSignup.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-amber-400 text-slate-950 transition-all';
    if (tabLogin) tabLogin.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all';
    if (roleContainer) roleContainer.classList.remove('hidden');
    if (submitBtn) submitBtn.textContent = 'Create Account';
  }
};

window.setAuthRole = function (role) {
  authSelectedRole = role;
  const seekerBtn = document.getElementById('role-btn-seeker');
  const volunteerBtn = document.getElementById('role-btn-volunteer');

  if (role === 'seeker') {
    if (seekerBtn) seekerBtn.className = 'py-2.5 px-3 text-xs font-extrabold rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-400 flex items-center justify-center gap-1.5 transition-all';
    if (volunteerBtn) volunteerBtn.className = 'py-2.5 px-3 text-xs font-extrabold rounded-xl border border-slate-800 bg-slate-900 text-slate-400 flex items-center justify-center gap-1.5 transition-all';
  } else {
    if (volunteerBtn) volunteerBtn.className = 'py-2.5 px-3 text-xs font-extrabold rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-400 flex items-center justify-center gap-1.5 transition-all';
    if (seekerBtn) seekerBtn.className = 'py-2.5 px-3 text-xs font-extrabold rounded-xl border border-slate-800 bg-slate-900 text-slate-400 flex items-center justify-center gap-1.5 transition-all';
  }
};

window.handleAuthFormSubmit = async function (e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    showNotification('Please enter both email and password.', 'error');
    return;
  }

  // Password Policy Protocol: Minimum 6 characters required
  if (authMode === 'signup' && password.length < 6) {
    showNotification('Password protocol: Must be at least 6 characters long.', 'error');
    return;
  }

  let role = authSelectedRole || 'seeker';
  let supabaseUser = null;

  // Supabase Auth Integration with strict validation
  if (window.supabaseClient) {
    try {
      if (authMode === 'signup') {
        const { data, error } = await window.supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { role } }
        });

        if (error) {
          showNotification(`Registration Failed: ${error.message}`, 'error');
          return;
        }

        // Supabase returns an empty identities array if email is already registered
        if (data?.user && data?.user?.identities && data.user.identities.length === 0) {
          showNotification('This email address is already in use. Please sign in instead.', 'error');
          return;
        }

        if (data?.user) {
          supabaseUser = data.user;
          await window.supabaseClient.from('profiles').upsert({ id: data.user.id, role, email });
          showNotification('Account created successfully!', 'success');
        }
      } else {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
          showNotification(`Login Failed: ${error.message}`, 'error');
          return;
        }
        if (data?.user) {
          supabaseUser = data.user;
          const { data: profile } = await window.supabaseClient.from('profiles').select('role').eq('id', data.user.id).single();
          if (profile?.role) role = profile.role;
          showNotification('Signed in successfully!', 'success');
        }
      }
    } catch (err) {
      console.error('Supabase authentication error:', err);
      showNotification('Authentication error. Please check your network connection.', 'error');
      return;
    }
  }

  const userData = {
    username: email,
    email,
    role,
    id: supabaseUser?.id || `user-${Date.now()}`,
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

  // Navigate directly to the user's role-specific dashboard
  const targetDashboard = role === 'volunteer' ? 'helper-dashboard.html' : 'seeker-dashboard.html';
  if (typeof navigateToPageInstant === 'function') {
    navigateToPageInstant(targetDashboard);
  } else {
    window.location.href = targetDashboard;
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
function initInstantPageTransitions() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href$=".html"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('tel:')) return;

    // Prevent re-rendering the exact same page if the user clicks the active tab again (Fixes layout collapsing bugs)
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (href === currentPath) {
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
  try {
    // Show Swirling Loading Overlay
    const loader = document.getElementById('swirling-loader-overlay');
    if (loader) {
      loader.classList.remove('hidden');
      loader.style.display = 'flex';
    }

    // React app or dynamically mounted pages must perform full browser load to initialize React root scripts
    if (url.includes('resource-map.html') || window.location.pathname.includes('resource-map.html')) {
      window.location.href = url;
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      if (loader) { loader.classList.add('hidden'); loader.style.display = 'none'; }
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
        initHelpModal();
        initCallModal();
        initTaskClaiming();
        // Execute inline script tags present in the loaded page document
        doc.querySelectorAll('script').forEach(s => {
          if (s.textContent) {
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
      }, 90);
    } else {
      window.location.href = url;
    }
  } catch (err) {
    console.error('Page fetch error, falling back:', err);
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
  // Volunteer-only routes: helper-dashboard.html, opportunities.html, donate.html
  const seekerOnlyRoutes = ['resume-builder.html', 'progress.html'];
  const volunteerOnlyRoutes = ['helper-dashboard.html', 'opportunities.html', 'donate.html'];

  if (role === 'seeker' && volunteerOnlyRoutes.includes(currentPath)) {
    showNotification('Restricted area. Redirecting to Seeker Dashboard...', 'warning');
    if (typeof navigateToPageInstant === 'function') {
      navigateToPageInstant('seeker-dashboard.html');
    } else {
      window.location.href = 'seeker-dashboard.html';
    }
  } else if (role === 'volunteer' && seekerOnlyRoutes.includes(currentPath)) {
    showNotification('Restricted area. Redirecting to Helper Dashboard...', 'warning');
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
  if (role === 'seeker' && (currentPath === 'helper-dashboard.html' || currentPath === 'opportunities.html' || currentPath === 'donate.html')) {
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

  nav.style.display = 'flex';
  nav.classList.remove('hidden');

  const role = getRole();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let navItems = [];

  if (role === 'seeker') {
    // Seeker Funnel Tabs: [Dashboard, Resources/Map, Resume, Progress, Settings]
    navItems = [
      { href: 'seeker-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: 'resource-map.html', label: 'Map', icon: 'map' },
      { href: 'resume-builder.html', label: 'Resume', icon: 'description' },
      { href: 'progress.html', label: 'Progress', icon: 'military_tech' },
      { href: '#', label: 'Settings', icon: 'settings', action: 'openSettingsModal()' }
    ];
  } else {
    // Volunteer Funnel Tabs: [Dashboard, Opportunities, Donate, Shelter Info, Settings]
    navItems = [
      { href: 'helper-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: 'opportunities.html', label: 'Opportunities', icon: 'work' },
      { href: 'donate.html', label: 'Donate', icon: 'volunteer_activism' },
      { href: 'call-shelter.html', label: 'Shelter', icon: 'call' },
      { href: '#', label: 'Settings', icon: 'settings', action: 'openSettingsModal()' }
    ];
  }

  // Smooth item swap animation
  nav.classList.add('transition-opacity', 'duration-150');
  nav.innerHTML = navItems.map(item => {
    const isActive = currentPath === item.href || (currentPath === '' && item.href === 'index.html');
    const activeClass = isActive && !item.action
      ? 'bg-secondary-container text-on-secondary-container rounded-2xl px-3 py-1.5 shadow-md starlight-glow font-bold animate-switch-pop'
      : 'text-on-surface-variant hover:text-primary px-3 py-1.5 font-medium';

    const fillStyle = isActive && !item.action ? "style=\"font-variation-settings: 'FILL' 1;\"" : "";

    if (item.action) {
      return `
        <button onclick="${item.action}" class="flex flex-col items-center justify-center transition-all ${activeClass}">
          <span class="material-symbols-outlined text-xl" ${fillStyle}>${item.icon}</span>
          <span class="text-[11px]">${item.label}</span>
        </button>
      `;
    }

    return `
      <a class="flex flex-col items-center justify-center transition-all ${activeClass}" href="${item.href}">
        <span class="material-symbols-outlined text-xl" ${fillStyle}>${item.icon}</span>
        <span class="text-[11px]">${item.label}</span>
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
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'absolute inset-0 z-[150] hidden flex-col justify-end';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick="closeModal('settings-modal')"></div>
      <div class="modal-drawer bg-surface w-full rounded-t-3xl p-6 transform translate-y-full transition-transform duration-300 ease-in-out relative flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5"></div>
        <h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined">settings</span> Settings
        </h2>
        
        <div class="space-y-6">
          <!-- Role Selector -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Account Role</label>
            <div class="grid grid-cols-2 gap-3">
              <button onclick="switchUserRole('seeker'); setTimeout(() => openSettingsModal(), 10);" id="settings-role-seeker" class="py-3 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1">
                <span class="material-symbols-outlined text-xl">search</span>
                <span>I need help</span>
                <span class="text-[10px] opacity-75 font-normal">(Seeker)</span>
              </button>
              <button onclick="switchUserRole('volunteer'); setTimeout(() => openSettingsModal(), 10);" id="settings-role-volunteer" class="py-3 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1">
                <span class="material-symbols-outlined text-xl">volunteer_activism</span>
                <span>I want to help</span>
                <span class="text-[10px] opacity-75 font-normal">(Helper)</span>
              </button>
            </div>
          </div>


          <!-- Sign Out Button -->
          <div class="pt-4 border-t border-slate-200">
            <button onclick="signOutUser()" class="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-sm shadow-sm transition-colors border border-rose-100 flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-sm">logout</span> Sign out
            </button>
          </div>
        </div>
      </div>
    `;
    const appFrame = document.querySelector('.app-frame');
    if (appFrame) {
      appFrame.appendChild(modal);
    }
  }

  // Update role toggle UI state
  const role = getRole();
  const seekerBtn = document.getElementById('settings-role-seeker');
  const volunteerBtn = document.getElementById('settings-role-volunteer');

  if (role === 'seeker') {
    seekerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-amber-400 bg-amber-50 text-amber-900 transition-all flex flex-col items-center justify-center gap-1 shadow-sm';
    volunteerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1';
  } else {
    volunteerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-amber-400 bg-amber-50 text-amber-900 transition-all flex flex-col items-center justify-center gap-1 shadow-sm';
    seekerBtn.className = 'py-3 px-3 text-xs font-bold rounded-xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1';
  }

  openModal('settings-modal');
};

// Global Toast Notification System
function showNotification(message, type = 'info') {
  const appFrame = document.querySelector('.app-frame') || document.body;
  let container = document.getElementById('toast-container');
  if (!container || !appFrame.contains(container)) {
    if (container) container.remove();
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'absolute top-12 left-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none';
    appFrame.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-slate-900/95 border-amber-400/60 text-white' : 'bg-slate-900/95 border-slate-700 text-white';

  toast.className = `${bgClass} border px-3.5 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center justify-between pointer-events-auto transition-all duration-300 transform -translate-y-2 opacity-0 text-xs font-semibold`;

  toast.innerHTML = `
    <div class="flex items-center gap-2.5 overflow-hidden">
      <img src="northstar-logo.png" class="w-4 h-4 object-contain flex-shrink-0" alt="Northstar" />
      <span class="truncate">${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-0.5 ml-2 flex-shrink-0">
      <span class="material-symbols-outlined text-xs">close</span>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('-translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Auth Entry Functions ---

function loginAsGuest() {
  const session = { username: 'Guest', role: 'seeker', isGuest: true };
  localStorage.setItem('northstar_session', JSON.stringify(session));

  // Navigate directly to dashboard
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
window.handleGatewayLogin = handleGatewayLogin;
window.logout = logout;

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
  const username = document.getElementById('gateway-username').value;
  if (!username) return showNotification('Please enter a username', 'error');
  // Use the passed mode ('signin' or 'signup') or fall back to the current role toggle state
  const resolvedMode = mode || currentGatewayMode;
  loginAsUser(username, resolvedMode);
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
  const key = `northstar_data_${session.username}`;
  return JSON.parse(localStorage.getItem(key)) || defaultUserData;
}

function updateMilestone(milestoneKey, isCompleted) {
  const session = getSession();
  const key = `northstar_data_${session.username}`;
  const userData = getUserData();
  userData.progress[milestoneKey] = isCompleted;

  const completedCount = Object.keys(userData.progress).filter(k => userData.progress[k] === true).length;
  userData.progress.movingForward = completedCount >= 5;

  localStorage.setItem(key, JSON.stringify(userData));
  renderProgressPage();
}



function saveResumeData(data) {
  const session = getSession();
  const key = `northstar_data_${session.username}`;
  const userData = getUserData();
  userData.resumeData = data;
  localStorage.setItem(key, JSON.stringify(userData));
}

function renderProgressPage() {
  const stepperContainer = document.getElementById('stepper-nodes');
  const listContainer = document.getElementById('journey-list-container');
  if (!stepperContainer || !listContainer) return;

  const userData = getUserData();
  const state = userData.progress;
  const completedCount = Object.keys(state).filter(k => state[k] === true).length;

  const session = getSession();
  const accountLabel = document.getElementById('progress-account-label');
  if (accountLabel) {
    accountLabel.textContent = session.isGuest ? 'Browsing as Guest' : `Signed in as ${session.username}`;
  }

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
      <div class="w-6 h-6 rounded-full flex items-center justify-center ${isCompleted ? 'bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-800 border-2 border-slate-600 text-slate-400'} z-10 text-xs transition-colors duration-300">
          <span class="material-symbols-outlined text-[14px]">${isCompleted ? 'circle' : 'radio_button_unchecked'}</span>
      </div>
    `;
  }).join('');

  listContainer.innerHTML = milestones.map((m, index) => {
    const isCompleted = m.status === 'completed';
    const isLast = index === milestones.length - 1;
    let clickHandler = m.hasModal ? `onclick="openMilestoneModal('${m.id}')"` : '';
    let cursorClass = m.hasModal ? 'cursor-pointer hover:bg-slate-50 transition-colors' : '';

    return `
      <div class="relative flex gap-4 ${!isLast ? 'pb-6' : ''}">
        ${!isLast ? '<div class="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-200"></div>' : ''}
        
        <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${isCompleted ? 'bg-' + m.color + '-100 text-' + m.color + '-600 shadow-sm border border-' + m.color + '-200' : 'bg-slate-100 text-slate-400 border border-slate-200'} transition-colors duration-300">
            <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' ${isCompleted ? '1' : '0'};">${m.icon}</span>
        </div>
        
        <div class="bg-surface-container-lowest border border-slate-200/80 p-4 rounded-2xl shadow-sm flex-1 ${cursorClass}" ${clickHandler}>
            <div class="flex justify-between items-start">
                <h4 class="font-bold text-sm text-primary">${m.title}</h4>
                ${isCompleted ? '<span class="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>' : (m.status === 'in-progress' ? '<span class="material-symbols-outlined text-amber-500 text-lg">pending</span>' : '<span class="material-symbols-outlined text-slate-300 text-lg">lock</span>')}
            </div>
            <p class="text-[11px] text-slate-500 mt-1 leading-snug">${m.desc}</p>
            ${(!isCompleted && m.customAction) || m.id === 'movingForward' ? m.customAction : ''}
        </div>
      </div>
    `;
  }).join('');
}

