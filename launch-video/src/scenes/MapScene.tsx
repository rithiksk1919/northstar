import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { lineStyle, Phone, phoneHeight, Screen, Star, wordStyle } from "../components";
import { C, clamp, easeInOut, ICON_FONT } from "../theme";

// S5: phone shifts left onto the real map; amber pins drop and little stars float up (the energy spike).
export const MAP_FRAMES = 42;

const PHONE_W = 430;
const PH = phoneHeight(PHONE_W);
const spring = Easing.bezier(0.34, 1.5, 0.64, 1);

const PINS = [
  { x: 118, y: 150, d: 6 },
  { x: 262, y: 118, d: 8 },
  { x: 305, y: 232, d: 10 },
  { x: 86, y: 262, d: 12 },
  { x: 205, y: 205, d: 14 },
];

const FLOATERS = [
  { x: 1090, y: 700, dx: 520, dy: -760, s: 70, d: 10 },
  { x: 1010, y: 560, dx: 780, dy: -520, s: 46, d: 13 },
  { x: 1130, y: 820, dx: 640, dy: -900, s: 56, d: 15 },
  { x: 960, y: 460, dx: 900, dy: -380, s: 40, d: 17 },
  { x: 1060, y: 640, dx: 420, dy: -820, s: 80, d: 19 },
  { x: 990, y: 760, dx: 820, dy: -700, s: 44, d: 21 },
];

export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 10], [0, -250], { ...clamp, easing: easeInOut });
  const drift = interpolate(frame, [0, 42], [1, 1.025], clamp);

  return (
    <AbsoluteFill style={{ background: C.field, scale: String(drift) }}>
      <Phone width={PHONE_W} style={{ left: 960 - PHONE_W / 2 + shift, top: 540 - PH / 2 + 20 }}>
        <Screen name="map" />
        {PINS.map((p, i) => {
          const t = interpolate(frame, [p.d, p.d + 9], [0, 1], { ...clamp, easing: spring });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: p.x - 17,
                top: p.y - 34,
                fontFamily: ICON_FONT,
                fontSize: 34,
                lineHeight: 1,
                color: C.amber,
                fontVariationSettings: "'FILL' 1",
                textShadow: "0 0 1px #111, 0 2px 6px rgba(17,17,17,0.35)",
                opacity: Math.min(1, t * 2),
                translate: `0 ${(1 - t) * -40}px`,
              }}
            >
              location_on
            </div>
          );
        })}
      </Phone>

      {FLOATERS.map((f, i) => {
        const t = interpolate(frame, [f.d, f.d + 22], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.2, 0.4, 1) });
        const vel = interpolate(frame, [f.d, f.d + 4, f.d + 22], [0, 1, 0.2], clamp);
        return (
          <Star
            key={i}
            id={`float-${i}`}
            size={f.s}
            glow={0.6}
            style={{
              left: f.x + f.dx * t + shift * 0.2,
              top: f.y + f.dy * t,
              opacity: interpolate(frame, [f.d, f.d + 3, f.d + 18, f.d + 22], [0, 1, 1, 0], clamp),
              scale: String(interpolate(frame, [f.d, f.d + 6], [0.3, 1], { ...clamp, easing: spring })),
              rotate: `${t * 90 * (i % 2 ? 1 : -1)}deg`,
              filter: `blur(${vel * 5}px)`,
            }}
          />
        );
      })}

      <div style={{ position: "absolute", left: 1010, top: 300, ...lineStyle(72) }}>
        <span style={wordStyle(frame, 12)}>Near </span>
        <span style={wordStyle(frame, 17)}>you</span>
      </div>
    </AbsoluteFill>
  );
};
