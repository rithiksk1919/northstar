/**
 * Nate Welcome Screen & Dashboard Tour — NorthStar Onboarding Mascot
 *
 * Step 1: Welcome Overlay after account creation (Firefly 22 mascot)
 * Step 2+: Feature tour — Dashboard, Progress, Jobs, Map, Resume, Settings
 *          (Firefly 24 for Dashboard step, Firefly 27 for all others)
 */

(function () {
  'use strict';

  // =========================================================================
  // TOUR STEP DEFINITIONS
  // =========================================================================
  var TOUR_STEPS = [
    {
      label: 'Dashboard',
      tabSelector: 'a[href*="dashboard"], a.active-tab',
      image: 'images/Firefly%20(24).png',
      message: 'This is your Dashboard! Here you can view active updates, track your progress, access quick services, and easily navigate around NorthStar.',
      nextLabel: 'Next • Progress'
    },
    {
      label: 'Progress',
      tabSelector: 'a[href*="progress"]',
      image: 'images/Firefly%20(24).png',
      message: 'The Progress tab tracks your journey! Check off milestones here to level up your NorthStar experience.',
      nextLabel: 'Next • Jobs'
    },
    {
      label: 'Jobs',
      tabSelector: 'a[href*="opportunit"]',
      image: 'images/Firefly%20(24).png',
      message: 'Browse Jobs to find vetted gig work and employment opportunities nearby. Apply directly from the app!',
      nextLabel: 'Next • Map'
    },
    {
      label: 'Map',
      tabSelector: 'a[href*="resource-map"], a[href*="map"]',
      image: 'images/Firefly%20(27).png',
      message: 'The Map shows shelters, food banks, clinics, and services near you — all in one place.',
      nextLabel: 'Next • Resume'
    },
    {
      label: 'Resume',
      tabSelector: 'a[href*="resume"]',
      image: 'images/Firefly%20(27).png',
      message: 'Build and export a professional resume with our guided Resume Builder. Employers are waiting for you!',
      nextLabel: 'Next • Settings'
    },
    {
      label: 'Settings',
      tabSelector: 'button[onclick*="openSettings"], button[onclick*="settings"], button[onclick*="Settings"]',
      image: 'images/Firefly%20(27).png',
      message: 'Settings lets you manage your profile, notifications, and account preferences anytime.',
      nextLabel: "Next • AI Assistant",
      isNavTab: true
    },
    {
      label: 'AI Assistant',
      tabSelector: '#chat-fab, [data-fab-alias="chatbot-fab-btn"]',
      image: 'images/Firefly%20(28).png',
      message: "Meet your NorthStar AI Assistant! Ask me anything — find resources, get support, or just say hi. I'm here 24/7 to help.",
      nextLabel: "Got it! Let's Go",
      isNavTab: false
    }
  ];

  // =========================================================================
  // STEP 1: WELCOME OVERLAY (inside phone frame)
  // =========================================================================
  window.showNateWelcome = function (redirectUrl) {
    const phoneFrame = document.querySelector('.app-frame.phone-frame') || document.body;

    // Hide existing children inside phone frame
    const existingChildren = Array.from(phoneFrame.children);
    existingChildren.forEach(function (child) {
      if (child.id !== 'nate-welcome-overlay' && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
        child.style.display = 'none';
      }
    });

    // Create overlay element
    let overlay = document.getElementById('nate-welcome-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'nate-welcome-overlay';
    overlay.innerHTML =
      '<div class="nwb"></div>' +
      '<div class="nwc">' +
        '<div class="nws" id="nate-stars"></div>' +
        '<img src="images/Firefly%20(22).png" alt="Nate" class="nwchar" id="nate-img" />' +
        '<div class="nwbub" id="nate-bubble">' +
          '<span class="nwt" id="nate-text"></span>' +
          '<span class="nwcur" id="nate-cursor">|</span>' +
        '</div>' +
        '<button class="nwbtn" id="nate-proceed">' +
          'Proceed' +
          '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:4px;">arrow_forward</span>' +
        '</button>' +
      '</div>';

    injectStyles();
    phoneFrame.appendChild(overlay);

    // Spawn floating stars
    const starsEl = document.getElementById('nate-stars');
    if (starsEl) {
      for (let i = 0; i < 25; i++) {
        const s = document.createElement('div');
        s.className = 'nst';
        const sz = Math.random() * 3 + 1.5;
        s.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + (Math.random() * 100) + '%;top:' + (60 + Math.random() * 40) + '%;animation-duration:' + (4 + Math.random() * 6) + 's;animation-delay:' + (Math.random() * 4) + 's';
        starsEl.appendChild(s);
      }
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('nv');
      });
    });

    const nateImg = document.getElementById('nate-img');
    const bubble = document.getElementById('nate-bubble');
    const textEl = document.getElementById('nate-text');
    const cursor = document.getElementById('nate-cursor');
    const proceedBtn = document.getElementById('nate-proceed');

    const message = "Welcome to Northstar! I'm Nate, let me show you around!";

    setTimeout(function () {
      if (nateImg) {
        nateImg.style.opacity = '1';
        nateImg.style.transform = 'translateY(0) scale(1)';
        nateImg.classList.add('nidle');
      }
      if (bubble) bubble.classList.add('nbv');

      setTimeout(function () {
        let charIndex = 0;
        const typeInterval = setInterval(function () {
          if (charIndex < message.length) {
            textEl.textContent += message[charIndex];
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTimeout(function () {
              if (cursor) cursor.classList.add('nh');
              if (proceedBtn) proceedBtn.classList.add('nbvis');
            }, 400);
          }
        }, 40);
      }, 400);
    }, 1400);

    if (proceedBtn) {
      proceedBtn.addEventListener('click', function () {
        proceedBtn.disabled = true;
        sessionStorage.setItem('show_nate_dashboard_tour', 'true');
        overlay.classList.remove('nv');
        overlay.classList.add('nx');
        setTimeout(function () {
          window.location.href = redirectUrl;
        }, 600);
      });
    }
  };

  // =========================================================================
  // STEP 2+: FEATURE TOUR (multi-step, data-driven)
  // =========================================================================
  window.showNateDashboardTour = function () {
    const phoneFrame = document.querySelector('.app-frame.phone-frame') || document.body;
    injectStyles();

    // --- Dim Backdrop ---
    let dimOverlay = document.getElementById('nate-tour-dim');
    if (dimOverlay) dimOverlay.remove();
    dimOverlay = document.createElement('div');
    dimOverlay.id = 'nate-tour-dim';
    dimOverlay.className = 'nate-dim-backdrop';
    phoneFrame.appendChild(dimOverlay);

    // --- Elevate bottom nav ---
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      bottomNav.classList.add('nate-nav-elevated');
      // Strip all native active styling from every tab
      bottomNav.querySelectorAll('a, button').forEach(function (tab) {
        tab.classList.remove(
          'bg-secondary-container', 'text-on-secondary-container', 'active-tab',
          'bg-amber-400/15', 'text-amber-500', 'dark:text-amber-400',
          'border', 'border-amber-400/30', 'shadow-[0_0_12px_rgba(245,158,11,0.2)]'
        );
      });
    }

    // --- Helper: force a tab/button fully deselected ---
    function forceTabDeselected(el) {
      if (!el) return;
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('border-color', 'transparent', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('color', '#94a3b8', 'important');
      el.style.setProperty('transform', 'none', 'important');
      el.querySelectorAll('*').forEach(function (child) {
        child.style.setProperty('color', '#94a3b8', 'important');
      });
    }

    // --- Helper: clear forced styles and spotlight an element ---
    function spotlightTab(el) {
      if (!el) return;
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('color');
      el.style.removeProperty('border-color');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('transform');
      el.querySelectorAll('*').forEach(function (child) {
        child.style.removeProperty('color');
      });
      el.classList.add('nate-tab-spotlight');
    }

    // --- Helper: find a tab by a step's selector ---
    // Searches bottomNav first for nav tabs, then falls back to document-wide
    function findTab(selector, isNavTab) {
      var parts = selector.split(',');
      // Try bottomNav first for nav items
      if (isNavTab !== false && bottomNav) {
        for (var i = 0; i < parts.length; i++) {
          var el = bottomNav.querySelector(parts[i].trim());
          if (el) return el;
        }
      }
      // Fall back to document-wide search (for header buttons etc.)
      for (var j = 0; j < parts.length; j++) {
        var docEl = document.querySelector(parts[j].trim());
        if (docEl) return docEl;
      }
      return null;
    }

    // --- Build tour overlay ---
    let tourOverlay = document.getElementById('nate-tour-overlay');
    if (tourOverlay) tourOverlay.remove();

    tourOverlay = document.createElement('div');
    tourOverlay.id = 'nate-tour-overlay';
    tourOverlay.innerHTML =
      '<div class="nte-content">' +
        '<div class="nwbub nwbub-tour" id="nate-tour-bubble">' +
          '<div class="nte-badge" id="nate-tour-badge">Step 1 of ' + TOUR_STEPS.length + ' • ' + TOUR_STEPS[0].label + '</div>' +
          '<div class="nwt-body">' +
            '<span class="nwt" id="nate-tour-text"></span>' +
            '<span class="nwcur" id="nate-tour-cursor">|</span>' +
          '</div>' +
          '<button class="nwbtn nwbtn-tour" id="nate-tour-finish">' +
            TOUR_STEPS[0].nextLabel +
            '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:4px;">arrow_forward</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="nte-pointing-wrapper" id="nate-tour-wrapper">' +
        '<img src="' + TOUR_STEPS[0].image + '" alt="Nate pointing" class="nwchar nwchar-pointing" id="nate-pointing-img" />' +
        '<div class="nte-arrow-pointer"></div>' +
      '</div>';

    phoneFrame.appendChild(tourOverlay);

    // --- State ---
    let currentStepIndex = 0;
    let currentSpotlitTab = null;
    let activeTypeInterval = null;

    // --- Spotlight first tab ---
    var firstStep = TOUR_STEPS[0];
    var firstTab = findTab(firstStep.tabSelector, firstStep.isNavTab) || (bottomNav && bottomNav.firstElementChild);
    // Force deselect all first
    if (bottomNav) {
      bottomNav.querySelectorAll('a, button').forEach(forceTabDeselected);
    }
    spotlightTab(firstTab);
    currentSpotlitTab = firstTab;

    positionPointingWrapper();
    window.addEventListener('resize', positionPointingWrapper);

    // Animate in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        dimOverlay.classList.add('nv');
        tourOverlay.classList.add('nv');
      });
    });

    const pointingImg = document.getElementById('nate-pointing-img');
    const tourBubble = document.getElementById('nate-tour-bubble');
    const tourTextEl = document.getElementById('nate-tour-text');
    const tourCursor = document.getElementById('nate-tour-cursor');
    const finishBtn = document.getElementById('nate-tour-finish');
    const badgeEl = document.getElementById('nate-tour-badge');

    // --- Type a message ---
    function typeMessage(msg, onDone) {
      if (activeTypeInterval) clearInterval(activeTypeInterval);
      tourTextEl.textContent = '';
      if (tourCursor) tourCursor.classList.remove('nh');
      finishBtn.classList.remove('nbvis');
      finishBtn.disabled = true;

      let idx = 0;
      activeTypeInterval = setInterval(function () {
        if (idx < msg.length) {
          tourTextEl.textContent += msg[idx];
          idx++;
        } else {
          clearInterval(activeTypeInterval);
          activeTypeInterval = null;
          setTimeout(function () {
            if (tourCursor) tourCursor.classList.add('nh');
            finishBtn.disabled = false;
            finishBtn.classList.add('nbvis');
            if (onDone) onDone();
          }, 400);
        }
      }, 35);
    }

    // --- Transition to a given step index ---
    function goToStep(stepIndex) {
      const step = TOUR_STEPS[stepIndex];

      // Update badge
      if (badgeEl) {
        badgeEl.textContent = 'Step ' + (stepIndex + 1) + ' of ' + TOUR_STEPS.length + ' • ' + step.label;
      }

      // Update mascot image
      if (pointingImg) {
        pointingImg.src = step.image;
      }

      // Update button label
      finishBtn.innerHTML =
        step.nextLabel +
        '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:4px;">arrow_forward</span>';

      // Deselect previous tab, spotlight new one
      if (currentSpotlitTab) {
        currentSpotlitTab.classList.remove('nate-tab-spotlight');
        forceTabDeselected(currentSpotlitTab);
      }
      var newTab = findTab(step.tabSelector, step.isNavTab);
      if (newTab) {
        spotlightTab(newTab);
        currentSpotlitTab = newTab;
      }

      // Reposition mascot
      positionPointingWrapper();

      // Type message
      typeMessage(step.message);
    }

    // --- Initial animation then type step 1 ---
    setTimeout(function () {
      if (pointingImg) {
        pointingImg.style.opacity = '1';
        pointingImg.style.transform = 'translateY(0) scale(1)';
        pointingImg.classList.add('nidle-bounce');
      }
      if (tourBubble) tourBubble.classList.add('nbv');

      setTimeout(function () {
        typeMessage(TOUR_STEPS[0].message);
      }, 400);
    }, 800);

    // --- Button click handler ---
    if (finishBtn) {
      finishBtn.addEventListener('click', function () {
        const nextIndex = currentStepIndex + 1;

        if (nextIndex < TOUR_STEPS.length) {
          // Advance to next step
          currentStepIndex = nextIndex;
          goToStep(currentStepIndex);
        } else {
          // Tour complete — trigger final bounce out with Firefly 29
          finishBtn.disabled = true;
          
          if (tourBubble) tourBubble.classList.remove('nbv');
          if (pointingImg) pointingImg.style.opacity = '0';
          
          // Create final bounce element
          let finalMascot = document.createElement('img');
          finalMascot.src = 'images/Firefly%20(29).png';
          finalMascot.className = 'nwchar-final-bounce';
          phoneFrame.appendChild(finalMascot);
          
          // Animate in, wait, animate out, then redirect
          setTimeout(function() {
            finalMascot.classList.add('bounce-in');
            
            setTimeout(function() {
              finalMascot.classList.replace('bounce-in', 'bounce-out');
              
              setTimeout(function () {
                dimOverlay.classList.remove('nv');
                tourOverlay.classList.remove('nv');
                tourOverlay.classList.add('nx');
                window.removeEventListener('resize', positionPointingWrapper);
                
                setTimeout(function () {
                  if (bottomNav) bottomNav.classList.remove('nate-nav-elevated');
                  if (currentSpotlitTab) currentSpotlitTab.classList.remove('nate-tab-spotlight');
                  dimOverlay.remove();
                  tourOverlay.remove();
                  finalMascot.remove();
                  window.location.href = 'seeker-dashboard.html';
                }, 500);
              }, 600); // Wait for bounce out
            }, 1200); // Hang time
          }, 300); // Wait for previous elements to hide
        }
      });
    }
  };

  // =========================================================================
  // AUTO-RUN CHECK ON PAGE LOAD
  // =========================================================================
  document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('show_nate_dashboard_tour') === 'true') {
      sessionStorage.removeItem('show_nate_dashboard_tour');
      setTimeout(function () {
        if (typeof window.showNateDashboardTour === 'function') {
          window.showNateDashboardTour();
        }
      }, 500);
    }
  });

  // =========================================================================
  // STYLES INJECTION
  // =========================================================================
  function injectStyles() {
    if (document.getElementById('nate-welcome-css')) return;
    const css = document.createElement('style');
    css.id = 'nate-welcome-css';
    css.textContent = [
      '#nate-welcome-overlay{position:relative;width:100%;min-height:100%;flex:1;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .6s cubic-bezier(.4,0,.2,1);overflow:hidden;z-index:9999}',
      '#nate-welcome-overlay.nv{opacity:1}',
      '#nate-welcome-overlay.nx{opacity:0;pointer-events:none}',

      '.nwb{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,#0f1729 0%,#080c16 60%,#040609 100%)}',
      '.nwc{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:2rem 1.5rem;width:100%;box-sizing:border-box}',

      '.nws{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}',
      '.nst{position:absolute;border-radius:50%;background:rgba(245,158,11,.5);animation:nsf linear infinite}',
      '@keyframes nsf{0%{transform:translateY(0) scale(1);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-60vh) scale(.4);opacity:0}}',

      '.nwchar{width:180px;height:auto;object-fit:contain;filter:drop-shadow(0 8px 32px rgba(245,158,11,.25));transform:translateY(120px) scale(.7);opacity:0;animation:nsi 1s cubic-bezier(.34,1.56,.64,1) .3s forwards}',
      '@keyframes nsi{0%{transform:translateY(120px) scale(.7);opacity:0}60%{transform:translateY(-8px) scale(1.02);opacity:1}80%{transform:translateY(4px) scale(.99)}100%{transform:translateY(0) scale(1);opacity:1}}',

      '.nwchar.nidle{animation:nid 3s ease-in-out infinite}',
      '@keyframes nid{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-6px) rotate(1deg)}}',

      '.nwbub{margin-top:20px;background:rgba(15,23,42,.96);border:1px solid rgba(245,158,11,.35);border-radius:20px;padding:20px 24px;min-height:56px;opacity:0;transform:translateY(20px) scale(.95);transition:all .5s cubic-bezier(.4,0,.2,1);width:100%;box-sizing:border-box;box-shadow:0 12px 36px rgba(0,0,0,.5)}',
      '.nwbub.nbv{opacity:1;transform:translateY(0) scale(1)}',

      '.nte-badge{display:block !important;margin-bottom:10px !important;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f59e0b;line-height:1.2}',

      '.nwt-body{display:block;clear:both}',
      '.nwt{font-family:"Plus Jakarta Sans","Inter",sans-serif;font-size:.98rem;font-weight:600;line-height:1.55;color:#f0f4f8;letter-spacing:-.01em}',

      '.nwcur{display:inline-block;font-weight:300;color:#f59e0b;animation:nbk .7s step-end infinite;margin-left:1px}',
      '.nwcur.nh{display:none}',
      '@keyframes nbk{0%,100%{opacity:1}50%{opacity:0}}',

      '.nwbtn{margin-top:24px;padding:14px 36px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#0f172a;font-family:"Plus Jakarta Sans","Inter",sans-serif;font-size:.95rem;font-weight:700;border:none;border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:4px;opacity:0;transform:translateY(16px);transition:all .5s cubic-bezier(.4,0,.2,1);box-shadow:0 4px 24px rgba(245,158,11,.35)}',
      '.nwbtn.nbvis{opacity:1;transform:translateY(0)}',
      '.nwbtn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 8px 32px rgba(245,158,11,.5)}',
      '.nwbtn:active{transform:translateY(0) scale(.98)}',

      '/* Feature Tour Styles */',
      '.nate-dim-backdrop{position:absolute;inset:0;background:rgba(8,12,22,.72);z-index:9980;opacity:0;transition:opacity .5s ease;pointer-events:all}',
      '.nate-dim-backdrop.nv{opacity:1}',

      '.nate-nav-elevated{z-index:9995 !important}',
      '.bottom-nav a:not(.nate-tab-spotlight),.bottom-nav button:not(.nate-tab-spotlight){background:transparent !important;background-color:transparent !important;color:#94a3b8 !important;border-color:transparent !important;box-shadow:none !important;transform:none !important}',
      '.bottom-nav a:not(.nate-tab-spotlight) *,.bottom-nav button:not(.nate-tab-spotlight) *{color:#94a3b8 !important}',
      '.nate-tab-spotlight{position:relative !important;z-index:9999 !important;box-shadow:0 0 0 3px #f59e0b,0 0 28px rgba(245,158,11,0.95) !important;border-radius:14px !important;background:#facc15 !important;color:#020617 !important;transform:scale(1.12) translateY(-6px) !important;transition:all .4s cubic-bezier(.34,1.56,.64,1);animation:ntePulseSpot 2s infinite ease-in-out}',
      '.nate-tab-spotlight *{color:#020617 !important}',
      '@keyframes ntePulseSpot{0%,100%{box-shadow:0 0 0 3px #f59e0b,0 0 24px rgba(245,158,11,.8)}50%{box-shadow:0 0 0 5px #fbbf24,0 0 36px rgba(245,158,11,1)}}',
      '/* Upward arrow for header-positioned mascot */',
      '.nte-pointing-wrapper--top .nte-arrow-pointer{border-top:none;border-bottom:14px solid #f59e0b;margin-bottom:0;margin-top:-10px;order:-1}',
      '.nte-pointing-wrapper--top{flex-direction:column-reverse}',

      '/* Final Bounce Animation */',
      '.nwchar-final-bounce{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) scale(0);width:220px;height:auto;object-fit:contain;filter:drop-shadow(0 15px 40px rgba(245,158,11,.6));z-index:9999;opacity:0}',
      '.nwchar-final-bounce.bounce-in{animation:nteFinalBounceIn .8s cubic-bezier(.34,1.56,.64,1) forwards;opacity:1}',
      '.nwchar-final-bounce.bounce-out{animation:nteFinalBounceOut .6s cubic-bezier(.6,-0.28,.735,.045) forwards}',
      '@keyframes nteFinalBounceIn{0%{transform:translate(-50%, -50%) scale(0) translateY(50px);opacity:0}60%{transform:translate(-50%, -50%) scale(1.1) translateY(-10px);opacity:1}80%{transform:translate(-50%, -50%) scale(.95) translateY(5px);opacity:1}100%{transform:translate(-50%, -50%) scale(1) translateY(0);opacity:1}}',
      '@keyframes nteFinalBounceOut{0%{transform:translate(-50%, -50%) scale(1) translateY(0);opacity:1}20%{transform:translate(-50%, -50%) scale(1.1) translateY(-15px);opacity:1}100%{transform:translate(-50%, -50%) scale(0) translateY(-100px);opacity:0}}',

      '#nate-tour-overlay{position:absolute;inset:0;z-index:9990;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:1.25rem;box-sizing:border-box;opacity:0;transition:opacity .5s ease;pointer-events:none}',
      '#nate-tour-overlay.nv{opacity:1}',
      '#nate-tour-overlay.nx{opacity:0}',

      '.nte-content{position:absolute;bottom:260px;width:calc(100% - 2.5rem);max-width:340px;display:flex;flex-direction:column;align-items:center;pointer-events:auto}',

      '.nte-pointing-wrapper{position:absolute;display:flex;flex-direction:column;align-items:center;width:135px;padding-left:0;box-sizing:border-box;pointer-events:none;z-index:9999}',
      '.nwchar-pointing{width:135px;height:auto;object-fit:contain;filter:drop-shadow(0 10px 30px rgba(245,158,11,.4));opacity:0;transform:translateY(20px) scale(.9);transition:all .5s cubic-bezier(.34,1.56,.64,1);margin-bottom:-10px}',
      '.nwchar-pointing.nidle-bounce{opacity:1;animation:nteBounce 2.5s ease-in-out infinite}',
      '@keyframes nteBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',

      '.nte-arrow-pointer{width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:14px solid #f59e0b;filter:drop-shadow(0 4px 12px rgba(245,158,11,.8));animation:nteArrowPulse 1.2s infinite ease-in-out}',
      '@keyframes nteArrowPulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(6px) scale(1.1)}}',

      '.nwbub-tour{margin-top:0;width:100%;border-color:rgba(245,158,11,.4);background:rgba(15,23,42,.96);box-shadow:0 16px 40px rgba(0,0,0,.6);padding:18px 20px}',
      '.nwbtn-tour{margin-top:16px;width:100%;justify-content:center;padding:12px 20px;font-size:.9rem}',

      '@media(max-width:380px){#nate-tour-overlay{padding-bottom:100px}.nwchar{width:140px}.nwchar-pointing{width:120px}.nte-pointing-wrapper{width:120px}.nwt{font-size:.92rem}.nwbub{padding:14px 16px}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // Helper: dynamically position the pointing wrapper over the spotlit tab or element
  function positionPointingWrapper() {
    const wrapper = document.getElementById('nate-tour-wrapper');
    const bottomNav = document.querySelector('.bottom-nav');
    // Check bottom nav first, then document-wide
    let targetTab = null;
    if (bottomNav) {
      targetTab = bottomNav.querySelector('a.nate-tab-spotlight, button.nate-tab-spotlight');
    }
    if (!targetTab) {
      targetTab = document.querySelector('.nate-tab-spotlight');
    }

    if (wrapper && targetTab) {
      const tabRect = targetTab.getBoundingClientRect();
      const phoneFrame = document.querySelector('.app-frame.phone-frame');
      const frameRect = phoneFrame ? phoneFrame.getBoundingClientRect() : document.body.getBoundingClientRect();

      // Tab center relative to frame
      const tabCenter = (tabRect.left - frameRect.left) + (tabRect.width / 2);
      const wrapperWidth = wrapper.offsetWidth || 135;
      wrapper.style.left = (tabCenter - (wrapperWidth / 2)) + 'px';

      // Is this a bottom-nav tab or a top header element?
      const isTopElement = tabRect.top < frameRect.top + (frameRect.height / 2);

      if (isTopElement) {
        // For header elements: position mascot BELOW the target, arrow pointing UP
        const topDist = tabRect.bottom - frameRect.top;
        wrapper.style.bottom = 'auto';
        wrapper.style.top = (topDist + 10) + 'px';
        // Flip arrow to point up
        wrapper.classList.add('nte-pointing-wrapper--top');
        // Speech bubble below mascot
        const content = document.querySelector('.nte-content');
        if (content) {
          content.style.bottom = 'auto';
          content.style.top = (topDist + 185) + 'px';
        }
      } else {
        // For bottom-nav tabs: position mascot above the tab, arrow pointing down
        const bottomDist = frameRect.bottom - tabRect.top;
        wrapper.style.top = 'auto';
        wrapper.style.bottom = (bottomDist + 5) + 'px';
        wrapper.classList.remove('nte-pointing-wrapper--top');
        const content = document.querySelector('.nte-content');
        if (content) {
          content.style.top = 'auto';
          content.style.bottom = (bottomDist + 190) + 'px';
        }
      }
    }
  }

})();
