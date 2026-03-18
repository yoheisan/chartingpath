import React, { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTradingCopilotContext } from './TradingCopilotContext';
import { trackEvent } from '@/lib/analytics';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, BarChart3, Percent, Hash, FlaskConical, FileCode, Activity, ExternalLink, Sparkles, Brain, Shield, Clock, Briefcase, Check, X } from 'lucide-react';

interface CopilotRichMessageProps {
  content: string;
  onQuickReply?: (text: string) => void;
}

// ─── Platform route mapping for service keywords ───
const SERVICE_LINKS: { pattern: RegExp; path: string; label: string }[] = [
  { pattern: /\bPattern\s*Lab\b/gi, path: '/projects/pattern-lab/new', label: 'Pattern Lab' },
  { pattern: /\bScreener\b/gi, path: '/patterns/live', label: 'Screener' },
  { pattern: /\bEdge\s*Atlas\b/gi, path: '/patterns/live', label: 'Edge Atlas' },
  { pattern: /\bScript(?:s|\s+Generator)?\b/gi, path: '/members/scripts', label: 'Scripts' },
  { pattern: /\bDashboard\b/gi, path: '/members/dashboard', label: 'Dashboard' },
  { pattern: /\bAgent\s*Scor(?:ing|e)\b/gi, path: '/tools/agent-scoring', label: 'Agent Scoring' },
];

// Known ticker patterns (stocks, crypto, forex, indices)
const TICKER_REGEX = /\b([A-Z]{1,5}(?:USD[T]?)?)\b/g;
const KNOWN_PREFIXES = new Set([
  // Common words to exclude
  'THE','AND','FOR','NOT','BUT','ALL','ARE','WAS','HAS','HAD','HIS','HER','HIM',
  'HOW','GET','GOT','LET','MAY','NEW','NOW','OLD','SEE','WAY','WHO','OUR',
  'OUT','DAY','USE','MAN','SAY','SHE','TWO','ONE','ITS','ANY','FEW','OWN',
  'SET','RUN','PUT','END','WIN','TOP','LOW','BIG','TRY','ASK','MEN','RAN',
  'ADD','AGO','YES','YET','ACT','CUT','FAR','FIT','HIT','HOT','LAY','LED',
  'PAY','RED','RAN','SAT','SIT','TEN','VIA','WILL','WITH','THIS','THAT','FROM',
  'THEY','BEEN','HAVE','EACH','MAKE','LIKE','JUST','THAN','THEM','SOME','INTO',
  'OVER','SUCH','TAKE','YEAR','ALSO','BACK','COME','THAN','MOST','ONLY','VERY',
  'WHEN','WHAT','YOUR','LONG','SHORT','HIGH','BULL','BEAR','SELL','BUY','HOLD',
  'STOP','LOSS','TAKE','RISK','RATE','OPEN','CLOSE','CALL','DIR','AVG','MAX',
  'MIN','NET','PNL','VOL','ADX','RSI','MACD','EMA','SMA','ATR','USD','EUR',
  'GBP','JPY','AUD','CAD','NZD','CHF','VWAP','OHLC',
  'WATCH','SKIP','DONE','BEST','GOOD','POOR','WEAK','PASS','FAIL','NONE',
]);

function isLikelyTicker(word: string): boolean {
  if (word.length < 2 || word.length > 6) return false;
  if (KNOWN_PREFIXES.has(word)) return false;
  // Must be all uppercase letters (with optional trailing digits for crypto like BTC)
  if (!/^[A-Z]{1,5}(?:USDT?)?$/.test(word)) return false;
  return true;
}

// Map pattern names to screener IDs
const PATTERN_SCREENER_MAP: Record<string, string> = {
  'head and shoulders': 'head-and-shoulders',
  'inverse head and shoulders': 'inverse-head-and-shoulders',
  'double top': 'double-top',
  'double bottom': 'double-bottom',
  'triple top': 'triple-top',
  'triple bottom': 'triple-bottom',
  'ascending triangle': 'ascending-triangle',
  'descending triangle': 'descending-triangle',
  'symmetrical triangle': 'symmetrical-triangle',
  'bull flag': 'bull-flag',
  'bear flag': 'bear-flag',
  'bull pennant': 'bull-pennant',
  'bear pennant': 'bear-pennant',
  'rising wedge': 'rising-wedge',
  'falling wedge': 'falling-wedge',
  'cup and handle': 'cup-and-handle',
  'ascending channel': 'ascending-channel',
  'descending channel': 'descending-channel',
};

