import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, BarChart3, Percent, Hash } from 'lucide-react';

interface CopilotRichMessageProps {
  content: string;
}

// Detect if a value is a positive/negative metric for color coding
function getMetricStyle(value: string, header: string): string {
  const lowerHeader = header.toLowerCase();
  const numMatch = value.match(/^-?\d+\.?\d*/);
  if (!numMatch) return '';

  const num = parseFloat(numMatch[0]);

  // Win rate coloring
  if (lowerHeader.includes('win') && lowerHeader.includes('rate')) {
    if (num >= 50) return 'text-emerald-500 font-semibold';
    if (num >= 40) return 'text-amber-500 font-semibold';
    return 'text-red-500 font-semibold';
  }

  // Return / PnL / Expectancy coloring
  if (
    lowerHeader.includes('return') ||
    lowerHeader.includes('pnl') ||
    lowerHeader.includes('exp') ||
    lowerHeader.includes('profit') ||
    lowerHeader.includes('expectancy')
  ) {
    if (num > 0) return 'text-emerald-500 font-semibold';
    if (num < 0) return 'text-red-500 font-semibold';
    return 'text-muted-foreground';
  }

  // R-multiple coloring
  if (value.endsWith('R') || lowerHeader.includes('(r)')) {
    if (num > 0) return 'text-emerald-500 font-semibold';
    if (num < 0) return 'text-red-500 font-semibold';
  }

  return '';
}

// Detect direction badge
function DirectionBadge({ value }: { value: string }) {
  const lower = value.toLowerCase().trim();
  if (lower === 'long') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-500">
        <TrendingUp className="h-3 w-3" />
        Long
      </span>
    );
  }
  if (lower === 'short') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-500">
        <TrendingDown className="h-3 w-3" />
        Short
      </span>
    );
  }
  return <span>{value}</span>;
}

// Parse a markdown table string into headers + rows
function parseMarkdownTable(tableStr: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableStr.trim().split('\n').filter(l => l.trim());
  if (lines.length < 3) return null;

  // Check for separator line (---|---|---)
  const sepIdx = lines.findIndex(l => /^\|?\s*[-:]+[-|\s:]+\s*\|?$/.test(l));
  if (sepIdx < 1) return null;

  const parseLine = (line: string): string[] =>
    line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);

  const headers = parseLine(lines[sepIdx - 1]);
  const rows = lines.slice(sepIdx + 1).map(parseLine).filter(r => r.length === headers.length);

  if (headers.length < 2 || rows.length === 0) return null;
  return { headers, rows };
}

// Extract stat-card worthy metrics from text
interface StatMetric {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function extractStatMetrics(text: string): StatMetric[] {
  const metrics: StatMetric[] = [];

  // Win Rate pattern
  const winRateMatch = text.match(/win\s*rate[:\s]*(\d+\.?\d*)\s*%/i);
  if (winRateMatch) {
    const val = parseFloat(winRateMatch[1]);
    metrics.push({
      label: 'Win Rate',
      value: `${winRateMatch[1]}%`,
      icon: <Target className="h-4 w-4" />,
      color: val >= 50 ? 'text-emerald-500' : val >= 40 ? 'text-amber-500' : 'text-red-500',
    });
  }

  // Expectancy pattern
  const expMatch = text.match(/expectancy[:\s]*(-?\d+\.?\d*)\s*R/i);
  if (expMatch) {
    const val = parseFloat(expMatch[1]);
    metrics.push({
      label: 'Expectancy',
      value: `${expMatch[1]}R`,
      icon: <BarChart3 className="h-4 w-4" />,
      color: val > 0 ? 'text-emerald-500' : 'text-red-500',
    });
  }

  // Annualized Return
  const annMatch = text.match(/annualized?\s*return[:\s]*(-?\d+\.?\d*)\s*%/i);
  if (annMatch) {
    const val = parseFloat(annMatch[1]);
    metrics.push({
      label: 'Ann. Return',
      value: `${annMatch[1]}%`,
      icon: <Percent className="h-4 w-4" />,
      color: val > 0 ? 'text-emerald-500' : 'text-red-500',
    });
  }

  // Total Trades / Sample Size
  const tradesMatch = text.match(/(?:total\s*)?trades[:\s]*(\d[\d,]*)/i) || text.match(/sample\s*size[:\s]*(\d[\d,]*)/i);
  if (tradesMatch) {
    metrics.push({
      label: 'Total Trades',
      value: tradesMatch[1],
      icon: <Hash className="h-4 w-4" />,
      color: 'text-muted-foreground',
    });
  }

  return metrics;
}

// Rich table component
function RichTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const dirIdx = headers.findIndex(h => h.toLowerCase() === 'dir' || h.toLowerCase() === 'direction');

  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {headers.map((h, i) => (
                <TableHead key={i} className="text-xs font-semibold whitespace-nowrap py-2 px-3">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, ci) => (
                  <TableCell key={ci} className={cn("py-2 px-3 text-xs whitespace-nowrap", getMetricStyle(cell, headers[ci]))}>
                    {ci === dirIdx ? <DirectionBadge value={cell} /> : cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Stat cards row
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

// Split content into segments: text blocks and table blocks
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
      if (!inTable) {
        flushText();
        inTable = true;
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        flushTable();
        inTable = false;
      }
      currentText.push(line);
    }
  }

  if (inTable) flushTable();
  flushText();

  return segments;
}

export function CopilotRichMessage({ content }: CopilotRichMessageProps) {
  const segments = useMemo(() => segmentContent(content), [content]);

  // Extract stat metrics from the full text (only show if no table present — avoids duplication)
  const hasTable = segments.some(s => s.type === 'table');
  const statMetrics = useMemo(() => {
    if (hasTable) return []; // Tables already show the data
    return extractStatMetrics(content);
  }, [content, hasTable]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80 prose-headings:text-foreground">
      {statMetrics.length > 0 && <StatCards metrics={statMetrics} />}
      {segments.map((segment, i) => {
        if (segment.type === 'table' && segment.parsed) {
          return <RichTable key={i} headers={segment.parsed.headers} rows={segment.parsed.rows} />;
        }
        return (
          <ReactMarkdown key={i}>{segment.content || '...'}</ReactMarkdown>
        );
      })}
    </div>
  );
}
