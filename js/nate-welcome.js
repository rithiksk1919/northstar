/**
 * Nate Welcome Screen & Dashboard Tour — NorthStar Onboarding Mascot
 * 
 * Step 1: Welcome Overlay after account creation (Firefly 22 mascot)
 * Step 2: Dashboard Feature Highlight (Firefly 23 pointing mascot, dimmed backdrop, taskbar spotlight)
 */

(function () {
  'use strict';

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
  // STEP 2: DASHBOARD TOUR (Firefly 23 pointing mascot + spotlight)
  // =========================================================================
  window.showNateDashboardTour = function () {
    const phoneFrame = document.querySelector('.app-frame.phone-frame') || document.body;
    
    // Inject CSS
    injectStyles();

    // 1. Create Dim Backdrop inside container
    let dimOverlay = document.getElementById('nate-tour-dim');
    if (dimOverlay) dimOverlay.remove();

    dimOverlay = document.createElement('div');
    dimOverlay.id = 'nate-tour-dim';
    dimOverlay.className = 'nate-dim-backdrop';
    phoneFrame.appendChild(dimOverlay);

    // 2. Find Dashboard Nav Target in Bottom Navigation Bar
    const bottomNav = document.querySelector('.bottom-nav');
    let dashTab = null;
    if (bottomNav) {
      dashTab = bottomNav.querySelector('a.active-tab') ||
                bottomNav.querySelector('a[href*="dashboard"]') ||
                bottomNav.firstElementChild;
    }

    if (bottomNav) {
      bottomNav.classList.add('nate-nav-elevated');
      // Strip native active states so only spotlight applies colors
      const allTabs = bottomNav.querySelectorAll('a');
      allTabs.forEach(tab => {
        tab.classList.remove('bg-secondary-container', 'text-on-secondary-container', 'active-tab', 'bg-amber-400/15', 'text-amber-500', 'dark:text-amber-400', 'border', 'border-amber-400/30', 'shadow-[0_0_12px_rgba(245,158,11,0.2)]');
        if (!tab.classList.contains('text-on-surface-variant')) {
          tab.classList.add('text-on-surface-variant');
        }
      });
    }
    if (dashTab) {
      dashTab.classList.add('nate-tab-spotlight');
    }
    
    // Helper: force a tab to look fully deselected via inline styles
    function forceTabDeselected(tab) {
      tab.style.setProperty('background', 'transparent', 'important');
      tab.style.setProperty('background-color', 'transparent', 'important');
      tab.style.setProperty('border-color', 'transparent', 'important');
      tab.style.setProperty('box-shadow', 'none', 'important');
      tab.style.setProperty('color', '#94a3b8', 'important');
      tab.style.setProperty('transform', 'none', 'important');
      // Also force child text colors
      tab.querySelectorAll('*').forEach(el => {
        el.style.setProperty('color', '#94a3b8', 'important');
      });
    }

    // 3. Create Tour Step Overlay Container
    let tourOverlay = document.getElementById('nate-tour-overlay');
    if (tourOverlay) tourOverlay.remove();

    tourOverlay = document.createElement('div');
    tourOverlay.id = 'nate-tour-overlay';
    tourOverlay.innerHTML =
      '<div class="nte-content">' +
        '<div class="nwbub nwbub-tour" id="nate-tour-bubble">' +
          '<div class="nte-badge">Step 1 of 2 • Dashboard</div>' +
          '<div class="nwt-body">' +
            '<span class="nwt" id="nate-tour-text"></span>' +
            '<span class="nwcur" id="nate-tour-cursor">|</span>' +
          '</div>' +
          '<button class="nwbtn nwbtn-tour" id="nate-tour-finish">' +
            'Next • Progress' +
            '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:4px;">arrow_forward</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="nte-pointing-wrapper" id="nate-tour-wrapper">' +
        '<img src="images/Firefly%20(24).png" alt="Nate pointing" class="nwchar nwchar-pointing" id="nate-pointing-img" />' +
        '<div class="nte-arrow-pointer"></div>' +
      '</div>';

    phoneFrame.appendChild(tourOverlay);
    
    // Dynamically position the mascot wrapper over the dashboard tab
    positionPointingWrapper();
    window.addEventListener('resize', positionPointingWrapper);

    // Animate in dim backdrop & tour overlay
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

    const message = "This is your Dashboard! Here you can view active updates, track your progress, access quick services, and easily navigate around NorthStar.";

    setTimeout(function () {
      if (pointingImg) {
        pointingImg.style.opacity = '1';
        pointingImg.style.transform = 'translateY(0) scale(1)';
        pointingImg.classList.add('nidle-bounce');
      }
      if (tourBubble) tourBubble.classList.add('nbv');

      setTimeout(function () {
        let charIndex = 0;
        const typeInterval = setInterval(function () {
          if (charIndex < message.length) {
            tourTextEl.textContent += message[charIndex];
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTimeout(function () {
              if (tourCursor) tourCursor.classList.add('nh');
              if (finishBtn) finishBtn.classList.add('nbvis');
            }, 400);
          }
        }, 35);
      }, 400);
    }, 800);

    // Finish button event listener (Multi-step logic)
    let currentStep = 1;
    if (finishBtn) {
      finishBtn.addEventListener('click', function () {
        if (currentStep === 1) {
          // Transition to Step 2: Progress
          currentStep = 2;
          
          // Clear current text and hide button
          tourTextEl.textContent = '';
          if (tourCursor) tourCursor.classList.remove('nh');
          finishBtn.classList.remove('nbvis');
          
          // Update Badge
          const badgeEl = tourBubble.querySelector('.nte-badge');
          if (badgeEl) badgeEl.textContent = 'Step 2 of 2 • Progress';
          
          // Change Button Text
          finishBtn.innerHTML = 'Got it! Explore Progress' +
            '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:4px;">arrow_forward</span>';
            
          // Shift Spotlight to Progress Tab
          if (dashTab) {
            dashTab.classList.remove('nate-tab-spotlight');
            forceTabDeselected(dashTab);
          }
          
          let progressTab = bottomNav ? bottomNav.querySelector('a[href*="progress"]') : null;
          if (progressTab) {
            // Clear any deselected inline styles from progressTab before spotlighting
            progressTab.style.removeProperty('background');
            progressTab.style.removeProperty('background-color');
            progressTab.style.removeProperty('color');
            progressTab.style.removeProperty('border-color');
            progressTab.style.removeProperty('box-shadow');
            progressTab.style.removeProperty('transform');
            progressTab.querySelectorAll('*').forEach(el => el.style.removeProperty('color'));
            progressTab.classList.add('nate-tab-spotlight');
          }
          
          // Reposition Mascot over new tab
          positionPointingWrapper();
          
          // Type new message
          const msg2 = "The Progress tab tracks your journey! Check off milestones here to level up your NorthStar experience.";
          let charIdx = 0;
          const typeInterval2 = setInterval(function () {
            if (charIdx < msg2.length) {
              tourTextEl.textContent += msg2[charIdx];
              charIdx++;
            } else {
              clearInterval(typeInterval2);
              setTimeout(function () {
                if (tourCursor) tourCursor.classList.add('nh');
                finishBtn.classList.add('nbvis');
                finishBtn.disabled = false;
              }, 400);
            }
          }, 35);
          
        } else {
          // Finish Step 2: Redirect to Progress Page
          finishBtn.disabled = true;
          dimOverlay.classList.remove('nv');
          tourOverlay.classList.remove('nv');
          tourOverlay.classList.add('nx');
          window.removeEventListener('resize', positionPointingWrapper);
          
          setTimeout(function () {
            if (bottomNav) bottomNav.classList.remove('nate-nav-elevated');
            let progressTab = bottomNav ? bottomNav.querySelector('a[href*="progress"]') : null;
            if (progressTab) progressTab.classList.remove('nate-tab-spotlight');
            dimOverlay.remove();
            tourOverlay.remove();
            
            // Redirect to Progress page
            window.location.href = 'progress.html';
          }, 500);
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

      '/* Step 2 Tour Styles (NO BLUR) */',
      '.nate-dim-backdrop{position:absolute;inset:0;background:rgba(8,12,22,.72);z-index:9980;opacity:0;transition:opacity .5s ease;pointer-events:all}',
      '.nate-dim-backdrop.nv{opacity:1}',

      '.nate-nav-elevated{z-index:9995 !important}',
      '.bottom-nav a:not(.nate-tab-spotlight){background:transparent !important; background-color:transparent !important; color:#94a3b8 !important; border-color:transparent !important; box-shadow:none !important; transform:none !important}',
      '.bottom-nav a:not(.nate-tab-spotlight) *{color:#94a3b8 !important}',
      '.nate-tab-spotlight{position:relative !important;z-index:9999 !important;box-shadow:0 0 0 3px #f59e0b, 0 0 28px rgba(245,158,11,0.95) !important;border-radius:14px !important;background:#facc15 !important;color:#020617 !important;transform:scale(1.12) translateY(-6px);transition:all .4s cubic-bezier(.34,1.56,.64,1);animation:ntePulseSpot 2s infinite ease-in-out}',
      '.nate-tab-spotlight *{color:#020617 !important}',
      '@keyframes ntePulseSpot{0%,100%{box-shadow:0 0 0 3px #f59e0b,0 0 24px rgba(245,158,11,.8)}50%{box-shadow:0 0 0 5px #fbbf24,0 0 36px rgba(245,158,11,1)}}',

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

  // Helper to dynamically position the wrapper
  function positionPointingWrapper() {
    const wrapper = document.getElementById('nate-tour-wrapper');
    const bottomNav = document.querySelector('.bottom-nav');
    let targetTab = null;
    if (bottomNav) {
      targetTab = bottomNav.querySelector('a.nate-tab-spotlight') ||
                  bottomNav.querySelector('a.active-tab') ||
                  bottomNav.querySelector('a[href*="dashboard"]') ||
                  bottomNav.firstElementChild;
    }
    
    if (wrapper && targetTab) {
      const tabRect = targetTab.getBoundingClientRect();
      const phoneFrame = document.querySelector('.app-frame.phone-frame');
      const frameRect = phoneFrame ? phoneFrame.getBoundingClientRect() : document.body.getBoundingClientRect();
      
      // Calculate tab center relative to the frame
      const tabCenter = (tabRect.left - frameRect.left) + (tabRect.width / 2);
      // Wrapper width is 135px (or 120px on small screens), so offset by half width
      const wrapperWidth = wrapper.offsetWidth || 135;
      wrapper.style.left = (tabCenter - (wrapperWidth / 2)) + 'px';
      
      // Distance from the bottom of the frame to the top of the tab
      const bottomDist = frameRect.bottom - tabRect.top;
      // Hover the arrow just above the tab (e.g., 5px gap)
      wrapper.style.bottom = (bottomDist + 5) + 'px';
      
      // Position the speech bubble just above the mascot
      const content = document.querySelector('.nte-content');
      if (content) {
        // Mascot image is ~140px tall + arrow is 14px + gap = ~160px
        content.style.bottom = (bottomDist + 190) + 'px';
      }
    }
  }

})();