const PATTERN_REGEX = new RegExp(
  `\\b(${Object.keys(PATTERN_SCREENER_MAP).join('|')})\\b`,
  'gi'
);

// ─── Metric color coding ───
function getMetricStyle(value: string, header: string): string {
  const lowerHeader = header.toLowerCase();
  const numMatch = value.match(/^-?\d+\.?\d*/);
  if (!numMatch) return '';
  const num = parseFloat(numMatch[0]);

  if (lowerHeader.includes('win') && lowerHeader.includes('rate')) {
    if (num >= 50) return 'text-emerald-500 font-semibold';
    if (num >= 40) return 'text-amber-500 font-semibold';
    return 'text-red-500 font-semibold';
  }
  if (lowerHeader.includes('return') || lowerHeader.includes('pnl') || lowerHeader.includes('exp') || lowerHeader.includes('profit') || lowerHeader.includes('expectancy')) {
    if (num > 0) return 'text-emerald-500 font-semibold';
    if (num < 0) return 'text-red-500 font-semibold';
    return 'text-muted-foreground';
  }
  if (value.endsWith('R') || lowerHeader.includes('(r)')) {
    if (num > 0) return 'text-emerald-500 font-semibold';
    if (num < 0) return 'text-red-500 font-semibold';
  }
  return '';
}

function DirectionBadge({ value }: { value: string }) {
  const lower = value.toLowerCase().trim();
  if (lower === 'long') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-500">
        <TrendingUp className="h-3 w-3" /> Long
      </span>
    );
  }
  if (lower === 'short') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-500">
        <TrendingDown className="h-3 w-3" /> Short
      </span>
    );
  }
  return <span>{value}</span>;
}

// ─── Inline hyperlink injection ───
function enrichTextWithLinks(text: string): React.ReactNode[] {
  // Build a combined regex for all linkable tokens
  type Match = { index: number; length: number; node: React.ReactNode };
  const matches: Match[] = [];

  // 1. Service links
  for (const svc of SERVICE_LINKS) {
    let m: RegExpExecArray | null;
    const re = new RegExp(svc.pattern.source, svc.pattern.flags);
    while ((m = re.exec(text)) !== null) {
      matches.push({
        index: m.index,
        length: m[0].length,
        node: (
          <Link key={`svc-${m.index}`} to={svc.path} className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
            {m[0]}
          </Link>
        ),
      });
    }
  }

  // 2. Pattern names
  {
    let m: RegExpExecArray | null;
    const re = new RegExp(PATTERN_REGEX.source, PATTERN_REGEX.flags);
    while ((m = re.exec(text)) !== null) {
      // Skip if already captured by a service match
      if (matches.some(x => m!.index >= x.index && m!.index < x.index + x.length)) continue;
      const screenerId = PATTERN_SCREENER_MAP[m[0].toLowerCase()];
      if (screenerId) {
        matches.push({
          index: m.index,
          length: m[0].length,
          node: (
            <Link key={`pat-${m.index}`} to={`/patterns/live?pattern=${screenerId}`} className="text-primary underline underline-offset-2 hover:text-primary/80">
              {m[0]}
            </Link>
          ),
        });
      }
    }
  }

  // 3. Ticker symbols (only in non-table text)
  {
    let m: RegExpExecArray | null;
    const re = new RegExp(TICKER_REGEX.source, TICKER_REGEX.flags);
    while ((m = re.exec(text)) !== null) {
      if (matches.some(x => m!.index >= x.index && m!.index < x.index + x.length)) continue;
      if (!isLikelyTicker(m[1])) continue;
      matches.push({
        index: m.index,
        length: m[0].length,
        node: (
          <Link key={`tkr-${m.index}`} to={`/members/dashboard?instrument=${m[1]}`} className="text-primary font-mono font-semibold hover:underline">
            {m[1]}
          </Link>
        ),
      });
    }
  }

  if (matches.length === 0) return [text];

  // Sort by index and build result
  matches.sort((a, b) => a.index - b.index);

  const result: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index > cursor) {
      result.push(text.slice(cursor, match.index));
    }
    if (match.index >= cursor) {
      result.push(match.node);
      cursor = match.index + match.length;
    }
  }
  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}

// ─── Action buttons extracted from message context ───
interface ActionButton {
  labelKey: string;
  icon: React.ReactNode;
  to: string;
}

