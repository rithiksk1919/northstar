import React from "react";
import { interpolate, Img, staticFile } from "remotion";
import { C, clamp, easeOut, fontFamily, SCREEN_H, SCREEN_W, STAR_PATH, TRACK } from "./theme";

/* ---------- Phone: a light, unbranded bezel around a real Northstar screen ---------- */

type PhoneProps = {
  readonly width: number;
  readonly bezelOpacity?: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

// Screen area keeps the app's 390x844 aspect; the bezel adds a top strip for the camera island.
export const phoneHeight = (width: number) => {
  const pad = width * 0.035;
  const screenW = width - pad * 2;
  return screenW * (SCREEN_H / SCREEN_W) + pad * 2 + width * 0.1;
};

export const Phone: React.FC<PhoneProps> = ({ width, bezelOpacity = 1, children, style }) => {
  const pad = width * 0.035;
  const top = width * 0.1;
  const screenW = width - pad * 2;
  const screenH = screenW * (SCREEN_H / SCREEN_W);
  return (
    <div
      style={{
        position: "absolute",
        width,
        height: screenH + pad * 2 + top,
        borderRadius: width * 0.14,
        background: C.field,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: width * 0.14,
          border: `${Math.max(2, width * 0.006)}px solid #E2E4E1`,
          boxShadow: `inset 0 0 0 ${width * 0.012}px #F7F8F6, 0 ${width * 0.07}px ${width * 0.16}px rgba(17,17,17,0.10)`,
          opacity: bezelOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: width * 0.035,
          width: width * 0.27,
          height: width * 0.068,
          translate: "-50% 0",
          borderRadius: width,
          background: "#1C1D22",
          opacity: bezelOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: pad,
          top: top + pad * 0.3,
          width: screenW,
          height: screenH,
          borderRadius: width * 0.09,
          overflow: "hidden",
          background: C.field,
        }}
      >
        {/* Children draw in app CSS px (390 wide) and are scaled to the screen. */}
        <div style={{ width: SCREEN_W, height: SCREEN_H, scale: String(screenW / SCREEN_W), transformOrigin: "0 0", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Screen: React.FC<{ readonly name: string; readonly style?: React.CSSProperties }> = ({ name, style }) => (
  <Img
    src={staticFile(`screens/${name}.png`)}
    style={{ position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, ...style }}
  />
);

/* ---------- Star: the four-point star from the Northstar mark, glossy ---------- */

export const Star: React.FC<{ readonly size: number; readonly id: string; readonly style?: React.CSSProperties; readonly glow?: number }> = ({
  size,
  id,
  style,
  glow = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 500 500"
    style={{
      position: "absolute",
      overflow: "visible",
      filter: `drop-shadow(0 0 ${size * 0.18 * glow}px rgba(255,212,59,${0.55 * glow}))`,
      ...style,
    }}
  >
    <defs>
      <linearGradient id={`${id}-g`} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#FFF4C2" />
        <stop offset="0.35" stopColor={C.starHi} />
        <stop offset="0.7" stopColor={C.star} />
        <stop offset="1" stopColor="#C98A12" />
      </linearGradient>
      <radialGradient id={`${id}-h`} cx="0.38" cy="0.3" r="0.35">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path d={STAR_PATH} fill={`url(#${id}-g)`} />
    <path d={STAR_PATH} fill={`url(#${id}-h)`} />
  </svg>
);

/* ---------- Ghost → ink word reveal (the workhorse text behavior) ---------- */

// Returns the style for a word that lands at `start` frames and takes `dur` frames.
export const wordStyle = (frame: number, start: number, dur = 7): React.CSSProperties => ({
  opacity: interpolate(frame, [start, start + 2], [0, 1], clamp),
  color: `rgba(17,17,17,${interpolate(frame, [start, start + dur], [0.26, 1], { ...clamp, easing: easeOut })})`,
  filter: `blur(${interpolate(frame, [start, start + dur], [4, 0], { ...clamp, easing: easeOut })}px)`,
});

export const lineStyle = (size: number): React.CSSProperties => ({
  fontFamily,
  fontWeight: 600,
  fontSize: size,
  letterSpacing: TRACK,
  color: C.ink,
  whiteSpace: "pre",
  lineHeight: 1.15,
});

/* ---------- Chat bubbles in Companion's own style ---------- */

export const UserPill: React.FC<{ readonly text: string; readonly style?: React.CSSProperties }> = ({ text, style }) => (
  <div
    style={{
      position: "absolute",
      right: 16,
      background: C.ink,
      color: "#fff",
      fontFamily,
      fontWeight: 600,
      fontSize: 15,
      letterSpacing: "-0.01em",
      padding: "10px 16px",
      borderRadius: 22,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text}
  </div>
);

export const CompanionBubble: React.FC<{ readonly text: string; readonly style?: React.CSSProperties }> = ({ text, style }) => (
  <div style={{ position: "absolute", left: 16, display: "flex", gap: 8, alignItems: "flex-end", ...style }}>
    <div style={{ width: 26, height: 26, borderRadius: 13, background: C.navy, position: "relative", flexShrink: 0 }}>
      <Star size={16} id="avatar" glow={0.3} style={{ left: 5, top: 5 }} />
    </div>
    <div>
      <div style={{ fontFamily, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Companion</div>
      <div
        style={{
          background: C.sand,
          color: C.ink,
          fontFamily,
          fontWeight: 500,
          fontSize: 15,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          padding: "10px 14px",
          borderRadius: 18,
          borderBottomLeftRadius: 6,
          width: 236,
        }}
      >
        {text}
      </div>
    </div>
  </div>
);
