/**
 * Lightweight signals table used by the homepage teaser.
 * Extracted as a standalone component to prevent regressions
 * when the full screener table is modified independently.
 */
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ExternalLink, Search, FlaskConical, Info, Bot } from 'lucide-react';
import { getTradingViewAffiliateUrl } from '@/utils/tradingViewLinks';
import { buildPatternLabUrl } from '@/utils/patternLabUrl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface LiveSetup {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: string;
  quality: string;
  signalTs: string;
  historicalPerformance?: {
    winRate?: number;
    sampleSize?: number;
    avgRMultiple?: number;
    avgDurationBars?: number;
  };
}

function formatSignalAgeSimple(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface TeaserSignalsTableProps {
  patterns: LiveSetup[];
  onOpenChart?: (setup: LiveSetup) => void;
}

export function TeaserSignalsTable({ patterns, onOpenChart }: TeaserSignalsTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleScreen = (e: React.MouseEvent, setup: LiveSetup) => {
    e.stopPropagation();
    navigate(`/patterns/live?search=${encodeURIComponent(setup.instrument)}`);
  };

  const handleValidate = (e: React.MouseEvent, setup: LiveSetup) => {
    e.stopPropagation();
    navigate(buildPatternLabUrl({ pattern: setup.patternId, instrument: setup.instrument, mode: 'validate' }));
  };

  const handleAgentScore = (e: React.MouseEvent, setup: LiveSetup) => {
    e.stopPropagation();
    navigate(`/tools/agent-scoring?symbol=${encodeURIComponent(setup.instrument)}&pattern=${encodeURIComponent(setup.patternId)}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="whitespace-nowrap">{t('teaserSignals.symbol')}</TableHead>
          <TableHead className="whitespace-nowrap">{t('teaserSignals.pattern')}</TableHead>
          <TableHead className="text-center whitespace-nowrap">{t('teaserSignals.grade')}</TableHead>
          <TableHead className="whitespace-nowrap">{t('teaserSignals.signal')}</TableHead>
          <TableHead className="text-right whitespace-nowrap">{t('teaserSignals.winRate')}</TableHead>
          <TableHead className="text-right whitespace-nowrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <span className="flex items-center justify-end gap-1 cursor-help">
                     {t('teaserSignals.rot', 'ROT')}
                     <Info className="h-3 w-3 opacity-50" />
                   </span>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="max-w-sm whitespace-normal">
                   <p className="text-xs">{t('teaserSignals.rotTooltip', 'Return on Time — R earned per bar of exposure. Higher = more capital-efficient.')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableHead>
          <TableHead className="text-right whitespace-nowrap">{t('teaserSignals.age')}</TableHead>
          <TableHead className="text-center whitespace-nowrap">{t('teaserSignals.actions', 'Actions')}</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patterns.map((setup, idx) => {
          const isLong = setup.direction === 'long';
          const signalAge = formatSignalAgeSimple(setup.signalTs);
          const winRate = setup.historicalPerformance?.winRate;

          return (
            <TableRow
              key={`${setup.instrument}-${setup.patternId}-${idx}`}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onOpenChart?.(setup)}
            >
              <TableCell>
                <InstrumentLogo instrument={setup.instrument} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {t(`patternNames.${setup.patternName}`, setup.patternName)}
              </TableCell>
              <TableCell className="text-center">
                <GradeBadge quality={setup.quality} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={isLong ? 'default' : 'destructive'}
                  className={cn(
                    'text-xs',
                    isLong
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30'
                  )}
                >
                  {isLong ? (
                    <><TrendingUp className="h-3 w-3 mr-1" /> {t('teaserSignals.long')}</>
                  ) : (
                    <><TrendingDown className="h-3 w-3 mr-1" /> {t('teaserSignals.short')}</>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {winRate != null ? (
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      'font-mono font-medium',
                      winRate >= 50 ? 'text-green-500' : winRate >= 40 ? 'text-yellow-500' : 'text-muted-foreground'
                    )}>
                      {winRate.toFixed(0)}%
                    </span>
                    {setup.historicalPerformance?.sampleSize != null && (
                      <span className="text-sm text-muted-foreground/70 font-mono">
                        n={setup.historicalPerformance.sampleSize}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const perf = setup.historicalPerformance;
                  if (perf && perf.avgRMultiple && perf.avgDurationBars && perf.avgDurationBars > 0) {
                    const rot = perf.avgRMultiple / perf.avgDurationBars;
                    const isHighEfficiency = rot >= 0.01;
                    return (
                      <span className={cn(
                        'font-mono text-xs font-medium',
                        isHighEfficiency ? 'text-amber-500' : 'text-muted-foreground'
                      )}>
                        {rot.toFixed(4)}
                      </span>
                    );
                  }
                  return <span className="text-muted-foreground text-xs">—</span>;
                })()}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {signalAge}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={(e) => handleScreen(e, setup)}
                    title={t('teaserSignals.screen', 'Screen')}
                  >
                    <Search className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('teaserSignals.screen', 'Screen')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={(e) => handleValidate(e, setup)}
                    title={t('teaserSignals.validate', 'Validate')}
                  >
                    <FlaskConical className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('teaserSignals.validate', 'Validate')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-amber-500 hover:text-amber-400 gap-1"
                    onClick={(e) => handleAgentScore(e, setup)}
                    title={t('teaserSignals.agentScore', 'Score')}
                  >
                    <Bot className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('teaserSignals.agentScore', 'Score')}</span>
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <a
                  href={getTradingViewAffiliateUrl(setup.instrument)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={t('teaserSignals.openInTradingView', 'Open in TradingView')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
