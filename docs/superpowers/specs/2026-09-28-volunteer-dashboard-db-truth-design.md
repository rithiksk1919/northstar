# Design Specification: Volunteer Dashboard — Database as Single Source of Truth

**Date**: 2026-09-28  
**Status**: Approved (incl. temporary-row claim test)  
**Decisions already made**: Scope = fix live app + rewrite `VolunteerDashboard.jsx`; Claim path = guarded server endpoint (Option A).

## Overview
The volunteer dashboard must show exactly what is in Supabase: open food pickups, the volunteer's own active pickups, and the signed-in account. No cached or hardcoded fallbacks, no double claims, and a stable avatar across reloads and tab switches.

Facts this design is built on (verified against the live project):
- Pickups live in table **`deliveries`** (`food_donations` does not exist). Claimed = `status: 'driver_assigned'` + `driver_id`, `driverName`, `claimed_at`.
- Auth is the localStorage session `northstar_session` (`{ id, username, full_name, role }`), not Supabase Auth.
- The live page is `helper-dashboard.html` + `js/northstar.js`. `VolunteerDashboard.jsx` is not mounted (no JSX build pipeline).

---

## 1. Server — `server.js`
**Rule:** when Supabase is configured, delivery endpoints use the database only. The in-memory `activeDeliveries` array is used only when Supabase is not configured.

| Endpoint | Change |
|---|---|
| `GET /api/deliveries` | Return DB rows even when `[]`. DB error → `502 { success: false, error }`. |
| `GET /api/deliveries/:id` | Not in DB → `404`. DB error → `502`. |
| `POST /api/deliveries/:id/claim` | Require `driver_id` (`400` otherwise). One atomic `update(...).eq('id', id).eq('status', 'pending_driver').select()`. Row returned → `200`. No row → `404` if the delivery is missing, else `409 { error: 'already_claimed' }`. |
| `POST /api/deliveries`, `POST /api/deliveries/:id/status` | DB error → `502` instead of silently writing to memory. |
| `seedSupabaseTablesIfEmpty()` | Seed demo deliveries only when `SEED_DEMO_DELIVERIES=true`. Jobs seeding unchanged. |

## 2. Live page — `helper-dashboard.html`, `js/northstar.js`, `donate.html`
- **One queue renderer.** Delete the inline `renderVolunteerFoodDonationsQueue` override in `helper-dashboard.html` (its filter shows already-claimed rows). Keep the on-load call.
- **`fetchUnifiedDeliveries()`** returns API rows as-is (including `[]`) and throws on HTTP/network errors. Remove the localStorage-cache and hardcoded `del_101`–`del_103` fallbacks.
- **Queue renderer** (`northstar.js`):
  - Skeleton on first load → error card with Retry → empty state → cards for `status === 'pending_driver'` only.
  - Escape all DB-sourced text (currently injected raw into `innerHTML`, a stored-XSS risk).
  - Ignore stale responses when several refreshes overlap.
- **`claimAndTrackDelivery(id, button)`**: ignores repeat clicks while in flight; button shows "Claiming…" and is disabled.
  - `200` → open tracker + refresh.
  - `409` → inline "Already claimed" on that card + refresh (no tracker).
  - Other errors → inline "Couldn't claim — tap to retry".
  - Feedback is inline because `showNotification` toasts are disabled app-wide.
- **Refetch triggers:** after claims/status changes, on tab focus (`visibilitychange`), after instant tab transitions, and on cross-tab `storage` signals. `notifyDeliveriesChanged()` no longer renders twice per call.
- **Active Transport Route card:** hides when there is no active job; re-runs after claims and tab transitions.
- **Avatar:** re-run `renderAccountHeaderAvatar()` after instant tab transitions (today the swapped-in header reverts to the static "V") and when `northstar_session` changes in another tab.
- **`donate.html` "Available Deliveries" modal:** shares `fetchUnifiedDeliveries()`, so catch its errors and show an inline error; escape DB text.

## 3. React component — `src/views/VolunteerDashboard.jsx` (complete rewrite)
- **Props:** `supabase` (default `window.supabaseClient`), `user` (optional), `apiBaseUrl` (default `''`), `donationsList`, `activeTab`, `onTabChange`, `onPostJob`, `onDonate`, `onViewAllPickups`, `onOpenChatbot`, `onOpenSettings`, `onPickupClaimed(delivery)`. Removed: `foodDonations`, `onClaimPickup` (the component owns its data now).
- **Session:** `user` prop → `supabase.auth.getSession()` → `localStorage.northstar_session`. Refreshes on `storage`, window focus, and `onAuthStateChange`.
- **Avatar initial:** first character of `user_metadata.full_name` → `full_name` → `username` → `email` → `'V'`, uppercased.
- **User status:** `profiles.select('id, username, role')` for the session id. Never selects `pass_hash`.
- **Data** (two parallel queries, explicit columns):
  - Open: `deliveries` where `status = 'pending_driver'`, newest first.
  - Mine: `deliveries` where `driver_id = me` and `status in ('driver_assigned', 'in_transit')`.
- **Queue filter pills:** **Available** / **My pickups**, with counts. After a claim the item leaves Available and appears in My pickups labelled "Claimed" or "In transit".
- **Claim:** `POST {apiBaseUrl}/api/deliveries/:id/claim`. Per-item loading + disabled button. `409` → inline "Already claimed" + refetch. Other errors → inline message. Success → local state update, `onPickupClaimed`, background refetch.
- **Live updates:** Supabase Realtime subscription on `deliveries` (harmless if Realtime is not enabled for the table) + refetch on focus.
- **States:** skeleton rows, error banner with Retry, per-filter empty state, `aria-live` status text. Missing Supabase client → error state, never mock data.
- **Unchanged:** `h-32` action cards, equal-weight action buttons, FAB `fixed bottom-16 right-4`, dark-mode contrast classes, `VolunteerBottomNav`. "Post a Job" / "Donate" call their handler if provided, else navigate to `opportunities.html` / `donate.html`.
- **DONATIONS total** stays prop-driven: no donations table exists.

---

## Out of Scope
- Auth/login flows and job-seeker pages (locked).
- `profiles.pass_hash` being readable with the public key, and RLS lock-down of `deliveries` writes — recommended follow-up.
- Mounting the JSX (needs a build pipeline) and deleting existing demo rows from the database.

## Impacted Files
- `server.js` — delivery endpoints, claim guard, seed gating.
- `js/northstar.js` — fetch, queue renderer, claim, refetch triggers, avatar re-render.
- `helper-dashboard.html` — remove inline override; Active Route card hide/refresh.
- `donate.html` — modal error handling + escaping.
- `src/views/VolunteerDashboard.jsx` — rewrite.

## Verification Plan
1. `node --check` on `server.js` and `js/northstar.js`; bundle `VolunteerDashboard.jsx` with the installed Vite/Rolldown to catch syntax and import errors.
2. Start a second server on port 3099 (the running :3000 server is untouched) and curl:
   - `GET /api/deliveries` → exactly the rows in the database.
   - Claim `del_101` (already `driver_assigned`) → `409`, row unchanged.
   - With approval: insert a temporary `del-verify-*` row, claim → `200`, claim again → `409`, then delete it.
3. The running `npm start` process must be restarted to pick up `server.js` changes.
