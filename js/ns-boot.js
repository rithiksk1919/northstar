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

  // Volunteers get the warm page color (css: html.ns-volunteer)
  try {
    if (localStorage.getItem('northstar_user_role') === 'volunteer') root.classList.add('ns-volunteer');
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

  // Coming back through the browser's back/forward cache: never leave the cover up.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) root.classList.remove('ns-leaving', 'ns-entering');
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
