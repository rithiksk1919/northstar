# UI/UX Design System Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the NorthStar web application's typography, color tokens, layout hierarchy, and job cards to eliminate generic AI aesthetic artifacts (blurry purple/blue gradients, glassmorphism bubbles, emoji icons) and establish a custom dark theme built on obsidian `#0B0E14`, crisp navy-gray `#121722` surfaces, `#232C3F` strokes, and emerald `#10B981` accents while maintaining all functional behavior.

**Architecture:** Update `css/northstar.css` design system variables & utility rules, refactor HTML Google Fonts imports & Tailwind palette configs, and update `js/northstar.js` dynamic card & navigation rendering functions.

**Tech Stack:** HTML5, CSS3 Variables, Tailwind CSS (Custom Theme Config), JavaScript (ES6 Modules).

## Global Constraints
- Target Palette: Background `#0B0E14`, Card Surface `#121722`, Sub-surface `#1A2130`, Border `#232C3F`, Primary Text `#F0F4F8`, Secondary Text `#8896AB`, Emerald Accent `#10B981`, Pay Pill `#064E3B` text `#34D399`.
- Typography: Headers `'Plus Jakarta Sans'`, Body `'Inter'`.
- All long text & descriptions must be left-aligned (`text-left`).
- Strict ban on blurry gradients (`backdrop-blur` with 0.1 border), heavy drop shadows, and emoji icons.

---

### Task 1: Update CSS Design System Tokens in `css/northstar.css`

**Files:**
- Modify: `c:/Users/Rithik/Downloads/Homeless nonprofit/css/northstar.css:1-50`

**Interfaces:**
- Consumes: CSS root variables
- Produces: Base styling, font families, dark obsidian theme variables

- [ ] **Step 1: Replace CSS root variables and font family rules**

In `css/northstar.css`:
```css
:root {
  --bg-obsidian: #0B0E14;
  --surface-card: #121722;
  --surface-sub: #1A2130;
  --border-stroke: #232C3F;
  --text-primary: #F0F4F8;
  --text-secondary: #8896AB;
  --accent-emerald: #10B981;
  --pay-pill-bg: #064E3B;
  --pay-pill-text: #34D399;
  --btn-primary-bg: #1E293B;
}

body {
  background-color: var(--bg-obsidian);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 2: Remove blurry glassmorphism drop shadows and neon glow rules**

Replace `.glass-card`, `.glass-card-dark`, `.starlight-glow` with crisp border stroke definitions (`border: 1px solid #232C3F; background: #121722;`).

- [ ] **Step 3: Commit CSS design system updates**

```bash
git add css/northstar.css
git commit -m "style: update CSS design system variables and typography rules"
```

---

### Task 2: Refactor Google Fonts Imports & Tailwind Config in HTML Files

**Files:**
- Modify: `index.html`
- Modify: `opportunities.html`
- Modify: `seeker-dashboard.html`
- Modify: `progress.html`
- Modify: `resource-map.html`
- Modify: `resume-builder.html`
- Modify: `helper-dashboard.html`
- Modify: `donate.html`
- Modify: `call-shelter.html`

**Interfaces:**
- Consumes: Tailwind script & Google Fonts `<link>` tags
- Produces: Consistent dark palette Tailwind theme across all HTML pages

- [ ] **Step 1: Update Google Fonts link tag in all HTML files**

Replace existing Google Fonts tags with:
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Update Tailwind `tailwind.config` JSON script in all HTML files**

Extend Tailwind colors with exact hex values:
```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: "#0B0E14",
        card: "#121722",
        subsurface: "#1A2130",
        stroke: "#232C3F",
        primaryText: "#F0F4F8",
        secondaryText: "#8896AB",
        emeraldAccent: "#10B981"
      },
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"]
      }
    }
  }
}
```

- [ ] **Step 3: Replace body classes and remove atmospheric background glow blur divs**

Remove `<div class="fixed inset-0 pointer-events-none ... rounded-full blur-3xl"></div>` atmospheric glow elements and set body background to `bg-[#0B0E14] text-[#F0F4F8]`.

- [ ] **Step 4: Commit HTML font & theme updates**

```bash
git add *.html
git commit -m "style: update typography imports and Tailwind theme configuration in HTML files"
```

---

### Task 3: Refactor Work Opportunities Header & Job Card Rendering in `opportunities.html` and `js/northstar.js`

**Files:**
- Modify: `opportunities.html`
- Modify: `js/northstar.js:690-780`

**Interfaces:**
- Consumes: `activeGigs` state, `renderGigs()`
- Produces: Clean, asymmetrical job card hierarchy matching design system

- [ ] **Step 1: Update Top Bar in `opportunities.html`**

Update header to left-aligned bold heading `"Work Opportunities"`, subtle count badge (`12 active` in `bg-[#1A2130] text-[#8896AB] px-2.5 py-0.5 rounded-full text-xs font-semibold`), and a minimalistic SVG refresh icon.

- [ ] **Step 2: Update `renderGigs()` function in `js/northstar.js`**

Refactor the card HTML string inside `renderGigs()`:
```javascript
  gigsContainer.innerHTML = gigs.map(gig => `
    <div class="bg-[#121722] border border-[#232C3F] rounded-xl p-4 space-y-3 transition-all hover:border-[#334155] text-left">
      <div class="flex justify-between items-start gap-3">
        <h3 class="text-lg font-bold text-[#F0F4F8] leading-snug text-left font-heading">${gig.title}</h3>
        <span class="bg-[#064E3B] text-[#34D399] font-bold px-3 py-1 rounded-full text-xs flex-shrink-0">${gig.pay}</span>
      </div>
      <p class="text-xs text-[#8896AB] leading-relaxed text-left font-body">${gig.summary}</p>
      <div class="flex items-center gap-2">
        <span class="bg-[#1A2130] text-[#10B981] text-[11px] font-semibold px-2.5 py-1 rounded-md border border-[#232C3F] inline-flex items-center gap-1">
          • No State ID / Background Check
        </span>
      </div>
      <div class="flex items-center justify-between pt-1 gap-2">
        <a href="${gig.url}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-[#1E293B] hover:bg-[#232C3F] text-[#F0F4F8] rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border border-[#232C3F]">
          View Listing
          <svg class="w-3.5 h-3.5 text-[#8896AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
        <button onclick="playAudioPrimer('${gig.id}')" class="px-3 py-2 bg-[#1A2130] hover:bg-[#232C3F] text-[#8896AB] hover:text-[#F0F4F8] rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1 border border-[#232C3F]">
          <span class="material-symbols-outlined text-xs">volume_up</span> Audio Primer
        </button>
      </div>
    </div>
  `).join('');
```

- [ ] **Step 3: Update `renderDynamicNav()` in `js/northstar.js` for navigation dock**

Ensure navigation dock uses `#121722` surface with `border-t border-[#232C3F]` and crisp active tab indicator (`bg-[#1A2130] text-[#10B981]`).

- [ ] **Step 4: Verify local web app on `http://localhost:5000/opportunities.html`**

Fetch `http://localhost:5000/opportunities.html` and `http://localhost:5000/seeker-dashboard.html` to confirm layout rendering.

- [ ] **Step 5: Commit job cards & navbar refactor**

```bash
git add opportunities.html js/northstar.js
git commit -m "feat: refactor Job Opportunities cards and header hierarchy to match dark design system"
```
