import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut } from "../theme";
import { blurIn, Icon, K, sans, WriteOn } from "./kit";

// S3: Companion input bar → words blur in → pull back and morph into the user pill → Thinking → reply writes on.
export const ASK2_FRAMES = 81;

const QUESTION = "Is there a bed open near me tonight?";
const REPLY = "Yes — Downtown Emergency Service Center is open 24/7. It's 0.3 mi from you.";

const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

export const AskScene: React.FC = () => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: easeOut });
  const m = interpolate(frame, [36, 50], [0, 1], { ...clamp, easing: easeInOut });
  const words = QUESTION.split(" ");

  // Bar geometry morphs into the black pill (center-based).
  const w = lerp(m, 1340, 520);
  const h = lerp(m, 104, 66);
  const cx = lerp(m, 960, 1270) + (1 - slide) * 320;
  const cy = lerp(m, 540, 330);
  const fg = m < 0.5 ? K.ink : "#FFFFFF";

  return (
    <AbsoluteFill style={{ background: K.field }}>
      <div
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: h / 2,
          background: m < 0.5 ? K.card : K.ink,
          boxShadow: `0 20px 60px rgba(17,17,17,${0.07 * (1 - m)}), 0 0 0 1px rgba(17,17,17,${0.05 * (1 - m)})`,
          display: "flex",
          alignItems: "center",
          padding: `0 ${lerp(m, 40, 26)}px`,
          gap: 18,
          opacity: slide,
          filter: `blur(${(1 - slide) * 20}px)`,
        }}
      >
        <div
          style={{
            flex: 1,
            fontFamily: sans,
            fontWeight: 500,
            fontSize: lerp(m, 36, 24),
            letterSpacing: "-0.01em",
            color: fg,
            whiteSpace: "nowrap",
            textAlign: m < 0.5 ? "left" : "center",
          }}
        >
          {words.map((wd, i) => (
            <span key={i} style={m > 0 ? {} : blurIn(frame, 7 + i * 3, 8)}>
              {wd}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
        {/* Amber send button, the only accent on screen */}
        <div
          style={{
            height: 68,
            borderRadius: 34,
            overflow: "hidden",
            background: K.amber,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            ...blurIn(frame, 30, 6),
            opacity: interpolate(frame, [30, 35, 36, 40], [0, 1, 1, 0], clamp),
            width: lerp(m, 68, 0),
          }}
        >
          <Icon name="arrow_upward" size={36} />
        </div>
      </div>

      {/* Thinking shimmer */}
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 400,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 22,
          color: K.ghost,
          opacity: interpolate(frame, [48, 52, 57, 61], [0, 1, 1, 0], clamp),
          backgroundImage: `linear-gradient(90deg, ${K.ghost} 0%, ${K.ink} ${interpolate(frame, [48, 60], [0, 100])}%, ${K.ghost} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        • • • Thinking
      </div>

      {/* Reply card writes on */}
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 395,
          width: 780,
          background: K.card,
          borderRadius: 26,
          padding: "30px 36px",
          boxShadow: "0 20px 60px rgba(17,17,17,0.06), 0 0 0 1px rgba(17,17,17,0.04)",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 32,
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
          ...blurIn(frame, 57, 8),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, fontSize: 20, color: K.muted, fontWeight: 600 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: K.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="star" size={18} color={K.amber} />
          </div>
          Companion
        </div>
        <WriteOn text={REPLY} progress={interpolate(frame, [59, 78], [0, 1], clamp)} />
      </div>

      {/* Overexposure into the analog flash */}
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: interpolate(frame, [75, 81], [0, 1], { ...clamp, easing: easeInOut }) }} />
    </AbsoluteFill>
  );
};
