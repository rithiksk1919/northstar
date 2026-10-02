// Runs inside the Craigslist page shown in the guide. It works out which step the person is on,
// draws a bouncing yellow arrow and a ring around the thing to tap, and tells the app the step
// so the card at the bottom can say it in plain words.
//
// Craigslist reply flow (checked on real listings, Oct 2026):
//   1. "reply" button (.reply-button)
//   2. sometimes an hCaptcha "are you human" check (iframe)
//   3. options: email / call / text (.reply-option-header)
//   4. the chosen option opens with the address or number
export const GUIDE_SCRIPT = `
(function () {
  if (window.__nsGuide) return true;
  window.__nsGuide = true;

  var post = function (m) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m));
  };

  var style = document.createElement('style');
  style.textContent = [
    '#ns-arrow{position:absolute;z-index:2147483646;width:64px;height:64px;margin-left:-32px;pointer-events:none;',
    'transition:left .35s ease, top .35s ease, opacity .25s ease;animation:nsBounce .9s ease-in-out infinite}',
    '#ns-arrow svg{width:64px;height:64px;display:block;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35))}',
    '#ns-arrow.ns-up svg{transform:rotate(180deg)}',
    '@keyframes nsBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}',
    '#ns-arrow.ns-up{animation-name:nsBounceUp}',
    '@keyframes nsBounceUp{0%,100%{transform:translateY(0)}50%{transform:translateY(14px)}}',
    '#ns-ring{position:absolute;z-index:2147483645;pointer-events:none;border:4px solid #FFD43B;border-radius:14px;',
    'transition:left .3s ease, top .3s ease, opacity .25s ease;animation:nsPulse 1.3s ease-out infinite}',
    '@keyframes nsPulse{0%{box-shadow:0 0 0 0 rgba(255,212,59,.85)}100%{box-shadow:0 0 0 20px rgba(255,212,59,0)}}',
    '.ns-hidden{opacity:0 !important}'
  ].join('');
  document.head.appendChild(style);

  var arrow = document.createElement('div');
  arrow.id = 'ns-arrow';
  arrow.className = 'ns-hidden';
  arrow.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 4h20v28h14L32 60 8 32h14z" fill="#FFD43B" stroke="#111" stroke-width="4" stroke-linejoin="round"/></svg>';
  var ring = document.createElement('div');
  ring.id = 'ns-ring';
  ring.className = 'ns-hidden';
  document.body.appendChild(ring);
  document.body.appendChild(arrow);

  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function first(sel) { return all(sel).filter(visible)[0] || null; }
  function text(el) { return ((el && (el.innerText || el.textContent)) || '').replace(/\\s+/g, ' ').trim(); }

  var onCraigslist = /(^|\\.)craigslist\\.org$/i.test(location.hostname);
  var postBody = onCraigslist ? document.querySelector('#postingbody, .posting-body') : null;

  // Web addresses typed as plain text in the post ("Apply here: teamgillywagon.com/jobs")
  // become tappable links, so the arrow can point at them.
  function linkifyPost() {
    if (!postBody || postBody.__nsLinked) return;
    postBody.__nsLinked = true;
    var re = /((https?:\\/\\/|www\\.)[^\\s<>"']+|\\b[a-z0-9][a-z0-9-]*\\.(com|org|net|io|co|jobs|us|work)(\\/[^\\s<>"']*)?)/gi;
    var walker = document.createTreeWalker(postBody, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (n.parentElement && n.parentElement.closest('a')) continue;
      re.lastIndex = 0;
      if (re.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      var str = n.nodeValue;
      var lastIndex = 0;
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(str))) {
        var raw = m[0].replace(/[.,;:)!]+$/, '');
        var before = str.slice(Math.max(0, m.index - 1), m.index);
        if (before === '@' || raw.indexOf('@') >= 0) continue; // email addresses stay text
        frag.appendChild(document.createTextNode(str.slice(lastIndex, m.index)));
        var link = document.createElement('a');
        link.href = /^https?:/i.test(raw) ? raw : 'https://' + raw;
        link.textContent = raw;
        link.setAttribute('data-ns-linked', '1');
        frag.appendChild(link);
        lastIndex = m.index + raw.length;
      }
      frag.appendChild(document.createTextNode(str.slice(lastIndex)));
      n.parentNode.replaceChild(frag, n);
    });
  }

  // What the post asks people to include ("To apply, reply with your name, experience...")
  function postAsks() {
    if (!postBody) return '';
    var t = text(postBody);
    var m = t.match(/(to apply|when you reply|when replying|please (include|mention|send|reply with))[^.!?]{0,200}[.!?]?/i);
    return m ? m[0].trim() : '';
  }

  // A link in the post that is clearly how to apply
  function applyLink() {
    if (!postBody) return null;
    var links = all('#postingbody a, .posting-body a').filter(function (a) {
      return visible(a) && /^https?:/i.test(a.getAttribute('href') || a.href || '') && !/craigslist\\.org/i.test(a.hostname || '');
    });
    if (!links.length) return null;
    var applyish = /apply|application|sign ?up|join|career|jobs|hiring|register|get started|click here/i;
    var best = links.filter(function (a) {
      var around = text(a.parentElement || a).slice(0, 200);
      return applyish.test(text(a)) || applyish.test(a.href) || applyish.test(around);
    })[0];
    return best || (links.length === 1 ? links[0] : null);
  }

  // ---- On the employer's own website: walk through the form ----
  function fieldLabel(f) {
    var l = f.getAttribute('aria-label') || '';
    if (!l && f.id) {
      var forEl = document.querySelector('label[for="' + f.id.replace(/"/g, '') + '"]');
      if (forEl) l = text(forEl);
    }
    if (!l) { var wrap = f.closest('label'); if (wrap) l = text(wrap); }
    if (!l) l = f.getAttribute('placeholder') || '';
    if (!l) l = (f.getAttribute('name') || '').replace(/[_\\-\\[\\]]+/g, ' ');
    return l.replace(/\\*/g, '').replace(/\\s+/g, ' ').trim().slice(0, 40);
  }
  function formFields() {
    return all('input, textarea, select').filter(function (f) {
      var type = (f.getAttribute('type') || '').toLowerCase();
      return visible(f) && !f.disabled && !f.readOnly && !/^(hidden|submit|button|image|reset|search|checkbox|radio|file)$/.test(type);
    });
  }
  function isEmpty(f) { return !String(f.value || '').trim(); }

  function detectSite() {
    var page = text(document.body).toLowerCase();
    if (/thank(s| you) for (applying|your application)|application (has been |was )?(received|submitted)|we('|’)ll be in touch/.test(page)) {
      return { step: 'applied' };
    }
    var fields = formFields();
    if (fields.length) {
      var active = document.activeElement;
      // While someone is typing in a box, keep pointing at it
      if (active && fields.indexOf(active) >= 0) return { step: 'form', target: active, label: fieldLabel(active), typing: true };
      var required = fields.filter(function (f) { return f.required || f.getAttribute('aria-required') === 'true'; });
      var next = (required.length ? required : fields).filter(isEmpty)[0];
      if (next) return { step: 'form', target: next, label: fieldLabel(next) };
      var submit = all('button, input[type="submit"], [role="button"]').filter(function (b) {
        return visible(b) && /submit|apply|send|next|continue|finish/i.test(text(b) || b.value || '');
      })[0];
      if (submit) return { step: 'submit', target: submit, label: (text(submit) || submit.value || 'Submit').slice(0, 30) };
    }
    var start = all('a, button, [role="button"]').filter(function (b) {
      return visible(b) && /^(apply( now| here| today)?|start (your )?application|sign up( today| now)?|get started|join now|i'?m interested)$/i.test(text(b));
    })[0];
    if (start) return { step: 'site-apply', target: start, label: text(start).slice(0, 30) };
    return { step: 'site' };
  }

  function detect() {
    if (!onCraigslist) return detectSite();
    linkifyPost();
    var asks = postAsks();
    var body = text(document.body).toLowerCase();
    if (/this posting has been (deleted|flagged)|this posting has expired|posting has been removed/.test(body)) {
      return { step: 'gone' };
    }

    var captcha = all('iframe[src*="hcaptcha"], iframe[src*="turnstile"], iframe[src*="recaptcha"]')
      .filter(function (f) { return f.getBoundingClientRect().height > 40 && visible(f); })[0];
    if (captcha) return { step: 'captcha' };

    var open = all('.reply-option-section').filter(function (s) { return !s.classList.contains('collapsed'); })[0];
    var area = open || document.querySelector('.reply-options') || document.querySelector('.reply-info');
    if (area) {
      var mail = all('a[href^="mailto:"]').filter(visible)[0];
      if (mail) return { step: 'email', href: mail.getAttribute('href') || '', asks: asks };
      var app = all('.reply-options a, .reply-options button').filter(function (el) {
        return visible(el) && /gmail|outlook|yahoo|default email|mail app|aol/i.test(text(el));
      })[0];
      if (app) return { step: 'email-app', target: app, label: text(app), asks: asks };
      var tel = all('a[href^="tel:"]').filter(visible)[0];
      if (tel) return { step: 'call', target: tel };
      var sms = all('a[href^="sms:"]').filter(visible)[0];
      if (sms) return { step: 'text', target: sms, asks: asks };
    }

    var headers = all('.reply-option-header').filter(visible);
    if (headers.length && !open) {
      var pick = headers.filter(function (h) { return /email/i.test(text(h)); })[0]
        || headers.filter(function (h) { return /text/i.test(text(h)); })[0]
        || headers.filter(function (h) { return /call|phone/i.test(text(h)); })[0]
        || headers[0];
      return { step: 'choose', target: pick, label: text(pick), asks: asks };
    }
    if (open) return { step: 'wait' };

    // The post says how to apply with a link: that comes first
    var applyAt = applyLink();
    if (applyAt) return { step: 'apply-link', target: applyAt, label: (text(applyAt) || applyAt.hostname || '').slice(0, 40) };

    var reply = first('.reply-button') || all('button, a').filter(function (el) { return visible(el) && /^reply$/i.test(text(el)); })[0];
    if (reply) {
      var loading = document.querySelector('.reply-info .cl-spinner, .reply-loading-view:not(.bd-hidden)');
      if (loading && visible(loading)) return { step: 'wait' };
      return { step: 'reply', target: reply, asks: asks };
    }
    return { step: 'read' };
  }

  // "Fill in for me": puts the person's details in the boxes that clearly ask for them
  window.__nsFill = function (profile) {
    var filled = 0;
    var parts = String(profile.name || '').trim().split(/\\s+/);
    formFields().forEach(function (f) {
      if (!isEmpty(f) || f.tagName === 'SELECT') return;
      var type = (f.getAttribute('type') || '').toLowerCase();
      var hint = (fieldLabel(f) + ' ' + (f.getAttribute('name') || '') + ' ' + (f.getAttribute('autocomplete') || '') + ' ' + (f.id || '')).toLowerCase();
      var value = '';
      if (type === 'email' || /e-?mail/.test(hint)) value = profile.email || '';
      else if (type === 'tel' || /phone|mobile|cell/.test(hint)) value = profile.phone || '';
      else if (/first/.test(hint) && /name/.test(hint)) value = parts[0] || '';
      else if (/last|surname|family/.test(hint) && /name/.test(hint)) value = parts.length > 1 ? parts[parts.length - 1] : '';
      else if (/full ?name|^name\\b|\\bname\\b|your name/.test(hint) && !/company|business|user/.test(hint)) value = profile.name || '';
      else if (/city|location|where do you live/.test(hint)) value = profile.city || '';
      if (!value) return;
      var proto = f.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(f, value); // works with React-style forms too
      f.dispatchEvent(new Event('input', { bubbles: true }));
      f.dispatchEvent(new Event('change', { bubbles: true }));
      filled++;
    });
    post({ type: 'filled', count: filled });
    return filled;
  };

  var last = '';
  var lastTarget = null;
  function place(target) {
    if (!target) {
      arrow.classList.add('ns-hidden');
      ring.classList.add('ns-hidden');
      return;
    }
    var r = target.getBoundingClientRect();
    var x = r.left + window.scrollX;
    var y = r.top + window.scrollY;
    var pad = 6;
    ring.style.left = (x - pad) + 'px';
    ring.style.top = (y - pad) + 'px';
    ring.style.width = (r.width + pad * 2) + 'px';
    ring.style.height = (r.height + pad * 2) + 'px';
    // Arrow above the target, or below it when there's no room above
    var below = r.top < 90;
    arrow.classList.toggle('ns-up', below);
    arrow.style.left = (x + r.width / 2) + 'px';
    arrow.style.top = (below ? y + r.height + pad + 8 : y - 64 - pad - 8) + 'px';
    arrow.classList.remove('ns-hidden');
    ring.classList.remove('ns-hidden');
  }

  function tick() {
    var s;
    try { s = detect(); } catch (e) { s = { step: 'read' }; }
    var key = s.step + '|' + (s.label || '') + '|' + (s.href || '');
    if (key !== last || s.target !== lastTarget) {
      if (s.target && s.target !== lastTarget && !s.typing) {
        try { s.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      }
      if (key !== last) {
        post({
          type: 'guide-step', step: s.step, label: s.label || '', href: s.href || '', asks: s.asks || '',
          onSite: !onCraigslist, canFill: !onCraigslist && formFields().some(isEmpty)
        });
      }
      last = key;
      lastTarget = s.target || null;
    }
    place(s.target || null);
  }

  window.__nsGuideShow = function (on) {
    document.getElementById('ns-arrow').style.display = on ? '' : 'none';
    document.getElementById('ns-ring').style.display = on ? '' : 'none';
  };

  tick();
  setInterval(tick, 400);
  window.addEventListener('scroll', function () { place(lastTarget); }, { passive: true });
  window.addEventListener('resize', function () { place(lastTarget); });
  return true;
})();
true;
`;

