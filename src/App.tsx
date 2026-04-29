import { TopBar } from "./components/TopBar";
import { BookSpread } from "./components/BookSpread";
import { StoryCanvas } from "./components/StoryCanvas";
import { Narration } from "./components/Narration";
import { UtteranceStrip } from "./components/UtteranceStrip";
import { VocabGrid } from "./components/VocabGrid";
import { BranchOverlay } from "./components/BranchOverlay";
import { DevPanel } from "./components/DevPanel";

export default function App() {
  return (
    <div className="flex flex-col h-full" style={{ minHeight: "100vh" }}>
      <TopBar />
      <BookSpread
        left={
          <>
            <StoryCanvas />
            <Narration />
          </>
        }
        right={
          <>
            <UtteranceStrip />
            <VocabGrid />
          </>
        }
      />
      <BranchOverlay />
      <DevPanel />
    </div>
  );
}
