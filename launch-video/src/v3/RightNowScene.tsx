import React from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";
import { lineStyle, Phone, phoneHeight, Screen, wordStyle } from "../components";
import { C, clamp, easeInOut, easeOut, fontFamily, ICON_FONT, useT } from "../theme";
import { pressed, Ripple } from "./kit";

// S3 + S4 (one take): tight on the real "Right now" card → pull back to the dashboard → tap Get directions →
// real directions (Bus 36, leave at 10:13 PM) → route draws on the map → departure chip + "Even by bus."
export const RIGHTNOW_FRAMES = 108;

// Phone geometry for 16:9 or the 9:16 reel. In the reel the phone is bigger and moves up instead of left,
// so the caption and departure chip sit underneath it.
const layout = (W: number, H: number) => {
  const reel = H > W;
  const PHONE_W = reel ? 640 : 430;
  const PH = phoneHeight(PHONE_W);
  const LEFT0 = W / 2 - PHONE_W / 2;
  const TOP = reel ? (H - PH) / 2 : H / 2 - PH / 2 + 20;
  const K = (PHONE_W - PHONE_W * 0.07) / 390;
  const SX = PHONE_W * 0.035;
  const SY = PHONE_W * 0.1 + PHONE_W * 0.035 * 0.3;
  // App px (390x844) → frame px for the phone at its starting position.
  const at = (x: number, y: number) => `${LEFT0 + SX + x * K}px ${TOP + SY + y * K}px`;
  return {
    reel,
    PHONE_W,
    LEFT0,
    TOP,
    at,
    move: reel ? { x: 0, y: -170 } : { x: -250, y: 0 },
    caption: reel ? { left: 0, top: TOP - 170 + PH + 40, width: W, align: "center" as const } : { left: 1010, top: 330 },
    chip: reel ? { left: W / 2, top: TOP - 170 + PH + 150, center: true } : { left: 1010, top: 470, center: false },
  };
};

const CARD = { x: 195, y: 295 }; // "Right now" card center (measured from the capture)
const GO = { x: 113, y: 366 }; // "Get directions" button center
const spring = Easing.bezier(0.34, 1.45, 0.64, 1);

export const RightNowScene: React.FC = () => {
  const frame = useT();
  const { width: W, height: H } = useVideoConfig();
  const L = layout(W, H);
  const pull = interpolate(frame, [0, 14, 32], [1.6, 1.63, 1], { ...clamp, easing: [Easing.linear, easeOut] });
  const bezel = interpolate(frame, [16, 30], [0, 1], { ...clamp, easing: easeOut });
  const toMap = interpolate(frame, [46, 51], [0, 1], clamp);
  const shift = interpolate(frame, [56, 68], [0, 1], { ...clamp, easing: easeInOut });
  const route = interpolate(frame, [72, 88], [0, 1], { ...clamp, easing: easeInOut });
  const chip = interpolate(frame, [82, 92], [0, 1], { ...clamp, easing: spring });

  return (
    <AbsoluteFill style={{ background: C.field }}>
      <AbsoluteFill style={{ scale: String(pull), transformOrigin: L.at(CARD.x, CARD.y) }}>
        <Phone width={L.PHONE_W} bezelOpacity={bezel} style={{ left: L.LEFT0 + shift * L.move.x, top: L.TOP + shift * L.move.y }}>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - toMap }}>
            <Screen name="dashboard" />
            {/* Pressed state on Get directions */}
            <div
              style={{
                position: "absolute",
                left: GO.x - 88,
                top: GO.y - 21,
                width: 176,
                height: 42,
                borderRadius: 21,
                background: "rgba(17,17,17,0.25)",
                opacity: interpolate(frame, [40, 42, 46], [0, 1, 0], clamp),
                scale: pressed(frame, 40),
              }}
            />
            <Ripple frame={frame} at={40} x={GO.x} y={GO.y} dark />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: toMap }}>
            <Screen name="map-directions" />
            {/* The route sheet gives way to the map, and the route draws from the top (the bus leg) down */}
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${(1 - route) * 100}% 0)` }}>
              <Screen name="map-route" />
            </div>
            <div style={{ position: "absolute", inset: 0, opacity: interpolate(route, [0.55, 0.8], [0, 1], clamp) }}>
              <Screen name="map-route" />
            </div>
          </div>
        </Phone>
      </AbsoluteFill>

      {/* Departure chip (live data from the app's directions) */}
      <div
        style={{
          position: "absolute",
          left: L.chip.left,
          top: L.chip.top,
          translate: L.chip.center ? "-50% 0" : undefined,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 24px",
          borderRadius: 40,
          background: C.amber,
          fontFamily,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: "-0.015em",
          color: C.ink,
          opacity: Math.min(1, chip * 2),
          scale: String(0.7 + 0.3 * chip),
          transformOrigin: L.chip.center ? "50% 50%" : "0% 50%",
        }}
      >
        <span style={{ fontFamily: ICON_FONT, fontSize: 36, lineHeight: 1, fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
        Leave at 10:13 PM · Bus 36
      </div>
      <div style={{ position: "absolute", ...L.caption, textAlign: L.caption.align, ...lineStyle(72) }}>
        <span style={wordStyle(frame, 88)}>Even </span>
        <span style={wordStyle(frame, 92)}>by </span>
        <span style={wordStyle(frame, 96)}>bus.</span>
      </div>
    </AbsoluteFill>
  );
};
