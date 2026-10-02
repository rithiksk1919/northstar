import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LogoTile } from "../scenes/LogoTile";
import { clamp, easeInOut } from "../theme";
import { blurIn, blurOut, K, serif } from "./kit";

// S1 + S2: one dot splits into two that frame the serif title; the title swaps between them.
export const TITLE_FRAMES = 69;

const SIZE = 46;
const Dot: React.FC = () => <div style={{ width: 9, height: 9, borderRadius: 5, background: K.ink, flexShrink: 0 }} />;
const Mark: React.FC = () => <LogoTile width={SIZE * 0.95} style={{ boxShadow: "none", translate: "0 6px" }} />;

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const split = interpolate(frame, [15, 28], [0, 1], { ...clamp, easing: easeInOut });
  const drift = interpolate(frame, [0, 69], [1, 1.03], clamp);
  const t1Out = blurOut(frame, 41, 7);

  const word = (start: number, out?: React.CSSProperties) => {
    const a = blurIn(frame, start, 10);
    return out ? { opacity: (a.opacity as number) * (out.opacity as number), filter: `${a.filter} ${out.filter}` } : a;
  };

  return (
    <AbsoluteFill style={{ background: K.field, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", scale: String(drift), ...blurOut(frame, 62, 7) }}>
        <Dot />
        {/* Both titles share one grid cell, so the dots open to the wider one and never move. */}
        <div style={{ display: "grid", overflow: "hidden", maxWidth: split * 760, padding: `0 ${split * 30}px` }}>
          <div
            style={{
              gridArea: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.28em",
              fontFamily: serif,
              fontSize: SIZE,
              color: K.ink,
              whiteSpace: "nowrap",
            }}
          >
            <span style={word(19, t1Out)}>Introducing</span>
            <span style={word(24, t1Out)}>Northstar</span>
            <span style={word(29, t1Out)}>
              <Mark />
            </span>
          </div>
          <div
            style={{
              gridArea: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.28em",
              fontFamily: serif,
              fontSize: SIZE,
              color: K.ink,
              whiteSpace: "nowrap",
            }}
          >
            <span style={blurIn(frame, 47, 10)}>Help</span>
            <span style={blurIn(frame, 51, 10)}>
              <Mark />
            </span>
            <span style={blurIn(frame, 55, 10)}>Tonight</span>
          </div>
        </div>
        <div style={{ marginLeft: -9 * (1 - split) }}>
          <Dot />
        </div>
      </div>
    </AbsoluteFill>
  );
};
