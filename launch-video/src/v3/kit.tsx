import React from "react";
import { Easing, interpolate, random } from "remotion";
import { clamp, ICON_FONT } from "../theme";

/** Tap cue (style guide §11d: no hands): a soft ripple plus a pressed darken, centered on (x, y). */
export const Ripple: React.FC<{ readonly frame: number; readonly at: number; readonly x: number; readonly y: number; readonly size?: number; readonly dark?: boolean }> = ({
  frame,
  at,
  x,
  y,
  size = 70,
  dark = false,
}) => {
  const t = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (frame < at || t >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: dark ? "rgba(255,255,255,0.55)" : "rgba(17,17,17,0.22)",
        scale: String(0.3 + t * 1.2),
        opacity: 1 - t,
        pointerEvents: "none",
      }}
    />
  );
};

/** Pressed state: scale down slightly for 4 frames from `at`. */
export const pressed = (frame: number, at: number) => String(interpolate(frame, [at, at + 2, at + 6], [1, 0.95, 1], clamp));

// The guide's arrow, exactly as expo-app/guideScript.js draws it (64px, yellow, 4px ink stroke).
const ARROW = "M22 4h20v28h14L32 60 8 32h14z";

/** Bouncing arrow (nsBounce: 14px), pointing down at (x, y). Drawn in app px. */
export const GuideArrow: React.FC<{ readonly frame: number; readonly x: number; readonly y: number; readonly opacity?: number }> = ({ frame, x, y, opacity = 1 }) => {
  const bounce = (1 - Math.cos((frame / 20) * Math.PI * 2)) / 2; // 0..1, ~0.67s period
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      style={{
        position: "absolute",
        left: x - 32,
        top: y - 64 - 6 - bounce * 14,
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,.35))",
        opacity,
        overflow: "visible",
      }}
    >
      <path d={ARROW} fill="#FFD43B" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
};

/** Ring around the target (nsPulse): 4px #FFD43B, radius 14, pulsing glow. Box in app px. */
export const GuideRing: React.FC<{ readonly frame: number; readonly box: { x: number; y: number; w: number; h: number }; readonly opacity?: number }> = ({
  frame,
  box,
  opacity = 1,
}) => {
  const p = (frame % 30) / 30;
  const pad = 6;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x - pad,
        top: box.y - pad,
        width: box.w + pad * 2,
        height: box.h + pad * 2,
        border: "4px solid #FFD43B",
        borderRadius: 14,
        boxShadow: `0 0 0 ${p * 20}px rgba(255,212,59,${0.85 * (1 - p)})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

/* ---------- Energy spike: Northstar's own glossy icon tiles burst around the frame edges ---------- */

type Tile = { icon: string; x: number; y: number; s: number; tone: "amber" | "navy" | "white"; r: number };

// Positions in frame px; the center stays clear for the "You applied!" card.
const TILES: Tile[] = [
  { icon: "bed", x: 250, y: 190, s: 170, tone: "amber", r: -14 },
  { icon: "star", x: 600, y: 90, s: 110, tone: "navy", r: 10 },
  { icon: "restaurant", x: 1330, y: 120, s: 140, tone: "white", r: 12 },
  { icon: "work", x: 1690, y: 260, s: 180, tone: "amber", r: -10 },
  { icon: "shower", x: 170, y: 760, s: 150, tone: "white", r: 16 },
  { icon: "description", x: 520, y: 950, s: 120, tone: "navy", r: -8 },
  { icon: "payments", x: 1420, y: 960, s: 130, tone: "amber", r: 9 },
  { icon: "check_circle", x: 1740, y: 780, s: 150, tone: "navy", r: -16 },
];

// 9:16 reel: tiles live in the bands above and below the phone, plus the narrow side margins.
const REEL_TILES: Tile[] = [
  { icon: "bed", x: 190, y: 170, s: 170, tone: "amber", r: -14 },
  { icon: "star", x: 545, y: 95, s: 110, tone: "navy", r: 10 },
  { icon: "restaurant", x: 900, y: 190, s: 150, tone: "white", r: 12 },
  { icon: "work", x: 105, y: 980, s: 130, tone: "amber", r: -10 },
  { icon: "shower", x: 975, y: 840, s: 130, tone: "white", r: 16 },
  { icon: "description", x: 200, y: 1770, s: 140, tone: "navy", r: -8 },
  { icon: "payments", x: 560, y: 1835, s: 120, tone: "amber", r: 9 },
  { icon: "check_circle", x: 900, y: 1740, s: 160, tone: "navy", r: -16 },
];

const TONES = {
  amber: { bg: "linear-gradient(145deg, #FFF0A8 0%, #FFD43B 45%, #E9A80F 100%)", fg: "#111111" },
  navy: { bg: "linear-gradient(145deg, #3A4C80 0%, #1B273E 55%, #0B1122 100%)", fg: "#FFD43B" },
  white: { bg: "linear-gradient(145deg, #FFFFFF 0%, #F2F2F2 60%, #DADDD9 100%)", fg: "#111111" },
};

export const Burst: React.FC<{ readonly frame: number; readonly at: number; readonly hold?: number; readonly reel?: boolean }> = ({ frame, at, hold = 10, reel = false }) => {
  if (frame < at) return null;
  const spring = Easing.bezier(0.34, 1.5, 0.64, 1);
  return (
    <>
      {(reel ? REEL_TILES : TILES).map((t, i) => {
        const d = at + i * 1;
        const inT = interpolate(frame, [d, d + 8], [0, 1], { ...clamp, easing: spring });
        const outT = interpolate(frame, [at + hold + 8, at + hold + 15], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
        // Direction away from the frame center, for both the entry offset and the exit.
        const dx = t.x - (reel ? 540 : 960);
        const dy = t.y - (reel ? 960 : 540);
        const len = Math.hypot(dx, dy) || 1;
        const push = (1 - inT) * 120 + outT * 700;
        const vel = Math.max(1 - Math.min(inT, 1), outT);
        const tone = TONES[t.tone];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: t.x - t.s / 2 + (dx / len) * push,
              top: t.y - t.s / 2 + (dy / len) * push,
              width: t.s,
              height: t.s,
              borderRadius: t.s * 0.24,
              background: tone.bg,
              boxShadow: `inset 0 ${t.s * 0.04}px ${t.s * 0.06}px rgba(255,255,255,0.6), 0 ${t.s * 0.12}px ${t.s * 0.25}px rgba(17,17,17,0.22)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scale: String(0.6 + 0.4 * Math.min(inT, 1.1)),
              rotate: `${t.r + (1 - inT) * 25 * (random(`b${i}`) > 0.5 ? 1 : -1)}deg`,
              opacity: Math.min(1, inT * 2) * (1 - outT),
              filter: `blur(${vel * 6}px)`,
            }}
          >
            <span style={{ fontFamily: ICON_FONT, fontSize: t.s * 0.52, lineHeight: 1, color: tone.fg, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
          </div>
        );
      })}
    </>
  );
};
