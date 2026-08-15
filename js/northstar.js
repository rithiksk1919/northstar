/**
 * Northstar Interactive Web Application Module
 * Architecture & Dual-Funnel Role Navigation Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initRoleNavigation();
  initDonationForm();
  initResourceMapFilter();
  initHelpModal();
  initCallModal();
  initTaskClaiming();
  initInstantPageTransitions();
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

// Expose globally for HTML handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;
window.switchUserRole = switchUserRole;
window.setRole = setRole;
window.getRole = getRole;
