import React from "react";
import { AbsoluteFill, interpolate, Interactive, useCurrentFrame } from "remotion";
import { Star } from "../components";
import { C, clamp, easeInOut, easeOut, fontFamily, TRACK } from "../theme";

// S1 + S2: dawn gradient, "Introducing", typewriter tagline, oversized blur line, bloom to white.
export const OPEN_FRAMES = 96;

const TYPED = "help is closer";
const BIG = ["than", "you", "think"];

export const OpenScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Crane up: the horizon sinks and the sky warms.
  const horizon = interpolate(frame, [0, 96], [60, 84], { ...clamp, easing: easeInOut });
  const warm = interpolate(frame, [0, 96], [0.0, 0.55], clamp);
  const push = interpolate(frame, [45, 96], [1, 1.05], clamp);

  // Star rises from the horizon, then parks small at the top for the tagline.
  const starY = interpolate(frame, [0, 40, 58], [horizon - 9, 27, 16], { ...clamp, easing: easeInOut });
  const starSize = interpolate(frame, [0, 40, 58], [150, 120, 80], { ...clamp, easing: easeInOut });

  const typedChars = Math.floor(interpolate(frame, [46, 68], [0, TYPED.length], clamp));
  const caretOn = frame < 69 && (frame < 68 || Math.floor(frame / 4) % 2 === 0);

  return (
    <AbsoluteFill style={{ background: C.navyDeep, overflow: "hidden" }}>
      <AbsoluteFill style={{ scale: String(push) }}>
        {/* Sky */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, #070B18 0%, ${C.navy} 35%, ${C.night} 62%, #6B5A7A 80%, #E8A94A 100%)`,
          }}
        />
        {/* Dawn glow sitting on the horizon */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 38% at 50% ${horizon}%, rgba(255,229,138,0.95) 0%, rgba(255,212,59,0.55) 30%, rgba(243,180,60,0.18) 60%, rgba(243,180,60,0) 100%)`,
          }}
        />
        {/* Planet edge */}
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
            boxShadow: `0 -10px 60px rgba(255,212,59,0.65), 0 -2px 0 rgba(255,244,194,0.9), inset 0 30px 80px rgba(255,212,59,0.35)`,
          }}
        />
        {/* Haze lifts the whole frame toward white as the camera rises */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, rgba(255,247,209,${warm * 0.35}) 0%, rgba(255,241,201,${warm}) 100%)`,
          }}
        />

        <Star
          size={starSize}
          id="open-star"
          style={{ left: "50%", top: `${starY}%`, translate: "-50% -50%", rotate: `${interpolate(frame, [0, 96], [-6, 10])}deg` }}
        />
        {/* Soft reflection under the horizon, only while the star sits on it */}
        <Star
          size={starSize}
          id="open-star-r"
          glow={0.2}
          style={{
            left: "50%",
            top: `${horizon + 8}%`,
            translate: "-50% -50%",
            scale: "1 -0.6",
            opacity: interpolate(frame, [0, 40, 50], [0.35, 0.25, 0], clamp),
            filter: "blur(6px)",
          }}
        />
      </AbsoluteFill>

      {/* "Introducing" — blur in */}
      <Interactive.Div
        name="Introducing"
        style={{
          position: "absolute",
          top: "47%",
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 600,
          fontSize: 56,
          letterSpacing: TRACK,
          color: "rgba(255,255,255,0.92)",
          opacity: frame < 45 ? interpolate(frame, [12, 24], [0, 1], clamp) : 0,
          filter: `blur(${interpolate(frame, [12, 26], [20, 0], { ...clamp, easing: easeOut })}px)`,
        }}
      >
        Introducing
      </Interactive.Div>

      {/* Typewriter with caret */}
      <Interactive.Div
        name="Typewriter"
        style={{
          position: "absolute",
          top: "44%",
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 600,
          fontSize: 60,
          letterSpacing: TRACK,
          color: "#FFFFFF",
          whiteSpace: "pre",
          opacity: frame >= 45 && frame < 69 ? 1 : 0,
        }}
      >
        {TYPED.slice(0, typedChars)}
        <span style={{ opacity: caretOn ? 1 : 0, fontWeight: 300, marginLeft: 2 }}>|</span>
      </Interactive.Div>

      {/* Oversized blur-in line */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: "0.26em",
          fontFamily,
          fontWeight: 600,
          fontSize: 150,
          letterSpacing: "-0.035em",
          color: C.starHi,
          textShadow: "0 0 50px rgba(255,212,59,0.55)",
          opacity: frame >= 69 ? 1 : 0,
          scale: String(interpolate(frame, [69, 96], [1, 1.04], clamp)),
        }}
      >
        {BIG.map((w, i) => {
          const s = 69 + i * 4;
          return (
            <span
              key={w}
              style={{
                opacity: interpolate(frame, [s, s + 6], [0, 1], clamp),
                filter: `blur(${interpolate(frame, [s, s + 9], [20, 0], { ...clamp, easing: easeOut })}px)`,
                scale: String(interpolate(frame, [s, s + 9], [1.04, 1], { ...clamp, easing: easeOut })),
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* Luminance bloom into the white world */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 55%, #FFFFFF 0%, #FFFDF3 60%, #FFF7D1 100%)",
          opacity: interpolate(frame, [88, 95], [0, 1], { ...clamp, easing: easeInOut }),
        }}
      />
    </AbsoluteFill>
  );
};
