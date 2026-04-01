import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { CopilotAlert } from "@/hooks/useCopilotAlerts";

interface CopilotAlertBubbleProps {
  alert: CopilotAlert;
  onOpenTrade: (alert: CopilotAlert) => void;
  onDismiss: (alertId: string) => void;
}

export function CopilotAlertBubble({ alert, onOpenTrade, onDismiss }: CopilotAlertBubbleProps) {
  const { t } = useTranslation();
  const isIntervention = alert.alert_type === 'intervention';
  const isConflict = alert.full_context?.gate_result === 'conflict';

  return (
    <Card className={cn(
      "p-3 border-l-4 animate-in slide-in-from-right-5 fade-in-0 duration-300",
      isIntervention ? "border-l-amber-500 bg-amber-500/5" :
      isConflict ? "border-l-destructive bg-destructive/5" :
      "border-l-accent bg-accent/5"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isIntervention ? (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <TrendingUp className="h-4 w-4 text-accent shrink-0" />
          )}
          <Badge variant="secondary" className="text-xs shrink-0">
            {alert.symbol}
          </Badge>
          {alert.timeframe && (
            <Badge variant="outline" className="text-xs shrink-0">
              {alert.timeframe}
            </Badge>
          )}
          {alert.direction && (
            <Badge variant="outline" className={cn(
              "text-xs shrink-0",
              alert.direction === 'long' ? "text-green-600 border-green-600/30" : "text-red-600 border-red-600/30"
            )}>
              {alert.direction.toUpperCase()}
            </Badge>
          )}
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-sm text-foreground/90 mb-2 leading-relaxed">
        {alert.alert_message}
      </p>

      {alert.rr_ratio && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          {alert.entry_price && <span>Entry: {Number(alert.entry_price).toFixed(4)}</span>}
          {alert.stop_price && <span>SL: {Number(alert.stop_price).toFixed(4)}</span>}
          {alert.target_price && <span>TP: {Number(alert.target_price).toFixed(4)}</span>}
          <span className="font-medium text-foreground">R:R {Number(alert.rr_ratio).toFixed(1)}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isConflict && alert.entry_price && (
          <Button
            size="sm"
            className="h-7 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => onOpenTrade(alert)}
          >
            {t('copilot.alerts.openTrade', 'Open Trade')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onDismiss(alert.id)}
        >
          {t('copilot.alerts.dismiss', 'Dismiss')}
        </Button>
      </div>
    </Card>
  );
}
