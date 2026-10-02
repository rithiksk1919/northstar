# Shotlist — Northstar launch film

**Format:** 15.0 s · 16:9 · 1920×1080 · 30 fps (450 frames) · Remotion
**Style:** the grammar in [`style_guide.md`](style_guide.md), with Northstar's own palette, type, logo and screens.
**Story:** *Tonight → next month.* Northstar gets you a bed tonight and helps you toward a job.

---

## Northstar translation of the grammar

| Reference grammar | Northstar version |
|---|---|
| Dusk gradient bookends (World A) | **Night-to-dawn gradient**: logo navy `#1B273E` at the top, amber `#FFD43B` dawn glow at a curved horizon |
| Glossy sphere hero object | The **four-point star** from `assets/brand/northstar-mark.svg` (`#F3B43C`), glossy with soft bloom |
| Objects gather into the mark | Three stars (big plus two small, as in the app icon) settle into place, then match-cut to the icon tile |
| Field `#FEFFFD` / ink `#161815` | Northstar field `#FFFFFF` / ink `#111111` (`css/app.css` tokens) |
| Ghost ink | `#111111` at 30% (≈ `#B8B8B8`); matches `--muted #737373` family |
| Neo-grotesk, Medium 500, −2.5% | **Plus Jakarta Sans 600**, tracking −0.025em (the app's real font; 600 compensates for Jakarta's lighter color) |
| Assistant avatar (gradient dot) | A small amber star dot, Companion's avatar |
| Floating reactions (hearts) | **Amber map pins and little stars** rising with a spring |
| Emoji glyph scramble | **Material Symbols** glyphs from `assets/fonts/` (bed, restaurant, work, wifi_off) |
| Accent color | Only from the screens and the amber `#FFD43B`; the frame never adds color |

**Assets (all real, all ours):**
- Logo tile: `assets/brand/northstar-logo.png` (navy tile, amber stars, white house)
- Star shape: the amber path in `assets/brand/northstar-mark.svg`
- Screens: captured from the running app at 390×844 (phone viewport), with seeded demo data, from
  `companion.html`, `seeker-dashboard.html`, `resource-map.html`, `opportunities.html`,
  `resume-builder.html`, `call-shelter.html`
- Phone frame: a drawn light bezel (no Apple/Android hardware marks)

---

## Shots

Timecodes are `seconds` (frames at 30 fps).

### S1 · Open: dawn (0.00–1.50 · f0–45) · World A
- **Picture:** full-bleed gradient. Navy `#1B273E` at the top blends into `#2A3A66` and meets a curved horizon glowing amber `#FFD43B` → `#F3B43C`, with a warm haze `#FFF7D1` just above the curve. The glossy four-point star sits on the horizon, half reflected in it.
- **Camera:** slow crane up. The horizon drops from 62% to 78% of frame height, the frame gets lighter, and the star rises slightly.
- **Type:** `Introducing` (Jakarta 600, 44 px, white at 90%) blurs in at 0.5 s (blur 20 px → 0, 0.4 s) at 45% height.
- **Out:** hard cut on the same palette to S2.

### S2 · Tagline (1.50–3.20 · f45–96) · World A
- **Picture:** the same gradient, now higher and hazier; the star is small at the top center.
- **Type, part 1 (1.50–2.30):** typewriter `help is closer|` with thin caret, 13 characters per second, white, 48 px, centered.
- **Type, part 2 (2.30–3.00):** hard switch to oversized `than you think`, 100 px, tinted `#FFE58A` with a soft glow. Each word blur-ins (20 px → 0, scale 1.04 → 1.00), 0.15 s apart.
- **Camera:** push-in 1.00 → 1.05.
- **Out (3.00–3.20):** luminance bloom. Haze fills the frame to `#FFFFFF`.

### S3 · Ask (3.20–4.40 · f96–132) · World C (tight)
- **Picture:** pure white. A black user pill on the right types in: `is there a bed open tonight?`
- **0.4 s later:** a Companion bubble (`#F2F2F2`, 18 px radius) with the amber star dot as avatar: `Two shelters near you are open all night.`
- **Camera:** starts at scale 1.6, centered on the bubbles, and drifts in 2%.
- **Type behavior:** each bubble springs up (y +12 px → 0) with a single overshoot.

### S4 · Pull back to phone (4.40–5.80 · f132–174) · World C
- **Move:** pull back 1.6 → 1.0 (0.6 s, ease-out). A light phone bezel resolves around the bubbles; it is the real `companion.html` screen with those bubbles in it.
- **5.10:** the screen scrolls up to a real card from `seeker-dashboard.html`, **"Shelters open all night"**, and the camera pushes 8% into it.
- **Shadow:** soft phone drop shadow (0 30 px 60 px, 10% black).

