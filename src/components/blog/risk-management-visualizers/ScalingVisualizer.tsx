/**
 * ScalingVisualizer - Position Scaling Education
 * 
 * Professional-grade content covering:
 * - Scaling into positions (pyramiding)
 * - Scaling out (partial profit taking)
 * - Anti-Martingale approaches
 * - Professional scaling strategies
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Layers, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Lightbulb,
  BarChart3,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ScaleEntry {
  price: number;
  shares: number;
  totalShares: number;
  avgCost: number;
  positionValue: number;
}

export const ScalingVisualizer = () => {
  const [initialPrice, setInitialPrice] = useState(100);
  const [initialShares, setInitialShares] = useState(100);
  const [addPrice1, setAddPrice1] = useState(105);
  const [addShares1, setAddShares1] = useState(50);
  const [addPrice2, setAddPrice2] = useState(110);
  const [addShares2, setAddShares2] = useState(25);

  const scalingCalc = useMemo(() => {
    const entries: ScaleEntry[] = [];
    
    // Initial entry
    let totalShares = initialShares;
    let totalCost = initialPrice * initialShares;
    entries.push({
      price: initialPrice,
      shares: initialShares,
      totalShares,
      avgCost: initialPrice,
      positionValue: totalShares * initialPrice
    });
    
    // First add
    totalShares += addShares1;
    totalCost += addPrice1 * addShares1;
    entries.push({
      price: addPrice1,
      shares: addShares1,
      totalShares,
      avgCost: totalCost / totalShares,
      positionValue: totalShares * addPrice1
    });
    
    // Second add
    totalShares += addShares2;
    totalCost += addPrice2 * addShares2;
    entries.push({
      price: addPrice2,
      shares: addShares2,
      totalShares,
      avgCost: totalCost / totalShares,
      positionValue: totalShares * addPrice2
    });
    
    // Calculate profit at current price (highest entry)
    const currentPrice = addPrice2;
    const unrealizedProfit = (totalShares * currentPrice) - totalCost;
    const profitPercent = (unrealizedProfit / totalCost) * 100;
    
    return {
      entries,
      totalShares,
      totalCost,
      avgCost: totalCost / totalShares,
      currentValue: totalShares * currentPrice,
      unrealizedProfit,
      profitPercent
    };
  }, [initialPrice, initialShares, addPrice1, addShares1, addPrice2, addShares2]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Scaling Into and Out of Positions</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Position Management</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Scaling is the art of building and reducing positions incrementally rather than all at once. 
          Pyramiding adds to winners while they're working. Partial exits lock in profits while letting 
          runners run. Master these techniques to optimize your risk-adjusted returns.
        </p>
      </div>

      <Tabs defaultValue="pyramiding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="pyramiding">Pyramiding</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="scaling-out">Scaling Out</TabsTrigger>
          <TabsTrigger value="rules">Rules & Mistakes</TabsTrigger>
        </TabsList>

        {/* Pyramiding Tab */}
        <TabsContent value="pyramiding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Pyramiding: Adding to Winners
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  <span className="text-primary font-semibold">Pyramiding</span> = Adding to positions as they move in your favor
                </p>
              </div>

              <p className="text-muted-foreground">
                The Turtle Traders made pyramiding famous. Instead of entering full size immediately, they 
                would add to positions as the trade proved correct. This keeps risk small initially and 
                increases exposure only when the market confirms your thesis.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <ArrowUp className="w-4 h-4" />
                    Upward Pyramid (Standard)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Start with smaller position</li>
                    <li>• Add as price rises and confirms trend</li>
                    <li>• Each add is smaller than the last</li>
                    <li>• Move stop to breakeven after adds</li>
                  </ul>
                  <p className="text-xs text-green-400 mt-2">Used by: Trend followers, momentum traders</p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <ArrowDown className="w-4 h-4" />
                    Downward Pyramid (Averaging Down)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Add as price moves against you</li>
                    <li>• Lowers average cost</li>
                    <li>• Increases risk dramatically</li>
                    <li>• Can lead to catastrophic losses</li>
                  </ul>
                  <p className="text-xs text-red-400 mt-2">Warning: Professional traders rarely average down</p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  The Turtle Trading Pyramid Rules
                </p>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Initial position: 1 unit (1% account risk)</li>
                  <li>2. Add 1 unit at each 1/2 ATR move in your favor</li>
                  <li>3. Maximum 4 units per market</li>
                  <li>4. Stop loss at 2 ATR from entry for all units</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Pyramid Shapes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Pyramid Shape Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <div className="flex flex-col items-center mb-2">
                    <div className="w-16 h-3 bg-primary mb-1"></div>
                    <div className="w-12 h-3 bg-primary/70 mb-1"></div>
                    <div className="w-8 h-3 bg-primary/40"></div>
                  </div>
                  <h4 className="font-semibold text-primary">Standard Pyramid</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Largest position first, smaller adds. Most conservative.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Example: 100, 50, 25 shares</p>
                </div>

                <div className="p-4 rounded-lg border bg-card text-center">
                  <div className="flex flex-col items-center mb-2">
                    <div className="w-12 h-3 bg-blue-400 mb-1"></div>
                    <div className="w-12 h-3 bg-blue-400/70 mb-1"></div>
                    <div className="w-12 h-3 bg-blue-400/40"></div>
                  </div>
                  <h4 className="font-semibold text-blue-400">Equal Weight</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Same size on each add. Moderate approach.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Example: 50, 50, 50 shares</p>
                </div>

                <div className="p-4 rounded-lg border bg-card text-center">
                  <div className="flex flex-col items-center mb-2">
                    <div className="w-8 h-3 bg-purple-400 mb-1"></div>
                    <div className="w-12 h-3 bg-purple-400/70 mb-1"></div>
                    <div className="w-16 h-3 bg-purple-400/40"></div>
                  </div>
                  <h4 className="font-semibold text-purple-400">Inverted Pyramid</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Smallest first, largest last. Most aggressive.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Example: 25, 50, 100 shares</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Pyramiding Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Entry 1 (Initial)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={initialPrice}
                          onChange={(e) => setInitialPrice(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Shares</Label>
                        <Input
                          type="number"
                          value={initialShares}
                          onChange={(e) => setInitialShares(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Entry 2 (First Add)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={addPrice1}
                          onChange={(e) => setAddPrice1(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Shares</Label>
                        <Input
                          type="number"
                          value={addShares1}
                          onChange={(e) => setAddShares1(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Entry 3 (Second Add)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={addPrice2}
                          onChange={(e) => setAddPrice2(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Shares</Label>
                        <Input
                          type="number"
                          value={addShares2}
                          onChange={(e) => setAddShares2(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Total Position</p>
                    <p className="text-2xl font-bold text-primary">{scalingCalc.totalShares} shares</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg Cost: ${scalingCalc.avgCost.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground">Total Invested</p>
                    <p className="text-xl font-bold text-blue-400">
                      ${scalingCalc.totalCost.toLocaleString()}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${scalingCalc.unrealizedProfit >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                    <p className={`text-xl font-bold ${scalingCalc.unrealizedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${scalingCalc.unrealizedProfit.toFixed(2)} ({scalingCalc.profitPercent.toFixed(1)}%)
                    </p>
                  </div>

                  {/* Entry Breakdown */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Entry Breakdown</p>
                    {scalingCalc.entries.map((entry, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b border-muted/50 last:border-0">
                        <span>Entry {idx + 1}: {entry.shares} @ ${entry.price}</span>
                        <span className="text-muted-foreground">Avg: ${entry.avgCost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scaling Out Tab */}
        <TabsContent value="scaling-out" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Scaling Out: Locking In Profits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Scaling out involves taking partial profits as the trade moves in your favor. This 
                locks in gains while keeping exposure for potential larger moves. It's a psychological 
                tool that makes it easier to let winners run.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">1/3-1/3-1/3 Method</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sell 1/3 at 1R profit</li>
                    <li>• Sell 1/3 at 2R profit</li>
                    <li>• Let final 1/3 run with trailing stop</li>
                  </ul>
                  <p className="text-xs text-green-400 mt-2">Balanced approach for swing traders</p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Half-Off at 1R</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Sell 50% at 1:1 risk-reward</li>
                    <li>• Move stop to breakeven</li>
                    <li>• Remaining 50% is a "free trade"</li>
                  </ul>
                  <p className="text-xs text-blue-400 mt-2">Conservative, psychological benefit</p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">Target-Based Exit</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 25% at first target (support/resistance)</li>
                    <li>• 25% at second target</li>
                    <li>• 50% at final target or trailing stop</li>
                  </ul>
                  <p className="text-xs text-purple-400 mt-2">Technical analysis approach</p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">All-or-Nothing</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Hold entire position to target</li>
                    <li>• Exit 100% at stop or target</li>
                    <li>• Simple but emotionally harder</li>
                  </ul>
                  <p className="text-xs text-amber-400 mt-2">For disciplined traders with clear targets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tips */}
          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-green-400" />
                Scaling Out Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Take first profits early to secure gains and reduce anxiety",
                  "Move stop to breakeven after first scale-out",
                  "Let final portion run with trailing stop—this captures big moves",
                  "Pre-plan all exit levels before entering the trade",
                  "Don't add to a position you're already scaling out of"
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Professional Scaling Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Scaling In Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Only add to winning positions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Each add should be smaller than the last</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Have maximum position size rule</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Trail stop on existing position when adding</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 mb-2">Scaling Out Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Pre-plan exit levels before entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Move stop to breakeven after first exit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Keep final portion for outsized gains</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Use trailing stops on final portion</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Scaling Mistakes to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Averaging down on losers",
                    consequence: "Turning small losses into catastrophic ones",
                    fix: "Only add to winners, never losers"
                  },
                  {
                    mistake: "Adding full size on each pyramid",
                    consequence: "Average cost rises too fast, risk explodes",
                    fix: "Each add should be smaller: 100%, 50%, 25%"
                  },
                  {
                    mistake: "Scaling out entire position at first target",
                    consequence: "Missing the best part of winning trades",
                    fix: "Keep 25-50% for the big move"
                  },
                  {
                    mistake: "No maximum position size rule",
                    consequence: "Overconcentration in single position",
                    fix: "Never exceed 10-15% of account in one trade"
                  },
                  {
                    mistake: "Emotional adds/exits",
                    consequence: "Adding at highs, exiting at lows",
                    fix: "Pre-plan all scale points before entry"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-red-400/80 mt-1">→ {item.consequence}</p>
                    <p className="text-sm text-green-400 mt-2">✓ {item.fix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScalingVisualizer;