function extractActionButtons(content: string): ActionButton[] {
  const buttons: ActionButton[] = [];
  const lc = content.toLowerCase();

  // Extract tickers and patterns for deep-linking
  const tickerMatch = content.match(/\b([A-Z]{2,5}(?:USDT?)?)\b/g)?.filter(isLikelyTicker);
  const patternMatch = lc.match(PATTERN_REGEX);
  const firstTicker = tickerMatch?.[0];
  const firstPattern = patternMatch ? PATTERN_SCREENER_MAP[patternMatch[0].toLowerCase()] : null;

  // Extract grade from response (e.g., "Grade A", "Grade: B", "grade B")
  const gradeMatch = content.match(/\bgrade[:\s]*([ABCDF])\b/i);
  const extractedGrade = gradeMatch ? gradeMatch[1].toUpperCase() : null;

  // Build query params
  const labParams = new URLSearchParams();
  if (firstTicker) labParams.set('instrument', firstTicker);
  if (firstPattern) labParams.set('pattern', firstPattern);
  if (extractedGrade) labParams.set('grade', extractedGrade);
  labParams.set('mode', 'validate');

  const screenerParams = new URLSearchParams();
  if (firstPattern) screenerParams.set('pattern', firstPattern);

  const scriptParams = new URLSearchParams();
  if (firstTicker) scriptParams.set('instrument', firstTicker);
  if (firstPattern) scriptParams.set('pattern', firstPattern);

  // Only add relevant buttons
  if (firstTicker || firstPattern) {
    buttons.push({
      labelKey: 'copilot.actions.validatePatternLab',
      icon: <FlaskConical className="h-3.5 w-3.5" />,
      to: `/projects/pattern-lab/new?${labParams.toString()}`,
    });
  }
  if (firstPattern) {
    buttons.push({
      labelKey: 'copilot.actions.findActiveSignals',
      icon: <Activity className="h-3.5 w-3.5" />,
      to: `/patterns/live?${screenerParams.toString()}`,
    });
  }
  if (firstTicker || firstPattern) {
    buttons.push({
      labelKey: 'copilot.actions.exportScript',
      icon: <FileCode className="h-3.5 w-3.5" />,
      to: `/members/scripts?${scriptParams.toString()}`,
    });
  }

  // Agent Scoring button — show when response mentions TAKE/WATCH/SKIP or scoring
  const scoringParams = new URLSearchParams();
  if (firstTicker) scoringParams.set('symbol', firstTicker);
  if (firstPattern) scoringParams.set('pattern', firstPattern);

  if (/\b(TAKE|WATCH|SKIP)\b/.test(content) || /agent\s*scor/i.test(lc) || /confidence\s*score/i.test(lc)) {
    buttons.push({
      labelKey: 'copilot.actions.scoreTrade',
      icon: <Sparkles className="h-3.5 w-3.5" />,
      to: `/tools/agent-scoring${scoringParams.toString() ? '?' + scoringParams.toString() : ''}`,
    });
  }

  return buttons;
}

// ─── Table parsing ───
function parseMarkdownTable(tableStr: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableStr.trim().split('\n').filter(l => l.trim());
  if (lines.length < 3) return null;
  const sepIdx = lines.findIndex(l => /^\|?\s*[-:]+[-|\s:]+\s*\|?$/.test(l));
  if (sepIdx < 1) return null;
  const parseLine = (line: string): string[] =>
    line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
  const headers = parseLine(lines[sepIdx - 1]);
  const rows = lines.slice(sepIdx + 1).map(parseLine).filter(r => r.length === headers.length);
  if (headers.length < 2 || rows.length === 0) return null;
  return { headers, rows };
}

