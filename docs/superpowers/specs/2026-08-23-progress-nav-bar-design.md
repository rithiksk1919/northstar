# Design Specification: Progress Tab Integration in Bottom Navigation Bar

**Date**: 2026-08-23  
**Status**: Approved (Option 1)  

## Overview
Integrate the **Progress** page (`progress.html`) into the bottom navigation bar across the NorthStar web application for Seeker users. This provides direct 1-tap access to the milestone progress tracker alongside Dashboard, Jobs, Map, Resume, and Settings.

---

## Navigation Bar Specification

### Seeker Navigation Items (6-Item Dock)
1. **Dashboard** (`seeker-dashboard.html`) - Icon: `dashboard`
2. **Progress** (`progress.html`) - Icon: `timeline`
3. **Jobs** (`opportunities.html`) - Icon: `work`
4. **Map** (`resource-map.html`) - Icon: `map`
5. **Resume** (`resume-builder.html`) - Icon: `description`
6. **Settings** (`#`, triggers `openSettingsModal()`) - Icon: `settings`

### Styling & Responsive Layout Adjustments
- Update `renderDynamicNav()` in `js/northstar.js` to render the 6 items.
- Use responsive spacing (`px-1` to `px-2`, `gap-0.5` to `gap-1`, text size `text-[10px]` or `text-[11px]`) to ensure all 6 items fit seamlessly without overflow on mobile viewports (down to 360px width).
- Update static `<nav>` elements across HTML pages (`seeker-dashboard.html`, `progress.html`, `opportunities.html`, `resource-map.html`, `resume-builder.html`, `index.html`, etc.) for consistency before JS hydration.

---

## Impacted Files
- `js/northstar.js`: Update `renderDynamicNav()` tab list and active state styling.
- `index.html`, `seeker-dashboard.html`, `progress.html`, `opportunities.html`, `resource-map.html`, `resume-builder.html`: Align static fallback HTML `<nav>` blocks.

---

## Verification Plan
1. Test rendering on `http://localhost:5000` across all Seeker pages.
2. Verify active highlight state for each tab when navigating (Dashboard, Progress, Jobs, Map, Resume).
3. Test Settings modal trigger from the bottom navigation bar.
4. Verify responsive layout on mobile viewports without text wrapping or overflow.
