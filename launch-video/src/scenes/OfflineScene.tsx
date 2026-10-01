import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { lineStyle, wordStyle } from "../components";
import { C, clamp, easeInOut, ICON_FONT } from "../theme";

// S8: "No signal?" scrambles through Northstar's own icons, then "Still works." appends and the line re-centers.
export const OFFLINE_FRAMES = 36;

const SIZE = 84;
const HEAD = "No signal?";
const ICONS = ["bed", "restaurant", "work", "wifi_off", "call", "shower", "map", "home"];

export const OfflineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 36], [1, 1.03], clamp);
  const tail = interpolate(frame, [16, 26], [0, 1], { ...clamp, easing: easeInOut });

  return (
    <AbsoluteFill style={{ background: C.field, justifyContent: "center", alignItems: "center", scale: String(drift) }}>
      <div style={{ display: "flex", ...lineStyle(SIZE) }}>
        <span style={{ display: "flex" }}>
          {HEAD.split("").map((ch, i) => {
            const settle = 3 + i * 0.8;
            const scrambling = frame < settle && ch !== " ";
            const icon = ICONS[Math.floor(random(`g${i}-${Math.floor(frame / 2)}`) * ICONS.length)];
            return (
              <span key={i} style={{ position: "relative", opacity: interpolate(frame, [i * 0.6 - 1, i * 0.6 + 1], [0, 1], clamp) }}>
                <span style={{ visibility: scrambling ? "hidden" : "visible" }}>{ch === " " ? " " : ch}</span>
                {scrambling ? (
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "52%",
                      translate: "-50% -50%",
                      fontFamily: ICON_FONT,
                      fontSize: SIZE * 0.6,
                      fontWeight: 400,
                      letterSpacing: 0,
                      color: i % 3 === 0 ? "#C99A00" : C.ink,
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {icon}
                  </span>
                ) : null}
              </span>
            );
          })}
        </span>
        {/* Growing width re-centers the whole line as the second clause lands. */}
        <span style={{ display: "inline-block", overflow: "hidden", maxWidth: tail * 560, whiteSpace: "pre" }}>
          <span style={wordStyle(frame, 18)}>{" Still "}</span>
          <span style={wordStyle(frame, 22)}>works.</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
