import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { lineStyle, wordStyle } from "../components";
import { C, clamp, easeInOut, easeOut, fontFamily } from "../theme";
import { LOCKUP_TILE_W } from "./GatherScene";
import { LogoTile } from "./LogoTile";

// S10: "Meet · [icon] · Northstar" → "Meet" falls away → icon + name, tagline below. Holds on the last frame.
export const LOCKUP_FRAMES = 54;

const SIZE = 84;
const GAP = 34;

export const LockupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 54], [1, 1.025], clamp);
  // Width-driven layout: the row re-centers itself as words open and collapse.
  const meetOpen = interpolate(frame, [0, 8, 24, 34], [0, 1, 1, 0], { ...clamp, easing: easeInOut });
  const nameOpen = interpolate(frame, [4, 13], [0, 1], { ...clamp, easing: easeInOut });
  const meetFade = interpolate(frame, [22, 30], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: C.field, scale: String(drift) }}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", ...lineStyle(SIZE) }}>
          <span style={{ display: "inline-block", overflow: "hidden", maxWidth: meetOpen * 260 }}>
            <span
              style={{
                display: "inline-block",
                paddingRight: GAP,
                ...(frame < 22 ? wordStyle(frame, 1) : { color: `rgba(17,17,17,${0.26 + 0.74 * meetFade})`, filter: `blur(${(1 - meetFade) * 4}px)` }),
              }}
            >
              Meet
            </span>
          </span>
          <LogoTile width={LOCKUP_TILE_W} />
          <span style={{ display: "inline-block", overflow: "hidden", maxWidth: nameOpen * 520 }}>
            <span style={{ display: "inline-block", paddingLeft: GAP, ...wordStyle(frame, 7) }}>Northstar</span>
          </span>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 540 + 120,
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 500,
          fontSize: 34,
          letterSpacing: "-0.015em",
          color: C.muted,
          opacity: interpolate(frame, [34, 44], [0, 1], { ...clamp, easing: easeOut }),
          translate: `0 ${interpolate(frame, [34, 44], [10, 0], { ...clamp, easing: easeOut })}px`,
        }}
      >
        Help is closer than you think.
      </div>
    </AbsoluteFill>
  );
};
