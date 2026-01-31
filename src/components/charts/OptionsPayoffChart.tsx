/**
 * OptionsPayoffChart - Professional P&L Payoff Diagram for Options Strategies
 * 
 * Designed for educational content showing:
 * - P&L curves at expiration vs current value
 * - Strike prices and break-even points
 * - Max profit/loss zones
 * - Greeks impact visualization
 * 
 * Based on best practices from tastytrade, Option Alpha, and ProjectOption
 */

import { useMemo, memo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, Shield, Clock, Activity } from 'lucide-react';

export type OptionsStrategyType = 
  | 'covered-call'
  | 'iron-condor'
  | 'straddle'
  | 'strangle'
  | 'butterfly'
  | 'calendar-spread'
  | 'delta-neutral'
  | 'gamma-scalp'
  | 'long-call'
  | 'long-put'
  | 'bull-call-spread'
  | 'bear-put-spread';

export interface OptionsPayoffConfig {
  strategy: OptionsStrategyType;
  stockPrice: number;
  strikes: number[];
  premium: number;
  daysToExpiration?: number;
  title?: string;
  description?: string;
}

interface PayoffPoint {
  stockPrice: number;
  expirationPL: number;
  currentPL: number;
  label?: string;
}

interface StrategyMetrics {
  maxProfit: number | 'unlimited';
  maxLoss: number | 'unlimited';
  breakevens: number[];
  outlook: string;
  timeDecayEffect: 'positive' | 'negative' | 'neutral';
  direction: 'bullish' | 'bearish' | 'neutral';
}

