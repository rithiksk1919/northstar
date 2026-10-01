import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CompanionBubble, Phone, phoneHeight, Screen, UserPill } from "../components";
import { C, clamp, easeInOut, easeOut } from "../theme";

// S3 + S4: bubbles on white → pull back to reveal the phone → scroll to "Shelter open all night".
export const ASK_FRAMES = 78;

const PHONE_W = 430;
const PH = phoneHeight(PHONE_W);
const PHONE_LEFT = 960 - PHONE_W / 2;
const PHONE_TOP = 540 - PH / 2 + 20;
// Screen origin in frame px, and app px → frame px scale.
const SCREEN_X = PHONE_LEFT + PHONE_W * 0.035;
const SCREEN_Y = PHONE_TOP + PHONE_W * 0.1 + PHONE_W * 0.035 * 0.3;
const K = (PHONE_W - PHONE_W * 0.07) / 390;
const at = (x: number, y: number) => `${SCREEN_X + x * K}px ${SCREEN_Y + y * K}px`;

const spring = Easing.bezier(0.34, 1.45, 0.64, 1);

export const AskScene: React.FC = () => {
  const frame = useCurrentFrame();

  const pull = interpolate(frame, [0, 36, 54], [1.6, 1.64, 1], { ...clamp, easing: [Easing.linear, easeOut] });
  const reveal = interpolate(frame, [38, 52], [0, 1], { ...clamp, easing: easeOut });
  const scroll = interpolate(frame, [56, 66], [0, 1], { ...clamp, easing: easeInOut });
  const push = interpolate(frame, [64, 78], [1, 1.1], { ...clamp, easing: easeOut });

  const pillIn = interpolate(frame, [3, 12], [0, 1], { ...clamp, easing: spring });
  const replyIn = interpolate(frame, [15, 24], [0, 1], { ...clamp, easing: spring });

  return (
    <AbsoluteFill style={{ background: C.field }}>
      <AbsoluteFill style={{ scale: String(push), transformOrigin: at(195, 225) }}>
        <AbsoluteFill style={{ scale: String(pull), transformOrigin: at(195, 395) }}>
          <Phone width={PHONE_W} bezelOpacity={reveal} style={{ left: PHONE_LEFT, top: PHONE_TOP }}>
            {/* Companion screen, scrolled away to the dashboard */}
            <div style={{ position: "absolute", inset: 0, translate: `0 ${-scroll * 844}px` }}>
              <Screen name="companion" style={{ opacity: reveal }} />
              {/* Clear the empty state so our conversation sits in the real chat surface */}
              <div style={{ position: "absolute", left: 0, top: 70, width: 390, height: 590, background: C.field }} />
              <UserPill
                text="is there a bed open tonight?"
                style={{ top: 330, opacity: Math.min(1, pillIn * 1.5), translate: `0 ${(1 - pillIn) * 14}px` }}
              />
              <CompanionBubble
                text="Two shelters near you are open all night."
                style={{ top: 386, opacity: Math.min(1, replyIn * 1.5), translate: `0 ${(1 - replyIn) * 14}px` }}
              />
            </div>
            <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - scroll) * 844}px` }}>
              <Screen name="dashboard" />
            </div>
          </Phone>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
