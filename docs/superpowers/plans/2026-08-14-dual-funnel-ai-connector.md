# Dual Funnel Architecture & AI Connector Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete two-branch funnel ("I Need Help" / Seeker vs. "I Want to Help" / Volunteer), dynamic role-based navigation, AI Job Matcher (`/api/match-jobs`), Offline Resource Map, Job Opportunities portal (`opportunities.html`), and Progress & Achievements page (`progress.html`).

**Architecture:** Node Express backend (`server.js`) with Gemini 3.6 Flash for resume generation and job matching. LocalStorage and server state for job postings and resumes. Mobile app ratio UI with dynamic bottom navigation switching based on role (`seeker` vs `volunteer`).

---

### Task 1: Express Backend Expansion for Job Opportunities & AI Matcher

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add `/api/jobs` GET and POST endpoints in `server.js`**
Allow posting new job opportunities and fetching active jobs.

- [ ] **Step 2: Add `/api/match-jobs` POST endpoint in `server.js`**
Use `gemini-3.6-flash` with structured response schema to evaluate seeker resume against posted jobs, producing match percentage scores and match highlights.

---

### Task 2: Core JS Role State & Dynamic Bottom Navigation

**Files:**
- Modify: `js/northstar.js`

- [ ] **Step 1: Add role management helpers**
Implement `getRole()`, `setRole(role)`, `renderDynamicNav()`, and `initRoleToggle()`.

- [ ] **Step 2: Add job storage & matching helper functions**
Implement `saveResumeLocal()`, `getResumeLocal()`, `postOpportunity()`, and `getOpportunities()`.

---

### Task 3: Seeker Funnel Enhancements (Map Offline Download, Progress Page, Dashboard Matching)

**Files:**
- Modify: `index.html`
- Modify: `seeker-dashboard.html`
- Modify: `resource-map.html`
- Create: `progress.html`

- [ ] **Step 1: Update `index.html` entry funnel**
Ensure clicking "I Need Help" sets role to `seeker` and navigates to `seeker-dashboard.html`; "I Want to Help" sets role to `volunteer` and navigates to `helper-dashboard.html`.

- [ ] **Step 2: Create `progress.html` (Starter Pack & Achievements)**
Build progress page with onboarding checklist, progress percentage bar, and milestone badges.

- [ ] **Step 3: Add Offline Download capability to `resource-map.html`**
Add "Offline Download" button saving map pins to `localStorage` and filter pins for Shelters, Food & Water, Restrooms & Showers, and Transit Hubs.

- [ ] **Step 4: Add AI Job Matches card to `seeker-dashboard.html`**
Render matched jobs from AI Matcher based on saved resume.

---

### Task 4: Helper Funnel & Opportunities Portal

**Files:**
- Modify: `helper-dashboard.html`
- Modify: `donate.html`
- Create: `opportunities.html`

- [ ] **Step 1: Create `opportunities.html`**
Build opportunity posting form for volunteers/employers and list posted jobs.

- [ ] **Step 2: Update `donate.html` with Tiered Direct Aid Cards**
Add direct aid options ("Deliver Food", "Transit Pass", "Starter Kit") alongside monetary donation options.

- [ ] **Step 3: Update `helper-dashboard.html`**
Add overview stats and quick link to `opportunities.html`.

---

### Task 5: End-to-End Verification

- [ ] **Step 1: Verify backend API endpoints with node test script**
- [ ] **Step 2: Verify role switching and dynamic nav across all pages**
- [ ] **Step 3: Verify AI Job Matcher workflow from Job posting to Seeker match**
