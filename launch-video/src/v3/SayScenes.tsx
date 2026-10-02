import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { lineStyle, wordStyle } from "../components";
import { C, clamp, easeOut, useT } from "../theme";

const SIZE = 84;
const FIRST = ["bed ", "tonight."];
const SECOND = ["job ", "tomorrow."];

// The hidden final line sizes the box, so "A" sits where the finished "A job tomorrow." is centered.
const Line: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "relative", ...lineStyle(SIZE) }}>
    <span style={{ visibility: "hidden" }}>{"A " + SECOND.join("")}</span>
    <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>{children}</div>
  </div>
);

// S2: "A bed tonight." ghost → ink.
export const SAY_FRAMES = 27;
export const SayScene: React.FC = () => {
  const frame = useT();
  return (
    <AbsoluteFill style={{ background: C.field, justifyContent: "center", alignItems: "center", scale: String(interpolate(frame, [0, 27], [1, 1.02], clamp)) }}>
      <Line>
        <span style={wordStyle(frame, 0)}>{"A "}</span>
        {FIRST.map((w, i) => (
          <span key={w} style={wordStyle(frame, 4 + i * 5)}>
            {w}
          </span>
        ))}
      </Line>
    </AbsoluteFill>
  );
};

// S5: the same line returns; "bed tonight." dissolves into grain; "job tomorrow." writes on. "A" never moves.
export const TURN_FRAMES = 30;
export const TurnScene: React.FC = () => {
  const frame = useT();
  const dis = interpolate(frame, [3, 13], [0, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill style={{ background: C.field, justifyContent: "center", alignItems: "center", scale: String(interpolate(frame, [0, 30], [1.02, 1.04], clamp)) }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="turn-grain" x="-20%" y="-60%" width="160%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={dis * 90} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <Line>
        <span>{"A "}</span>
        <div style={{ position: "relative", display: "flex" }}>
          <div
            style={{
              display: "flex",
              filter: dis > 0 ? "url(#turn-grain)" : undefined,
              opacity: interpolate(dis, [0, 0.35, 1], [1, 0.8, 0], clamp),
              translate: `${dis * 120}px 0`,
            }}
          >
            {FIRST.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
            {SECOND.map((w, i) => (
              <span key={w} style={wordStyle(frame, 12 + i * 5)}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </Line>
    </AbsoluteFill>
  );
};
