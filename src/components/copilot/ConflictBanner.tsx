import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigateToDashboard } from "@/hooks/useNavigateToDashboard";

interface ConflictBannerProps {
  onFocusNLBar: (prefill?: string) => void;
  conflictTicker?: string | null;
  conflictReason?: string | null;
  onDismiss?: () => void;
}

export function ConflictBanner({ onFocusNLBar, conflictTicker, conflictReason, onDismiss }: ConflictBannerProps) {
  const { t } = useTranslation();
  const goToSymbol = useNavigateToDashboard();

  if (!conflictTicker && !conflictReason) {
    return null;
  }

  const ticker = conflictTicker || "TSLA";

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 space-y-1.5">
      <p className="text-sm font-semibold text-amber-300">
        <span
          className="hover:underline cursor-pointer"
          onClick={(e) => goToSymbol(ticker, e)}
          title={t('copilotPage.viewOnDashboard', 'View on Dashboard')}
        >
          {t('copilotPage.conflictFlagged', { ticker })}
        </span>
      </p>
      <p className="text-sm text-amber-200/70 leading-relaxed">
        {t('copilotPage.conflictDesc', { ticker })}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" className="h-6 text-sm px-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 whitespace-nowrap">
          {t('copilotPage.addAnyway')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="h-6 text-sm px-2 border-border/60 text-muted-foreground hover:bg-muted/40 whitespace-nowrap"
        >
          {t('copilotPage.skip')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFocusNLBar("Update plan")}
          className="h-6 text-sm px-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 whitespace-nowrap"
        >
          {t('copilotPage.updatePlanAction')}
        </Button>
      </div>
    </div>
  );
}
