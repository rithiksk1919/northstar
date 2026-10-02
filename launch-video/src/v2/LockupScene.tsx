import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LogoTile } from "../scenes/LogoTile";
import { clamp } from "../theme";
import { blurIn, K, sans, serif } from "./kit";

// S9: logo tile + serif wordmark blur in together, tagline under it; hold on the last frame.
export const LOCKUP2_FRAMES = 45;

export const LockupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 45], [1, 1.02], clamp);
  return (
    <AbsoluteFill style={{ background: K.field, justifyContent: "center", alignItems: "center", scale: String(drift) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, ...blurIn(frame, 0, 12, 18) }}>
        <LogoTile width={78} />
        <span style={{ fontFamily: serif, fontSize: 84, color: K.ink, lineHeight: 1 }}>Northstar</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 540 + 82,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 28,
          letterSpacing: "-0.01em",
          color: K.muted,
          ...blurIn(frame, 18, 10),
        }}
      >
        Help is closer than you think.
      </div>
    </AbsoluteFill>
  );
};
