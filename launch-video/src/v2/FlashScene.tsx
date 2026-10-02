import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../theme";
import { AnalogPlate, K, serif } from "./kit";

// S4 / S7: a short analog break on a generated plate; blooms in from white and washes out to the field.
type Props = { readonly closer?: boolean; readonly word?: string };

export const FlashScene: React.FC<Props> = ({ closer = false, word }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: d } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: K.field }}>
      <AnalogPlate closer={closer} id={closer ? "plate-b" : "plate-a"} />
      {word ? (
        <div
          style={{
            position: "absolute",
            left: 220,
            top: 470,
            fontFamily: serif,
            fontSize: 64,
            color: "rgba(255,255,255,0.85)",
            opacity: interpolate(frame, [2, 7], [0, 1], clamp),
            filter: `blur(${interpolate(frame, [2, 8], [14, 1], clamp)}px)`,
          }}
        >
          {word}
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: interpolate(frame, [0, 4], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: K.field, opacity: interpolate(frame, [d - 4, d], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
