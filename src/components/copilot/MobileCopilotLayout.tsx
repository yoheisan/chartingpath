import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Bell, FileText, MessageCircle, TrendingUp, TrendingDown, LineChart, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingCopilotContext } from "@/components/copilot/TradingCopilotContext";
import { MandateCard } from "@/components/copilot/MandateCard";
import { MyAlertsPanel } from "@/components/copilot/MyAlertsPanel";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import { MobileStatsTab } from "@/components/copilot/MobileStatsTab";
import type { MandateRule, MasterPlan } from "@/hooks/useMasterPlan";
import type { CopilotTrade } from "@/hooks/useCopilotTrades";

type MobileTab = "trades" | "alerts" | "plan" | "stats" | "chat";

interface MobileCopilotLayoutProps {
  // Plan
  rules?: MandateRule[];
  hasPlan?: boolean;
  plans?: MasterPlan[];
  selectedPlanId?: string | null;
  onSelectPlan?: (planId: string) => void;
  canCreateMore?: boolean;
  activePlan: MasterPlan | null;
  // Trades
  openTrades: any[];
  selectedTradeId: string | null;
  onSelectTrade: (id: string) => void;
  // Conflict
  conflictTicker: string | null;
  conflictReason: string | null;
  onDismissConflict: () => void;
  // NL bar
  onFocusNLBar: (prefill?: string) => void;
}

const tabs: { key: MobileTab; icon: typeof BarChart3; labelKey: string }[] = [
  { key: "trades", icon: BarChart3, labelKey: "copilotMobile.trades" },
  { key: "alerts", icon: Bell, labelKey: "copilotMobile.alerts" },
  { key: "plan", icon: FileText, labelKey: "copilotMobile.plan" },
  { key: "stats", icon: LineChart, labelKey: "copilotMobile.stats" },
  { key: "chat", icon: MessageCircle, labelKey: "copilotMobile.chat" },
];

