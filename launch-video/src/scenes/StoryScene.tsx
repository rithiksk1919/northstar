import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { lineStyle, wordStyle } from "../components";
import { C, clamp, easeOut } from "../theme";

// S7: "A bed tonight." → the ending dissolves into grain → "A job next month." ("A" never moves).
export const STORY_FRAMES = 54;

const SIZE = 84;
const FIRST = ["bed ", "tonight."];
const SECOND = ["job ", "next ", "month."];

export const StoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 54], [1, 1.03], clamp);
  const dis = interpolate(frame, [29, 40], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ background: C.field, justifyContent: "center", alignItems: "center", scale: String(drift) }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="grain-dissolve" x="-20%" y="-60%" width="160%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={dis * 90} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* The hidden final line sizes the box, so "A" sits where the finished line is centered. */}
      <div style={{ position: "relative", ...lineStyle(SIZE) }}>
        <span style={{ visibility: "hidden" }}>{"A " + SECOND.join("")}</span>
        <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
          <span style={wordStyle(frame, 0)}>{"A "}</span>
          <div style={{ position: "relative", display: "flex" }}>
            <div
              style={{
                display: "flex",
                filter: dis > 0 ? "url(#grain-dissolve)" : undefined,
                opacity: interpolate(dis, [0, 0.35, 1], [1, 0.8, 0], clamp),
                translate: `${dis * 120}px 0`,
              }}
            >
              {FIRST.map((w, i) => (
                <span key={w} style={dis > 0 ? { color: C.ink } : wordStyle(frame, 5 + i * 6)}>
                  {w}
                </span>
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
              {SECOND.map((w, i) => (
                <span key={w} style={wordStyle(frame, 38 + i * 5)}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
