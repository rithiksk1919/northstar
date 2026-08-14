# AI Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete AI Resume Builder feature for NorthStar, designed for individuals experiencing homelessness or employment gaps, using Express and `@google/genai` with `gemini-2.5-flash`.

**Architecture:** Express server (`server.js`) serving static files and exposing `POST /api/generate-resume` which uses official `@google/genai` SDK to query `gemini-2.5-flash` with structured system prompt and JSON schema. Mobile-first UI (`resume-builder.html`) fitting NorthStar's app frame ratio with a low-barrier wizard, live editing, ATS text copy, and PDF printing.

**Tech Stack:** Node.js, Express, `@google/genai`, `dotenv`, HTML5, Tailwind CSS, Vanilla JS.

## Global Constraints
- `GEMINI_API_KEY` read securely from `process.env.GEMINI_API_KEY`.
- Model: `gemini-2.5-flash`.
- SDK: `@google/genai`.
- Mobile App Frame ratio matching `app-frame` (`max-w-[420px]`).

---

### Task 1: Environment & Express Backend Setup

**Files:**
- Create: `package.json`
- Create: `.env`
- Create: `server.js`

- [ ] **Step 1: Create `package.json`**
Write `package.json` with dependencies `@google/genai`, `express`, and `dotenv`.

- [ ] **Step 2: Create `.env`**
Write `.env` containing `GEMINI_API_KEY` and `PORT=3000`.

- [ ] **Step 3: Create `server.js`**
Write `server.js` implementing Express server, static middleware, and `POST /api/generate-resume` endpoint calling `@google/genai` `gemini-2.5-flash`.

- [ ] **Step 4: Install dependencies**
Run `npm install`.

- [ ] **Step 5: Test backend API**
Test starting `server.js` and querying `POST /api/generate-resume` with test data.

---

### Task 2: Resume Builder Frontend Page & Wizard UI

**Files:**
- Create: `resume-builder.html`
- Modify: `js/northstar.js`
- Modify: `seeker-dashboard.html`

- [ ] **Step 1: Create `resume-builder.html`**
Build responsive mobile app frame with step wizard (Contact -> Experience -> Skills -> Target Roles), chip selection badges, text prompt input, and preview pane.

- [ ] **Step 2: Implement JS Logic in `js/northstar.js`**
Add step navigation, chip selection state, API call to `/api/generate-resume`, DOM injection of generated resume, inline editing handlers, plain text generator, and print handler.

- [ ] **Step 3: Link Resume Builder in `seeker-dashboard.html`**
Add quick action card and link to `resume-builder.html`.

- [ ] **Step 4: Verify end-to-end flow**
Launch server, navigate to `resume-builder.html`, complete wizard, generate resume, edit bullet points, copy clean text, and trigger PDF print preview.