### S5 · Map (5.80–7.20 · f174–216) · World C
- **Picture:** the phone slides to left of center (−220 px, eased). Its screen hard-cuts to `resource-map.html` with real map tiles.
- **Energy spike (6.10–6.80):** amber pins drop onto the map with staggered springs, and 5–6 small amber stars float up out of the phone and off the right edge with motion blur. This is the "reactions" beat.
- **Caption:** `Near you`, 28 px, ink, top third, right of the phone, with a ghost → ink reveal.

### S6 · Word roll (7.20–9.20 · f216–276) · Worlds B+C
- **Picture:** hero word in ink, 125 px, at 22% height. Below it is a ghost column. The phone is centered on top, covering the middle of the words.
- **Roll (4 slots, 0.5 s each, spring-free ease-in-out):**
  1. `beds` → phone shows `resource-map.html`, a shelter's detail sheet
  2. `meals` → `seeker-dashboard.html`, a food/meal place in "Near you"
  3. `gigs` → `opportunities.html`, the Listings screen
  4. `resumes` → `resume-builder.html`, "What work have you done?"
- On each roll, the new top word goes ghost → ink as it lands, and the old one slides up and out of frame.

### S7 · Tonight → next month (9.20–11.00 · f276–330) · World B
- **Picture:** white, nothing else.
- **9.20–9.90:** word reveal `A bed tonight.`, 52 px, centered, ghost → ink, 0.2 s per word.
- **Hold 0.3 s**, with a 2% drift.
- **10.20–10.55:** partial dissolve. `A` stays; `bed tonight.` breaks into dither/noise and blows off to the right.
- **10.55–11.00:** `job next month.` writes on with the ghost → ink reveal. `A` does not move.

### S8 · Works offline (11.00–12.20 · f330–366) · World B
- **Type:** `No signal? Still works.`
- **11.00–11.40:** letters of `No signal?` scramble through Material Symbols glyphs (`bed`, `restaurant`, `work`, `wifi_off`, `call`) before settling.
- **11.60:** `Still works.` appends in ghost → ink, and the line re-centers as it grows.
- Claim backed by the real "Save places for offline / Opens without internet" feature on `seeker-dashboard.html`.

### S9 · Stars gather (12.20–13.20 · f366–396) · World A (short)
- **Picture:** hard cut back to the dawn gradient (brighter than S1, closer to amber).
- **Move:** the big star and two small stars drift in from the edges and settle into the exact layout from the app icon.
- **13.00–13.20:** the navy background tightens into a rounded tile (radius about 22%) with the gradient falling away to white. Match-cut into the icon tile of S10.

### S10 · Lockup (13.20–15.00 · f396–450) · World B
- **13.20–14.00:** `Meet` · **[northstar-logo.png tile, 96 px, soft shadow]** · `Northstar`, Jakarta 600, 52 px, ghost → ink left to right.
- **14.00–14.40:** `Meet` fades to ghost and falls away, and the tile and `Northstar` slide together to center.
- **14.40–15.00:** hold with a 2% drift. `Help is closer than you think.` fades in below in `--muted #737373`, 24 px.
- **End:** hold the last frame (no fade to black).

---

## Rhythm check

| Shot | Length | Role |
|---|---|---|
| S1 | 1.50 | Slow open |
| S2 | 1.70 | Tagline |
| S3 | 1.20 | Say (as chat) |
| S4 | 1.40 | Show |
| S5 | 1.40 | Show + energy spike |
| S6 | 2.00 | Breadth (4 × 0.5 s pulse) |
| S7 | 1.80 | Story beat |
| S8 | 1.20 | Proof |
| S9 | 1.00 | Bookend return |
| S10 | 1.80 | Lockup |
| **Total** | **15.00** | 10 shots, average 1.5 s (the reference's rhythm compressed to about 60% of its average shot length) |

---

## Open questions for you

1. **End card URL:** the repo doesn't list a public domain. Should the lockup add one, as the reference does with its URL beat?
2. **Chat copy in S3:** `is there a bed open tonight?` → `Two shelters near you are open all night.` is demo copy in the voice of the app's own strings. OK, or do you want real Companion output?
3. **Demo data:** the screens will be captured with seeded, fictional places and listings, with no real people or addresses. OK?
4. **Sound:** silent, or should I leave a slot for a music track?
