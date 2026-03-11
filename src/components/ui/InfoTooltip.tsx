import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getGlossaryText } from '@/data/tradingGlossary';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  /** Glossary key (e.g. "winRate") — looks up from tradingGlossary */
  term?: string;
  /** Custom tooltip content — overrides term lookup */
  content?: string;
  /** Additional class on the icon */
  className?: string;
  /** Icon size in Tailwind (default: h-3.5 w-3.5) */
  size?: string;
}

export function InfoTooltip({ term, content, className, size = 'h-3.5 w-3.5' }: InfoTooltipProps) {
  const { t } = useTranslation();
  const text = content || (term ? getGlossaryText(term, t) : '');
  
  if (!text) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help',
              className
            )}
            tabIndex={-1}
          >
            <HelpCircle className={size} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm whitespace-normal text-sm" side="top">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