// Calculate payoff for different strategies
function calculatePayoff(
  config: OptionsPayoffConfig,
  pricePoint: number
): { expiration: number; current: number } {
  const { strategy, stockPrice, strikes, premium, daysToExpiration = 30 } = config;
  const timeDecayFactor = Math.max(0, 1 - (daysToExpiration / 45)); // Simplified theta decay

  switch (strategy) {
    case 'covered-call': {
      const [strike] = strikes;
      const stockPL = pricePoint - stockPrice;
      const callPL = pricePoint > strike ? -(pricePoint - strike) + premium : premium;
      const expPL = stockPL + callPL;
      const currPL = expPL * (0.3 + 0.7 * timeDecayFactor) + premium * (1 - timeDecayFactor);
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'iron-condor': {
      const [longPut, shortPut, shortCall, longCall] = strikes.sort((a, b) => a - b);
      const width = shortPut - longPut;
      let expPL = premium; // Start with credit received

      if (pricePoint <= longPut) {
        expPL = -(width - premium);
      } else if (pricePoint < shortPut) {
        expPL = premium - (shortPut - pricePoint);
      } else if (pricePoint <= shortCall) {
        expPL = premium;
      } else if (pricePoint < longCall) {
        expPL = premium - (pricePoint - shortCall);
      } else {
        expPL = -(width - premium);
      }

      const currPL = expPL * 0.4 + premium * 0.6 * (1 - timeDecayFactor);
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'straddle': {
      const [strike] = strikes;
      const distance = Math.abs(pricePoint - strike);
      const expPL = distance - premium;
      const currPL = distance * 0.5 - premium * timeDecayFactor;
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'strangle': {
      const [lowerStrike, upperStrike] = strikes.sort((a, b) => a - b);
      let intrinsic = 0;
      if (pricePoint < lowerStrike) {
        intrinsic = lowerStrike - pricePoint;
      } else if (pricePoint > upperStrike) {
        intrinsic = pricePoint - upperStrike;
      }
      const expPL = intrinsic - premium;
      const currPL = intrinsic * 0.5 - premium * timeDecayFactor;
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'butterfly': {
      const [lower, middle, upper] = strikes.sort((a, b) => a - b);
      const width = middle - lower;
      let expPL = -premium; // Debit paid

      if (pricePoint <= lower || pricePoint >= upper) {
        expPL = -premium;
      } else if (pricePoint < middle) {
        expPL = (pricePoint - lower) - premium;
      } else {
        expPL = (upper - pricePoint) - premium;
      }

      const currPL = expPL * 0.3 - premium * 0.3 * (1 - timeDecayFactor);
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'calendar-spread': {
      const [strike] = strikes;
      const distance = Math.abs(pricePoint - strike);
      // Calendar spreads profit from time decay differential
      const timeValue = premium * 0.5 * (1 - (distance / stockPrice) * 2);
      const expPL = -premium + Math.max(0, premium * 0.3 - distance * 0.5);
      const currPL = timeValue * (1 - timeDecayFactor * 0.5);
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'delta-neutral':
    case 'gamma-scalp': {
      const [strike] = strikes;
      // Delta neutral profits from volatility/movement
      const movement = Math.abs(pricePoint - stockPrice);
      const scalingProfit = movement * 0.2 - premium * 0.5;
      return { expiration: scalingProfit * 100, current: scalingProfit * 0.7 * 100 };
    }

    case 'long-call': {
      const [strike] = strikes;
      const intrinsic = Math.max(0, pricePoint - strike);
      const expPL = intrinsic - premium;
      const currPL = intrinsic * 0.6 + (premium * 0.4 * (1 - timeDecayFactor)) - premium;
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'long-put': {
      const [strike] = strikes;
      const intrinsic = Math.max(0, strike - pricePoint);
      const expPL = intrinsic - premium;
      const currPL = intrinsic * 0.6 + (premium * 0.4 * (1 - timeDecayFactor)) - premium;
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'bull-call-spread': {
      const [lowerStrike, upperStrike] = strikes.sort((a, b) => a - b);
      const width = upperStrike - lowerStrike;
      let expPL: number;

      if (pricePoint <= lowerStrike) {
        expPL = -premium;
      } else if (pricePoint >= upperStrike) {
        expPL = width - premium;
      } else {
        expPL = (pricePoint - lowerStrike) - premium;
      }

      const currPL = expPL * 0.4 + (width * 0.3 - premium) * (1 - timeDecayFactor);
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    case 'bear-put-spread': {
      const [lowerStrike, upperStrike] = strikes.sort((a, b) => a - b);
      const width = upperStrike - lowerStrike;
      let expPL: number;

      if (pricePoint >= upperStrike) {
        expPL = -premium;
      } else if (pricePoint <= lowerStrike) {
        expPL = width - premium;
      } else {
        expPL = (upperStrike - pricePoint) - premium;
      }

      const currPL = expPL * 0.4 + (width * 0.3 - premium) * (1 - timeDecayFactor);
      return { expiration: expPL * 100, current: currPL * 100 };
    }

    default:
      return { expiration: 0, current: 0 };
  }
}

// Get strategy characteristics
function getStrategyMetrics(config: OptionsPayoffConfig): StrategyMetrics {
  const { strategy, stockPrice, strikes, premium } = config;

  switch (strategy) {
    case 'covered-call':
      return {
        maxProfit: (strikes[0] - stockPrice + premium) * 100,
        maxLoss: (stockPrice - premium) * 100,
        breakevens: [stockPrice - premium],
        outlook: 'Moderately bullish to neutral',
        timeDecayEffect: 'positive',
        direction: 'bullish',
      };

    case 'iron-condor': {
      const sortedStrikes = [...strikes].sort((a, b) => a - b);
      const width = sortedStrikes[1] - sortedStrikes[0];
      return {
        maxProfit: premium * 100,
        maxLoss: (width - premium) * 100,
        breakevens: [sortedStrikes[1] - premium, sortedStrikes[2] + premium],
        outlook: 'Range-bound, low volatility expected',
        timeDecayEffect: 'positive',
        direction: 'neutral',
      };
    }

    case 'straddle':
      return {
        maxProfit: 'unlimited',
        maxLoss: premium * 100,
        breakevens: [strikes[0] - premium, strikes[0] + premium],
        outlook: 'Expecting significant price movement either direction',
        timeDecayEffect: 'negative',
        direction: 'neutral',
      };

    case 'strangle': {
      const sortedStrikes = [...strikes].sort((a, b) => a - b);
      return {
        maxProfit: 'unlimited',
        maxLoss: premium * 100,
        breakevens: [sortedStrikes[0] - premium, sortedStrikes[1] + premium],
        outlook: 'Expecting large price movement either direction',
        timeDecayEffect: 'negative',
        direction: 'neutral',
      };
    }

    case 'butterfly': {
      const sortedStrikes = [...strikes].sort((a, b) => a - b);
      const width = sortedStrikes[1] - sortedStrikes[0];
      return {
        maxProfit: (width - premium) * 100,
        maxLoss: premium * 100,
        breakevens: [sortedStrikes[0] + premium, sortedStrikes[2] - premium],
        outlook: 'Price to stay near middle strike at expiration',
        timeDecayEffect: 'positive',
        direction: 'neutral',
      };
    }

    case 'calendar-spread':
      return {
        maxProfit: premium * 100 * 0.5,
        maxLoss: premium * 100,
        breakevens: [strikes[0]],
        outlook: 'Expecting stock to stay near strike, volatility increase',
        timeDecayEffect: 'positive',
        direction: 'neutral',
      };

    case 'delta-neutral':
    case 'gamma-scalp':
      return {
        maxProfit: 'unlimited',
        maxLoss: premium * 100,
        breakevens: [],
        outlook: 'Profits from price movement regardless of direction',
        timeDecayEffect: 'negative',
        direction: 'neutral',
      };

    case 'long-call':
      return {
        maxProfit: 'unlimited',
        maxLoss: premium * 100,
        breakevens: [strikes[0] + premium],
        outlook: 'Bullish - expecting upward price movement',
        timeDecayEffect: 'negative',
        direction: 'bullish',
      };

    case 'long-put':
      return {
        maxProfit: (strikes[0] - premium) * 100,
        maxLoss: premium * 100,
        breakevens: [strikes[0] - premium],
        outlook: 'Bearish - expecting downward price movement',
        timeDecayEffect: 'negative',
        direction: 'bearish',
      };

    case 'bull-call-spread': {
      const sortedStrikes = [...strikes].sort((a, b) => a - b);
      const width = sortedStrikes[1] - sortedStrikes[0];
      return {
        maxProfit: (width - premium) * 100,
        maxLoss: premium * 100,
        breakevens: [sortedStrikes[0] + premium],
        outlook: 'Moderately bullish with defined risk',
        timeDecayEffect: 'neutral',
        direction: 'bullish',
      };
    }

    case 'bear-put-spread': {
      const sortedStrikes = [...strikes].sort((a, b) => a - b);
      const width = sortedStrikes[1] - sortedStrikes[0];
      return {
        maxProfit: (width - premium) * 100,
        maxLoss: premium * 100,
        breakevens: [sortedStrikes[1] - premium],
        outlook: 'Moderately bearish with defined risk',
        timeDecayEffect: 'neutral',
        direction: 'bearish',
      };
    }

    default:
      return {
        maxProfit: 0,
        maxLoss: 0,
        breakevens: [],
        outlook: '',
        timeDecayEffect: 'neutral',
        direction: 'neutral',
      };
  }
}

// Format strategy name for display
function formatStrategyName(strategy: OptionsStrategyType): string {
  const names: Record<OptionsStrategyType, string> = {
    'covered-call': 'Covered Call',
    'iron-condor': 'Iron Condor',
    'straddle': 'Long Straddle',
    'strangle': 'Long Strangle',
    'butterfly': 'Butterfly Spread',
    'calendar-spread': 'Calendar Spread',
    'delta-neutral': 'Delta Neutral',
    'gamma-scalp': 'Gamma Scalping',
    'long-call': 'Long Call',
    'long-put': 'Long Put',
    'bull-call-spread': 'Bull Call Spread',
    'bear-put-spread': 'Bear Put Spread',
  };
  return names[strategy] || strategy;
}

const OptionsPayoffChart = memo(({
  config,
  height = 400,
  showMetrics = true,
}: {
  config: OptionsPayoffConfig;
  height?: number;
  showMetrics?: boolean;
}) => {
  const { stockPrice, strikes, premium, daysToExpiration = 30 } = config;

  // Generate payoff data points
  const payoffData = useMemo(() => {
    const minPrice = stockPrice * 0.7;
    const maxPrice = stockPrice * 1.3;
    const step = (maxPrice - minPrice) / 60;
    const data: PayoffPoint[] = [];

    for (let price = minPrice; price <= maxPrice; price += step) {
      const { expiration, current } = calculatePayoff(config, price);
      data.push({
        stockPrice: Math.round(price * 100) / 100,
        expirationPL: Math.round(expiration * 100) / 100,
        currentPL: Math.round(current * 100) / 100,
      });
    }

    return data;
  }, [config, stockPrice]);

  const metrics = useMemo(() => getStrategyMetrics(config), [config]);

  // Find min/max for chart bounds
  const yMin = Math.min(...payoffData.map(d => Math.min(d.expirationPL, d.currentPL)));
  const yMax = Math.max(...payoffData.map(d => Math.max(d.expirationPL, d.currentPL)));
  const yPadding = Math.abs(yMax - yMin) * 0.15;

  const formatCurrency = (value: number) => {
    if (value >= 0) return `+$${value.toFixed(0)}`;
    return `-$${Math.abs(value).toFixed(0)}`;
  };

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {config.title || `${formatStrategyName(config.strategy)} Payoff Diagram`}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={metrics.direction === 'bullish' ? 'default' : metrics.direction === 'bearish' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {metrics.direction === 'bullish' ? <TrendingUp className="h-3 w-3" /> : 
               metrics.direction === 'bearish' ? <TrendingDown className="h-3 w-3" /> : 
               <Activity className="h-3 w-3" />}
              {metrics.direction.charAt(0).toUpperCase() + metrics.direction.slice(1)}
            </Badge>
            <Badge 
              variant={metrics.timeDecayEffect === 'positive' ? 'default' : metrics.timeDecayEffect === 'negative' ? 'outline' : 'secondary'}
              className="flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />
              Theta: {metrics.timeDecayEffect === 'positive' ? '+' : metrics.timeDecayEffect === 'negative' ? '−' : '○'}
            </Badge>
          </div>
        </div>
        {config.description && (
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        )}
      </CardHeader>

      <CardContent className="p-4">
        {/* Chart */}
        <div style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={payoffData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.5}
              />

              <XAxis
                dataKey="stockPrice"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(v) => `$${v}`}
                label={{ 
                  value: 'Stock Price at Expiration', 
                  position: 'bottom', 
                  offset: 0,
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                }}
              />

              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={formatCurrency}
                label={{ 
                  value: 'Profit / Loss', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                }}
                domain={[yMin - yPadding, yMax + yPadding]}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(v) => `Stock: $${v}`}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'expirationPL' ? 'At Expiration' : 'Current P/L'
                ]}
              />

              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>
                    {value === 'expirationPL' ? 'P/L at Expiration' : 'Current P/L'}
                  </span>
                )}
              />

              {/* Zero line */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />

              {/* Current stock price line */}
              <ReferenceLine
                x={stockPrice}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: `Current: $${stockPrice}`,
                  position: 'top',
                  fill: 'hsl(var(--primary))',
                  fontSize: 11,
                }}
              />

              {/* Strike price lines */}
              {strikes.map((strike, i) => (
                <ReferenceLine
                  key={strike}
                  x={strike}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  label={{
                    value: `$${strike}`,
                    position: 'top',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                  }}
                />
              ))}

              {/* Break-even lines */}
              {metrics.breakevens.map((be, i) => (
                <ReferenceLine
                  key={`be-${be}`}
                  x={be}
                  stroke="hsl(var(--warning, 45 93% 47%))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              ))}

              {/* Current P/L curve (thinner, shows time value) */}
              <Line
                type="monotone"
                dataKey="currentPL"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
              />

              {/* Expiration P/L curve (main curve) */}
              <Line
                type="monotone"
                dataKey="expirationPL"
                stroke="hsl(var(--foreground))"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Panel */}
        {showMetrics && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                Max Profit
              </div>
              <div className="font-semibold text-green-500">
                {metrics.maxProfit === 'unlimited' ? 'Unlimited' : `$${metrics.maxProfit.toFixed(0)}`}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Shield className="h-3.5 w-3.5 text-red-500" />
                Max Loss
              </div>
              <div className="font-semibold text-red-500">
                {metrics.maxLoss === 'unlimited' ? 'Unlimited' : `$${metrics.maxLoss.toFixed(0)}`}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Target className="h-3.5 w-3.5 text-amber-500" />
                Break-even
              </div>
              <div className="font-semibold text-amber-500">
                {metrics.breakevens.length === 0 
                  ? 'N/A' 
                  : metrics.breakevens.map(b => `$${b.toFixed(0)}`).join(' / ')
                }
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Premium
              </div>
              <div className="font-semibold text-primary">
                ${(premium * 100).toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {/* Outlook */}
        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Market Outlook</div>
          <div className="text-sm font-medium">{metrics.outlook}</div>
        </div>
      </CardContent>
    </Card>
  );
});

OptionsPayoffChart.displayName = 'OptionsPayoffChart';

export default OptionsPayoffChart;
export { getStrategyMetrics, formatStrategyName };
