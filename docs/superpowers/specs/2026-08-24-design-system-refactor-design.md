# Design Specification: NorthStar UI/UX Design System Refactor

**Date**: 2026-08-24  
**Status**: Approved  

## 1. Executive Summary
Refactor the NorthStar web application's typography, color tokens, layout hierarchy, and job cards to eliminate generic AI aesthetic artifacts (blurry purple/blue gradients, glassmorphism bubbles, emoji icons) and establish a custom dark theme built on obsidian `#0B0E14`, crisp navy-gray `#121722` surfaces, `#232C3F` strokes, and emerald `#10B981` accents.

---

## 2. Design Tokens & Palette

### Typography
- **Font Pairing**: Google Fonts `'Plus Jakarta Sans'` (Headers, 600/700/800) & `'Inter'` (Body, 400/500/600).
- **Import Link**:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  ```
- **Heading Style**: `font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em;` (`tracking-tight`).
- **Body / Meta Style**: `font-family: 'Inter', sans-serif; line-height: 1.5; text-align: left;`.

### Colors & Surfaces
- **Page Background**: `#0B0E14` (Deep obsidian dark slate)
- **Container / Card Surface**: `#121722` (Dark navy-gray elevation)
- **Sub-surface / Badge**: `#1A2130`
- **Stroke / Border**: `1px solid #232C3F` (Crisp stroke border, no heavy drop shadows)
- **Primary Text**: `#F0F4F8` (Crisp off-white)
- **Secondary Text**: `#8896AB` (Cool slate gray)
- **Verified / Pay Accent**: `#10B981` (Emerald green)
- **Pay Pill Background**: `#064E3B` with `#34D399` text
- **Primary Button**: `#1E293B` background with `#F0F4F8` text
- **Secondary Button**: `#1A2130` background with `#8896AB` text

---

## 3. Component Hierarchy & Rules

### Work Opportunities Header (`opportunities.html`)
- Left-aligned title: `"Work Opportunities"`
- Subtle count badge: e.g. `12 active` in `#1A2130` container with `#8896AB` text.
- Minimalist SVG refresh icon button.

### Job Cards (`js/northstar.js` `renderGigs()`)
- **Top Row**:
  - Left-aligned title: `text-lg font-bold text-[#F0F4F8]`
  - Right-aligned pay pill: `bg-[#064E3B] text-[#34D399] font-bold px-3 py-1 rounded-full text-xs`
- **Middle**:
  - Summary: 2 sentences in `#8896AB` text, left-aligned.
  - Tag: Single crisp tag `• No State ID / Background Check` (`bg-[#1A2130] text-[#10B981] text-xs font-semibold px-2.5 py-1 rounded-md`).
- **Bottom Action Row**:
  - Left action: `"View Listing"` (`bg-[#1E293B] text-[#F0F4F8] hover:bg-[#232C3F] px-4 py-2 rounded-lg text-xs font-bold` with external link SVG icon).
  - Right action: `"Audio Primer"` (`bg-[#1A2130] text-[#8896AB] hover:text-[#F0F4F8] px-3 py-2 rounded-lg text-xs font-medium`).

### Navigation Dock & Shell
- Bottom Navigation Bar: `#121722` background with `border-t border-[#232C3F]`. Active item pill: `bg-[#1A2130] text-[#10B981]`.
- Main Mobile Frame: `#0B0E14` background, `border border-[#232C3F]`.

---

## 4. Impacted Files
- `css/northstar.css`: Complete CSS design system token update.
- `js/northstar.js`: `renderGigs()` card markup & `renderDynamicNav()` navbar styling.
- `index.html`, `opportunities.html`, `seeker-dashboard.html`, `progress.html`, `resource-map.html`, `resume-builder.html`, `helper-dashboard.html`, `donate.html`, `call-shelter.html`: Font imports & Tailwind configuration/color classes.

---

## 5. Verification Plan
- Verify page rendering on `http://localhost:5000/opportunities.html` and `http://localhost:5000/seeker-dashboard.html`.
- Confirm all interactive functions remain fully operational (Gig vetting, audio primer player, modal popups, push alert toggle, SPA navigation).