// What the card at the bottom says for each step. Short and plain on purpose.
export function stepCopy(step, label) {
  const option = (label || '').toLowerCase();
  switch (step) {
    case 'reply':
      return { tag: 'First', title: 'Tap “reply”', detail: 'The yellow arrow shows you where.' };
    case 'captcha':
      return { tag: 'Next', title: 'Show you’re a person', detail: 'Tap the pictures it asks for, then tap the button at the bottom. Tap Skip for a new set.' };
    case 'choose':
      return {
        tag: 'Next',
        title: `Tap “${option || 'email'}”`,
        detail: /email/.test(option) ? 'This shows their email address.' : 'This shows how to reach them.'
      };
    case 'email':
      return { tag: 'Finally', title: 'Open Gmail and send it', detail: 'Your message is already written. Send it to:', copy: true };
    case 'email-app':
      return { tag: 'Last step', title: `Tap “${label || 'your email app'}”`, detail: 'Paste your message, then send it.', copy: true };
    case 'call':
      return { tag: 'Last step', title: 'Tap the number to call', detail: 'Say which job you saw and when you can start.' };
    case 'text':
      return { tag: 'Last step', title: 'Tap the number to text', detail: 'Paste your message, then send it.', copy: true };
    case 'apply-link':
      return { tag: 'First', title: 'Tap the apply link', detail: 'This job wants you to apply on their website. The arrow shows the link.' };
    case 'site-apply':
      return { tag: 'Next', title: `Tap “${label || 'Apply'}”`, detail: 'This starts the application.' };
    case 'form':
      return { tag: 'Next', title: label ? `Fill in “${label}”` : 'Fill in the box', detail: 'Tap the box and type your answer.', fill: true };
    case 'submit':
      return { tag: 'Last step', title: `Tap “${label || 'Submit'}”`, detail: 'Check your answers first.' };
    case 'site':
      return { tag: 'Next', title: 'Find the Apply button', detail: 'Scroll down if you don’t see it.' };
    case 'applied':
      return { tag: 'Done', title: 'You applied!', detail: 'Nice work. Keep an eye on your phone and email.' };
    case 'gone':
      return { tag: 'Sorry', title: 'This job is gone', detail: 'The person took it down. Go back and pick another one.' };
    case 'wait':
      return { tag: 'Next', title: 'One moment…', detail: 'Craigslist is loading.' };
    case 'read':
    default:
      return { tag: 'First', title: 'Read about the job', detail: 'Scroll down to see the details.' };
  }
}
