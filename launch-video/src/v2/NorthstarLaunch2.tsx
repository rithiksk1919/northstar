import React from "react";
import { Series } from "remotion";
import { AskScene } from "./AskScene";
import { FlashScene } from "./FlashScene";
import { HelpWithScene } from "./HelpWithScene";
import { LockupScene } from "./LockupScene";
import { NearYouScene } from "./NearYouScene";
import { NextStepScene } from "./NextStepScene";
import { TitleScene } from "./TitleScene";

// Round-2 15 s film. Shots follow docs/shotlist.md; chapters blur/bloom into each other (no hard UI cuts).
export const NorthstarLaunch2: React.FC = () => (
  <Series>
    <Series.Sequence name="S1–S2 Title" durationInFrames={69}>
      <TitleScene />
    </Series.Sequence>
    <Series.Sequence name="S3 Ask" durationInFrames={81}>
      <AskScene />
    </Series.Sequence>
    <Series.Sequence name="S4 Flash" durationInFrames={15}>
      <FlashScene />
    </Series.Sequence>
    <Series.Sequence name="S5 Near you" durationInFrames={81}>
      <NearYouScene />
    </Series.Sequence>
    <Series.Sequence name="S6 Next step" durationInFrames={90}>
      <NextStepScene />
    </Series.Sequence>
    <Series.Sequence name="S7 Flash" durationInFrames={12}>
      <FlashScene closer word="every night" />
    </Series.Sequence>
    <Series.Sequence name="S8 Help with" durationInFrames={57}>
      <HelpWithScene />
    </Series.Sequence>
    <Series.Sequence name="S9 Lockup" durationInFrames={45}>
      <LockupScene />
    </Series.Sequence>
  </Series>
);
