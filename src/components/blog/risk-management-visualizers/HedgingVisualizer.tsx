/**
 * HedgingVisualizer - Comprehensive Hedging Strategies Education
 * 
 * Professional-grade content covering:
 * - Hedging fundamentals
 * - Options hedging (protective puts, collars)
 * - Futures hedging
 * - Portfolio hedging strategies
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Shield, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Target,
  TrendingDown,
  TrendingUp,
  Umbrella
} from 'lucide-react';

export const HedgingVisualizer = () => {
  const [stockValue, setStockValue] = useState(100000);
  const [stockPrice, setStockPrice] = useState(150);
  const [putStrike, setPutStrike] = useState(140);
  const [putCost, setPutCost] = useState(3);
  const [priceDrop, setPriceDrop] = useState(20);

  const hedgeCalc = useMemo(() => {
    const shares = Math.floor(stockValue / stockPrice);
    const totalPutCost = shares * putCost;
    const dropPercent = priceDrop / 100;
    
    // Unhedged loss
    const unhedgedLoss = stockValue * dropPercent;
    
    // Hedged loss (price drops to put strike, then protected)
    const newPrice = stockPrice * (1 - dropPercent);
    let hedgedLoss = 0;
    
    if (newPrice < putStrike) {
      // Put kicks in at strike
      hedgedLoss = (stockPrice - putStrike) * shares + totalPutCost;
    } else {
      // Put worthless, full loss + premium
      hedgedLoss = (stockPrice - newPrice) * shares + totalPutCost;
    }
    
    const maxLossPercent = ((stockPrice - putStrike + putCost) / stockPrice) * 100;
    const protectionSaved = unhedgedLoss - hedgedLoss;
    
    return {
      shares,
      totalPutCost,
      unhedgedLoss,
      hedgedLoss,
      protectionSaved,
      maxLossPercent,
      breakeven: stockPrice + putCost
    };
  }, [stockValue, stockPrice, putStrike, putCost, priceDrop]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Umbrella className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Hedging Strategies: Portfolio Insurance</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Risk Protection</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Hedging is the practice of reducing or eliminating financial risk by taking offsetting positions. 
          Like insurance, hedging has a cost—but it protects against catastrophic losses. Professional 
          portfolio managers and institutions hedge routinely to manage downside exposure.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="protective-put">Protective Put</TabsTrigger>
          <TabsTrigger value="other-hedges">Other Strategies</TabsTrigger>
          <TabsTrigger value="when-to-hedge">When to Hedge</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is Hedging?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  Hedging = <span className="text-primary font-semibold">Taking a position that profits when your main position loses</span>
                </p>
              </div>

              <p className="text-muted-foreground">
                Think of hedging as buying insurance for your portfolio. You pay a premium (the cost of the hedge) 
                in exchange for protection against adverse price movements. Like all insurance, you hope you never 
                need it—but you're glad to have it when you do.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <Shield className="w-6 h-6 text-blue-400 mb-2" />
                  <h4 className="font-semibold mb-1">Full Hedge</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete protection. No loss possible, but also no gain beyond hedge cost.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Target className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="font-semibold mb-1">Partial Hedge</h4>
                  <p className="text-sm text-muted-foreground">
                    Reduces but doesn't eliminate risk. Lower cost, keeps some upside.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Activity className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="font-semibold mb-1">Dynamic Hedge</h4>
                  <p className="text-sm text-muted-foreground">
                    Adjusts hedge ratio based on market conditions. More complex.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Hedging Instruments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Hedging Instruments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Put Options</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Right to sell at strike price</li>
                    <li>• Limited cost (premium)</li>
                    <li>• Unlimited upside preserved</li>
                    <li>• Expires worthless if not needed</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Short Futures</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Obligation to sell at future date</li>
                    <li>• No premium (margin required)</li>
                    <li>• Locks in both upside and downside</li>
                    <li>• Perfect hedge if matched</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">Inverse ETFs</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Rises when index falls</li>
                    <li>• Easy to trade (no options)</li>
                    <li>• Decay over time</li>
                    <li>• Best for short-term hedging</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">VIX Calls</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Profit from volatility spike</li>
                    <li>• Tail risk protection</li>
                    <li>• Complex pricing</li>
                    <li>• "Crisis insurance"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protective Put Tab */}
        <TabsContent value="protective-put" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Protective Put Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                <p className="text-muted-foreground">
                  A <span className="text-primary font-semibold">Protective Put</span> involves buying put options 
                  to protect stock holdings. You maintain full upside potential while limiting downside to the 
                  strike price minus premium paid.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stockValue">Stock Position Value ($)</Label>
                    <Input
                      id="stockValue"
                      type="number"
                      value={stockValue}
                      onChange={(e) => setStockValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stockPrice">Current Stock Price ($)</Label>
                    <Input
                      id="stockPrice"
                      type="number"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="putStrike">Put Strike Price ($)</Label>
                    <Input
                      id="putStrike"
                      type="number"
                      value={putStrike}
                      onChange={(e) => setPutStrike(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="putCost">Put Premium ($/share)</Label>
                    <Input
                      id="putCost"
                      type="number"
                      step="0.5"
                      value={putCost}
                      onChange={(e) => setPutCost(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Simulated Price Drop: {priceDrop}%</Label>
                    <Slider
                      value={[priceDrop]}
                      onValueChange={(v) => setPriceDrop(v[0])}
                      min={5}
                      max={50}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border">
                    <p className="text-sm text-muted-foreground">Shares Held</p>
                    <p className="text-xl font-bold">{hedgeCalc.shares} shares</p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground">Total Hedge Cost</p>
                    <p className="text-xl font-bold text-blue-400">
                      ${hedgeCalc.totalPutCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((hedgeCalc.totalPutCost / stockValue) * 100).toFixed(2)}% of position
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-muted-foreground">Unhedged Loss</p>
                      <p className="text-xl font-bold text-red-400">
                        -${hedgeCalc.unhedgedLoss.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-muted-foreground">Hedged Loss</p>
                      <p className="text-xl font-bold text-green-400">
                        -${hedgeCalc.hedgedLoss.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Protection Saved</p>
                    <p className="text-xl font-bold text-primary">
                      ${hedgeCalc.protectionSaved.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-400 text-sm">
                      Max loss capped at {hedgeCalc.maxLossPercent.toFixed(1)}% of position
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Hedges Tab */}
        <TabsContent value="other-hedges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Advanced Hedging Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Collar */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-400">Popular</Badge>
                  Collar Strategy
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Buy a protective put AND sell a covered call. The call premium offsets put cost, 
                  creating low-cost or "costless" protection at the expense of capping upside.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  Collar = Long Stock + Long Put + Short Call
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-green-400">✓ Zero or low cost</div>
                  <div className="text-red-400">✗ Upside capped at call strike</div>
                </div>
              </div>

              {/* Pairs Hedge */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-purple-400 mb-2">Pairs/Sector Hedge</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Long a stock, short a correlated stock or sector ETF. Removes market risk 
                  while betting on relative performance.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  Long AAPL + Short XLK = Apple vs Tech Sector bet
                </div>
              </div>

              {/* Beta Hedge */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-green-400 mb-2">Beta Hedge</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Short index futures proportional to your portfolio's beta. A portfolio with 
                  beta 1.2 needs more short futures than one with beta 0.8.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  Futures to Short = Portfolio Value × Beta / Index Price
                </div>
              </div>

              {/* Tail Hedge */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <Badge className="bg-red-500/20 text-red-400">Advanced</Badge>
                  Tail Risk Hedge
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Buy far out-of-the-money puts or VIX calls. Cheap most of the time, but pays 
                  off massively during market crashes. Favored by Nassim Taleb's hedge fund.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  Buy 20% OTM puts OR Buy VIX calls at 25+
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* When to Hedge Tab */}
        <TabsContent value="when-to-hedge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                When Should You Hedge?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Good Times to Hedge</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Before known risk events (earnings, elections)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>After large gains you want to protect</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>When volatility is low (hedges are cheap)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Concentrated positions you can't sell</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Near retirement or with specific cash needs</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Poor Times to Hedge</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>After the market has already crashed (expensive)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>When volatility is already high (premiums elevated)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Long time horizons where decay eats returns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Well-diversified portfolios (natural hedge)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Panic hedging after losses (locking in losses)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Cost of Constant Hedging
                </p>
                <p className="text-sm text-muted-foreground">
                  Continuously hedging creates a drag on returns. A 2% annual hedge cost over 20 years 
                  reduces final portfolio value by ~33%. Hedge strategically, not constantly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Principles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Hedging Principles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Hedge before you need to—not after the storm hits",
                  "Buy hedges when volatility is low, not high",
                  "Match hedge duration to your risk horizon",
                  "Consider hedge cost as insurance premium, not wasted money",
                  "Partial hedges often make more sense than full hedges",
                  "Don't hedge diversified portfolios the same as concentrated ones"
                ].map((principle, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{principle}</span>
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

export default HedgingVisualizer;
