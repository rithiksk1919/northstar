import React from "react";
import { Img, staticFile } from "remotion";

// assets/brand/northstar-logo.png is 1024² with the tile at x 91–928, y 61–917 on black; crop to the tile.
const TX = 91;
const TY = 61;
const TW = 837;
const TH = 856;
export const TILE_ASPECT = TH / TW;

export const LogoTile: React.FC<{ readonly width: number; readonly style?: React.CSSProperties }> = ({ width, style }) => {
  const k = width / TW;
  return (
    <div
      style={{
        position: "relative",
        width,
        height: width * TILE_ASPECT,
        borderRadius: width * 0.2,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: `0 ${width * 0.12}px ${width * 0.3}px rgba(17,17,17,0.18), 0 ${width * 0.02}px ${width * 0.05}px rgba(17,17,17,0.12)`,
        ...style,
      }}
    >
      <Img
        src={staticFile("northstar-logo.png")}
        style={{ position: "absolute", width: 1024 * k, height: 1024 * k, left: -TX * k, top: -TY * k }}
      />
    </div>
  );
};
