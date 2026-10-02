import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, easeInOut, easeOut } from "../theme";
import { blurIn, Icon, K, sans } from "./kit";

// S5: the dashboard's real "Near you" rows, tilted in 3D, settle flat; a white pill glides row to row; push into row 1.
export const NEAR_FRAMES = 81;

const ROWS = [
  { icon: "bed", name: "Downtown Emergency Service Center", sub: "0.3 mi · Open 24/7 · Shelter" },
  { icon: "restaurant", name: "YouthCare Orion Center", sub: "0.8 mi · Youth meals, showers & housing" },
  { icon: "shower", name: "Compass Center Hygiene Center", sub: "0.3 mi · Showers & restrooms" },
  { icon: "work", name: "Get Paid to Lift", sub: "Day gig · $25.00 / hr" },
];
const ROW_H = 112;
const TOP = 140;

export const NearYouScene: React.FC = () => {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 36], [0, 1], { ...clamp, easing: easeOut });
  const pillRow = interpolate(frame, [39, 48, 57, 66], [0, 1, 1, 0], { ...clamp, easing: easeInOut });
  const pillOn = interpolate(frame, [36, 41], [0, 1], clamp);
  const push = interpolate(frame, [69, 81], [1, 1.7], { ...clamp, easing: easeInOut });
  const outBlur = interpolate(frame, [73, 81], [0, 24], clamp);

  return (
    <AbsoluteFill style={{ background: K.field, perspective: 1800 }}>
      <AbsoluteFill
        style={{
          scale: String(push * interpolate(settle, [0, 1], [0.92, 1])),
          transformOrigin: `960px ${300 + TOP + ROW_H / 2}px`,
          opacity: interpolate(frame, [76, 81], [1, 0], clamp),
          filter: `blur(${outBlur}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 410,
            top: 300,
            width: 1100,
            rotate: `${interpolate(settle, [0, 1], [-3, 0])}deg`,
            transform: `rotateX(${interpolate(settle, [0, 1], [24, 0])}deg)`,
            ...blurIn(frame, 0, 12, 24),
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sans, color: K.muted, fontSize: 22, fontWeight: 600, padding: "0 28px" }}>
            <span style={{ color: K.ink, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>Near you</span>
            <span style={{ textDecoration: "underline", textUnderlineOffset: 5 }}>See map</span>
          </div>
          {/* Highlight pill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: TOP - 22 + pillRow * ROW_H,
              height: ROW_H - 12,
              borderRadius: 26,
              background: K.card,
              boxShadow: "0 18px 50px rgba(17,17,17,0.07), 0 0 0 1px rgba(17,17,17,0.04)",
              opacity: pillOn,
            }}
          />
          {ROWS.map((r, i) => (
            <div
              key={r.name}
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                top: TOP - 16 + i * ROW_H,
                height: ROW_H - 24,
                display: "flex",
                alignItems: "center",
                gap: 24,
                fontFamily: sans,
                ...blurIn(frame, 4 + i * 3, 10),
              }}
            >
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "#EEF0ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={r.icon} size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: 600, color: K.ink, letterSpacing: "-0.015em" }}>{r.name}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: K.muted, marginTop: 4 }}>{r.sub}</div>
              </div>
              {i === 0 ? (
                <div
                  style={{
                    background: K.amber,
                    color: K.ink,
                    fontSize: 20,
                    fontWeight: 700,
                    padding: "8px 16px",
                    borderRadius: 20,
                    ...blurIn(frame, 64, 6),
                  }}
                >
                  Open now
                </div>
              ) : (
                <Icon name="chevron_right" size={30} color={K.ghost} />
              )}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
