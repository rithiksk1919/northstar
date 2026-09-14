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
    }
    if (dashTab) {
      dashTab.classList.add('nate-tab-spotlight');
    }

    // 3. Create Tour Step Overlay Container
    let tourOverlay = document.getElementById('nate-tour-overlay');
    if (tourOverlay) tourOverlay.remove();

    tourOverlay = document.createElement('div');
    tourOverlay.id = 'nate-tour-overlay';
    tourOverlay.innerHTML =
      '<div class="nte-content">' +
        '<div class="nwbub nwbub-tour" id="nate-tour-bubble">' +
          '<div class="nte-badge">Step 1 of 1 • Dashboard</div>' +
          '<div class="nwt-body">' +
            '<span class="nwt" id="nate-tour-text"></span>' +
            '<span class="nwcur" id="nate-tour-cursor">|</span>' +
          '</div>' +
          '<button class="nwbtn nwbtn-tour" id="nate-tour-finish">' +
            'Got it! Explore Dashboard' +
            '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-left:4px;">check_circle</span>' +
          '</button>' +
        '</div>' +
        '<div class="nte-pointing-wrapper">' +
          '<img src="images/Firefly%20(24).png" alt="Nate pointing" class="nwchar nwchar-pointing" id="nate-pointing-img" />' +
          '<div class="nte-arrow-pointer"></div>' +
        '</div>' +
      '</div>';

    phoneFrame.appendChild(tourOverlay);

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

    // Finish button event listener
    if (finishBtn) {
      finishBtn.addEventListener('click', function () {
        finishBtn.disabled = true;
        dimOverlay.classList.remove('nv');
        tourOverlay.classList.remove('nv');
        tourOverlay.classList.add('nx');
        
        setTimeout(function () {
          if (bottomNav) bottomNav.classList.remove('nate-nav-elevated');
          if (dashTab) dashTab.classList.remove('nate-tab-spotlight');
          dimOverlay.remove();
          tourOverlay.remove();
        }, 500);
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
      '.nate-tab-spotlight{position:relative !important;z-index:9999 !important;box-shadow:0 0 0 3px #f59e0b, 0 0 28px rgba(245,158,11,0.95) !important;border-radius:14px !important;background:rgba(245,158,11,0.2) !important;transform:scale(1.12) translateY(-6px);transition:all .4s cubic-bezier(.34,1.56,.64,1);animation:ntePulseSpot 2s infinite ease-in-out}',
      '@keyframes ntePulseSpot{0%,100%{box-shadow:0 0 0 3px #f59e0b,0 0 24px rgba(245,158,11,.8)}50%{box-shadow:0 0 0 5px #fbbf24,0 0 36px rgba(245,158,11,1)}}',

      '#nate-tour-overlay{position:absolute;inset:0;z-index:9990;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:1.25rem;padding-bottom:70px;box-sizing:border-box;opacity:0;transition:opacity .5s ease;pointer-events:none}',
      '#nate-tour-overlay.nv{opacity:1}',
      '#nate-tour-overlay.nx{opacity:0}',

      '.nte-content{width:100%;max-width:340px;display:flex;flex-direction:column;align-items:center;pointer-events:auto}',

      '.nte-pointing-wrapper{position:relative;display:flex;flex-direction:column;align-items:flex-start;margin-top:6px;margin-bottom:0;width:100%;padding-left:0;box-sizing:border-box}',
      '.nwchar-pointing{width:135px;height:auto;object-fit:contain;filter:drop-shadow(0 10px 30px rgba(245,158,11,.4));opacity:0;margin-left:-18px;transform:translateY(20px) scale(.9);transition:all .5s cubic-bezier(.34,1.56,.64,1)}',
      '.nwchar-pointing.nidle-bounce{opacity:1;animation:nteBounce 2.5s ease-in-out infinite}',
      '@keyframes nteBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',

      '.nte-arrow-pointer{width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:14px solid #f59e0b;margin-top:2px;margin-left:18px;filter:drop-shadow(0 4px 12px rgba(245,158,11,.8));animation:nteArrowPulse 1.2s infinite ease-in-out}',
      '@keyframes nteArrowPulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(8px) scale(1.25)}}',

      '.nwbub-tour{margin-top:0;width:100%;border-color:rgba(245,158,11,.4);background:rgba(15,23,42,.96);box-shadow:0 16px 40px rgba(0,0,0,.6);padding:18px 20px}',
      '.nwbtn-tour{margin-top:16px;width:100%;justify-content:center;padding:12px 20px;font-size:.9rem}',

      '@media(max-width:380px){#nate-tour-overlay{padding-bottom:60px}.nwchar{width:140px}.nwchar-pointing{width:120px}.nwt{font-size:.92rem}.nwbub{padding:14px 16px}}'
    ].join('\n');
    document.head.appendChild(css);
  }

})();
