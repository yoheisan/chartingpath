import { useCallback } from "react";
import { MandateCard } from "@/components/copilot/MandateCard";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import { AIGatedWatchlist } from "@/components/copilot/AIGatedWatchlist";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import RightPanel from "@/components/copilot/RightPanel";

const Copilot = () => {
  const focusNLBar = useCallback((prefill?: string) => {
    // Dispatch to the NavCopilotBar via ⌘K simulation
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    // TODO: wire prefill text into the NL bar
    if (prefill) {
      console.log("[Copilot] prefill NL bar:", prefill);
    }
  }, []);

  return (
    <div className="container mx-auto flex h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <aside className="w-[270px] shrink-0 border-r border-border/40 flex flex-col gap-2 p-2 overflow-hidden">
        {/* Zone 0: Feedback Loop Banner */}
        <FeedbackLoopBanner onFocusNLBar={focusNLBar} />

        {/* Zone 1: Mandate + Conflict */}
        <MandateCard onFocusNLBar={focusNLBar} />
        <ConflictBanner onFocusNLBar={focusNLBar} />

        {/* Zone 2: AI-Gated Watchlist */}
        <AIGatedWatchlist />
      </aside>

      {/* Center Panel placeholder */}
      <main className="flex-1 border-r border-border/40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground/40">Center panel</p>
      </main>

      {/* Right Panel placeholder */}
      <aside className="w-[256px] shrink-0 overflow-hidden">
        <RightPanel />
      </aside>
    </div>
  );
};

export default Copilot;
