import { useCallback, useState } from "react";
import { MandateCard } from "@/components/copilot/MandateCard";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import { AIGatedWatchlist } from "@/components/copilot/AIGatedWatchlist";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import RightPanel from "@/components/copilot/RightPanel";
import { useMasterPlan } from "@/hooks/useMasterPlan";

const Copilot = () => {
  const { rules, hasPlan, refreshPlan } = useMasterPlan();
  const [conflictTicker, setConflictTicker] = useState<string | null>(null);
  const [conflictReason, setConflictReason] = useState<string | null>(null);

  const focusNLBar = useCallback((prefill?: string) => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
    if (prefill) {
      console.log("[Copilot] prefill NL bar:", prefill);
    }
  }, []);

  const handleConflictDetected = useCallback((ticker: string, reason: string) => {
    setConflictTicker(ticker);
    setConflictReason(reason);
  }, []);

  const dismissConflict = useCallback(() => {
    setConflictTicker(null);
    setConflictReason(null);
  }, []);

  return (
    <div className="container mx-auto flex h-[calc(100vh-64px)]">
      <aside className="w-[270px] shrink-0 border-r border-border/40 flex flex-col gap-2 p-2 overflow-hidden">
        <FeedbackLoopBanner onFocusNLBar={focusNLBar} />
        <MandateCard onFocusNLBar={focusNLBar} rules={rules} hasPlan={hasPlan} />
        <ConflictBanner
          onFocusNLBar={focusNLBar}
          conflictTicker={conflictTicker}
          conflictReason={conflictReason}
          onDismiss={dismissConflict}
        />
        <AIGatedWatchlist onConflictDetected={handleConflictDetected} />
      </aside>

      <main className="flex-1 border-r border-border/40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground/40">Center panel</p>
      </main>

      <aside className="w-[256px] shrink-0 overflow-hidden">
        <RightPanel />
      </aside>
    </div>
  );
};

export default Copilot;
