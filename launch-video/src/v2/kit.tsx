import { loadFont as loadSerif } from "@remotion/google-fonts/EBGaramond";
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Star } from "../components";
import { clamp, fontFamily, ICON_FONT } from "../theme";

// Round-2 grammar (docs/style_guide.md): off-white field, serif voice + sans product, blur-in everything.
export const K = {
  field: "#F7F9F6",
  card: "#FFFFFF",
  ink: "#111111",
  ghost: "#C7C9C6",
  muted: "#737373",
  dark: "#111111",
  amber: "#FFD43B",
  navy: "#1B273E",
  leaf: "#1E7B45",
  leafLine: "#B9DEC6",
};

export const { fontFamily: serif } = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
export const sans = fontFamily;
export { ICON_FONT };

const soft = (t: number) => t * t * (3 - 2 * t);

/** Blur-in: 12px → 0 and opacity 0 → 1 over `dur` frames from `start`. */
export const blurIn = (frame: number, start: number, dur = 10, from = 12): React.CSSProperties => {
  const t = soft(interpolate(frame, [start, start + dur], [0, 1], clamp));
  return { opacity: t, filter: `blur(${(1 - t) * from}px)` };
};

/** Blur-out: whole element 0 → 16px and fades, over `dur` frames from `start`. */
export const blurOut = (frame: number, start: number, dur = 8, to = 16): React.CSSProperties => {
  const t = soft(interpolate(frame, [start, start + dur], [0, 1], clamp));
  return { opacity: 1 - t, filter: `blur(${t * to}px)` };
};

/** Merge an in and an out envelope on the same element. */
export const envelope = (frame: number, inAt: number, outAt: number, inDur = 10, outDur = 8): React.CSSProperties => {
  const a = soft(interpolate(frame, [inAt, inAt + inDur], [0, 1], clamp));
  const b = soft(interpolate(frame, [outAt, outAt + outDur], [0, 1], clamp));
  return { opacity: a * (1 - b), filter: `blur(${(1 - a) * 12 + b * 16}px)` };
};

export const Icon: React.FC<{ readonly name: string; readonly size: number; readonly color?: string; readonly style?: React.CSSProperties }> = ({
  name,
  size,
  color = K.ink,
  style,
}) => (
  <span
    style={{
      fontFamily: ICON_FONT,
      fontSize: size,
      lineHeight: 1,
      color,
      fontVariationSettings: "'FILL' 1",
      display: "inline-block",
      ...style,
    }}
  >
    {name}
  </span>
);

/**
 * Card write-on: words before the cursor are ink, the next few are ghost, the rest not yet there.
 * `progress` runs 0 → 1 across the whole text.
 */
export const WriteOn: React.FC<{ readonly text: string; readonly progress: number; readonly color?: string; readonly ghost?: string }> = ({
  text,
  progress,
  color = K.ink,
  ghost = K.ghost,
}) => {
  const words = text.split(" ");
  const cursor = progress * (words.length + 3);
  return (
    <>
      {words.map((w, i) => {
        const lead = cursor - i; // >3 ink, 0..3 ghost, <0 hidden
        const op = interpolate(lead, [0, 0.6], [0, 1], clamp);
        const ink = interpolate(lead, [2, 3], [0, 1], clamp);
        return (
          <span key={i} style={{ opacity: op, color: ink >= 1 ? color : ink <= 0 ? ghost : mix(ghost, color, ink) }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};

/** Animated film grain: fresh noise every frame. */
export const Grain: React.FC<{ readonly opacity?: number; readonly id: string }> = ({ opacity = 0.35, id }) => {
  const frame = useCurrentFrame();
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay" }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(random(`${id}-${frame}`) * 1000)} />
        <feColorMatrix type="saturate" values="0.15" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};

/**
 * Generated analog plate (no photography): a blurred amber star glow over dark dawn water,
 * grain, halation, and a vignette that washes to milky white. `closer` pushes in and warms it.
 */
export const AnalogPlate: React.FC<{ readonly closer?: boolean; readonly id: string }> = ({ closer = false, id }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 20], [1, 1.04], clamp);
  const s = closer ? 1.5 : 1;
  return (
    <AbsoluteFill style={{ background: "#2E5A6E", overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(drift * s), filter: "blur(5px) saturate(0.85)" }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #DDE6E6 0%, #8FB0BC 26%, #3F6E82 44%, #1E3D4E 60%, #12262F 100%)" }} />
        {/* Water streaks */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${10 + random(`w${i}`) * 50}%`,
              top: `${62 + i * 5}%`,
              width: `${20 + random(`l${i}`) * 30}%`,
              height: 6,
              borderRadius: 6,
              background: "rgba(150,190,205,0.35)",
              filter: "blur(4px)",
            }}
          />
        ))}
        {/* Amber glow and its reflection */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            width: 900,
            height: 520,
            translate: "-50% -50%",
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,226,150,0.95) 0%, rgba(240,138,60,0.75) 22%, rgba(240,138,60,0) 60%)",
            filter: "blur(18px)",
          }}
        />
        <Star size={closer ? 300 : 230} id={`${id}-star`} glow={1.6} style={{ left: "50%", top: "47%", translate: "-50% -50%", filter: "blur(9px)" }} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "66%",
            width: 420,
            height: 90,
            translate: "-50% -50%",
            background: "radial-gradient(ellipse, rgba(255,190,110,0.7) 0%, rgba(240,138,60,0) 70%)",
            filter: "blur(10px)",
          }}
        />
      </AbsoluteFill>
      {closer ? (
        // Light leak sweep
        <AbsoluteFill
          style={{
            background: `linear-gradient(100deg, rgba(255,120,40,0) ${interpolate(frame, [0, 12], [-20, 60])}%, rgba(255,140,60,0.55) ${interpolate(
              frame,
              [0, 12],
              [0, 80],
            )}%, rgba(255,120,40,0) ${interpolate(frame, [0, 12], [20, 100])}%)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      <Grain id={`${id}-grain`} opacity={0.55} />
      {/* Milky vignette (washes to white, not black) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(233,236,234,0) 45%, rgba(233,236,234,0.75) 85%, #E9ECEA 100%)" }} />
    </AbsoluteFill>
  );
};

/** Dither connector: a column of small squares that dissolves in as it grows (0 → 1). */
export const Dither: React.FC<{ readonly height: number; readonly grow: number; readonly id: string; readonly color?: string }> = ({
  height,
  grow,
  id,
  color = K.navy,
}) => {
  const cell = 7;
  const rows = Math.floor(height / cell);
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 3; c++) {
      const reveal = grow * rows - r;
      const keep = random(`${id}-${r}-${c}`) < 0.55 + 0.35 * (1 - Math.abs(c - 1));
      if (reveal <= 0 || !keep) continue;
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            left: c * cell,
            top: r * cell,
            width: cell - 2,
            height: cell - 2,
            background: color,
            opacity: interpolate(reveal, [0, 2], [0, 0.85], clamp),
          }}
        />,
      );
    }
  }
  return <div style={{ position: "relative", width: cell * 3, height }}>{cells}</div>;
};
