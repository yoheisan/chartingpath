import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Bell, FileText, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MandateCard } from "@/components/copilot/MandateCard";
import { MyAlertsPanel } from "@/components/copilot/MyAlertsPanel";
import { FeedbackLoopBanner } from "@/components/copilot/FeedbackLoopBanner";
import { ConflictBanner } from "@/components/copilot/ConflictBanner";
import type { MandateRule, MasterPlan } from "@/hooks/useMasterPlan";
import type { SelectedClosedTrade } from "@/components/copilot/CenterPanel";

type MobileTab = "trades" | "alerts" | "plan" | "chat";

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

  const handleChatTab = useCallback(() => {
    // Open the floating command palette instead of rendering inline
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  const handleTabChange = useCallback(
    (tab: MobileTab) => {
      if (tab === "chat") {
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
      </div>

      {/* Bottom tab bar */}
      <nav className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {tabs.map(({ key, icon: Icon, labelKey }) => {
            const isActive = activeTab === key && key !== "chat";
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
                <span className="text-[10px] font-medium leading-none">
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

function TradesTab({
  openTrades,
  selectedTradeId,
  onSelectTrade,
}: {
  openTrades: any[];
  selectedTradeId: string | null;
  onSelectTrade: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (openTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
        <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t("copilotMobile.noTrades", "No active trades yet")}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {t("copilotMobile.noTradesHint", "Set up a trading plan to start receiving signals")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {t("copilotMobile.activeTrades", "Active Trades")} ({openTrades.length})
      </h2>
      {openTrades.map((trade) => (
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
            <span className="font-semibold text-sm">{trade.instrument}</span>
            <span
              className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                trade.direction === "long"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {trade.direction?.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{trade.pattern_id?.replace(/-/g, " ")}</span>
            <span>{trade.timeframe}</span>
          </div>
          {trade.entry_price && (
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="text-blue-400">E: {trade.entry_price}</span>
              {trade.stop_loss && <span className="text-red-400">SL: {trade.stop_loss}</span>}
              {trade.take_profit && <span className="text-green-400">TP: {trade.take_profit}</span>}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