// ─── Stat metrics extraction ───
interface StatMetric {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function extractStatMetrics(text: string): StatMetric[] {
  const metrics: StatMetric[] = [];
  const winRateMatch = text.match(/win\s*rate[:\s]*(\d+\.?\d*)\s*%/i);
  if (winRateMatch) {
    const val = parseFloat(winRateMatch[1]);
    metrics.push({ label: 'Win Rate', value: `${winRateMatch[1]}%`, icon: <Target className="h-4 w-4" />, color: val >= 50 ? 'text-emerald-500' : val >= 40 ? 'text-amber-500' : 'text-red-500' });
  }
  const expMatch = text.match(/expectancy[:\s]*(-?\d+\.?\d*)\s*R/i);
  if (expMatch) {
    const val = parseFloat(expMatch[1]);
    metrics.push({ label: 'Expectancy', value: `${expMatch[1]}R`, icon: <BarChart3 className="h-4 w-4" />, color: val > 0 ? 'text-emerald-500' : 'text-red-500' });
  }
  const annMatch = text.match(/annualized?\s*return[:\s]*(-?\d+\.?\d*)\s*%/i);
  if (annMatch) {
    const val = parseFloat(annMatch[1]);
    metrics.push({ label: 'Ann. Return', value: `${annMatch[1]}%`, icon: <Percent className="h-4 w-4" />, color: val > 0 ? 'text-emerald-500' : 'text-red-500' });
  }
  const tradesMatch = text.match(/(?:total\s*)?trades[:\s]*(\d[\d,]*)/i) || text.match(/sample\s*size[:\s]*(\d[\d,]*)/i);
  if (tradesMatch) {
    metrics.push({ label: 'Total Trades', value: tradesMatch[1], icon: <Hash className="h-4 w-4" />, color: 'text-muted-foreground' });
  }
  return metrics;
}

// ─── Table component with linked cells ───
function RichTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const dirIdx = headers.findIndex(h => h.toLowerCase() === 'dir' || h.toLowerCase() === 'direction');
  const tickerIdx = headers.findIndex(h => /symbol|ticker|instrument|stock|pair/i.test(h));
  const patternIdx = headers.findIndex(h => /pattern/i.test(h));

  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {headers.map((h, i) => (
                <TableHead key={i} className="text-xs font-semibold whitespace-nowrap py-2 px-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, ci) => {
                  let cellContent: React.ReactNode = cell;

                  // Parse markdown links like [Text](/path) in any cell
                  const mdLinkMatch = cell.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

                  if (ci === dirIdx) {
                    cellContent = <DirectionBadge value={cell} />;
                  } else if (mdLinkMatch) {
                    // Render markdown link as a router Link
                    cellContent = (
                      <Link to={mdLinkMatch[2]} className="text-primary hover:underline">
                        {mdLinkMatch[1]}
                      </Link>
                    );
                  } else if (ci === tickerIdx && cell.trim()) {
                    cellContent = (
                      <Link to={`/members/dashboard?instrument=${cell.trim()}`} className="text-primary font-mono font-semibold hover:underline">
                        {cell.trim()}
                      </Link>
                    );
                  } else if (ci === patternIdx && cell.trim()) {
                    const screenerId = PATTERN_SCREENER_MAP[cell.trim().toLowerCase()];
                    if (screenerId) {
                      cellContent = (
                        <Link to={`/patterns/live?pattern=${screenerId}`} className="text-primary hover:underline">
                          {cell.trim()}
                        </Link>
                      );
                    }
                  }

                  return (
                    <TableCell key={ci} className={cn("py-2 px-3 text-xs whitespace-nowrap", getMetricStyle(cell, headers[ci]))}>
                      {cellContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatCards({ metrics }: { metrics: StatMetric[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
      {metrics.map((m, i) => (
        <Card key={i} className="p-3 bg-card border">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            {m.icon}
            <span className="text-[10px] font-medium uppercase tracking-wider">{m.label}</span>
          </div>
          <p className={cn("text-lg font-bold", m.color)}>{m.value}</p>
        </Card>
      ))}
    </div>
  );
}

function ActionButtons({ buttons }: { buttons: ActionButton[] }) {
  const { t } = useTranslation();
  const copilotContext = useTradingCopilotContext();
  const handleClick = useCallback((btn: ActionButton) => {
    trackEvent('copilot.action_click', {
      label: btn.labelKey,
      destination: btn.to,
    });
    copilotContext.close();
  }, [copilotContext]);

  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
      {buttons.map((btn, i) => (
        <Link key={i} to={btn.to} onClick={() => handleClick(btn)}>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            {btn.icon}
            {t(btn.labelKey)}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </Button>
        </Link>
      ))}
    </div>
  );
}

// ─── Content segmentation ───
interface Segment {
  type: 'text' | 'table';
  content: string;
  parsed?: { headers: string[]; rows: string[][] };
}

function segmentContent(content: string): Segment[] {
  const lines = content.split('\n');
  const segments: Segment[] = [];
  let currentText: string[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  const flushText = () => {
    if (currentText.length > 0) {
      segments.push({ type: 'text', content: currentText.join('\n') });
      currentText = [];
    }
  };
  const flushTable = () => {
    if (tableLines.length > 0) {
      const parsed = parseMarkdownTable(tableLines.join('\n'));
      if (parsed) {
        segments.push({ type: 'table', content: tableLines.join('\n'), parsed });
      } else {
        currentText.push(...tableLines);
      }
      tableLines = [];
    }
  };

  for (const line of lines) {
    const isTableLine = line.trim().startsWith('|') || /^\s*[-:]+[-|\s:]+\s*$/.test(line.trim());
    if (isTableLine) {
      if (!inTable) { flushText(); inTable = true; }
      tableLines.push(line);
    } else {
      if (inTable) { flushTable(); inTable = false; }
      currentText.push(line);
    }
  }
  if (inTable) flushTable();
  flushText();
  return segments;
}

// ─── Custom markdown renderer with inline links ───
function EnrichedMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => {
          // Process text children to inject links
          const enriched = React.Children.map(children, child => {
            if (typeof child === 'string') {
              return <>{enrichTextWithLinks(child)}</>;
            }
            return child;
          });
          return <p>{enriched}</p>;
        },
        li: ({ children }) => {
          const enriched = React.Children.map(children, child => {
            if (typeof child === 'string') {
              return <>{enrichTextWithLinks(child)}</>;
            }
            return child;
          });
          return <li>{enriched}</li>;
        },
        strong: ({ children }) => {
          const enriched = React.Children.map(children, child => {
            if (typeof child === 'string') {
              return <strong>{enrichTextWithLinks(child)}</strong>;
            }
            return <strong>{child}</strong>;
          });
          return <>{enriched}</>;
        },
      }}
    >
      {content || '...'}
    </ReactMarkdown>
  );
}

// ─── Signal score explanation card ───
interface AgentScoreExplanation {
  instrument: string;
  pattern: string;
  timeframe: string;
  composite: number;
  verdict: string;
  analyst: { score: number; winRate?: number; avgR?: number; trades?: number; source?: string };
  risk: { score: number; rr?: number; kelly?: number };
  timing: { score: number; trend?: string; hasEvents?: boolean };
  portfolio: { score: number; note?: string };
}

function parseScoreExplanation(content: string): AgentScoreExplanation | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (!parsed.scoreExplanation) return null;
    return parsed.scoreExplanation as AgentScoreExplanation;
  } catch {
    return null;
  }
}

function ScoreExplanationCard({ explanation }: { explanation: AgentScoreExplanation }) {
  const verdictColor = {
    TAKE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    WATCH: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    SKIP: 'text-red-400 bg-red-400/10 border-red-400/20',
  }[explanation.verdict] ?? 'text-muted-foreground bg-muted/10 border-border';

  const agents = [
    {
      key: 'analyst',
      label: 'Analyst',
      icon: <Brain className="h-3.5 w-3.5 text-blue-400" />,
      score: explanation.analyst.score,
      detail: [
        explanation.analyst.winRate !== undefined && `Win rate ${(explanation.analyst.winRate * 100).toFixed(0)}%`,
        explanation.analyst.avgR !== undefined && `Avg R ${explanation.analyst.avgR.toFixed(2)}`,
        explanation.analyst.trades !== undefined && `${explanation.analyst.trades} trades`,
        explanation.analyst.source === 'pattern_aggregate' && '📊 Pattern avg',
        explanation.analyst.source === 'bayesian_prior' && '🔮 Estimated',
      ].filter(Boolean).join(' · '),
    },
    {
      key: 'risk',
      label: 'Risk',
      icon: <Shield className="h-3.5 w-3.5 text-amber-400" />,
      score: explanation.risk.score,
      detail: [
        explanation.risk.rr !== undefined && `R:R ${explanation.risk.rr.toFixed(1)}`,
        explanation.risk.kelly !== undefined && `Kelly ${(explanation.risk.kelly * 100).toFixed(0)}%`,
      ].filter(Boolean).join(' · '),
    },
    {
      key: 'timing',
      label: 'Timing',
      icon: <Clock className="h-3.5 w-3.5 text-purple-400" />,
      score: explanation.timing.score,
      detail: [
        explanation.timing.trend && `${explanation.timing.trend} trend`,
        explanation.timing.hasEvents !== undefined && (explanation.timing.hasEvents ? '⚠️ Events nearby' : '✅ No events'),
      ].filter(Boolean).join(' · '),
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      icon: <Briefcase className="h-3.5 w-3.5 text-emerald-400" />,
      score: explanation.portfolio.score,
      detail: explanation.portfolio.note ?? '',
    },
  ];

  return (
    <Card className="my-3 border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {explanation.instrument} · {explanation.pattern} · {explanation.timeframe}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', verdictColor)}>
            {explanation.verdict}
          </span>
          <span className="text-lg font-bold text-foreground">
            {explanation.composite.toFixed(0)}
            <span className="text-xs text-muted-foreground font-normal">/100</span>
          </span>
        </div>
      </div>
      <div className="divide-y divide-border/30">
        {agents.map((agent) => {
          const pct = Math.min(Math.max(agent.score, 0), 100);
          const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={agent.key} className="px-4 py-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                {agent.icon}
                <span className="text-xs font-medium text-foreground">{agent.label}</span>
              </div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-mono font-bold text-foreground w-8 text-right">
                {pct.toFixed(0)}
              </span>
              {agent.detail && (
                <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">
                  {agent.detail}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Confirmation question detection ───
const CONFIRM_PATTERNS = [
  /would you like (?:to|me to) apply/i,
  /shall i apply/i,
  /do you want (?:to|me to) apply/i,
  /would you like (?:to|me to) (?:proceed|continue|go ahead|make this change|update)/i,
  /shall i (?:proceed|continue|go ahead|make this change|update)/i,
  /do you want (?:to|me to) (?:proceed|continue|go ahead|make this change|update)/i,
  /ready to apply\??/i,
  /apply (?:this|these) changes?\??/i,
];

function hasConfirmationQuestion(content: string): boolean {
  return CONFIRM_PATTERNS.some(p => p.test(content));
}

function ConfirmationButtons({ onQuickReply }: { onQuickReply: (text: string) => void }) {
  const { t } = useTranslation();
  const [clicked, setClicked] = useState<string | null>(null);

  const handle = (answer: string) => {
    setClicked(answer);
    onQuickReply(answer);
  };

  if (clicked) return null;

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
      <Button
        variant="default"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => handle('Yes, apply it')}
      >
        <Check className="h-3.5 w-3.5" />
        {t('copilot.confirm.yes', 'Yes, apply')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => handle('No, don\'t apply')}
      >
        <X className="h-3.5 w-3.5" />
        {t('copilot.confirm.no', 'No, cancel')}
      </Button>
    </div>
  );
}

// ─── Main component ───
export function CopilotRichMessage({ content, onQuickReply }: CopilotRichMessageProps) {
  const cleanedContent = useMemo(() => 
    content
      .replace(/```(?:json)?\s*\{"scoreExplanation"[\s\S]*?```/g, '')
      .replace(/```(?:json)?\s*\{"(?:diff|uiSync|actionMarker|runBacktest|navigateTo|saved|undone|loaded)"[\s\S]*?```/g, '')
      .replace(/\{"(?:diff|uiSync|actionMarker)":\s*\{[\s\S]*?\}\s*\}/g, '')
      .trim(),
  [content]);
  const segments = useMemo(() => segmentContent(cleanedContent), [cleanedContent]);
  const hasTable = segments.some(s => s.type === 'table');
  const statMetrics = useMemo(() => {
    if (hasTable) return [];
    return extractStatMetrics(cleanedContent);
  }, [cleanedContent, hasTable]);
  const actionButtons = useMemo(() => extractActionButtons(cleanedContent), [cleanedContent]);
  const scoreExplanation = useMemo(() => parseScoreExplanation(content), [content]);
  const showConfirmation = useMemo(() => hasConfirmationQuestion(cleanedContent), [cleanedContent]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80 prose-headings:text-foreground">
      {scoreExplanation && <ScoreExplanationCard explanation={scoreExplanation} />}
      {statMetrics.length > 0 && <StatCards metrics={statMetrics} />}
      {segments.map((segment, i) => {
        if (segment.type === 'table' && segment.parsed) {
          return <RichTable key={i} headers={segment.parsed.headers} rows={segment.parsed.rows} />;
        }
        return <EnrichedMarkdown key={i} content={segment.content} />;
      })}
      <ActionButtons buttons={actionButtons} />
      {showConfirmation && onQuickReply && (
        <ConfirmationButtons onQuickReply={onQuickReply} />
      )}
    </div>
  );
}
