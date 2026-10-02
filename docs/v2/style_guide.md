# Style Guide — reference grammar (round 2)

Source: `refs/reference.mp4` (x.com/nizzyabi/status/2099883276072600000), 57.1 s, 1920×1080 @ 60 fps.
Studied from 114 frames at 0.5 s intervals in `refs/frames/` (frame `f_NNN` = `(NNN-1) × 0.5 s`).
Round 1 (the previous reference) is archived in `docs/v1/` and `refs/v1/`.

This file records **grammar only**. None of the reference's copy, product names, logos, people,
photos, or third-party app icons carry over.

---

## 1. Character in one line

A quiet product film: **an off-white field, a classic serif for the voice, a neutral sans for the product**. Everything arrives out of a heavy blur. Long continuous takes move through tilted 3D UI cards, and two or three **grainy analog film flashes** break up the clean chapters.

---

## 2. Structure

| Time | Chapter | Grammar |
|---|---|---|
| 0.0–2.0 | Title | One dot splits into two dots, which frame a serif line that blurs in word by word |
| 2.5–3.5 | Title swap | The line blurs out between the dots, and a new two-word line with an inline mark blurs in |
| 3.5–8.5 | Prompt | A wide prompt bar slides in from the right, blurred. Words type in with a blur. The camera pulls back and the bar becomes a dark chat bubble that drifts up-right. A "Thinking" shimmer plays, then a reply card writes on |
| 8.5–9.0 | Whiteout | Overexposed bloom to white |
| 9.0–16.0 | Configure | A form card tilted in 3D (rotateX about 25°, rotateZ about −4°) writes its text on, flattens out, then scrolls down to an accent button |
| 16.0–18.0 | Result | One message card writes on, then the camera pulls back to a moving wall of similar cards |
| 18.0–19.0 | **Analog flash** | Grainy, blurred, vignetted film photo, overexposed at the edges |
| 19.0–24.0 | List | A table of rows. A white pill highlight slides from row to row, and the camera pushes into one row |
| 24.0–33.5 | Process | A dark card scales up and tilts. A pixel-dither connector grows downward to a status row (icon + label), and labels blur-swap ("doing X…" → "found Y"). The stack pulls back and a white reply card writes on |
| 33.5–41.0 | Channel | A sans caption with an inline icon over a phone. The camera pushes into the phone and the messages pop in |
| 41.0–42.0 | **Analog flash** | A blurred portrait photo with a light leak; the first serif word ghosts in over it |
| 42.0–46.0 | Breadth | Serif `every ___  [icon track]  every ___`, with app tiles running on a curved vertical track between the two phrases |
| 46.0–51.0 | Uses | A sans slot roll: a fixed word plus a rolling list, with ghost words above and below fading at the edges |
| 51.0–57.0 | Lockup | Blur out, then mark + serif wordmark blur in. Long hold |

---

## 3. Palette (measured)

| Role | Hex | Notes |
|---|---|---|
| Field | `#F7F9F6` | Warm off-white with a faint green cast. Every chapter uses it, with no pure white |
| Card surface | `#FCFEFB` | Cards and highlight pills sit only slightly brighter than the field |
| Ink | `#000100` | True near-black for both serif and sans |
| Ghost | `#C7C9C6` | Inactive slot words and labels that haven't arrived |
| Dark card | `#1C1E1B` | The "input" object in the process chapter (warm black) |
| Accent 1 | `#0A76DB` | The single action color: send button, launch button |
| Accent 2 | `#512BF4` | Process icons and the dither connector |
| Analog flash | Desaturated teal `#2E5A6E` → orange `#F08A3C` highlights, milky white edges `#E9ECEA` | Only inside the film flashes |

**Rule:** the frame is almost monochrome. Accent colors appear only on **one interactive element at a time**.

---

## 4. Typography

