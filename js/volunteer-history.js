/**
 * "Your history" for helpers (shown on the Me page).
 * One list of everything they did, newest first: card donations, food they donated,
 * pickups they delivered, and jobs they posted. A delivery they both donated and
 * delivered themselves is one entry, not two.
 *
 * Needs on the page: #volunteer-history-section (hidden by default) containing
 * #volunteer-history-recent and #history-see-all. The full-list sheet is added here.
 */
(function () {
  'use strict';

  const ICON = {
    money: 'assets/illustrations/icons/money.svg',
    food: 'assets/illustrations/icons/food.svg',
    deliver: 'assets/illustrations/icons/deliver.svg',
    job: 'assets/illustrations/icons/post-job.svg'
  };

  let items = [];
  let filter = 'all';
  let jobsCache = null;
  let busy = false;

  const esc = (v) => (window.nsEscape ? window.nsEscape(v) : String(v == null ? '' : v));

  function session() {
    try { return JSON.parse(localStorage.getItem('northstar_session') || 'null'); } catch (e) { return null; }
  }
  function isVolunteer() {
    return (localStorage.getItem('northstar_user_role') || '') === 'volunteer';
  }

  function dateLabel(value) {
    const d = new Date(value);
    if (isNaN(d)) return '';
    const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(new Date()) - day(d)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function status(s) {
    switch (s) {
      case 'delivered': return { text: 'Delivered', tone: 'done' };
      case 'in_transit': return { text: 'On the way', tone: 'go' };
      case 'driver_assigned':
      case 'claimed': return { text: 'Picked up soon', tone: 'go' };
      default: return { text: 'Waiting for a driver', tone: 'wait' };
    }
  }

  function itemsText(d) {
    const list = Array.isArray(d.items) ? d.items : (d.items ? [d.items] : []);
    return list.join(', ') || 'food';
  }

  async function loadJobs(s) {
    if (jobsCache) return jobsCache;
    try {
      const res = await fetch(`/api/jobs?role=volunteer&userId=${encodeURIComponent(s.id)}`);
      const data = await res.json();
      jobsCache = Array.isArray(data.jobs) ? data.jobs : [];
    } catch (e) {
      jobsCache = [];
    }
    return jobsCache;
  }

  async function build(s) {
    const list = [];

    try {
      const cards = JSON.parse(localStorage.getItem('northstar_donations') || '[]');
      (Array.isArray(cards) ? cards : []).forEach((c) => {
        const amount = Number(c && c.amount) || 0;
        list.push({ kind: 'donation', icon: ICON.money, title: `Donated $${amount.toLocaleString()}`, sub: 'Card donation', date: c.date, status: { text: 'Paid', tone: 'done' } });
      });
    } catch (e) {}

    let deliveries = [];
    if (typeof window.fetchUnifiedDeliveries === 'function') {
      try { deliveries = (await window.fetchUnifiedDeliveries()) || []; } catch (e) {}
    }
    const seen = new Set();
    deliveries.forEach((d) => {
      if (!d || seen.has(d.id)) return;
      const mineAsDonor = d.donor_id === s.id;
      const mineAsDriver = d.driver_id === s.id;
      if (!mineAsDonor && !mineAsDriver) return;
      seen.add(d.id);
      const to = d.destination || 'a shelter';
      const done = d.status === 'delivered';
      if (mineAsDonor && mineAsDriver) {
        // They gave the food and took it there themselves: one entry
        list.push({
          kind: 'delivery', icon: ICON.deliver,
          title: done ? `Donated and delivered ${itemsText(d)}` : `Donating and delivering ${itemsText(d)}`,
          sub: [`To ${to}`, d.donorArea ? `from ${d.donorArea}` : ''].filter(Boolean).join(' · '),
          date: d.updated_at || d.created_at, status: status(d.status), deliveryId: d.id
        });
      } else if (mineAsDriver) {
        list.push({
          kind: 'delivery', icon: ICON.deliver,
          title: done ? `Delivered to ${to}` : `Pickup for ${to}`,
          sub: [itemsText(d), d.donorArea ? `from ${d.donorArea}` : ''].filter(Boolean).join(' · '),
          date: d.updated_at || d.claimed_at || d.created_at, status: status(d.status), deliveryId: d.id
        });
      } else {
        list.push({
          kind: 'donation', icon: ICON.food,
          title: `Donated ${itemsText(d)}`, sub: `Food donation · to ${to}`,
          date: d.created_at, status: status(d.status), deliveryId: d.id
        });
      }
    });

    (await loadJobs(s)).forEach((j) => {
      list.push({ kind: 'job', icon: ICON.job, title: j.title || 'Job posted', sub: ['Job posted', j.pay].filter(Boolean).join(' · '), date: j.postedAt, status: null });
    });

    list.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
    return list;
  }

  function rowHtml(item) {
    const pill = item.status ? `<span class="ns-badge history-status history-status--${item.status.tone}">${esc(item.status.text)}</span>` : '';
    // Deliveries still moving open the tracker
    const open = item.deliveryId && item.status && item.status.text !== 'Delivered'
      ? ` onclick="if (typeof openUberTrackingModal === 'function') { closeModal('history-sheet'); openUberTrackingModal('${esc(item.deliveryId)}'); }"`
      : '';
    const tag = open ? 'button' : 'div';
    return `
      <${tag}${open ? ' type="button"' : ''} class="ns-row history-row"${open}>
        <span class="ns-art-tile"><img src="${item.icon}" alt=""></span>
        <span class="ns-row__body min-w-0">
          <span class="ns-row__title block">${esc(item.title)}</span>
          <span class="ns-row__sub block truncate">${esc(item.sub)}</span>
        </span>
        <span class="history-meta">
          <span class="history-date">${esc(dateLabel(item.date))}</span>
          ${pill}
        </span>
      </${tag}>`;
  }

  function renderSheet() {
    const list = document.getElementById('history-list');
    const count = document.getElementById('history-count');
    if (count) count.textContent = `${items.length} ${items.length === 1 ? 'thing' : 'things'} you’ve done`;
    document.querySelectorAll('[data-history-filter]').forEach((b) => b.classList.toggle('is-active', b.dataset.historyFilter === filter));
    if (!list) return;
    const shown = items.filter((i) => filter === 'all' || i.kind === filter);
    const empty = { donation: 'No donations yet.', delivery: 'No deliveries yet.', job: 'No jobs posted yet.', all: 'Nothing here yet.' }[filter];
    list.innerHTML = shown.length ? shown.map(rowHtml).join('') : `<div class="ns-empty mt-2"><p class="ns-empty__title">${empty}</p></div>`;
  }

  async function render() {
    const section = document.getElementById('volunteer-history-section');
    const s = session();
    if (!section || !isVolunteer() || !s || !s.id || s.isGuest) return;
    section.classList.remove('hidden');
    if (busy) return;
    busy = true;
    try {
      items = await build(s);
      const recent = document.getElementById('volunteer-history-recent');
      const seeAll = document.getElementById('history-see-all');
      if (seeAll) seeAll.classList.toggle('hidden', items.length <= 3);
      if (recent) {
        recent.innerHTML = items.length
          ? `<div class="ns-card px-4">${items.slice(0, 3).map(rowHtml).join('')}</div>`
          : `<div class="ns-empty">
               <img class="ns-empty__art" src="assets/illustrations/icons/heart.svg" alt="" style="width:64px">
               <p class="ns-empty__title">Nothing here yet</p>
               <p class="ns-empty__sub">Donations, deliveries and jobs you post will show up here.</p>
             </div>`;
      }
      const sheet = document.getElementById('history-sheet');
      if (sheet && !sheet.classList.contains('hidden')) renderSheet();
    } finally {
      busy = false;
    }
  }

  function addSheet() {
    if (document.getElementById('history-sheet')) return;
    const frame = document.querySelector('.app-frame') || document.body;
    frame.insertAdjacentHTML('beforeend', `
      <div id="history-sheet" class="ns-sheet-wrap hidden" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div class="ns-sheet-backdrop" onclick="closeModal('history-sheet')"></div>
        <div class="modal-drawer ns-sheet translate-y-full">
          <div class="ns-sheet__handle"></div>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 id="history-title" class="ns-sheet__title">Your history</h2>
              <p id="history-count" class="ns-card-sub mt-1"></p>
            </div>
            <button type="button" class="ns-icon-btn ns-icon-btn--sm" onclick="closeModal('history-sheet')" aria-label="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="history-filters mt-4" role="group" aria-label="Show">
            <button type="button" class="ns-chip is-active" data-history-filter="all">All</button>
            <button type="button" class="ns-chip" data-history-filter="donation">Donations</button>
            <button type="button" class="ns-chip" data-history-filter="delivery">Deliveries</button>
            <button type="button" class="ns-chip" data-history-filter="job">Jobs</button>
          </div>
          <div id="history-list" class="ns-list mt-3"></div>
        </div>
      </div>`);
    document.querySelectorAll('[data-history-filter]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.historyFilter; renderSheet(); }));
  }

  window.openHistorySheet = function () {
    renderSheet();
    if (typeof window.openModal === 'function') window.openModal('history-sheet');
  };
  window.renderVolunteerHistory = render;

  function init() {
    if (!document.getElementById('volunteer-history-section')) return;
    addSheet();
    render();
    window.addEventListener('northstar_deliveries_updated', render);
    window.addEventListener('ns:userdata', render);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
