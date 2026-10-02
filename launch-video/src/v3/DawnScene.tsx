import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Star } from "../components";
import { C, clamp, easeInOut, fontFamily, TRACK, useT } from "../theme";

// S1: dawn gradient, the star rises, typewriter "help is closer|", luminance bloom to white.
export const DAWN_FRAMES = 45;

const TYPED = "help is closer";

export const DawnScene: React.FC = () => {
  const frame = useT();
  const horizon = interpolate(frame, [0, 45], [64, 82], { ...clamp, easing: easeInOut });
  const warm = interpolate(frame, [0, 45], [0.05, 0.5], clamp);
  const starY = interpolate(frame, [0, 30], [horizon - 8, 24], { ...clamp, easing: easeInOut });
  const chars = Math.floor(interpolate(frame, [8, 32], [0, TYPED.length], clamp));
  const caretOn = frame < 32 || Math.floor(frame / 4) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: C.navyDeep, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(interpolate(frame, [0, 45], [1, 1.05], clamp)) }}>
        <AbsoluteFill style={{ background: `linear-gradient(180deg, #070B18 0%, ${C.navy} 35%, ${C.night} 62%, #6B5A7A 80%, #E8A94A 100%)` }} />
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 38% at 50% ${horizon}%, rgba(255,229,138,0.95) 0%, rgba(255,212,59,0.55) 30%, rgba(243,180,60,0.18) 60%, rgba(243,180,60,0) 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `${horizon}%`,
            width: 5200,
            height: 5200,
            translate: "-50% 0",
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 8%, #1E2C4A 0%, ${C.navyDeep} 30%, #05070F 60%)`,
            boxShadow: "0 -10px 60px rgba(255,212,59,0.65), 0 -2px 0 rgba(255,244,194,0.9), inset 0 30px 80px rgba(255,212,59,0.35)",
          }}
        />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(255,247,209,${warm * 0.35}) 0%, rgba(255,241,201,${warm}) 100%)` }} />
        <Star size={interpolate(frame, [0, 30], [150, 96], clamp)} id="dawn3-star" style={{ left: "50%", top: `${starY}%`, translate: "-50% -50%", rotate: `${interpolate(frame, [0, 45], [-6, 8])}deg` }} />
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          top: "45%",
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 600,
          fontSize: 64,
          letterSpacing: TRACK,
          color: "#FFFFFF",
          whiteSpace: "pre",
        }}
      >
        {TYPED.slice(0, chars)}
        <span style={{ opacity: caretOn ? 1 : 0, fontWeight: 300, marginLeft: 2 }}>|</span>
      </div>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 55%, #FFFFFF 0%, #FFFDF3 60%, #FFF7D1 100%)",
          opacity: interpolate(frame, [38, 45], [0, 1], { ...clamp, easing: easeInOut }),
        }}
      />
    </AbsoluteFill>
  );
};
