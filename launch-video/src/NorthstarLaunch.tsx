import React from "react";
import { Series } from "remotion";
import { AskScene } from "./scenes/AskScene";
import { GatherScene } from "./scenes/GatherScene";
import { LockupScene } from "./scenes/LockupScene";
import { MapScene } from "./scenes/MapScene";
import { OfflineScene } from "./scenes/OfflineScene";
import { OpenScene } from "./scenes/OpenScene";
import { RollScene } from "./scenes/RollScene";
import { StoryScene } from "./scenes/StoryScene";

// 15 s launch film. Shots follow docs/shotlist.md; every cut is a hard cut, per docs/style_guide.md.
export const NorthstarLaunch: React.FC = () => (
  <Series>
    <Series.Sequence name="S1–S2 Open" durationInFrames={96}>
      <OpenScene />
    </Series.Sequence>
    <Series.Sequence name="S3–S4 Ask" durationInFrames={78}>
      <AskScene />
    </Series.Sequence>
    <Series.Sequence name="S5 Map" durationInFrames={42}>
      <MapScene />
    </Series.Sequence>
    <Series.Sequence name="S6 Roll" durationInFrames={60}>
      <RollScene />
    </Series.Sequence>
    <Series.Sequence name="S7 Story" durationInFrames={54}>
      <StoryScene />
    </Series.Sequence>
    <Series.Sequence name="S8 Offline" durationInFrames={36}>
      <OfflineScene />
    </Series.Sequence>
    <Series.Sequence name="S9 Gather" durationInFrames={30}>
      <GatherScene />
    </Series.Sequence>
    <Series.Sequence name="S10 Lockup" durationInFrames={54}>
      <LockupScene />
    </Series.Sequence>
  </Series>
);
