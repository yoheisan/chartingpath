import { useCallback, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MandateCard } from "@/components/copilot/MandateCard";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import { MyAlertsPanel } from "@/components/copilot/MyAlertsPanel";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import RightPanel from "@/components/copilot/RightPanel";
import CenterPanel, { SelectedClosedTrade } from "@/components/copilot/CenterPanel";

import { useMasterPlan } from "@/hooks/useMasterPlan";
import { useCopilotTrades } from "@/hooks/useCopilotTrades";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS_CONFIG, type PlanTier } from "@/config/plans";
import { useUserProfile } from "@/hooks/useUserProfile";

const Copilot = () => {
  const { t } = useTranslation();
  const { rules, hasPlan, refreshPlan, plans, selectedPlanId, selectPlan, plan: activePlan } = useMasterPlan();
  const { user } = useAuth();
  const { subscriptionPlan } = useUserProfile();
  const { openTrades } = useCopilotTrades(user?.id);

  const canCreateMore = useMemo(() => {
    const planMapping: Record<string, PlanTier> = {
      free: 'FREE', starter: 'FREE', lite: 'LITE', plus: 'PLUS',
      pro: 'PRO', pro_plus: 'PRO', elite: 'ELITE', team: 'ELITE',
    };
    const tier = planMapping[subscriptionPlan?.toLowerCase() ?? 'free'] || 'FREE';
    const maxPlans = PLANS_CONFIG.tiers[tier].maxActivePlans;
    return plans.length < maxPlans;
  }, [subscriptionPlan, plans.length]);
  const [conflictTicker, setConflictTicker] = useState<string | null>(null);
  const [conflictReason, setConflictReason] = useState<string | null>(null);
  const [sessionEndBanner, setSessionEndBanner] = useState<{ time: string } | null>(null);
  const [debriefFromBanner, setDebriefFromBanner] = useState(false);
  const [debriefQuestion, setDebriefQuestion] = useState<string | null>(null);
  const [selectedClosedTrade, setSelectedClosedTrade] = useState<SelectedClosedTrade | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  // Listen for question routing from NL Command Bar
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setDebriefQuestion(e.detail);
      setDebriefFromBanner(true);
    };
    window.addEventListener('copilot-question', handler as EventListener);
    return () => window.removeEventListener('copilot-question', handler as EventListener);
  }, []);

  const activeTrade = useMemo(() => {
    if (selectedTradeId) {
      return openTrades.find(t => t.id === selectedTradeId) ?? openTrades[0] ?? null;
    }
    return openTrades[0] ?? null;
  }, [openTrades, selectedTradeId]);

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

  const handleTradeSelect = useCallback((trade: SelectedClosedTrade) => {
    setSelectedClosedTrade(trade);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedClosedTrade(null);
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Session end banner */}
      {sessionEndBanner && (
        <div className="w-full px-4 py-2 flex items-center justify-between bg-blue-500/10 border-b border-blue-500/20">
          <span className="text-sm text-muted-foreground">
            {t('copilotPage.sessionEnded', { time: sessionEndBanner.time })}
          </span>
          <button
            onClick={() => {
              setDebriefFromBanner(true);
              setSessionEndBanner(null);
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {t('copilotPage.reviewToday')}
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <aside className="w-[270px] shrink-0 border-r border-border/40 flex flex-col gap-2 p-2 overflow-y-auto overflow-x-hidden">
          <FeedbackLoopBanner onFocusNLBar={focusNLBar} />
          <MandateCard
            onFocusNLBar={focusNLBar}
            rules={rules}
            hasPlan={hasPlan}
            plans={plans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={selectPlan}
            canCreateMore={canCreateMore}
          />
          <ConflictBanner
            onFocusNLBar={focusNLBar}
            conflictTicker={conflictTicker}
            conflictReason={conflictReason}
            onDismiss={dismissConflict}
          />
          <MyAlertsPanel activePlan={activePlan} />
        </aside>

        <main className="flex-1 border-r border-border/40 flex flex-col min-h-0">
          <CenterPanel
            activeTrade={activeTrade}
            selectedClosedTrade={selectedClosedTrade}
            onBack={handleBack}
            onFocusNLBar={focusNLBar}
            openTrades={openTrades}
            selectedTradeId={selectedTradeId}
            onSelectTrade={(id) => {
              setSelectedClosedTrade(null);
              setSelectedTradeId(id);
            }}
          />
        </main>

        <aside className="w-[256px] shrink-0 overflow-hidden">
          <RightPanel
            openDebriefOnMount={debriefFromBanner}
            onDebriefOpened={() => { setDebriefFromBanner(false); }}
            onTradeSelect={handleTradeSelect}
            debriefQuestion={debriefQuestion}
          />
        </aside>
      </div>
    </div>
  );
};

export default Copilot;

