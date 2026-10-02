import React from "react";
import { AbsoluteFill, Easing, interpolate, useVideoConfig } from "remotion";
import { Star } from "../components";
import { C, clamp, easeInOut, useT } from "../theme";
import { LogoTile, TILE_ASPECT } from "./LogoTile";

// S9: back to dawn; the three stars from the app icon gather, then the sky tightens into the icon tile.
export const GATHER_FRAMES = 30;
export const LOCKUP_TILE_W = 150;

const spring = Easing.bezier(0.34, 1.35, 0.64, 1);

// Positions inside the icon tile (fractions of tile width/height) and size (fraction of tile width).
const STARS = [
  { x: 0.502, y: 0.279, s: 0.33, fromX: -0.2, fromY: -0.5, d: 0 },
  { x: 0.24, y: 0.49, s: 0.11, fromX: -0.9, fromY: 0.6, d: 3 },
  { x: 0.757, y: 0.437, s: 0.1, fromX: 1.0, fromY: 0.2, d: 5 },
];

// `speed` lets a shorter slot play the same timing (round 3); 1 = original.
export const GatherScene: React.FC<{ readonly speed?: number }> = ({ speed = 1 }) => {
  const frame = useT() * speed;
  const { width: W, height: H } = useVideoConfig();
  const tighten = interpolate(frame, [17, 28], [0, 1], { ...clamp, easing: easeInOut });
  const w = interpolate(tighten, [0, 1], [W, LOCKUP_TILE_W]);
  const h = interpolate(tighten, [0, 1], [H, LOCKUP_TILE_W * TILE_ASPECT]);
  const unit = Math.min(w, h * 1.1);

  return (
    <AbsoluteFill style={{ background: C.field }}>
      <div
        style={{
          position: "absolute",
          left: W / 2 - w / 2,
          top: H / 2 - h / 2,
          width: w,
          height: h,
          borderRadius: interpolate(tighten, [0, 1], [0, LOCKUP_TILE_W * 0.2]),
          overflow: "hidden",
          background: `linear-gradient(180deg, #0B1122 0%, ${C.navy} 55%, #3A3A5E 80%, #C98A2A 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 45% at 50% 100%, rgba(255,212,59,0.9) 0%, rgba(243,180,60,0.35) 45%, rgba(243,180,60,0) 75%)`,
          }}
        />
        {STARS.map((s, i) => {
          const t = interpolate(frame, [s.d, s.d + 15], [0, 1], { ...clamp, easing: spring });
          const size = s.s * unit * 1.1;
          return (
            <Star
              key={i}
              id={`gather-${i}`}
              size={size}
              glow={interpolate(tighten, [0, 1], [1, 0.3])}
              style={{
                left: w * (s.x + s.fromX * (1 - t)) - size / 2,
                top: h * (s.y + s.fromY * (1 - t)) - size / 2,
                rotate: `${(1 - t) * 120}deg`,
                filter: `blur(${(1 - t) * 8}px)`,
              }}
            />
          );
        })}
      </div>
      {/* Resolve into the real icon on the last frames */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - LOCKUP_TILE_W / 2,
          top: H / 2 - (LOCKUP_TILE_W * TILE_ASPECT) / 2,
          opacity: interpolate(frame, [26, 30], [0, 1], clamp),
        }}
      >
        <LogoTile width={LOCKUP_TILE_W} />
      </div>
    </AbsoluteFill>
  );
};
