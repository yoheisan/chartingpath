import { useCallback, useState, useEffect } from "react";
import { MandateCard } from "@/components/copilot/MandateCard";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import { AIGatedWatchlist } from "@/components/copilot/AIGatedWatchlist";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import RightPanel from "@/components/copilot/RightPanel";
import { useMasterPlan } from "@/hooks/useMasterPlan";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Copilot = () => {
  const { rules, hasPlan, refreshPlan } = useMasterPlan();
  const { user } = useAuth();
  const [conflictTicker, setConflictTicker] = useState<string | null>(null);
  const [conflictReason, setConflictReason] = useState<string | null>(null);
  const [sessionEndBanner, setSessionEndBanner] = useState<{ time: string } | null>(null);
  const [debriefFromBanner, setDebriefFromBanner] = useState(false);

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

  // Listen for session_logs updates to detect session end
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('session-end-watcher')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new?.summary_text) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setSessionEndBanner({ time });

            // Send browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification('Session Complete', {
                body: 'Your session is complete. Copilot has your recap ready.',
                icon: '/favicon.ico',
              });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <div className="container mx-auto flex flex-col h-[calc(100vh-64px)]">
      {/* Session end banner */}
      {sessionEndBanner && (
        <div className="w-full px-4 py-2 flex items-center justify-between bg-blue-500/10 border-b border-blue-500/20">
          <span className="text-sm text-muted-foreground">
            Session ended · {sessionEndBanner.time}
          </span>
          <button
            onClick={() => {
              setDebriefFromBanner(true);
              setSessionEndBanner(null);
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Review today →
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
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
          <RightPanel openDebriefOnMount={debriefFromBanner} onDebriefOpened={() => setDebriefFromBanner(false)} />
        </aside>
      </div>
    </div>
  );
};

export default Copilot;

