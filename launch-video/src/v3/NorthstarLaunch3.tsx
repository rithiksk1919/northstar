import React from "react";
import { Series, useVideoConfig } from "remotion";
import { GatherScene } from "../scenes/GatherScene";
import { LockupScene } from "../scenes/LockupScene";
import { CarouselScene } from "./CarouselScene";
import { DawnScene } from "./DawnScene";
import { JobGuideScene } from "./JobGuideScene";
import { RightNowScene } from "./RightNowScene";
import { SayScene, TurnScene } from "./SayScenes";

// Round-3 15 s film. Shots follow docs/shotlist.md (S3+S4 are one take). Cuts are white-to-white.
// Works at any fps: durations below are 30 fps frames, scaled by `d()` (60 fps reel = 2×).
export const NorthstarLaunch3: React.FC = () => {
  const { fps } = useVideoConfig();
  const d = (n: number) => Math.round((n * fps) / 30);
  return (
    <Series>
      <Series.Sequence name="S1 Dawn" durationInFrames={d(45)}>
        <DawnScene />
      </Series.Sequence>
      <Series.Sequence name="S2 A bed tonight" durationInFrames={d(27)}>
        <SayScene />
      </Series.Sequence>
      <Series.Sequence
        name="S3–S4 Right now → directions"
        durationInFrames={d(108)}
      >
        <RightNowScene />
      </Series.Sequence>
      <Series.Sequence name="S5 A job tomorrow" durationInFrames={d(30)}>
        <TurnScene />
      </Series.Sequence>
      <Series.Sequence name="S6 Job guide" durationInFrames={d(138)}>
        <JobGuideScene />
      </Series.Sequence>
      <Series.Sequence name="S7 Carousel" durationInFrames={d(42)}>
        <CarouselScene />
      </Series.Sequence>
      <Series.Sequence name="S8 Stars gather" durationInFrames={d(18)}>
        <GatherScene speed={30 / 18} />
      </Series.Sequence>
      <Series.Sequence name="S9 Lockup" durationInFrames={d(42)}>
        <LockupScene speed={54 / 42} />
      </Series.Sequence>
    </Series>
  );
};