| Voice | Family | Weight | Tracking | Use |
|---|---|---|---|---|
| **Serif** (brand voice) | High-contrast transitional serif (Baskerville/Garamond family) | Regular 400 | 0 (default) | Title lines, `every ___` lines, wordmark |
| **Sans** (product voice) | Neutral grotesk (Inter-like) | Regular 400, Medium 500 for bubbles | −1% | Prompt text, UI, captions, slot roll |

- Size: serif title about 3.4% of frame height (≈ 37 px at 1080p), very small and confident. The sans prompt text is about 2.4% (≈ 26 px). The slot roll is about 3.6% (≈ 38 px). Nothing is ever huge.
- Sentence case throughout. Lowercase labels inside the UI ("launch agent", "reading…").
- An inline mark or icon sits on the text baseline at cap height, like a glyph.
- **Framing dots** `•  title  •` are a recurring title device.

---

## 5. How text enters and exits

1. **Blur-in word by word** (the default for everything): each word goes from blur about 12 px and opacity 0 to sharp in about 0.35 s, with words 0.12–0.18 s apart. Words don't move; only blur and opacity change.
2. **Blur-out** (the default exit): the whole line, all at once, goes to blur about 16 px and opacity 0 in about 0.3 s.
3. **Write-on in cards:** paragraphs appear left to right, line by line. The trailing words of the current line show as ghost (`#C7C9C6`) until the "cursor" passes them.
4. **Status label swap:** the old label blurs out while the new label blurs in, in the same position, overlapping by about 0.15 s.
5. **Slot roll:** the fixed word stays in ink. The rolling column moves up one slot every 0.4–0.6 s. The active word is ink, neighbors are ghost, and ghosts fade to 0 within about 2 slots.
6. **Dot split:** a single dot holds for about 1 s, then splits horizontally into two dots, opening the space the title blurs into.

---

## 6. Shot lengths and rhythm

- **Long continuous takes**: about 11 chapters in 57 s, averaging about 5 s. Each chapter is one move, not a series of cuts.
- Title and type beats: 1.0–2.0 s. Product chapters: 4–9 s. **Analog flashes: 0.5–1.0 s.**
- Tempo: the opening is calm. It gets denser in the middle (process stepper, wall of cards) and calms down again for the closing type chapters.

---

## 7. Transitions

| Type | Use |
|---|---|
| **Blur dissolve** (out-blur about 30 px, then in-blur) | The default between chapters |
| **Overexposure / whiteout** | Into and out of a new environment (prompt → form) |
| **Analog film flash** | A 0.5–1 s texture break between product chapters |
| **Morph** | One object becomes the next (prompt bar → chat bubble) |
| **Pull-back to wall** | One card → many cards |
| **Push-through** | The camera pushes into a row or phone until it becomes the next scene |

No hard cuts between UI chapters and no slides or wipes.

---

## 8. Camera moves

- **3D tilt:** cards sit at rotateX 20–30° with a slight rotateZ and **straighten to flat** as they "settle". This is the signature move.
- **Slow dolly-in** of 2–5% on every hold.
- **Pull-back** from one element to a grid or wall.
- **Vertical pan or scroll** down forms and conversations.
- Easing is long, soft ease-in-out with no overshoot anywhere. Even the pill highlight glides.

---

## 9. Texture and grain

- **UI chapters:** perfectly clean. Depth comes from very soft, wide, low-opacity shadows under cards (≈ 0 20px 60px rgba(0,0,0,.06)) and depth-of-field blur on edges that fall away in 3D.
- **Analog flashes:** heavy film grain (visible at 1080p), soft focus, a vignette that **washes to milky white** rather than black, slight halation around highlights, and chroma noise.
- **Pixel dither:** the process connector is a column of small square dots in a dissolving dither pattern, the only "digital" texture.

---

## 10. Do / Don't

**Do:** blur-in everything · serif for voice, sans for product · one accent at a time · tilt-then-settle cards · long takes · analog flashes as punctuation.

**Don't:** use big headlines · use bold weights · hard-cut between UI chapters · bounce or overshoot · use more than one accent on screen · add grain on UI.
