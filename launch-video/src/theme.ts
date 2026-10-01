import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadLocalFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

// Northstar tokens (css/app.css) mapped onto the reference grammar in docs/style_guide.md.
export const C = {
  field: "#FFFFFF",
  ink: "#111111",
  ghost: "rgba(17,17,17,0.26)",
  muted: "#737373",
  sand: "#F2F2F2",
  line: "#E8E8E8",
  amber: "#FFD43B",
  star: "#F3B43C",
  starHi: "#FFE58A",
  navy: "#1B273E",
  navyDeep: "#0B1122",
  night: "#2A3A66",
  haze: "#FFF7D1",
};

export const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

export const ICON_FONT = "Material Symbols Outlined";
loadLocalFont({
  family: ICON_FONT,
  url: staticFile("material-symbols-outlined-subset.woff2"),
});

// Tight tracking from the style guide (-2.5%).
export const TRACK = "-0.025em";

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// The four-point star from assets/brand/northstar-mark.svg, re-centered on a 0..500 box.
export const STAR_PATH =
  "M249 5 C259 100 275 175 307 200 C339 232 402 240 497 250 C402 260 339 268 307 300 C275 325 259 400 249 498 C239 400 223 325 191 300 C159 268 96 260 0 250 C96 240 159 232 191 200 C223 175 239 100 249 5 Z";

// Phone screen captures are 390x844 CSS px (see scripts/capture-screens.mjs).
export const SCREEN_W = 390;
export const SCREEN_H = 844;
