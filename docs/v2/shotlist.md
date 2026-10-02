# Shotlist — Northstar launch film (round 2)

**Format:** 15.0 s · 16:9 · 1920×1080 · 30 fps (450 frames) · silent · Remotion
**Style:** the grammar in [`style_guide.md`](style_guide.md), with Northstar's own logo, screens, data and colors.
**Story:** *Ask → find a bed → get toward work.* One person, one night, one next step.

---

## Northstar translation of the grammar

| Reference grammar | Northstar version |
|---|---|
| Off-white field `#F7F9F6` | Same field value (very close to the app's white; the app UI cards sit on it as `#FFFFFF`) |
| Ink `#000100` | Northstar ink `#111111` |
| Ghost `#C7C9C6` | `#C7C9C6` (matches the app's `--line`/muted family) |
| Accent 1 (action) | **Amber `#FFD43B`**, Northstar's one signature color, used on one element at a time |
| Accent 2 (process) | Navy `#1B273E` from the logo tile |
| Dark card `#1C1E1B` | Northstar ink `#111111` card |
| Serif brand voice | **EB Garamond 400** (open-license Google Font), used only for title, flash word and wordmark |
| Sans product voice | **Plus Jakarta Sans 500** (the app's real font), for everything in the product |
| Inline engraving mark | The **Northstar logo tile** (`assets/brand/northstar-logo.png`) at cap height |
| Analog film flashes (stock photos) | **Our own generated plates**: a blurred amber star glow over dark water at dawn, made procedurally with grain, halation and a milky-white vignette. No photographs |
| Third-party app icons on a track | Not used. Northstar's own Material Symbols (bed, restaurant, shower, work, description) instead |

**Real assets:** logo tile · `companion.html` input bar and chat styles · `seeker-dashboard.html` "Shelter open all night" card and "Near you" rows (Downtown Emergency Service Center, YouthCare Orion Center, Compass Center Hygiene Center) · `opportunities.html` gig card ("Get Paid to Lift…", $25.00/hr, No ID needed) · `resume-builder.html` step screen. Screens are already captured in `launch-video/public/screens/`; rows and cards are rebuilt as vector UI using the app's own tokens so the text stays sharp in 3D tilt.

---

## Shots

### S1 · Dot → title (0.00–1.40 · f0–42)
- Field `#F7F9F6`. A single 8 px ink dot sits at center.
- **0.50:** the dot splits into two dots that slide apart (ease-in-out, 0.4 s).
- **0.65–1.20:** between them, serif `Introducing Northstar [logo tile]` blurs in word by word (12 px → 0, 0.15 s apart), 40 px.
- Camera: dolly-in 1.00 → 1.02.

### S2 · Title swap (1.40–2.30 · f42–69)
- The line blurs out between the dots (0.25 s).
- `Help [logo tile] Tonight` blurs in, serif, same size. The dots stay put.
- **2.15–2.30:** everything blurs out together.

### S3 · Ask (2.30–5.00 · f69–150)
- **2.30:** a wide Companion input bar (white `#FFFFFF`, pill, soft shadow, placeholder "Ask Companion") slides in from the right with blur, 70% of the frame wide.
- **2.50–3.40:** sans words blur in L→R: `Is there a bed open near me tonight?`. The **amber** send button (black arrow) fades in at the end.
- **3.50–3.90:** pull back. The bar shrinks and **morphs** into Companion's black user pill, which drifts up-right.
- **3.90–4.20:** a `• • • Thinking` shimmer label at left, in ghost.
- **4.20–5.00:** a white reply card writes on line by line, with the trailing words in ghost:
  `Yes — Downtown Emergency Service Center is open 24/7.`
  `It's 0.3 mi from you.`
  (Real place and hours from the app's data.)

### S4 · Analog flash #1 (5.00–5.50 · f150–165)
- Overexposed bloom into a **generated plate**: dark teal water, a blurred amber four-point star glow just above the horizon, heavy grain, halation, and a milky-white vignette. Slight drift.
- It exits by washing out to the field.

### S5 · Near you (5.50–8.20 · f165–246)
- A vector rebuild of the dashboard's **"Near you"** list as a table of rows (icon · name · distance · type): Downtown Emergency Service Center · YouthCare Orion Center · Compass Center Hygiene Center · Get Paid to Lift.
- Enters **tilted** (rotateX 24°, rotateZ −3°) and straightens to flat over 1.2 s, with a dolly-in.
- **6.80–7.80:** a white pill highlight glides from row 1 → row 2 → row 1. The row it rests on gets a tiny **amber** "Open now" chip.
- **7.80–8.20:** the camera pushes into row 1, then blurs into a dissolve.

### S6 · Next step (8.20–11.20 · f246–336)
- The title `Resume` (sans, small, ghost → ink) sits above a **dark card** (`#111111`) that scales up from small, tilted, then settles. Card text writes on, in white:
  `I've done warehouse work and moving jobs.`
- **9.20:** a navy pixel-dither connector grows down from the card to a status row: [Material `description` icon on a navy tile] `writing your resume…` (blur-in).
- **9.90:** the label blur-swaps to `resume ready`.
- **10.20:** the connector extends to the next row: [`work` icon] `matching gigs near you…` → `8 listings open`.
- **10.60–11.20:** pull back. A white gig card writes on under the stack: **Get Paid to Lift**, `$25.00 / hr · Cash`, and the green "No ID needed" chip (real listing, real styling).

### S7 · Analog flash #2 (11.20–11.60 · f336–348)
- A second generated plate (the star glow, closer, more orange, with a light-leak sweep). The serif word `every` ghosts in over it at left.

### S8 · Help with… (11.60–13.50 · f348–405)
- Sans slot roll on the field: the fixed word `help with` in ink, plus a rolling column:
  `beds` → `meals` → `showers` → `gigs` → `resumes`
- Moves one slot every 0.36 s (soft ease-in-out). Ghost neighbors `#C7C9C6` fade out within 2 slots. Each word carries its Material icon at its left, small, in ghost (amber when active).
- **13.30–13.50:** the whole roll blurs out.

### S9 · Lockup (13.50–15.00 · f405–450)
- The logo tile and serif wordmark `Northstar` blur in together (0.4 s), 44 px.
- **14.10:** the sans line `Help is closer than you think.` blurs in below, in ghost → ink-muted `#737373`, 22 px.
- Dolly-in 1.00 → 1.02 and hold on the last frame.

---

## Rhythm check

| Shot | Length | Role |
|---|---|---|
| S1 | 1.40 | Title |
| S2 | 0.90 | Title swap |
| S3 | 2.70 | Long take: ask → answer |
| S4 | 0.50 | Analog break |
| S5 | 2.70 | Long take: tilt-settle list |
| S6 | 3.00 | Long take: process stack |
| S7 | 0.40 | Analog break |
| S8 | 1.90 | Breadth |
| S9 | 1.50 | Lockup |
| **Total** | **15.00** | 9 shots; product takes about 2.8 s (the reference's 5 s compressed to fit 15 s) |

---

## Open questions

1. **Serif:** Northstar's brand uses only Plus Jakarta Sans. The reference's look depends on a serif voice, so I'd add **EB Garamond** just for the title, flash word and wordmark. OK, or should I keep everything in Jakarta?
2. **Accent:** I swapped the reference's blue action color for Northstar amber. OK?
3. **The S6 resume line** ("I've done warehouse work and moving jobs.") is demo copy I wrote for a fictional user. OK?
4. **Round-one film:** this will be a **new composition** next to the existing `NorthstarLaunch` in `launch-video/`, so nothing gets lost. OK?
