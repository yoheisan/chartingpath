/**
 * PositionSizingVisualizer - Comprehensive Position Sizing Education
 * 
 * Industry-leading educational content based on:
 * - Van K. Tharp's position sizing methodology
 * - Ralph Vince's optimal f theory
 * - Professional trading desk risk frameworks
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
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Target,
  DollarSign,
  BarChart3,
  Lightbulb,
  BookOpen,
  Users,
  Activity,
  PieChart
} from 'lucide-react';

interface PositionCalculation {
  positionSize: number;
  riskAmount: number;
  stopLossDistance: number;
  maxLoss: number;
  percentOfAccount: number;
}

export const PositionSizingVisualizer = () => {
  // Interactive calculator state
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(150);
  const [stopLoss, setStopLoss] = useState(145);

  const calculation = useMemo<PositionCalculation>(() => {
    const riskAmount = accountSize * (riskPercent / 100);
    const stopLossDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = stopLossDistance > 0 ? Math.floor(riskAmount / stopLossDistance) : 0;
    const maxLoss = positionSize * stopLossDistance;
    const percentOfAccount = (positionSize * entryPrice / accountSize) * 100;
    
    return {
      positionSize,
      riskAmount,
      stopLossDistance,
      maxLoss,
      percentOfAccount
    };
  }, [accountSize, riskPercent, entryPrice, stopLoss]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Position Sizing: The Foundation of Risk Management</h2>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Capital Preservation</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Position sizing determines how much capital you allocate to each trade. It is the single most important 
          factor in determining long-term trading success—more important than entry signals, indicators, or even 
          win rate. Master this, and you master the key to surviving and thriving in the markets.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          {/* The Core Principle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                The Core Principle: Risk Per Trade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-lg font-semibold text-blue-400 mb-2">The 1-2% Rule</p>
                <p className="text-muted-foreground">
                  Professional traders typically risk between 0.5% and 2% of their total trading capital on any single trade. 
                  This isn't arbitrary—it's mathematically derived from the probability of ruin calculations and ensures 
                  survival through inevitable losing streaks.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Why 1-2% Works</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>10 consecutive losses = only 10-20% drawdown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Allows for statistical edge to play out</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Reduces emotional decision-making</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Preserves capital for recovery</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Why Overleveraging Fails</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>5% risk × 5 losses = 25% drawdown</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Requires 33% gain just to break even</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Emotional pressure leads to revenge trading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Account can't survive normal variance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Position Sizing Formula */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                The Universal Position Sizing Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-6 rounded-lg">
                <pre className="text-lg font-mono text-center text-primary">
                  Position Size = (Account × Risk%) ÷ (Entry - Stop Loss)
                </pre>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <DollarSign className="w-6 h-6 text-green-400 mb-2" />
                  <h4 className="font-semibold mb-1">Account Value</h4>
                  <p className="text-sm text-muted-foreground">
                    Your total trading capital. Use only risk capital—never money needed for living expenses.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Target className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="font-semibold mb-1">Risk Percentage</h4>
                  <p className="text-sm text-muted-foreground">
                    The maximum you're willing to lose on this trade. Typically 0.5-2% for most traders.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Shield className="w-6 h-6 text-red-400 mb-2" />
                  <h4 className="font-semibold mb-1">Stop Distance</h4>
                  <p className="text-sm text-muted-foreground">
                    The price difference between your entry and stop loss. This should be based on market structure.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Math */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                The Mathematics of Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Understanding drawdown recovery math is crucial. Losses are not symmetrical with gains—the deeper 
                the hole, the harder it is to climb out.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-4">Account Loss</th>
                      <th className="text-left py-2 px-4">Gain Required to Recover</th>
                      <th className="text-left py-2 px-4">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-4 text-green-400">10%</td>
                      <td className="py-2 px-4">11.1%</td>
                      <td className="py-2 px-4"><Badge className="bg-green-500/20 text-green-400">Manageable</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-4 text-yellow-400">20%</td>
                      <td className="py-2 px-4">25%</td>
                      <td className="py-2 px-4"><Badge className="bg-yellow-500/20 text-yellow-400">Challenging</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-4 text-orange-400">30%</td>
                      <td className="py-2 px-4">42.9%</td>
                      <td className="py-2 px-4"><Badge className="bg-orange-500/20 text-orange-400">Difficult</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-4 text-red-400">50%</td>
                      <td className="py-2 px-4">100%</td>
                      <td className="py-2 px-4"><Badge className="bg-red-500/20 text-red-400">Severe</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-red-600">75%</td>
                      <td className="py-2 px-4">300%</td>
                      <td className="py-2 px-4"><Badge className="bg-red-600/20 text-red-500">Near Impossible</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Insight
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This is why proper position sizing is more important than finding "perfect" entries. 
                  A 50% win rate with proper sizing beats a 70% win rate with oversized positions.
                </p>
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
                Interactive Position Size Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account">Account Size ($)</Label>
                    <Input
                      id="account"
                      type="number"
                      value={accountSize}
                      onChange={(e) => setAccountSize(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Risk Per Trade: {riskPercent}%</Label>
                    <Slider
                      value={[riskPercent]}
                      onValueChange={(v) => setRiskPercent(v[0])}
                      min={0.25}
                      max={5}
                      step={0.25}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Conservative (0.25%)</span>
                      <span>Aggressive (5%)</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="entry">Entry Price ($)</Label>
                    <Input
                      id="entry"
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stop">Stop Loss Price ($)</Label>
                    <Input
                      id="stop"
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Position Size</p>
                    <p className="text-3xl font-bold text-primary">{calculation.positionSize} shares</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm text-muted-foreground">Dollar Risk</p>
                      <p className="text-xl font-bold text-green-400">${calculation.riskAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-muted-foreground">Max Loss</p>
                      <p className="text-xl font-bold text-red-400">${calculation.maxLoss.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-muted-foreground">Stop Distance</p>
                      <p className="text-xl font-bold text-blue-400">${calculation.stopLossDistance.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <p className="text-sm text-muted-foreground">% of Account</p>
                      <p className="text-xl font-bold text-purple-400">{calculation.percentOfAccount.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {calculation.percentOfAccount > 25 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-400 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Warning: Position exceeds 25% of account. Consider a wider stop or smaller risk %.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practical Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Real-World Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Swing Trade (AAPL)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Account: $100,000</li>
                    <li>Risk: 1% ($1,000)</li>
                    <li>Entry: $175</li>
                    <li>Stop: $170 ($5 risk)</li>
                    <li className="text-primary font-semibold">Position: 200 shares</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Day Trade (SPY)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Account: $25,000</li>
                    <li>Risk: 0.5% ($125)</li>
                    <li>Entry: $450</li>
                    <li>Stop: $449.50 ($0.50 risk)</li>
                    <li className="text-primary font-semibold">Position: 250 shares</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Forex (EUR/USD)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Account: $10,000</li>
                    <li>Risk: 2% ($200)</li>
                    <li>Entry: 1.0850</li>
                    <li>Stop: 1.0820 (30 pips)</li>
                    <li className="text-primary font-semibold">Position: 0.67 lots</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-400" />
                Position Sizing Methods Compared
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fixed Dollar Method */}
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-400">Beginner</Badge>
                  Fixed Dollar Risk
                </h4>
                <p className="text-muted-foreground mb-3">
                  Risk the same dollar amount on every trade regardless of account size changes.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-3">
                  Position Size = Fixed $ Risk ÷ Stop Distance
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-sm">
                    <span className="text-green-400">✓</span> Simple to calculate
                    <br /><span className="text-green-400">✓</span> Consistent risk exposure
                  </div>
                  <div className="text-sm">
                    <span className="text-red-400">✗</span> Doesn't scale with account growth
                    <br /><span className="text-red-400">✗</span> May become too aggressive as account shrinks
                  </div>
                </div>
              </div>

              {/* Fixed Percentage Method */}
              <div className="p-4 rounded-lg border border-primary/30">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary">Recommended</Badge>
                  Fixed Percentage Risk
                </h4>
                <p className="text-muted-foreground mb-3">
                  Risk a fixed percentage of current account balance. This is the industry standard.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-3">
                  Position Size = (Account × Risk%) ÷ Stop Distance
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-sm">
                    <span className="text-green-400">✓</span> Scales with account size
                    <br /><span className="text-green-400">✓</span> Automatically reduces risk in drawdowns
                    <br /><span className="text-green-400">✓</span> Compounds gains effectively
                  </div>
                  <div className="text-sm">
                    <span className="text-red-400">✗</span> Requires recalculation each trade
                    <br /><span className="text-red-400">✗</span> Can slow growth after drawdowns
                  </div>
                </div>
              </div>

              {/* Volatility-Based Method */}
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-400">Advanced</Badge>
                  Volatility-Adjusted (ATR-Based)
                </h4>
                <p className="text-muted-foreground mb-3">
                  Size positions inversely to market volatility using Average True Range.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-3">
                  Position Size = (Account × Risk%) ÷ (ATR × Multiplier)
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-sm">
                    <span className="text-green-400">✓</span> Adapts to market conditions
                    <br /><span className="text-green-400">✓</span> Equalizes risk across different volatility regimes
                    <br /><span className="text-green-400">✓</span> Better stop loss placement
                  </div>
                  <div className="text-sm">
                    <span className="text-red-400">✗</span> More complex to calculate
                    <br /><span className="text-red-400">✗</span> Requires understanding of ATR
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Psychology Tab */}
        <TabsContent value="psychology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                The Psychology of Position Sizing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Position sizing isn't just math—it's psychology. The right size keeps you emotionally balanced 
                and able to follow your trading plan regardless of outcome.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Right-Sized Position</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Can sleep at night without checking phone</li>
                    <li>• Don't feel urge to move stop loss</li>
                    <li>• Can take the loss without emotional reaction</li>
                    <li>• Trade feels "boring" rather than exciting</li>
                    <li>• Can focus on execution, not P&L</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Over-Sized Position</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Constantly checking the trade</li>
                    <li>• Heart racing during drawdowns</li>
                    <li>• Tempted to exit early or move stops</li>
                    <li>• Trade feels thrilling or terrifying</li>
                    <li>• Obsessing over every tick</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  The "Sleep Test"
                </p>
                <p className="text-sm text-muted-foreground">
                  If your current position size would prevent you from sleeping well if the trade went against you, 
                  it's too big. Reduce until you reach emotional neutrality. Your best trades will come when you're 
                  calm and detached from the outcome.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Common Position Sizing Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Sizing up after winning streak",
                    consequence: "One big loss wipes out multiple wins",
                    fix: "Keep risk % constant regardless of recent performance"
                  },
                  {
                    mistake: "Not adjusting for volatility",
                    consequence: "Normal market moves trigger stops too often",
                    fix: "Use ATR-based stops and position sizing"
                  },
                  {
                    mistake: "Averaging down without plan",
                    consequence: "Doubling exposure on losing trade",
                    fix: "Pre-define scaling rules before entering"
                  },
                  {
                    mistake: "Risking more on 'high conviction' trades",
                    consequence: "Overconfidence leads to larger losses",
                    fix: "Treat all trades equally—let statistics work"
                  },
                  {
                    mistake: "Ignoring correlation risk",
                    consequence: "Multiple correlated positions = hidden risk",
                    fix: "Count sector/correlation exposure as one trade"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{item.mistake}</p>
                        <p className="text-sm text-red-400 mt-1">{item.consequence}</p>
                        <p className="text-sm text-green-400 mt-1">Fix: {item.fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Insights from Professional Traders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-blue-500">
                  <p className="italic text-muted-foreground mb-2">
                    "Position sizing is the single most important factor in my trading success. I could give away 
                    all my entry signals and still make money because I know how to size positions correctly."
                  </p>
                  <p className="text-sm font-semibold">— Van K. Tharp, Trading Psychologist</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-green-500">
                  <p className="italic text-muted-foreground mb-2">
                    "Risk 1% of your capital on each trade. If you have 10 losing trades in a row, you still 
                    have 90% of your capital. That's how professionals think about survival."
                  </p>
                  <p className="text-sm font-semibold">— Mark Douglas, Author of "Trading in the Zone"</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-purple-500">
                  <p className="italic text-muted-foreground mb-2">
                    "The goal of a successful trader is to make the best trades. Money is secondary. If this 
                    surprises you, think about it this way: You can't make money if you've already blown up."
                  </p>
                  <p className="text-sm font-semibold">— Alexander Elder, Author of "Trading for a Living"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kelly Criterion Preview */}
          <Card className="border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                Kelly Criterion: Optimal Position Sizing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Kelly Criterion is a mathematical formula for optimal bet sizing developed by John Kelly at 
                Bell Labs. While theoretically optimal, most professional traders use "fractional Kelly" (25-50% 
                of full Kelly) to reduce volatility.
              </p>

              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="font-mono text-center text-lg text-purple-400">
                  Kelly % = W - [(1-W) / R]
                </pre>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Where W = Win Rate, R = Win/Loss Ratio
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="font-semibold text-purple-400 mb-2">Example Calculation</p>
                <p className="text-sm text-muted-foreground">
                  Win Rate: 55% | Average Win: $200 | Average Loss: $100 (R = 2)
                  <br />
                  Kelly = 0.55 - [(1 - 0.55) / 2] = 0.55 - 0.225 = <span className="text-purple-400 font-semibold">32.5%</span>
                  <br />
                  <br />
                  Half-Kelly (recommended): <span className="text-purple-400 font-semibold">16.25%</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PositionSizingVisualizer;
