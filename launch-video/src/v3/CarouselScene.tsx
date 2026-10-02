import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { lineStyle, Phone, Screen, wordStyle } from "../components";
import { C, clamp, useT } from "../theme";

// S7: caption + a curved arc of real Northstar screens panning behind the phone (style guide §11b).
export const CAROUSEL_FRAMES = 42;

// Real captures, including the giving side ("I want to help" and the volunteer Home).
const TILES = ["role", "companion", "resume", "gigs", "helper", "call", "map", "role", "companion", "resume", "helper", "gigs"];
const GAP = 300;
const TILE = 250;

export const CarouselScene: React.FC = () => {
  const frame = useT();
  const pan = interpolate(frame, [0, 42], [0, -GAP * 1.6]);
  const drift = interpolate(frame, [0, 42], [1, 1.02], clamp);
  const { width: W, height: H } = useVideoConfig();
  const reel = H > W;
  const cx = W / 2;
  const phone = reel ? { w: 600, top: H * 0.46 } : { w: 470, top: 300 };
  const arcTop = reel ? H * 0.255 : 560;

  return (
    <AbsoluteFill style={{ background: C.field, scale: String(drift), overflow: "hidden", perspective: 1600 }}>
      <div
        style={{
          position: "absolute",
          top: reel ? H * 0.12 : 165,
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          ...lineStyle(reel ? 72 : 56),
          lineHeight: 1.25,
          padding: reel ? "0 60px" : 0,
        }}
      >
        <span style={wordStyle(frame, 0)}>For </span>
        <span style={wordStyle(frame, 3)}>finding </span>
        <span style={wordStyle(frame, 6)}>help </span>
        <span style={wordStyle(frame, 9)}>— </span>
        {reel ? <span style={{ flexBasis: "100%", height: 0 }} /> : null}
        <span style={wordStyle(frame, 12)}>and </span>
        <span style={wordStyle(frame, 15)}>giving </span>
        <span style={wordStyle(frame, 18)}>it.</span>
      </div>

      {TILES.map((name, i) => {
        const x = (i - 3) * GAP + pan; // offset from frame center
        const n = Math.max(-1.4, Math.min(1.4, x / (reel ? 620 : 900)));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx + x - TILE / 2,
              top: arcTop + n * n * 150,
              width: TILE,
              height: TILE,
              borderRadius: TILE * 0.22,
              overflow: "hidden",
              background: "#FFFFFF",
              boxShadow: "0 18px 40px rgba(17,17,17,0.12), 0 0 0 1px rgba(17,17,17,0.05)",
              scale: String(1 - Math.abs(n) * 0.2),
              transform: `rotateY(${n * -32}deg)`,
              filter: `blur(${Math.max(0, Math.abs(n) - 0.9) * 4}px)`,
              opacity: interpolate(Math.abs(n), [1.1, 1.4], [1, 0], clamp),
            }}
          >
            {/* Top of each real screen, scaled to the tile */}
            <Img src={staticFile(`screens/${name}.png`)} style={{ width: TILE, height: (TILE * 844) / 390, display: "block" }} />
          </div>
        );
      })}

      <Phone width={phone.w} style={{ left: cx - phone.w / 2, top: phone.top }}>
        <Screen name="dashboard" />
      </Phone>
    </AbsoluteFill>
  );
};
