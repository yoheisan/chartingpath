import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useActivationChecklist } from '@/hooks/useActivationChecklist';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, X, TrendingUp, FlaskConical, Bell } from 'lucide-react';

const steps = [
  {
    key: 'viewed_signal' as const,
    icon: TrendingUp,
    labelKey: 'activation.viewSignal',
    labelFallback: 'View a live pattern signal',
    route: '/patterns/live',
  },
  {
    key: 'ran_backtest' as const,
    icon: FlaskConical,
    labelKey: 'activation.runBacktest',
    labelFallback: 'Run your first backtest',
    route: '/projects/pattern-lab/new?instrument=AAPL&pattern=double-bottom&timeframe=1d&mode=validate',
  },
  {
    key: 'set_alert' as const,
    icon: Bell,
    labelKey: 'activation.setAlert',
    labelFallback: 'Set a pattern alert',
    route: '/members/dashboard',
  },
];

export function ActivationChecklist() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, completedCount, shouldShow, dismiss } = useActivationChecklist();

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-28 right-4 z-40 w-72 rounded-xl border border-border bg-card shadow-2xl p-4 animate-fade-in sm:bottom-14">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          {t('activation.title', 'Getting Started')}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{completedCount}/3</span>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const done = state[step.key];
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => !done && navigate(step.route)}
              disabled={done}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${
                done
                  ? 'text-muted-foreground line-through opacity-60'
                  : 'hover:bg-muted/50 text-foreground cursor-pointer'
              }`}
            >
              {done ? (
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{t(step.labelKey, step.labelFallback)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
