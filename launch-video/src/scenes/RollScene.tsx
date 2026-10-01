import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Phone, Screen } from "../components";
import { C, clamp, easeInOut, fontFamily } from "../theme";

// S6: vertical word roll with the phone on top; each word swaps the real screen underneath.
export const ROLL_FRAMES = 60;

const WORDS = ["beds", "meals", "gigs", "resumes", "showers", "Wi-Fi", "rides"];
// One screen per rolled word, in the same order. `y` scrolls the capture to the relevant part.
const SCREENS: { name: string; y: number }[] = [
  { name: "map", y: 0 },
  { name: "dashboard", y: 0 },
  { name: "gigs", y: 0 },
  { name: "resume", y: 0 },
];
const ROLLS = [14, 29, 44];
const ROLL_DUR = 8;
const LINE = 168;
const TOP = 205;

export const RollScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pos = ROLLS.reduce(
    (acc, r) => acc + interpolate(frame, [r, r + ROLL_DUR], [0, 1], { ...clamp, easing: easeInOut }),
    0,
  );
  const drift = interpolate(frame, [0, 60], [1, 1.03], clamp);

  return (
    <AbsoluteFill style={{ background: C.field, scale: String(drift), overflow: "hidden" }}>
      {WORDS.map((w, i) => {
        const d = i - pos;
        const inkAmt = interpolate(Math.abs(d), [0, 0.6], [1, 0], clamp);
        return (
          <div
            key={w}
            style={{
              position: "absolute",
              width: "100%",
              top: TOP + d * LINE,
              translate: "0 -50%",
              textAlign: "center",
              fontFamily,
              fontWeight: 600,
              fontSize: 158,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: `rgba(17,17,17,${0.2 + 0.8 * inkAmt})`,
              opacity: interpolate(d, [-1.2, -0.6], [0, 1], clamp),
            }}
          >
            {w}
          </div>
        );
      })}

      <Phone width={520} style={{ left: 960 - 260, top: 330 }}>
        {SCREENS.map((s, i) => (
          <div
            key={s.name + i}
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(pos, [i - 0.55, i - 0.4, i + 0.4, i + 0.55], [0, 1, 1, 0], clamp),
            }}
          >
            <Screen name={s.name} style={{ top: s.y }} />
          </div>
        ))}
      </Phone>
    </AbsoluteFill>
  );
};
