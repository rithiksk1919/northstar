/**
 * Shared helpers for the verified places (window.NS_RESOURCES from js/resources-data.js).
 * Used by the map and Home so "Open now" and the status words are the same everywhere.
 */
(function () {
  'use strict';

  function minutesLabel(min) {
    const h24 = Math.floor(min / 60) % 24;
    const m = min % 60;
    const h = h24 % 12 || 12;
    return `${h}${m ? ':' + String(m).padStart(2, '0') : ''} ${h24 < 12 ? 'AM' : 'PM'}`;
  }
  function hhmmToMin(t) {
    const n = parseInt(t, 10);
    return Math.floor(n / 100) * 60 + (n % 100);
  }

  // { open: true | false | null (hours not listed), text: plain words }
  function placeStatus(p, now = new Date()) {
    if (!p) return { open: false, text: '' };
    if (p.closedNote) return { open: false, text: p.closedNote };
    if (p.is24Seven) return { open: true, text: 'Open 24 hours' };
    const periods = (p.opening_hours && p.opening_hours.periods) || [];
    if (!periods.length) {
      return p.hoursKnown === false ? { open: null, text: 'Hours not listed · Call first' } : { open: false, text: 'Closed now' };
    }
    const day = now.getDay();
    const cur = now.getHours() * 60 + now.getMinutes();
    const openNow = periods.find(pr => {
      if (!pr.open || !pr.close || pr.open.day !== day) return false;
      const o = hhmmToMin(pr.open.time), c = hhmmToMin(pr.close.time);
      return c > o ? cur >= o && cur < c : cur >= o || cur < c;
    }) || periods.find(pr => {
      // overnight hours that started yesterday ("9pm-8am")
      if (!pr.open || !pr.close) return false;
      const o = hhmmToMin(pr.open.time), c = hhmmToMin(pr.close.time);
      return c <= o && pr.open.day === (day + 6) % 7 && cur < c;
    });
    if (openNow) return { open: true, text: `Open now · until ${minutesLabel(hhmmToMin(openNow.close.time))}` };
    for (let i = 0; i < 7; i++) {
      const d = (day + i) % 7;
      const next = periods
        .filter(pr => pr.open && pr.open.day === d && (i > 0 || hhmmToMin(pr.open.time) > cur))
        .sort((x, y) => hhmmToMin(x.open.time) - hhmmToMin(y.open.time))[0];
      if (next) {
        const when = i === 0 ? '' : i === 1 ? 'tomorrow ' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d] + ' ';
        return { open: false, text: `Closed · Opens ${when}${minutesLabel(hhmmToMin(next.open.time))}` };
      }
    }
    return { open: false, text: 'Closed now' };
  }

  function placeCategories(p) {
    return Array.isArray(p.categories) && p.categories.length ? p.categories : [p.category];
  }

  window.nsPlaceStatus = placeStatus;
  window.nsPlaceCategories = placeCategories;
  window.nsPlaces = function () { return Array.isArray(window.NS_RESOURCES) ? window.NS_RESOURCES : []; };
})();
