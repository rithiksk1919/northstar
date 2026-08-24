# Progress Tab Navigation Bar Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the **Progress** tab (`progress.html`) into the bottom navigation bar for Seeker users across the site so they can track their milestones from any page.

**Architecture:** Update `renderDynamicNav()` in `js/northstar.js` to render a 6-item navigation bar for Seekers (`Dashboard`, `Progress`, `Jobs`, `Map`, `Resume`, `Settings`) with mobile responsive styling, and synchronize static `<nav>` HTML structures across HTML pages.

**Tech Stack:** HTML5, JavaScript (ES6), Tailwind CSS, Font/Material Symbols icons.

## Global Constraints
- Target 6 items in Seeker bottom navigation bar: `Dashboard`, `Progress`, `Jobs`, `Map`, `Resume`, `Settings`.
- Responsive design fitting mobile viewports down to 360px width.
- Standard active highlighting using `bg-secondary-container text-on-secondary-container`.

---

### Task 1: Update Dynamic Navigation Engine in `js/northstar.js`

**Files:**
- Modify: `c:/Users/Rithik/Downloads/Homeless nonprofit/js/northstar.js:600-645`

**Interfaces:**
- Consumes: `getRole()`, `window.location.pathname`
- Produces: 6-item dynamic navigation bar output for Seekers

- [ ] **Step 1: Update `renderDynamicNav` item array for Seeker role**

In `js/northstar.js`:
```javascript
  if (role === 'seeker') {
    // Seeker Funnel Tabs: [Dashboard, Progress, Jobs, Map, Resume, Settings]
    navItems = [
      { href: 'seeker-dashboard.html', label: 'Dashboard', icon: 'dashboard' },
      { href: 'progress.html', label: 'Progress', icon: 'timeline' },
      { href: 'opportunities.html', label: 'Jobs', icon: 'work' },
      { href: 'resource-map.html', label: 'Map', icon: 'map' },
      { href: 'resume-builder.html', label: 'Resume', icon: 'description' },
      { href: '#', label: 'Settings', icon: 'settings', action: 'openSettingsModal()' }
    ];
  }
```

- [ ] **Step 2: Update item container padding & label font sizing for 6-item layout**

Adjust active and non-active tab item styling classes in `renderDynamicNav()`:
```javascript
    const activeClass = isActive && !item.action
      ? 'bg-secondary-container text-on-secondary-container rounded-2xl px-2 py-1 shadow-md starlight-glow font-bold animate-switch-pop'
      : 'text-on-surface-variant hover:text-primary px-1.5 py-1 font-medium';
```
And label font class:
```javascript
    <span class="text-[10px] sm:text-[11px] leading-tight">${item.label}</span>
```

- [ ] **Step 3: Test local server navigation**

Run URL check or browser test to verify `http://localhost:5000/seeker-dashboard.html` renders all 6 tabs correctly.

- [ ] **Step 4: Commit changes**

```bash
git add js/northstar.js
git commit -m "feat: add Progress tab to seeker bottom navigation bar"
```

---

### Task 2: Align Static `<nav>` HTML Fallback Across HTML Files

**Files:**
- Modify: `index.html`
- Modify: `seeker-dashboard.html`
- Modify: `opportunities.html`
- Modify: `resource-map.html`
- Modify: `resume-builder.html`
- Modify: `progress.html`

**Interfaces:**
- Consumes: Static HTML fallback structure before JS initialization

- [ ] **Step 1: Add Progress tab link to `<nav>` elements in all HTML files**

Insert `<a href="progress.html" class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary px-1.5 py-1 transition-colors"><span class="material-symbols-outlined text-xl">timeline</span><span class="text-[10px]">Progress</span></a>` into the static `<nav>` blocks.

- [ ] **Step 2: Verify all static navs have 6 items matching JS hydration**

Check HTML files to ensure no visual layout jump occurs before JS executes `renderDynamicNav()`.

- [ ] **Step 3: Commit static HTML updates**

```bash
git add *.html
git commit -m "chore: synchronize static bottom nav markup across pages"
```
