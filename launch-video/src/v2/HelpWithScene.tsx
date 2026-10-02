import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeInOut } from "../theme";
import { blurIn, blurOut, Icon, K, sans } from "./kit";

// S8: "help with" fixed + rolling column of what Northstar finds; ghosts fade within two slots.
export const HELP_FRAMES = 57;

const ITEMS = [
  { w: "beds", icon: "bed" },
  { w: "meals", icon: "restaurant" },
  { w: "showers", icon: "shower" },
  { w: "gigs", icon: "work" },
  { w: "resumes", icon: "description" },
];
const ROLLS = [11, 22, 33, 44];
const SLOT = 78;

export const HelpWithScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pos = ROLLS.reduce((a, r) => a + interpolate(frame, [r, r + 8], [0, 1], { ...clamp, easing: easeInOut }), 0);
  const drift = interpolate(frame, [0, 57], [1, 1.03], clamp);
  const env = { ...blurIn(frame, 0, 8), ...(frame > 49 ? blurOut(frame, 50, 7) : {}) };

  return (
    <AbsoluteFill style={{ background: K.field, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, scale: String(drift), translate: "-110px 0", ...env }}>
        <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 64, letterSpacing: "-0.02em", color: K.ink }}>help with</div>
        <div style={{ position: "relative", width: 400, height: SLOT }}>
          {ITEMS.map((it, i) => {
            const d = i - pos;
            const act = interpolate(Math.abs(d), [0, 0.7], [1, 0], clamp);
            return (
              <div
                key={it.w}
                style={{
                  position: "absolute",
                  left: 0,
                  top: d * SLOT,
                  height: SLOT,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 64,
                  letterSpacing: "-0.02em",
                  color: act > 0.5 ? K.ink : K.ghost,
                  opacity: interpolate(Math.abs(d), [0, 1.2, 2.2], [1, 0.9, 0], clamp),
                  filter: `blur(${interpolate(Math.abs(d), [1.2, 2.2], [0, 4], clamp)}px)`,
                }}
              >
                <Icon name={it.icon} size={46} color={act > 0.5 ? "#D9A800" : K.ghost} />
                {it.w}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
