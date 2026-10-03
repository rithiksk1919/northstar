/**
 * Northstar boot script — load synchronously in <head>, before any styles paint.
 *  1. Locks the app to light mode (dark mode is switched off for now).
 *  2. Drives the short branded splash between pages: the page we are leaving
 *     fades the splash in, the page we land on starts covered and fades it out.
 */
(function () {
  var root = document.documentElement;
  root.classList.remove('dark');
  root.classList.add('light');
  try {
    localStorage.setItem('ns_theme', 'light');
    localStorage.setItem('northstar_theme', 'light');
  } catch (e) {}

  // Icons are a ligature font: until it loads, names like "arrow_back" would show as text.
  // Keep icons invisible until the font is ready (or give up after 3s).
  function iconsReady() { root.classList.add('ns-icons-ready'); }
  try {
    if (document.fonts && document.fonts.load) {
      // load() resolves with [] while the font stylesheet itself hasn't arrived yet, so retry.
      // Never reveal raw ligature names ("chevron_right") on a slow connection: icons stay
      // invisible (space kept) until the font really arrives, checking for up to a minute.
      var tries = 0;
      var checkIcons = function () {
        if (root.classList.contains('ns-icons-ready') || tries++ > 300) return;
        document.fonts.load('24px "Material Symbols Outlined"').then(function (faces) {
          if (faces && faces.length && document.fonts.check('24px "Material Symbols Outlined"')) iconsReady();
          else setTimeout(checkIcons, tries < 40 ? 80 : 400);
        }, function () { setTimeout(checkIcons, 400); });
      };
      checkIcons();
    } else {
      iconsReady();
    }
  } catch (e) { iconsReady(); }

  // ---- 5-minute inactivity window: you stay logged in while using the app; 5 minutes with no activity logs you out ----
  var SESSION_TTL_MS = 5 * 60 * 1000;
  var ACTIVE_FLAG = 'ns_session_active';
  var ACTIVITY_WRITE_MS = 10 * 1000;   // how often activity is written to the session
  var TOKEN_REFRESH_MS = 60 * 1000;    // how often an active account swaps for a fresh server token

  function isIndexRoute(pathname) {
    var p = (pathname || window.location.pathname || '').toLowerCase();
    var file = p.split('/').pop() || 'index.html';
    return file === '' || file === 'index.html' || file === 'login.html' || file === 'signup.html';
  }

  function clearExpiredSession() {
    try {
      localStorage.removeItem('northstar_session');
      localStorage.removeItem('northstar_user_role');
      localStorage.removeItem('northstar_full_name');
      localStorage.removeItem('northstar_username');
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && /^sb-.*-auth-token$/.test(k)) localStorage.removeItem(k);
      }
    } catch (e) {}
    try { sessionStorage.removeItem(ACTIVE_FLAG); } catch (e) {}
    root.classList.remove('ns-volunteer');
  }
  window.nsClearSession = clearExpiredSession;

  // Last moment the person did something in the app (falls back to login time)
  function lastActive(sess) {
    var a = Number(sess.lastActiveAt);
    var l = Number(sess.loggedInAt);
    if (Number.isFinite(a) && (!Number.isFinite(l) || a >= l)) return a;
    return Number.isFinite(l) ? l : NaN;
  }
  window.nsSessionLastActive = lastActive;

  window.nsGetValidSession = function (opts) {
    var options = opts || {};
    var onIndex = options.isIndex !== undefined ? options.isIndex : isIndexRoute();
    var raw = null;
    try { raw = localStorage.getItem('northstar_session'); } catch (e) {}
    if (!raw) return null;

    var sess = null;
    try { sess = JSON.parse(raw); } catch (e) {
      clearExpiredSession();
      return null;
    }
    if (!sess || typeof sess !== 'object') {
      clearExpiredSession();
      return null;
    }

    var last = lastActive(sess);
    var idle = Number.isFinite(last) ? (Date.now() - last) : Infinity;

    if (!sess.isGuest) {
      // Real account: valid while active within the last 5 minutes
      if (!sess.token || !sess.id || idle < -60000 || idle >= SESSION_TTL_MS) {
        clearExpiredSession();
        return null;
      }
      return sess;
    }

    // Guest session: never auto-logs in when opening index.html (a stale one is cleared once at boot,
    // below, so taps on the login screen don't wipe a guest session that was just created), and
    // elsewhere needs this app session + activity within 5 minutes
    if (onIndex) return null;
    var activeTab = false;
    try { activeTab = sessionStorage.getItem(ACTIVE_FLAG) === '1'; } catch (e) {}
    if (!activeTab || idle < -60000 || idle >= SESSION_TTL_MS) {
      clearExpiredSession();
      return null;
    }
    return sess;
  };

  window.nsCheckSessionExpiry = function () {
    var onIndex = isIndexRoute();
    var valid = window.nsGetValidSession({ isIndex: onIndex });
    if (!onIndex && !valid) {
      window.location.replace('index.html');
      return false;
    }
    return !!valid;
  };

  // Returning from Stripe checkout: the person was busy paying, not idle — count the return as activity
  // so a donation that took a few minutes doesn't land on the login screen.
  try {
    var bootPath = (window.location.pathname || '').toLowerCase();
    var bootParams = new URLSearchParams(window.location.search || '');
    var bootStatus = bootParams.get('status');
    if (/donate\.html$/.test(bootPath) && (bootStatus === 'success' || bootStatus === 'cancel')) {
      var returning = JSON.parse(localStorage.getItem('northstar_session') || 'null');
      if (returning && typeof returning === 'object') {
        returning.lastActiveAt = Date.now();
        localStorage.setItem('northstar_session', JSON.stringify(returning));
        if (returning.isGuest) sessionStorage.setItem(ACTIVE_FLAG, '1');
      }
    }
  } catch (e) {}

  var bootSession = window.nsGetValidSession({ isIndex: isIndexRoute() });
  if (!isIndexRoute() && !bootSession) {
    window.location.replace('index.html');
    return;
  }
  // On the login screen nothing is ever auto-logged in as a guest: drop any stale guest session once here
  if (isIndexRoute() && !bootSession) clearExpiredSession();

  // ---- Activity tracking: any tap, key, or scroll keeps the session alive ----
  var lastActivityWrite = 0;
  var refreshing = false;

  function refreshToken(sess) {
    if (refreshing || !sess || sess.isGuest || !sess.token) return;
    var tokenAt = Number(sess.tokenAt) || Number(sess.loggedInAt) || 0;
    if (Date.now() - tokenAt < TOKEN_REFRESH_MS) return;
    refreshing = true;
    fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sess.token }
    }).then(function (resp) {
      if (resp.status === 401) {
        clearExpiredSession();
        if (!isIndexRoute()) window.location.replace('index.html');
        return null;
      }
      return resp.ok ? resp.json() : null;
    }).then(function (out) {
      if (!out || !out.success || !out.token) return;
      try {
        var cur = JSON.parse(localStorage.getItem('northstar_session') || 'null');
        if (cur && cur.id === sess.id) {
          cur.token = out.token;
          cur.tokenAt = Date.now();
          localStorage.setItem('northstar_session', JSON.stringify(cur));
        }
      } catch (e) {}
    }).catch(function () { /* offline: try again on the next activity */ })
      .then(function () { refreshing = false; });
  }

  function markActive(force) {
    var now = Date.now();
    if (!force && now - lastActivityWrite < ACTIVITY_WRITE_MS) return;
    var sess = window.nsGetValidSession({ isIndex: isIndexRoute() });
    if (!sess) {
      if (!isIndexRoute()) window.location.replace('index.html');
      return;
    }
    lastActivityWrite = now;
    sess.lastActiveAt = now;
    try { localStorage.setItem('northstar_session', JSON.stringify(sess)); } catch (e) {}
    refreshToken(sess);
  }
  window.nsMarkActive = markActive;

  if (bootSession) markActive(true);
  ['pointerdown', 'keydown', 'touchstart', 'wheel', 'input'].forEach(function (evt) {
    window.addEventListener(evt, function () { markActive(false); }, { capture: true, passive: true });
  });
  window.addEventListener('scroll', function () { markActive(false); }, { capture: true, passive: true });

  // While a page sits open with no activity, log out once 5 minutes have passed
  setInterval(function () {
    if (document.visibilityState === 'visible' && !isIndexRoute()) window.nsCheckSessionExpiry();
  }, 15 * 1000);

  // Offline shell: sw.js caches the app pages and map tiles (browsers only allow this on https/localhost)
  try {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }
  } catch (e) {}

  // Volunteers get the warm page color (css: html.ns-volunteer)
  try {
    if (bootSession && bootSession.role === 'volunteer') root.classList.add('ns-volunteer');
  } catch (e) {}

  var NAV_FLAG = 'ns_nav_transition';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Landing: start covered if the previous page asked for a transition.
  var arriving = false;
  try {
    arriving = sessionStorage.getItem(NAV_FLAG) === '1';
    sessionStorage.removeItem(NAV_FLAG);
  } catch (e) {}
  if (arriving && !reduceMotion) root.classList.add('ns-entering');

  function reveal() {
    if (!root.classList.contains('ns-entering')) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.remove('ns-entering'); });
    });
  }
  if (arriving) {
    var revealTimer = null;
    document.addEventListener('DOMContentLoaded', function () {
      // Give runtime styles (Tailwind CDN) a moment, but never hold the cover long.
      revealTimer = setTimeout(reveal, 140);
    });
    window.addEventListener('load', function () { clearTimeout(revealTimer); reveal(); });
    setTimeout(reveal, 1200);
  }

  // Coming back through the browser's back/forward cache or reopening app: check session expiry & drop cover
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) root.classList.remove('ns-leaving', 'ns-entering');
    window.nsCheckSessionExpiry();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      window.nsCheckSessionExpiry();
    }
  });

  function isInternalPage(url) {
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && /\.html$|\/$/.test(u.pathname);
    } catch (e) {
      return false;
    }
  }

  // Leaving: fade the splash in, then navigate. Used by links and by code redirects.
  var leaving = false;
  window.nsNavigate = function (url, opts) {
    if (!url) return;
    var replace = opts && opts.replace;
    var go = function () {
      if (replace) window.location.replace(url);
      else window.location.href = url;
    };
    if (leaving) return;
    if (reduceMotion || !isInternalPage(url)) { go(); return; }
    leaving = true;
    try { sessionStorage.setItem(NAV_FLAG, '1'); } catch (e) {}
    root.classList.add('ns-leaving');
    setTimeout(go, 190);
    // If navigation is cancelled (download link, blocked), drop the cover again.
    setTimeout(function () {
      leaving = false;
      root.classList.remove('ns-leaving');
      try { sessionStorage.removeItem(NAV_FLAG); } catch (e) {}
    }, 4000);
  };
})();
