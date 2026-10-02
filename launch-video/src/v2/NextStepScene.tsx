import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut } from "../theme";
import { blurIn, blurOut, Dither, Icon, K, sans, WriteOn } from "./kit";

// S6: dark card (what Sam has done) → dither connector → status rows blur-swap → pull back to a real gig card.
export const NEXT_FRAMES = 90;

const NOTE = "I've done warehouse work and moving jobs.";

const StatusRow: React.FC<{ readonly icon: string; readonly a: string; readonly b: string; readonly at: number; readonly swap: number }> = ({
  icon,
  a,
  b,
  at,
  swap,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, height: 64, ...blurIn(frame, at, 8) }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: K.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={32} color="#FFFFFF" />
      </div>
      <div style={{ display: "grid", fontFamily: sans, fontWeight: 500, fontSize: 36, letterSpacing: "-0.015em", color: K.ink }}>
        <span style={{ gridArea: "1 / 1", ...blurOut(frame, swap, 6) }}>{a}</span>
        <span style={{ gridArea: "1 / 1", ...blurIn(frame, swap + 2, 8) }}>{b}</span>
      </div>
    </div>
  );
};

export const NextStepScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: easeOut });
  const back = interpolate(frame, [70, 86], [0, 1], { ...clamp, easing: easeInOut });

  return (
    <AbsoluteFill style={{ background: K.field, perspective: 1800 }}>
      <div
        style={{
          position: "absolute",
          left: 550,
          top: 110,
          width: 820,
          transformOrigin: "50% 0%",
          scale: String(interpolate(back, [0, 1], [1, 0.78])),
          translate: `0 ${back * -40}px`,
        }}
      >
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 26, color: K.muted, marginBottom: 18, textAlign: "center", ...blurIn(frame, 0, 8) }}>
          Resume
        </div>
        {/* Dark card */}
        <div
          style={{
            background: K.dark,
            borderRadius: 30,
            padding: "34px 40px",
            color: "#FFFFFF",
            fontFamily: sans,
            boxShadow: "0 30px 70px rgba(17,17,17,0.18)",
            scale: String(interpolate(enter, [0, 1], [0.6, 1])),
            transform: `rotateX(${interpolate(enter, [0, 1], [22, 0])}deg)`,
            rotate: `${interpolate(enter, [0, 1], [-2.5, 0])}deg`,
            ...blurIn(frame, 0, 10, 20),
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>What work have you done?</div>
          <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.35, letterSpacing: "-0.015em" }}>
            <WriteOn text={NOTE} progress={interpolate(frame, [10, 28], [0, 1], clamp)} color="#FFFFFF" ghost="#5A5C5A" />
          </div>
        </div>

        <div style={{ paddingLeft: 40 + 19 }}>
          <Dither id="d1" height={70} grow={interpolate(frame, [28, 36], [0, 1], clamp)} />
        </div>
        <div style={{ paddingLeft: 40 }}>
          <StatusRow icon="description" a="writing your resume…" b="resume ready" at={34} swap={48} />
        </div>
        <div style={{ paddingLeft: 40 + 19 }}>
          <Dither id="d2" height={56} grow={interpolate(frame, [54, 60], [0, 1], clamp)} />
        </div>
        <div style={{ paddingLeft: 40 }}>
          <StatusRow icon="work" a="matching gigs near you…" b="8 listings open" at={58} swap={66} />
        </div>
      </div>

      {/* Real listing from opportunities.html, in the app's card style */}
      <div
        style={{
          position: "absolute",
          left: 610,
          top: 770,
          width: 700,
          background: K.card,
          borderRadius: 26,
          padding: "26px 32px",
          fontFamily: sans,
          boxShadow: "0 20px 60px rgba(17,17,17,0.07), 0 0 0 1px rgba(17,17,17,0.05)",
          ...blurIn(frame, 74, 10, 18),
          translate: `0 ${interpolate(frame, [74, 86], [30, 0], { ...clamp, easing: easeOut })}px`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", color: K.ink }}>Get Paid to Lift</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: K.ink }}>
            $25.00 / hr <span style={{ fontSize: 20, fontWeight: 500, color: K.muted }}>Cash</span>
          </div>
        </div>
        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: `2px solid ${K.leafLine}`, color: K.leaf, fontSize: 20, fontWeight: 600 }}>
          <Icon name="check" size={20} color={K.leaf} /> No ID needed
        </div>
      </div>

      <AbsoluteFill style={{ background: "#FFFFFF", opacity: interpolate(frame, [85, 90], [0, 1], { ...clamp, easing: easeInOut }) }} />
    </AbsoluteFill>
  );
};
