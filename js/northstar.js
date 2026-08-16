/**
 * Northstar Interactive Web Application Module
 * Architecture & Dual-Funnel Role Navigation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const session = JSON.parse(localStorage.getItem('northstar_session'));

  // Session check on index.html: show gateway if no session, else show nav and layout
  if (currentPath === 'index.html' || currentPath === '') {
    const gatewayView = document.getElementById('auth-gateway-view');
    const mainLayout = document.getElementById('main-app-layout');
    const bottomNav = document.querySelector('.bottom-nav');

    if (session) {
      if (gatewayView) gatewayView.classList.add('hidden');
      if (mainLayout) mainLayout.classList.remove('hidden');
      if (bottomNav) bottomNav.style.display = 'flex';
      setRole(session.role);
    } else {
      if (gatewayView) gatewayView.classList.remove('hidden');
      if (mainLayout) mainLayout.classList.add('hidden');
    }

    function enterApp(userData) {
      console.log('Unlocking app with user:', userData);
      localStorage.setItem('northstar_session', JSON.stringify(userData));
      setRole(userData.role);

      // Hide BOTH possible gateway overlays
      ['auth-gateway-view', 'welcome-gateway'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
      });

      // Show main app layout
      if (mainLayout) {
        mainLayout.classList.remove('hidden');
        mainLayout.style.display = 'flex';
      }

      // Show nav
      if (bottomNav) {
        bottomNav.style.display = 'flex';
      }
    }

    let currentMode = 'login';
    let selectedRole = 'seeker';

    // Single delegated click listener covers BOTH overlays
    document.body.addEventListener('click', (e) => {

      // ── #welcome-gateway buttons ──────────────────────────────────────────

      // Guest button (both overlays share this id)
      if (e.target.closest('#guest-btn')) {
        e.preventDefault();
        enterApp({ username: 'Guest', role: 'seeker', isGuest: true });
        return;
      }

      // Sign In button (#welcome-gateway)
      if (e.target.closest('#sign-in-btn')) {
        e.preventDefault();
        const username = (document.getElementById('gateway-username') || {}).value || '';
        const password = (document.getElementById('gateway-password') || {}).value || '';
        if (!username.trim()) { showNotification('Please enter a username.', 'error'); return; }
        enterApp({ username: username.trim(), role: currentGatewayMode || selectedRole, isGuest: false, mode: 'signin' });
        return;
      }

      // Create Account button (#welcome-gateway)
      if (e.target.closest('#create-account-btn')) {
        e.preventDefault();
        const username = (document.getElementById('gateway-username') || {}).value || '';
        const password = (document.getElementById('gateway-password') || {}).value || '';
        if (!username.trim()) { showNotification('Please enter a username.', 'error'); return; }
        enterApp({ username: username.trim(), role: currentGatewayMode || selectedRole, isGuest: false, mode: 'signup' });
        return;
      }

      // ── #auth-gateway-view tab toggles ───────────────────────────────────

      const tabLogin = e.target.closest('#tab-login');
      const tabSignup = e.target.closest('#tab-signup');
      const roleSelection = document.getElementById('role-selection');
      const submitBtn = document.getElementById('auth-submit-btn');

      if (tabLogin) {
        currentMode = 'login';
        tabLogin.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white';
        if (tabSignup) tabSignup.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400';
        roleSelection?.classList.add('hidden');
        if (submitBtn) submitBtn.textContent = 'Sign In';
      }
      if (tabSignup) {
        currentMode = 'signup';
        tabSignup.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white';
        if (tabLogin) tabLogin.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400';
        roleSelection?.classList.remove('hidden');
        if (submitBtn) submitBtn.textContent = 'Create Account';
      }

      // Role selection buttons
      const roleBtn = e.target.closest('.role-btn');
      if (roleBtn) {
        selectedRole = roleBtn.dataset.role;
        document.querySelectorAll('.role-btn').forEach(b => {
          b.className = 'role-btn py-2 text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800 rounded-lg';
        });
        roleBtn.className = 'role-btn py-2 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg';
      }
    });

    // Form submit on #auth-gateway-view
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('auth-username');
        const username = usernameInput ? usernameInput.value : 'User';
        enterApp({
          username,
          role: currentMode === 'signup' ? selectedRole : 'seeker',
          isGuest: false
        });
      });
    }
  }

  // Automatic Trigger: Viewing Shelter Info
  if (currentPath === 'call-shelter.html') {
    // Slight delay to ensure DOM is ready and it doesn't block rendering
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

// Instant Zero-Lag Page Swapping Engine (SPA Router)
function initInstantPageTransitions() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href$=".html"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('tel:')) return;

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
    // React app or dynamically mounted pages must perform full browser load to initialize React root scripts
    if (url.includes('resource-map.html') || window.location.pathname.includes('resource-map.html')) {
      window.location.href = url;
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
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
        document.title = doc.title;
        if (pushState) {
          window.history.pushState({}, doc.title, url);
        }

        currentAppFrame.classList.remove('opacity-0');
        currentAppFrame.classList.add('animate-fade-in-up');

        // Re-initialize dynamic page handlers
        initClock();
        initRoleNavigation();
        initDonationForm();
        initResourceMapFilter();
        initHelpModal();
        initCallModal();
        initTaskClaiming();
        if (typeof window.updateLandingRoleCards === 'function') {
          window.updateLandingRoleCards();
        }
        if (typeof window.initChipToggles === 'function') {
          window.initChipToggles();
        }
        if (typeof window.loadOpportunities === 'function') {
          window.loadOpportunities();
        }
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

// Global Role Management (Seeker vs Volunteer)
function getRole() {
  return localStorage.getItem('northstar_user_role') || 'seeker';
}

function setRole(role) {
  if (role !== 'seeker' && role !== 'volunteer') role = 'seeker';
  localStorage.setItem('northstar_user_role', role);
  renderDynamicNav();
  renderRoleHeaderToggle();
  if (typeof window.updateLandingRoleCards === 'function') {
    window.updateLandingRoleCards();
  }
}

// Dynamic Navigation Engine based on Funnel Architecture
function initRoleNavigation() {
  renderRoleHeaderToggle();
  renderDynamicNav();
}

function renderRoleHeaderToggle() {
  const header = document.querySelector('header');
  if (!header) return;

  let toggleDiv = document.getElementById('role-header-toggle');
  const role = getRole();
  const isSeeker = role === 'seeker';

  if (!toggleDiv) {
    toggleDiv = document.createElement('div');
    toggleDiv.id = 'role-header-toggle';
    toggleDiv.className = 'role-toggle-container no-print';

    toggleDiv.innerHTML = `
      <div id="role-sliding-pill" class="role-toggle-pill ${!isSeeker ? 'volunteer-mode' : ''}"></div>
      <button id="btn-role-seeker" onclick="switchUserRole('seeker')" class="role-toggle-btn ${isSeeker ? 'active-seeker' : 'inactive-text'}">
        🙋 Seeker
      </button>
      <button id="btn-role-volunteer" onclick="switchUserRole('volunteer')" class="role-toggle-btn ${!isSeeker ? 'active-volunteer' : 'inactive-text'}">
        🤝 Helper
      </button>
    `;

    header.appendChild(toggleDiv);
  } else {
    // Update existing toggle state & trigger sliding animation
    const pill = document.getElementById('role-sliding-pill');
    const seekerBtn = document.getElementById('btn-role-seeker');
    const volunteerBtn = document.getElementById('btn-role-volunteer');

    if (pill) {
      if (!isSeeker) {
        pill.classList.add('volunteer-mode');
      } else {
        pill.classList.remove('volunteer-mode');
      }
    }

    if (seekerBtn) {
      seekerBtn.className = `role-toggle-btn ${isSeeker ? 'active-seeker' : 'inactive-text'}`;
    }
    if (volunteerBtn) {
      volunteerBtn.className = `role-toggle-btn ${!isSeeker ? 'active-volunteer' : 'inactive-text'}`;
    }

    toggleDiv.classList.remove('animate-switch-pop');
    void toggleDiv.offsetWidth; // Reflow to restart animation
    toggleDiv.classList.add('animate-switch-pop');
  }
}

function switchUserRole(role) {
  setRole(role);
  showNotification(`Switched mode to: ${role === 'seeker' ? 'Seeker (I Need Help)' : 'Volunteer (I Want to Help)'}`, 'info');

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  if (role === 'seeker' && (currentPath === 'helper-dashboard.html' || currentPath === 'opportunities.html')) {
    window.location.href = 'seeker-dashboard.html';
  } else if (role === 'volunteer' && (currentPath === 'seeker-dashboard.html' || currentPath === 'progress.html')) {
    window.location.href = 'helper-dashboard.html';
  }
}

function renderDynamicNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const role = getRole();
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let navItems = [];

  if (role === 'seeker') {
    // Seeker Funnel Tabs: [Home, Resources/Map, Resume, Progress]
    navItems = [
      { href: 'index.html', label: 'Home', icon: 'home' },
      { href: 'resource-map.html', label: 'Map', icon: 'map' },
      { href: 'resume-builder.html', label: 'Resume', icon: 'description' },
      { href: 'progress.html', label: 'Progress', icon: 'military_tech' }
    ];
  } else {
    // Volunteer Funnel Tabs: [Dashboard, Opportunities, Donate, Shelter Info]
    navItems = [
      { href: 'helper-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: 'opportunities.html', label: 'Opportunities', icon: 'work' },
      { href: 'donate.html', label: 'Donate', icon: 'volunteer_activism' },
      { href: 'call-shelter.html', label: 'Shelter', icon: 'call' }
    ];
  }

  nav.innerHTML = navItems.map(item => {
    const isActive = currentPath === item.href || (currentPath === '' && item.href === 'index.html');
    const activeClass = isActive
      ? 'bg-secondary-container text-on-secondary-container rounded-2xl px-3 py-1.5 shadow-md starlight-glow font-bold animate-switch-pop'
      : 'text-on-surface-variant hover:text-primary px-3 py-1.5 font-medium';

    const fillStyle = isActive ? "style=\"font-variation-settings: 'FILL' 1;\"" : "";

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

// Global Toast Notification System
function showNotification(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-md flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-slate-900 border-secondary-fixed text-white' : 'bg-slate-900 border-slate-700 text-white';

  toast.className = `${bgClass} border px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-lg flex items-center justify-between pointer-events-auto transition-all duration-300 transform -translate-y-4 opacity-0 text-sm font-medium`;

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <img src="northstar-logo.png" class="w-5 h-5 object-contain" alt="Northstar" />
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-1">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('-translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Auth Entry Functions ---

function loginAsGuest() {
  const session = { username: 'Guest', role: 'seeker', isGuest: true };
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

  console.log('Logged in as Guest');
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

window.northstarTest = {
  unlockConnected: () => updateMilestone('connected', true),
  resetData: () => {
    const session = getSession();
    localStorage.removeItem(`northstar_data_${session.username}`);
    localStorage.removeItem('northstar_session');
    location.reload();
  }
};

