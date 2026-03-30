import { useCallback, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { isForexSymbol, calcForexPnl } from "@/utils/forexUtils";
import { ChevronLeft, LayoutDashboard, Bell, FileText, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MandateCard } from "@/components/copilot/MandateCard";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import { MyAlertsPanel } from "@/components/copilot/MyAlertsPanel";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import RightPanel from "@/components/copilot/RightPanel";
import CenterPanel, { SelectedClosedTrade } from "@/components/copilot/CenterPanel";
import { MobileCopilotLayout } from "@/components/copilot/MobileCopilotLayout";

import { useMasterPlan } from "@/hooks/useMasterPlan";
import { useCopilotTrades } from "@/hooks/useCopilotTrades";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { PLANS_CONFIG, type PlanTier } from "@/config/plans";
import { useUserProfile } from "@/hooks/useUserProfile";

const Copilot = () => {
  const { t } = useTranslation();
  const { rules, hasPlan, refreshPlan, plans, selectedPlanId, selectPlan, plan: activePlan } = useMasterPlan();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { subscriptionPlan } = useUserProfile();
  const { openTrades, refetch: refetchTrades } = useCopilotTrades(user?.id);

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
  const [leftPaneOpen, setLeftPaneOpen] = useState(true);
  const [leftPaneSection, setLeftPaneSection] = useState<'all' | 'dashboard' | 'alerts' | 'plans' | 'trades'>('all');

  const openSection = useCallback((section: 'dashboard' | 'alerts' | 'plans' | 'trades') => {
    setLeftPaneSection(section);
    setLeftPaneOpen(true);
  }, []);

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

  const handleCloseTrade = useCallback(async (tradeId: string, manualPrice?: number) => {
    try {
      const trade = openTrades.find(t => t.id === tradeId);
      if (!trade) { toast.error('Trade not found'); return; }

      let exitPrice: number;
      let closeReason: string;

      if (manualPrice != null) {
        exitPrice = manualPrice;
        closeReason = 'manual_price_override';
      } else {
        const { data: latest } = await supabase
          .from('live_pattern_detections')
          .select('current_price')
          .eq('instrument', trade.symbol)
          .not('current_price', 'is', null)
          .order('last_confirmed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        exitPrice = latest?.current_price ? Number(latest.current_price) : trade.entry_price;
        closeReason = 'Override exit by trader';
      }

      const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
      const isForex = isForexSymbol(trade.symbol);
      const forexLotSize = isForex ? 0.01 : 0; // micro lot default

      const signedMove = isLong ? exitPrice - trade.entry_price : trade.entry_price - exitPrice;
      const pnl = isForex
        ? calcForexPnl(trade.symbol, isLong ? exitPrice - trade.entry_price : trade.entry_price - exitPrice, forexLotSize)
        : signedMove * trade.quantity;
      const riskAmount = Math.abs(trade.entry_price - (trade.stop_loss ?? trade.entry_price));
      const priceMove = isLong ? exitPrice - trade.entry_price : trade.entry_price - exitPrice;
      const outcomeR = riskAmount > 0 ? Math.round((priceMove / riskAmount) * 100) / 100 : 0;

      const { error } = await supabase.from('paper_trades').update({
        status: 'closed',
        exit_price: exitPrice,
        pnl: Math.round(pnl * 100) / 100,
        closed_at: new Date().toISOString(),
        close_reason: closeReason,
        outcome_r: outcomeR,
        user_action: 'override_exit',
        attribution: 'human_overwrite',
      }).eq('id', tradeId);

      if (error) { toast.error('Failed to close trade'); console.error(error); return; }

      toast.success(`Closed ${trade.symbol} at $${exitPrice.toFixed(2)}`);
      setSelectedTradeId(null);
      setSelectedClosedTrade(null);
      refetchTrades();
    } catch (err) {
      console.error('[Copilot] close trade error:', err);
      toast.error('Failed to close trade');
    }
  }, [openTrades, refetchTrades]);

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
              new Notification(t('copilotPage.sessionCompleteTitle', 'Session Complete'), {
                body: t('copilotPage.sessionCompleteBody', 'Your session is complete. Copilot has your recap ready.'),
                icon: '/favicon.ico',
              });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (isMobile) {
    return (
      <MobileCopilotLayout
        rules={rules}
        hasPlan={hasPlan}
        plans={plans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={selectPlan}
        canCreateMore={canCreateMore}
        activePlan={activePlan}
        openTrades={openTrades}
        selectedTradeId={selectedTradeId}
        onSelectTrade={(id) => {
          setSelectedClosedTrade(null);
          setSelectedTradeId(id);
        }}
        conflictTicker={conflictTicker}
        conflictReason={conflictReason}
        onDismissConflict={dismissConflict}
        onFocusNLBar={focusNLBar}
      />
    );
  }

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
        {/* TradingView-style sidebar: icon strip when collapsed, full panel when open */}
        {!leftPaneOpen ? (
          <aside className="shrink-0 w-[52px] border-r border-border/50 flex flex-col items-center py-3 gap-2 bg-card">
            <button
              onClick={() => openSection('dashboard')}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
              title="Overview"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
            <button
              onClick={() => openSection('alerts')}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
              title="Alerts"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              onClick={() => openSection('plans')}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
              title="Plans"
            >
              <FileText className="h-5 w-5" />
            </button>
            <button
              onClick={() => openSection('trades')}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
              title="Trades"
            >
              <TrendingUp className="h-5 w-5" />
            </button>
          </aside>
        ) : (
          <aside className="shrink-0 w-[280px] border-r border-border/50 flex flex-col bg-card">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
              <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                {leftPaneSection === 'alerts' ? t('copilotPage.alerts', 'Alerts') :
                 leftPaneSection === 'plans' ? t('copilotPage.masterPlans') :
                 leftPaneSection === 'trades' ? t('copilotPage.trades', 'Trades') :
                 t('copilotPage.masterPlans')}
              </span>
              <button
                onClick={() => { setLeftPaneOpen(false); setLeftPaneSection('all'); }}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5 p-3 overflow-y-auto overflow-x-hidden flex-1">
              {(leftPaneSection === 'all' || leftPaneSection === 'dashboard') && (
                <>
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
                </>
              )}
              {leftPaneSection === 'alerts' && (
                <MyAlertsPanel activePlan={activePlan} />
              )}
              {leftPaneSection === 'plans' && (
                <MandateCard
                  onFocusNLBar={focusNLBar}
                  rules={rules}
                  hasPlan={hasPlan}
                  plans={plans}
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={selectPlan}
                  canCreateMore={canCreateMore}
                />
              )}
              {leftPaneSection === 'trades' && (
                <ConflictBanner
                  onFocusNLBar={focusNLBar}
                  conflictTicker={conflictTicker}
                  conflictReason={conflictReason}
                  onDismiss={dismissConflict}
                />
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 border-r border-border/40 flex flex-col min-h-0">
          <CenterPanel
            activeTrade={activeTrade}
            selectedClosedTrade={selectedClosedTrade}
            onBack={handleBack}
            onFocusNLBar={focusNLBar}
            openTrades={openTrades}
            selectedTradeId={selectedTradeId}
            activePlan={activePlan}
            onCloseTrade={handleCloseTrade}
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

