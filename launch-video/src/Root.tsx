import { Composition, Folder } from "remotion";
import { NorthstarLaunch } from "./NorthstarLaunch";
import { AskScene } from "./scenes/AskScene";
import { GatherScene } from "./scenes/GatherScene";
import { LockupScene } from "./scenes/LockupScene";
import { MapScene } from "./scenes/MapScene";
import { OfflineScene } from "./scenes/OfflineScene";
import { OpenScene } from "./scenes/OpenScene";
import { RollScene } from "./scenes/RollScene";
import { StoryScene } from "./scenes/StoryScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="NorthstarLaunch" component={NorthstarLaunch} durationInFrames={450} fps={30} width={1920} height={1080} />
      <Folder name="Launch-Scenes">
        <Composition id="Open" component={OpenScene} durationInFrames={96} fps={30} width={1920} height={1080} />
        <Composition id="Ask" component={AskScene} durationInFrames={78} fps={30} width={1920} height={1080} />
        <Composition id="Map" component={MapScene} durationInFrames={42} fps={30} width={1920} height={1080} />
        <Composition id="Roll" component={RollScene} durationInFrames={60} fps={30} width={1920} height={1080} />
        <Composition id="Story" component={StoryScene} durationInFrames={54} fps={30} width={1920} height={1080} />
        <Composition id="Offline" component={OfflineScene} durationInFrames={36} fps={30} width={1920} height={1080} />
        <Composition id="Gather" component={GatherScene} durationInFrames={30} fps={30} width={1920} height={1080} />
        <Composition id="Lockup" component={LockupScene} durationInFrames={54} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