export function MobileCopilotLayout({
  rules,
  hasPlan,
  plans = [],
  selectedPlanId,
  onSelectPlan,
  canCreateMore,
  activePlan,
  openTrades,
  selectedTradeId,
  onSelectTrade,
  conflictTicker,
  conflictReason,
  onDismissConflict,
  onFocusNLBar,
}: MobileCopilotLayoutProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MobileTab>("trades");

  const copilot = useTradingCopilotContext();

  const handleChatTab = useCallback(() => {
    // Open the floating Copilot chat panel
    if (!copilot.isOpen) {
      copilot.toggle();
    }
  }, [copilot]);

  const handleTabChange = useCallback(
    (tab: MobileTab) => {
      if (tab === "chat") {
        setActiveTab("chat");
        handleChatTab();
        return;
      }
      setActiveTab(tab);
    },
    [handleChatTab]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:hidden">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {activeTab === "trades" && (
          <TradesTab
            openTrades={openTrades}
            selectedTradeId={selectedTradeId}
            onSelectTrade={onSelectTrade}
          />
        )}
        {activeTab === "alerts" && (
          <MyAlertsPanel activePlan={activePlan} />
        )}
        {activeTab === "plan" && (
          <div className="space-y-3">
            <FeedbackLoopBanner onFocusNLBar={onFocusNLBar} />
            <MandateCard
              onFocusNLBar={onFocusNLBar}
              rules={rules}
              hasPlan={hasPlan}
              plans={plans}
              selectedPlanId={selectedPlanId}
              onSelectPlan={onSelectPlan}
              canCreateMore={canCreateMore}
            />
            <ConflictBanner
              onFocusNLBar={onFocusNLBar}
              conflictTicker={conflictTicker}
              conflictReason={conflictReason}
              onDismiss={onDismissConflict}
            />
          </div>
        )}
        {activeTab === "stats" && <MobileStatsTab />}
        {activeTab === "chat" && <ChatTab onOpenCopilot={handleChatTab} />}
      </div>

      {/* Bottom tab bar */}
      <nav className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {tabs.map(({ key, icon: Icon, labelKey }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium leading-none">
                  {t(labelKey, key.charAt(0).toUpperCase() + key.slice(1))}
                </span>
                {key === "trades" && openTrades.length > 0 && (
                  <span className="absolute -top-0.5 right-1/2 translate-x-3 bg-primary text-primary-foreground text-[9px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {openTrades.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ---------- Trades Tab ---------- */

const DEMO_TRADES: CopilotTrade[] = [
  { id: 'demo-1', symbol: 'AAPL', trade_type: 'long', entry_price: 198.45, exit_price: null, quantity: 10, pnl: null, outcome_r: 0.8, status: 'open', stop_loss: 195.00, take_profit: 205.00, created_at: new Date().toISOString(), closed_at: null, close_reason: null, attribution: 'ai_approved', source: 'screener', gate_result: 'pass', setup_type: 'breakout', copilot_reasoning: null, outcome: null, user_action: null, timeframe: '1h', detection_id: null },
  { id: 'demo-2', symbol: 'MSFT', trade_type: 'short', entry_price: 420.10, exit_price: null, quantity: 5, pnl: null, outcome_r: -0.3, status: 'open', stop_loss: 425.00, take_profit: 410.00, created_at: new Date().toISOString(), closed_at: null, close_reason: null, attribution: 'human_overwrite', source: 'manual', gate_result: 'override', setup_type: 'reversal', copilot_reasoning: null, outcome: null, user_action: null, timeframe: '1d', detection_id: null },
  { id: 'demo-3', symbol: 'TSLA', trade_type: 'long', entry_price: 245.30, exit_price: null, quantity: 8, pnl: null, outcome_r: 1.2, status: 'open', stop_loss: 240.00, take_profit: 260.00, created_at: new Date().toISOString(), closed_at: null, close_reason: null, attribution: 'ai_approved', source: 'screener', gate_result: 'pass', setup_type: 'breakout', copilot_reasoning: null, outcome: null, user_action: null, timeframe: '4h', detection_id: null },
];

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

/* ---------- Chat Tab (inline entry point) ---------- */

function ChatTab({ onOpenCopilot }: { onOpenCopilot: () => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const copilot = useTradingCopilotContext();

  const QUICK_PROMPTS = [
    t("copilotMobile.chatPrompt1", "What setups match my plan today?"),
    t("copilotMobile.chatPrompt2", "Review my last trade"),
    t("copilotMobile.chatPrompt3", "Scan top movers"),
  ];

  const sendDraft = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      onOpenCopilot();
      return;
    }
    // Stash so the chat panel can pick it up via input — simplest: open and let user paste.
    // Use openWithContext to seed a context message that the panel surfaces.
    copilot.openWithContext(trimmed);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("copilotMobile.chatTitle", "Ask Copilot")}
        </h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("copilotMobile.chatPlaceholder", "Ask anything about markets, plans, or trades…")}
          rows={3}
          className="w-full resize-none bg-background border border-input rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("copilotMobile.chatHint", "Opens the full Copilot chat")}
          </span>
          <button
            onClick={() => sendDraft(draft)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
            {draft.trim()
              ? t("copilotMobile.chatSend", "Send")
              : t("copilotMobile.chatOpen", "Open chat")}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground px-1">
          {t("copilotMobile.chatSuggestions", "Quick prompts")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendDraft(p)}
              className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradesTab({
  openTrades,
  selectedTradeId,
  onSelectTrade,
}: {
  openTrades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (id: string) => void;
}) {
  const { t } = useTranslation();
  const displayTrades = openTrades.length > 0 ? openTrades : DEMO_TRADES;
  const isDemo = openTrades.length === 0;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {t("copilotMobile.activeTrades", "Active Trades")} ({displayTrades.length})
        {isDemo && <span className="text-muted-foreground/60 font-normal ml-1">(preview)</span>}
      </h2>
      {displayTrades.map((trade) => {
        const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
        const pnlR = trade.outcome_r ?? 0;
        const isPositive = pnlR >= 0;

        return (
          <button
            key={trade.id}
            onClick={() => onSelectTrade(trade.id)}
            className={cn(
              "w-full text-left rounded-lg border p-3 transition-colors",
              selectedTradeId === trade.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {isLong ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className="font-semibold text-sm font-mono">{trade.symbol}</span>
              </div>
              <span className={cn(
                "text-sm font-mono font-semibold",
                isPositive ? "text-green-500" : "text-red-500"
              )}>
                {formatR(pnlR)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {trade.setup_type && <span>{trade.setup_type.replace(/-/g, " ")}</span>}
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                isLong ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {trade.trade_type?.toUpperCase()}
              </span>
            </div>
            {trade.entry_price && (
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="text-blue-400">E: ${trade.entry_price.toFixed(2)}</span>
                {trade.stop_loss && <span className="text-red-400">SL: ${trade.stop_loss.toFixed(2)}</span>}
                {trade.take_profit && <span className="text-green-400">TP: ${trade.take_profit.toFixed(2)}</span>}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
