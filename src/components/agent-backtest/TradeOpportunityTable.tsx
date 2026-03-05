import React, { useMemo } from 'react';
import { AgentWeights } from '../../../engine/backtester-v2/agents/types';
import { Brain, Shield, Clock, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TradeOpportunity {
  id: string;
  symbol: string;
  pattern: string;
  direction: 'Long' | 'Short';
  timeframe: string;
  assetClass: 'stocks' | 'crypto' | 'forex' | 'commodities';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
  analystRaw: number;
  riskRaw: number;
  timingRaw: number;
  portfolioRaw: number;
}

const MOCK_TRADES: TradeOpportunity[] = [
  { id: '1', symbol: 'AAPL', pattern: 'Bull Flag', direction: 'Long', timeframe: '1D', assetClass: 'stocks', entryPrice: 189.50, stopLoss: 185.20, takeProfit: 198.40, rr: 2.1, analystRaw: 0.92, riskRaw: 0.88, timingRaw: 0.75, portfolioRaw: 0.80 },
  { id: '2', symbol: 'MSFT', pattern: 'Ascending Triangle', direction: 'Long', timeframe: '4H', assetClass: 'stocks', entryPrice: 415.00, stopLoss: 408.50, takeProfit: 432.00, rr: 2.6, analystRaw: 0.85, riskRaw: 0.72, timingRaw: 0.80, portfolioRaw: 0.65 },
  { id: '3', symbol: 'TSLA', pattern: 'Head & Shoulders', direction: 'Short', timeframe: '1D', assetClass: 'stocks', entryPrice: 245.00, stopLoss: 258.00, takeProfit: 218.00, rr: 2.1, analystRaw: 0.60, riskRaw: 0.45, timingRaw: 0.55, portfolioRaw: 0.70 },
  { id: '4', symbol: 'NVDA', pattern: 'Cup & Handle', direction: 'Long', timeframe: '1W', assetClass: 'stocks', entryPrice: 875.00, stopLoss: 840.00, takeProfit: 950.00, rr: 2.1, analystRaw: 0.95, riskRaw: 0.82, timingRaw: 0.60, portfolioRaw: 0.40 },
  { id: '5', symbol: 'META', pattern: 'Double Bottom', direction: 'Long', timeframe: '1D', assetClass: 'stocks', entryPrice: 505.00, stopLoss: 492.00, takeProfit: 535.00, rr: 2.3, analystRaw: 0.78, riskRaw: 0.90, timingRaw: 0.85, portfolioRaw: 0.75 },
  { id: '6', symbol: 'AMZN', pattern: 'Descending Wedge', direction: 'Long', timeframe: '4H', assetClass: 'stocks', entryPrice: 185.50, stopLoss: 180.00, takeProfit: 196.00, rr: 1.9, analystRaw: 0.72, riskRaw: 0.68, timingRaw: 0.40, portfolioRaw: 0.85 },
  { id: '7', symbol: 'GOOGL', pattern: 'Bear Flag', direction: 'Short', timeframe: '1D', assetClass: 'stocks', entryPrice: 152.00, stopLoss: 157.50, takeProfit: 140.00, rr: 2.2, analystRaw: 0.55, riskRaw: 0.50, timingRaw: 0.30, portfolioRaw: 0.60 },
  { id: '8', symbol: 'AMD', pattern: 'Inv Head & Shoulders', direction: 'Long', timeframe: '1D', assetClass: 'stocks', entryPrice: 165.00, stopLoss: 158.00, takeProfit: 182.00, rr: 2.4, analystRaw: 0.88, riskRaw: 0.75, timingRaw: 0.70, portfolioRaw: 0.55 },
  { id: '9', symbol: 'JPM', pattern: 'Bull Pennant', direction: 'Long', timeframe: '1D', assetClass: 'stocks', entryPrice: 198.00, stopLoss: 193.00, takeProfit: 210.00, rr: 2.4, analystRaw: 0.82, riskRaw: 0.92, timingRaw: 0.65, portfolioRaw: 0.90 },
  { id: '10', symbol: 'BTC/USD', pattern: 'Donchian Breakout', direction: 'Long', timeframe: '1H', assetClass: 'crypto', entryPrice: 67500, stopLoss: 65800, takeProfit: 71200, rr: 2.2, analystRaw: 0.70, riskRaw: 0.55, timingRaw: 0.15, portfolioRaw: 0.50 },
  { id: '11', symbol: 'ETH/USD', pattern: 'Symmetrical Triangle', direction: 'Long', timeframe: '4H', assetClass: 'crypto', entryPrice: 3450, stopLoss: 3320, takeProfit: 3720, rr: 2.1, analystRaw: 0.65, riskRaw: 0.60, timingRaw: 0.45, portfolioRaw: 0.35 },
  { id: '12', symbol: 'SPY', pattern: 'Rising Wedge', direction: 'Short', timeframe: '1D', assetClass: 'stocks', entryPrice: 510.00, stopLoss: 518.00, takeProfit: 494.00, rr: 2.0, analystRaw: 0.48, riskRaw: 0.40, timingRaw: 0.20, portfolioRaw: 0.55 },
  { id: '13', symbol: 'EUR/USD', pattern: 'Double Top', direction: 'Short', timeframe: '4H', assetClass: 'forex', entryPrice: 1.0920, stopLoss: 1.0960, takeProfit: 1.0830, rr: 2.3, analystRaw: 0.74, riskRaw: 0.80, timingRaw: 0.65, portfolioRaw: 0.70 },
  { id: '14', symbol: 'GBP/USD', pattern: 'Ascending Triangle', direction: 'Long', timeframe: '1D', assetClass: 'forex', entryPrice: 1.2680, stopLoss: 1.2620, takeProfit: 1.2800, rr: 2.0, analystRaw: 0.68, riskRaw: 0.72, timingRaw: 0.58, portfolioRaw: 0.62 },
  { id: '15', symbol: 'GOLD', pattern: 'Bull Flag', direction: 'Long', timeframe: '1D', assetClass: 'commodities', entryPrice: 2340, stopLoss: 2305, takeProfit: 2410, rr: 2.0, analystRaw: 0.80, riskRaw: 0.85, timingRaw: 0.72, portfolioRaw: 0.68 },
  { id: '16', symbol: 'OIL', pattern: 'Descending Wedge', direction: 'Long', timeframe: '4H', assetClass: 'commodities', entryPrice: 78.50, stopLoss: 76.80, takeProfit: 82.00, rr: 2.1, analystRaw: 0.62, riskRaw: 0.58, timingRaw: 0.50, portfolioRaw: 0.45 },
];

export type AssetClassFilter = 'all' | 'stocks' | 'crypto' | 'forex' | 'commodities';

interface Props {
  weights: AgentWeights;
  takeCutoff: number;
  watchCutoff: number;
  assetClassFilter?: AssetClassFilter;
}

export const TradeOpportunityTable: React.FC<Props> = ({ weights, takeCutoff, watchCutoff, assetClassFilter = 'all' }) => {
  const scoredTrades = useMemo(() => {
    const filtered = assetClassFilter === 'all' ? MOCK_TRADES : MOCK_TRADES.filter((t) => t.assetClass === assetClassFilter);
    return filtered.map((trade) => {
      const analystScore = trade.analystRaw * weights.analyst;
      const riskScore = trade.riskRaw * weights.risk;
      const timingScore = trade.timingRaw * weights.timing;
      const portfolioScore = trade.portfolioRaw * weights.portfolio;
      const composite = analystScore + riskScore + timingScore + portfolioScore;
      const verdict = composite >= takeCutoff ? 'TAKE' : composite >= watchCutoff ? 'WATCH' : 'SKIP';
      return {
        ...trade,
        analystScore,
        riskScore,
        timingScore,
        portfolioScore,
        composite,
        verdict,
      };
    }).sort((a, b) => b.composite - a.composite);
  }, [weights, takeCutoff, watchCutoff]);

  const counts = useMemo(() => {
    const c = { TAKE: 0, WATCH: 0, SKIP: 0 };
    scoredTrades.forEach((t) => c[t.verdict as keyof typeof c]++);
    return c;
  }, [scoredTrades]);

  const verdictStyles: Record<string, string> = {
    TAKE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    WATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    SKIP: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const rowBg: Record<string, string> = {
    TAKE: 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07]',
    WATCH: 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]',
    SKIP: 'opacity-40 hover:opacity-60',
  };

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">{scoredTrades.length} opportunities scanned</span>
        <span className="ml-auto" />
        <Badge variant="outline" className={verdictStyles.TAKE}>
          <TrendingUp className="h-3 w-3 mr-1" />TAKE: {counts.TAKE}
        </Badge>
        <Badge variant="outline" className={verdictStyles.WATCH}>
          <Minus className="h-3 w-3 mr-1" />WATCH: {counts.WATCH}
        </Badge>
        <Badge variant="outline" className={verdictStyles.SKIP}>
          <TrendingDown className="h-3 w-3 mr-1" />SKIP: {counts.SKIP}
        </Badge>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground text-left">
              <th className="px-3 py-2.5 font-medium">Symbol</th>
              <th className="px-3 py-2.5 font-medium">Pattern</th>
              <th className="px-3 py-2.5 font-medium text-center">Dir</th>
              <th className="px-3 py-2.5 font-medium text-center">TF</th>
              <th className="px-3 py-2.5 font-medium text-center">R:R</th>
              <th className="px-3 py-2.5 font-medium text-center">
                <Brain className="h-3 w-3 inline text-blue-400" /> Analyst
              </th>
              <th className="px-3 py-2.5 font-medium text-center">
                <Shield className="h-3 w-3 inline text-amber-400" /> Risk
              </th>
              <th className="px-3 py-2.5 font-medium text-center">
                <Clock className="h-3 w-3 inline text-purple-400" /> Timing
              </th>
              <th className="px-3 py-2.5 font-medium text-center">
                <Briefcase className="h-3 w-3 inline text-emerald-400" /> Portfolio
              </th>
              <th className="px-3 py-2.5 font-medium text-center">Score</th>
              <th className="px-3 py-2.5 font-medium text-center">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {scoredTrades.map((trade) => (
              <tr
                key={trade.id}
                className={`border-t border-border/50 transition-all duration-500 ${rowBg[trade.verdict]}`}
              >
                <td className="px-3 py-2.5 font-semibold text-foreground">{trade.symbol}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{trade.pattern}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={trade.direction === 'Long' ? 'text-emerald-400' : 'text-red-400'}>
                    {trade.direction === 'Long' ? '▲' : '▼'} {trade.direction}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">{trade.timeframe}</td>
                <td className="px-3 py-2.5 text-center font-mono">{trade.rr.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell score={trade.analystScore} max={weights.analyst} color="blue" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell score={trade.riskScore} max={weights.risk} color="amber" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell score={trade.timingScore} max={weights.timing} color="purple" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ScoreCell score={trade.portfolioScore} max={weights.portfolio} color="emerald" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`font-mono font-bold text-sm ${
                    trade.verdict === 'TAKE' ? 'text-emerald-400' :
                    trade.verdict === 'WATCH' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {trade.composite.toFixed(0)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Badge variant="outline" className={`text-[10px] ${verdictStyles[trade.verdict]}`}>
                    {trade.verdict}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ScoreCell: React.FC<{ score: number; max: number; color: string }> = ({ score, max, color }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColors: Record<string, string> = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
  };
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <div className="w-12 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="font-mono text-muted-foreground w-5 text-right">{score.toFixed(0)}</span>
    </div>
  );
};
