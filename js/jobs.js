/**
 * NorthStar Work Opportunities & Job Listings Module
 * Handles job fetching, rendering, DOM reconciliation, and silent background polling.
 */

(function () {
  const BACKGROUND_POLL_INTERVAL_MS = 30000; // 30 seconds
  let jobsPollingTimer = null;
  let isFetchInProgress = false;

  const defaultSeedGigs = [
    {
      id: 'seed-1',
      title: 'Capitol Hill Same-Day Pay Moving & Hauling',
      pay: '$150 Cash',
      summary: 'Assistance needed unloading a moving truck for 3 hours. Immediate cash in hand paid at completion.',
      safety: 'No ID required casual labor. Cash paid daily.',
      url: 'https://seattle.craigslist.org/search/lbg?query=same+day+pay'
    },
    {
      id: 'seed-2',
      title: 'Ballard Under-The-Table Cash Yard Helper',
      pay: '$25.00 / hr Cash',
      summary: 'Outdoor yard maintenance, leaf raking, and brush clearing in Ballard neighborhood.',
      safety: 'Under the table cash gig requiring no onboarding paperwork.',
      url: 'https://seattle.craigslist.org/search/lbg?query=cash'
    },
    {
      id: 'seed-3',
      title: 'SODO No-ID Casual Labor Freight Unloader',
      pay: '$22.00 / hr Cash',
      summary: 'Unloading commercial pallet boxes and organizing warehouse staging area.',
      safety: 'Entry level immediate hire. Cash paid at end of shift.',
      url: 'https://seattle.craigslist.org/search/lbg?query=casual+labor'
    },
    {
      id: 'seed-4',
      title: 'Rainier Valley Local Daily Gig Work',
      pay: '$24.00 / hr Cash',
      summary: 'Local daily gig work assisting with community center event equipment setup.',
      safety: 'Cash in hand jobs near me. Drop-in daily labor.',
      url: 'https://seattle.craigslist.org/search/lbg?query=daily+gig'
    },
    {
      id: 'seed-5',
      title: 'Pioneer Square Day Labor Drop-In Center Helper',
      pay: '$20.00 / hr Cash',
      summary: 'Assisting with food prep and inventory staging at local drop-in site.',
      safety: 'Immediate walk-in entry level daily stipend.',
      url: 'https://seattle.craigslist.org/search/lbg?query=day+labor'
    },
    {
      id: 'seed-6',
      title: 'Instant Payout Microtasks & Image Labeling',
      pay: '$18.00 / hr Instant Cash',
      summary: 'Digital microtasking and tagging data. Instant payout to digital wallet without ID verification.',
      safety: 'Low-barrier digital work with instant payout microtasks.',
      url: 'https://seattle.craigslist.org/search/lbg?query=microtask'
    }
  ];

  function extractPay(text) {
    if (!text) return null;
    const match = text.match(/\$[\d,]+(\.\d{2})?(\s*-\s*\$[\d,]+(\.\d{2})?)?(\s*\/\s*(hr|hour|h|gig|day|week))?/i);
    return match ? match[0] : null;
  }

  function cleanJobTitle(title) {
    if (!title) return '';
    let cleaned = title.replace(/^-+|-+$/g, '').trim();
    cleaned = cleaned.replace(/\bResiden\b/i, 'Residential');
    return cleaned;
  }

  function formatPay(pay, title, desc) {
    let p = pay ? String(pay).trim() : '';
    if (!p || p === '0' || p === '$0' || p === '$0.00' || p === '0.00' || p === 'Flexible Pay') {
      const extracted = extractPay(`${title || ''} ${desc || ''}`);
      return extracted || '$20.00/hr (Est)';
    }
    return p;
  }

  function getCategoryIcon(titleStr) {
    const t = (titleStr || '').toLowerCase();
    if (t.includes('move') || t.includes('haul') || t.includes('freight') || t.includes('unload')) return 'local_shipping';
    if (t.includes('yard') || t.includes('rake') || t.includes('landscaping') || t.includes('outdoor')) return 'yard';
    if (t.includes('prep') || t.includes('food') || t.includes('kitchen') || t.includes('cook') || t.includes('catering')) return 'restaurant';
    if (t.includes('warehouse') || t.includes('box') || t.includes('inventory')) return 'inventory_2';
    if (t.includes('clean') || t.includes('wash') || t.includes('housekeeping')) return 'cleaning_services';
    if (t.includes('digital') || t.includes('task') || t.includes('data') || t.includes('micro')) return 'laptop_mac';
    if (t.includes('event') || t.includes('setup') || t.includes('stage')) return 'event_seat';
    return 'work';
  }

  function deduplicate(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.title || item.rawTitle || ''}|${item.summary || item.description || ''}`.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function filterOutSurveys(items) {
    return items.filter(item => {
      const text = `${item.title || ''} ${item.rawTitle || ''} ${item.summary || ''} ${item.description || ''}`.toLowerCase();
      return !/survey|study|panel|questionnaire/i.test(text);
    });
  }

  function generateGigCardHtml(g, key) {
    const payFormatted = formatPay(g.pay || g.estPay, g.title || g.rawTitle, g.summary || g.description);
    const iconName = getCategoryIcon(g.title || g.rawTitle);
    const descriptionText = g.summary || g.description || 'Verified immediate payout daily labor gig in Seattle area.';
    const id = g.id || `gig-${encodeURIComponent(g.title || g.rawTitle || Math.random())}`;

    return `
      <div data-job-id="${id}" data-job-key="${key}" class="job-card bg-white p-4 rounded-[20px] border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-3 relative overflow-visible group">
          <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-[14px] bg-slate-100 border border-slate-200/80 text-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-xl">${iconName}</span>
              </div>
              <div class="job-text-column min-w-0 flex-1 space-y-2" style="min-width: 0; width: 100%;">
                  <div class="job-header-stack space-y-1.5 w-full min-w-0">
                      <div class="flex items-start justify-between gap-2 w-full min-w-0">
                          <h4 class="job-title font-bold text-xs sm:text-sm text-slate-900 leading-normal tracking-tight flex-1 min-w-0" style="flex: 1 1 auto; min-width: 0; white-space: normal; overflow: visible; word-break: normal; overflow-wrap: break-word; line-height: 1.35; margin: 0; padding: 0; font-size: 0.8125rem;">${cleanJobTitle(g.title || g.rawTitle)}</h4>
                      </div>
                      <div>
                          <span class="pay-rate-badge inline-block px-2.5 py-0.5 text-[0.7rem] font-bold rounded-[8px] shadow-none whitespace-normal break-words" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; max-width: 100%;">
                              ${payFormatted}
                          </span>
                      </div>
                  </div>
                  <div class="job-tags-container tag-group flex flex-wrap items-center gap-2" style="margin-left: 0; padding-left: 0; gap: 8px;">
                      ${(g.noIdRequired !== false && g.no_id_required !== false && !/ID required|W2|background check/i.test(g.safety || '')) 
                        ? `<span class="job-tag tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" style="border-radius: 9999px; margin-left: 0; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">✓ No ID Required</span>`
                        : `<span class="job-tag tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200" style="border-radius: 9999px; margin-left: 0; background: #fffbeb; color: #92400e; border: 1px solid #fde68a;">🪪 ID / Verification Required</span>`
                      }
                      <span class="job-tag tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="border-radius: 9999px; margin-left: 0;">Immediate Cash</span>
                  </div>
                  <p class="job-description text-xs leading-relaxed font-medium" style="white-space: normal; overflow: visible; word-break: normal; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none; height: auto; max-height: none; margin-left: 0; padding-left: 0;">${descriptionText}</p>
              </div>
          </div>

          <div class="card-divider flex items-center justify-between gap-2 border-t" style="border-top: 1px solid rgba(255, 255, 255, 0.15); margin: 0.75rem 0 0 0; padding-top: 0.75rem; margin-left: 0; padding-left: 0;">
              <a href="${g.url || g.link || 'https://seattle.craigslist.org/search/lbg?query=cash'}" target="_blank" rel="noopener noreferrer" class="apply-cta-btn flex-1 py-2 rounded-[12px] text-xs text-center shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 hover:brightness-105" style="background: #facc15; color: #0f172a; font-weight: 700;">
                  <span class="material-symbols-outlined text-sm">open_in_new</span> Apply / View Details
              </a>
              <button onclick="playAudioPrepPrimer('${encodeURIComponent(g.title || g.rawTitle)}')" class="audio-primer-btn btn-secondary px-3 py-2 rounded-[12px] font-bold text-xs flex items-center gap-1 active:scale-95 transition-all flex-shrink-0">
                  <span class="material-symbols-outlined text-sm text-amber-500">graphic_eq</span> Audio Primer
              </button>
          </div>
      </div>
    `.trim();
  }

  function generateStandardJobCardHtml(j, key, currentRole) {
    const payFormatted = formatPay(j.pay, j.title, j.description);
    const iconName = getCategoryIcon(j.title);
    const id = j.id || `job-${encodeURIComponent(j.title || Math.random())}`;

    return `
      <div data-job-id="${id}" data-job-key="${key}" class="job-card bg-white p-4 rounded-[20px] border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-3 relative overflow-visible">
          <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-[14px] bg-slate-100 border border-slate-200/80 text-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-xl">${iconName}</span>
              </div>
              <div class="job-text-column min-w-0 flex-1 space-y-2">
                  <div class="job-title-container flex items-start justify-between gap-2" style="height: auto; max-height: none; overflow: visible;">
                      <h4 class="job-title font-bold text-sm text-slate-900 leading-snug tracking-tight flex-1" style="white-space: normal; overflow: visible; word-break: break-word; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none; height: auto; max-height: none; line-height: 1.25; margin-left: 0; padding-left: 0;">${cleanJobTitle(j.title)}</h4>
                      <span class="pay-rate-badge px-2.5 py-1 text-xs font-bold rounded-[10px] flex-shrink-0 shadow-none whitespace-nowrap self-start" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; font-size: 0.75rem;">
                          ${payFormatted}
                      </span>
                  </div>
                  <div class="job-tags-container tag-group flex flex-wrap items-center gap-2" style="margin-left: 0; padding-left: 0; gap: 8px;">
                      <span class="job-tag tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="border-radius: 9999px; margin-left: 0;">${j.company || 'Community Partner'}</span>
                      <span class="job-tag tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="border-radius: 9999px; margin-left: 0;">${j.location || 'Seattle, WA'}</span>
                  </div>
                  <p class="job-description text-xs leading-relaxed font-medium" style="white-space: normal; overflow: visible; word-break: normal; overflow-wrap: break-word; hyphens: none; -webkit-hyphens: none; height: auto; max-height: none; margin-left: 0; padding-left: 0;">${j.description || 'Verified employment opportunity.'}</p>
                  ${(j.requirements || []).length > 0 ? `
                  <div class="job-tags-container tag-group flex flex-wrap items-center gap-2 pt-0.5" style="margin-left: 0; padding-left: 0; gap: 8px;">
                      ${(j.requirements || []).map(r => `<span class="job-tag tag-pill inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="border-radius: 9999px; margin-left: 0;">${r}</span>`).join('')}
                  </div>
                  ` : ''}
              </div>
          </div>

          <div class="card-divider flex justify-between items-center border-t text-xs" style="border-top: 1px solid rgba(255, 255, 255, 0.15); margin: 0.75rem 0 0 0; padding-top: 0.75rem; margin-left: 0; padding-left: 0;">
              <span class="text-slate-400 text-xs font-medium truncate max-w-[140px]">${j.contact}</span>
              ${currentRole === 'volunteer' ? `
                <div class="flex gap-1.5">
                  <button onclick="editVolunteerJob('${j.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[10px] text-xs flex items-center gap-1 active:scale-95 transition-all">
                    <span class="material-symbols-outlined text-sm">edit</span> Edit
                  </button>
                  <button onclick="deleteVolunteerJob('${j.id}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-[10px] text-xs flex items-center gap-1 active:scale-95 transition-all">
                    <span class="material-symbols-outlined text-sm">delete</span> Delete
                  </button>
                </div>
              ` : `
                <div class="flex items-center gap-2 flex-1 justify-end">
                  <button onclick="playAudioPrepPrimer('${encodeURIComponent(j.title)}')" class="audio-primer-btn btn-secondary px-3 py-2 rounded-[12px] font-bold text-xs flex items-center gap-1 active:scale-95 transition-all flex-shrink-0">
                      <span class="material-symbols-outlined text-sm text-amber-500">graphic_eq</span> Audio Primer
                  </button>
                  <button onclick="handleJobContactClick('${encodeURIComponent(j.contact)}')" class="apply-cta-btn px-4 py-2 rounded-[12px] text-xs active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm hover:brightness-105" style="background: #facc15; color: #0f172a; font-weight: 700;">
                      <span class="material-symbols-outlined text-sm">open_in_new</span> Apply / View Details
                  </button>
                </div>
              `}
          </div>
      </div>
    `.trim();
  }

  /**
   * Reconciles the feed DOM elements without full-page re-renders or scroll interruption.
   */
  function reconcileFeedDOM(feed, itemsList) {
    const scrollContainer = document.querySelector('main');
    const prevScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

    const existingCardMap = new Map();
    const existingCards = Array.from(feed.querySelectorAll('[data-job-id]'));
    existingCards.forEach(el => {
      existingCardMap.set(el.getAttribute('data-job-id'), el);
    });

    const newIdsSet = new Set(itemsList.map(item => item.id));

    // 1. Remove elements that no longer exist
    existingCards.forEach(el => {
      const id = el.getAttribute('data-job-id');
      if (!newIdsSet.has(id)) {
        el.remove();
      }
    });

    // 2. Reconcile or insert each item in correct sequence
    let prevSibling = null;
    itemsList.forEach((item, index) => {
      let cardEl = existingCardMap.get(item.id);

      if (cardEl) {
        // If content changed, update it in place
        if (cardEl.getAttribute('data-job-key') !== item.key) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = item.html;
          const updatedEl = wrapper.firstElementChild;
          cardEl.replaceWith(updatedEl);
          cardEl = updatedEl;
        }
      } else {
        // Brand new card: create and insert
        const wrapper = document.createElement('div');
        wrapper.innerHTML = item.html;
        cardEl = wrapper.firstElementChild;
      }

      // Ensure proper DOM order without destroying other elements
      if (index === 0) {
        if (feed.firstElementChild !== cardEl) {
          feed.prepend(cardEl);
        }
      } else if (prevSibling) {
        if (prevSibling.nextElementSibling !== cardEl) {
          prevSibling.after(cardEl);
        }
      }
      prevSibling = cardEl;
    });

    // Restore scroll position silently
    if (scrollContainer && scrollContainer.scrollTop !== prevScrollTop) {
      scrollContainer.scrollTop = prevScrollTop;
    }
    updateActiveJobsCount(itemsList.length);
  }

  /**
   * Updates the active jobs counter pill dynamically across all supported selectors.
   * @param {number} [explicitCount] - Explicit count of visible jobs, or omitted to dynamically read DOM.
   */
  function updateActiveJobsCount(explicitCount) {
    let count = explicitCount;
    if (typeof count !== 'number') {
      const feed = document.getElementById('opportunities-feed');
      if (feed) {
        const visibleCards = feed.querySelectorAll('[data-job-id]:not([style*="display: none"]):not(.hidden)');
        count = visibleCards.length;
      } else {
        count = 0;
      }
    }
    const badges = document.querySelectorAll('#active-jobs-count, #jobs-count-badge, .active-badge');
    badges.forEach(badge => {
      badge.textContent = `${count} Active`;
    });
  }
  window.updateActiveJobsCount = updateActiveJobsCount;

  /**
   * Main loadOpportunities function with silent background refresh support.
   * @param {boolean} isSilent - If true, runs in background without UI flicker or scroll reset.
   */
  window.loadOpportunities = async function loadOpportunities(isSilent = false) {
    const feed = document.getElementById('opportunities-feed');
    if (!feed) return;

    if (isFetchInProgress) return;
    isFetchInProgress = true;

    // Role Gate: Show Post Job UI only to Volunteers / Employers
    const rawRole = (typeof getRole === 'function') ? getRole() : (localStorage.getItem('northstar_user_role') || 'seeker');
    const isHelperRole = (rawRole === 'volunteer' || rawRole === 'donater' || rawRole === 'helper' || rawRole === 'employer');
    const currentRole = isHelperRole ? 'volunteer' : 'seeker';
    const session = (typeof getSession === 'function') ? getSession() : JSON.parse(localStorage.getItem('northstar_session') || '{}');
    const userId = session.id || session.email || '';

    const postBtn = document.getElementById('post-job-header-btn');
    const postBanner = document.getElementById('post-job-volunteer-banner');

    if (currentRole === 'volunteer') {
      if (postBtn) { postBtn.classList.remove('hidden'); postBtn.classList.add('flex'); }
      if (postBanner) { postBanner.classList.remove('hidden'); }
    } else {
      if (postBtn) { postBtn.classList.add('hidden'); postBtn.classList.remove('flex'); }
      if (postBanner) { postBanner.classList.add('hidden'); }
    }

    try {
      const jobsApiUrl = `/api/jobs?role=${currentRole}&userId=${encodeURIComponent(userId)}`;
      const [gigsRes, jobsRes] = await Promise.all([
        (currentRole === 'seeker') ? fetch('/api/gigs').then(r => r.json()).catch(() => ({ gigs: [] })) : Promise.resolve({ gigs: [] }),
        fetch(jobsApiUrl).then(r => r.json()).catch(() => ({ jobs: [] }))
      ]);

      let approvedGigs = filterOutSurveys(deduplicate(gigsRes.gigs || []));
      if (approvedGigs.length === 0 && currentRole === 'seeker') {
        approvedGigs = defaultSeedGigs;
      }
      const standardJobs = filterOutSurveys(deduplicate(jobsRes.jobs || []));

      // If volunteer with 0 jobs, display empty state
      if (currentRole === 'volunteer' && standardJobs.length === 0) {
        window._currentJobsFingerprint = 'empty-volunteer';
        updateActiveJobsCount(0);
        feed.innerHTML = `
          <div class="backdrop-blur-md bg-white/[0.04] border border-white/10 p-8 rounded-2xl text-center space-y-3">
            <span class="material-symbols-outlined text-4xl text-amber-400">post_add</span>
            <h4 class="text-sm font-extrabold text-white">No Opportunities Posted Yet</h4>
            <p class="text-xs text-slate-400 max-w-xs mx-auto">You haven't published any job or task listings. Use the "Post Opportunity" button above to publish work for community members.</p>
            <button onclick="openModal('post-job-modal')" class="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">
              Post Your First Job
            </button>
          </div>
        `;
        return;
      }

      // Build item objects with unique IDs, content keys, and HTML
      const itemsList = [];

      approvedGigs.forEach((g, idx) => {
        const id = g.id || `seed-${idx}`;
        const key = `${id}|${g.title || g.rawTitle || ''}|${g.pay || g.estPay || ''}|${g.summary || g.description || ''}`;
        itemsList.push({
          id,
          key,
          html: generateGigCardHtml(g, key)
        });
      });

      standardJobs.forEach((j, idx) => {
        const id = j.id || `job-${idx}`;
        const key = `${id}|${j.title || ''}|${j.pay || ''}|${j.company || ''}|${j.description || ''}`;
        itemsList.push({
          id,
          key,
          html: generateStandardJobCardHtml(j, key, currentRole)
        });
      });

      // Dynamically reflect real-time count of visible rendered jobs
      updateActiveJobsCount(itemsList.length);

      // Fingerprint to check whether anything changed
      const newFingerprint = itemsList.map(item => item.key).join(':::');

      if (isSilent && window._currentJobsFingerprint === newFingerprint) {
        // Silent poll: zero changes detected.
        updateActiveJobsCount(itemsList.length);
        return;
      }

      if (!feed.children.length || !window._currentJobsFingerprint) {
        // Initial render
        feed.innerHTML = itemsList.map(i => i.html).join('');
      } else {
        // Incremental, silent DOM reconciliation preserving scroll and user interactions
        reconcileFeedDOM(feed, itemsList);
      }

      updateActiveJobsCount(itemsList.length);
      window._currentJobsFingerprint = newFingerprint;
    } catch (e) {
      console.error('Error loading opportunities:', e);
    } finally {
      isFetchInProgress = false;
    }
  };

  /**
   * Starts silent background polling every 30 seconds.
   */
  window.startJobsAutoRefresh = function startJobsAutoRefresh() {
    if (jobsPollingTimer) clearInterval(jobsPollingTimer);
    jobsPollingTimer = setInterval(() => {
      if (typeof window.loadOpportunities === 'function') {
        window.loadOpportunities(true); // Silent mode = true
      }
    }, BACKGROUND_POLL_INTERVAL_MS);
  };

  window.stopJobsAutoRefresh = function stopJobsAutoRefresh() {
    if (jobsPollingTimer) {
      clearInterval(jobsPollingTimer);
      jobsPollingTimer = null;
    }
  };

  /**
   * Triggers the floating AI Assistant chat drawer and auto-submits the job match prompt.
   */
  window.triggerAIMatchAssistant = function triggerAIMatchAssistant() {
    const promptText = "What are the 3 best job opportunities for me based on my resume?";

    // 1. Ensure global AI chatbot widget is mounted
    if (typeof window.initGlobalAIChatbot === 'function') {
      window.initGlobalAIChatbot();
    }

    // 2. Open chatbot drawer if not already open
    const drawer = document.getElementById('chatbot-window-drawer');
    if (drawer && drawer.classList.contains('hidden')) {
      if (typeof window.toggleAIChatbotWindow === 'function') {
        window.toggleAIChatbotWindow();
      }
    }

    // 3. Inject and send initial message immediately
    const executeSend = () => {
      if (typeof window.sendQuickChatMessage === 'function') {
        window.sendQuickChatMessage(promptText);
      } else {
        const input = document.getElementById('chatbot-input-field');
        if (input) {
          input.value = promptText;
          if (typeof window.handleAIChatSubmit === 'function') {
            window.handleAIChatSubmit(new Event('submit'));
          }
        }
      }
    };

    setTimeout(executeSend, 80);
  };

  /**
   * Binds click listener to #ai-match-trigger button.
   */
  function initAIMatchTrigger() {
    const triggerBtn = document.getElementById('ai-match-trigger');
    if (!triggerBtn) return;
    if (triggerBtn._hasAIMatchListener) return;
    triggerBtn._hasAIMatchListener = true;

    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.triggerAIMatchAssistant();
    });
  }

  // Auto-initialize background polling and AI Match trigger when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAIMatchTrigger();
      window.startJobsAutoRefresh();
    });
  } else {
    initAIMatchTrigger();
    window.startJobsAutoRefresh();
  }
})();
