import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Target, TrendingUp, BarChart3, BookOpen } from "lucide-react";
import type { CopilotContext } from "@/hooks/useCopilotContext";

interface CopilotChartChipsProps {
  context: CopilotContext;
  onChipClick: (prompt: string) => void;
  disabled?: boolean;
}

export function CopilotChartChips({ context, onChipClick, disabled }: CopilotChartChipsProps) {
  const { t } = useTranslation();

  if (context.page !== 'chart' || !context.symbol || context.visible_patterns.length === 0) {
    return null;
  }

  const firstPattern = context.visible_patterns[0];
  const necklineStr = firstPattern.neckline ? ` at ${firstPattern.neckline}` : '';

  const chips = [
    {
      icon: Target,
      label: t('copilot.chip.setAlert', 'Set breakout alert'),
      prompt: `Set an alert for when ${context.symbol} breaks the neckline${necklineStr}`,
    },
    {
      icon: TrendingUp,
      label: t('copilot.chip.paperTrade', 'Paper trade this'),
      prompt: `Open a paper trade on the ${firstPattern.type} setup on ${context.symbol}`,
    },
    {
      icon: BarChart3,
      label: t('copilot.chip.showStats', 'Show my stats'),
      prompt: `Show me my historical performance on ${firstPattern.type} patterns`,
    },
    {
      icon: BookOpen,
      label: t('copilot.chip.explain', 'Explain pattern'),
      prompt: `Explain the ${firstPattern.type} pattern currently on my chart and what to watch for`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip) => (
        <Button
          key={chip.label}
          variant="outline"
          size="sm"
          className="h-auto py-1.5 px-3 gap-1.5 text-left"
          onClick={() => onChipClick(chip.prompt)}
          disabled={disabled}
        >
          <chip.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm">{chip.label}</span>
        </Button>
      ))}
    </div>
  );
}
