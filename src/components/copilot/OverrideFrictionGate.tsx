import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Shield, Clock } from "lucide-react";
import { useOverrideFriction } from "@/hooks/useOverrideFriction";
import { useTranslation } from "react-i18next";

interface OverrideFrictionGateProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OverrideFrictionGate({ onConfirm, onCancel, isSubmitting }: OverrideFrictionGateProps) {
  const { t } = useTranslation();
  const { isActive, countdown, countdownActive, startCountdown, cooldownSeconds } = useOverrideFriction();
  const [reason, setReason] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isActive && !started) {
      startCountdown();
      setStarted(true);
    }
  }, [isActive, started, startCountdown]);

  if (!isActive) {
    return null; // No friction — caller handles normal flow
  }

  const canSubmit = reason.trim().length >= 5 && !countdownActive && !isSubmitting;

  return (
    <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
        <Shield className="h-4 w-4" />
        {t('overrideFriction.title', 'Override Safety Check')}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          {t('overrideFriction.reasonLabel', 'Why are you overriding Copilot? (required)')}
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('overrideFriction.reasonPlaceholder', 'e.g., Strong conviction based on volume breakout…')}
          className="min-h-[60px] text-sm resize-none"
          maxLength={500}
        />
        {reason.trim().length > 0 && reason.trim().length < 5 && (
          <p className="text-xs text-destructive mt-1">
            {t('overrideFriction.tooShort', 'Please provide at least 5 characters')}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {countdownActive && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>{countdown}s {t('overrideFriction.remaining', 'remaining')}</span>
            </div>
          )}
          {!countdownActive && started && (
            <span className="text-xs text-green-600">{t('overrideFriction.ready', 'Ready to proceed')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>
            {t('overrideFriction.cancel', 'Cancel')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            disabled={!canSubmit}
            onClick={() => onConfirm(reason.trim())}
          >
            {countdownActive
              ? `${t('overrideFriction.wait', 'Wait')} ${countdown}s`
              : t('overrideFriction.confirmOverride', 'Confirm Override')
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
