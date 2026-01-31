/**
 * DrawdownVisualizer - Comprehensive Drawdown Management Education
 * 
 * Industry-leading content covering:
 * - Understanding drawdowns mathematically
 * - Recovery math
 * - Psychological management
 * - Professional strategies
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingDown, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Shield,
  Target,
  Clock
} from 'lucide-react';

export const DrawdownVisualizer = () => {
  const [peakValue, setPeakValue] = useState(100000);
  const [currentValue, setCurrentValue] = useState(80000);
  const [monthlyReturn, setMonthlyReturn] = useState(5);

  const drawdownCalc = useMemo(() => {
    const drawdownPercent = ((peakValue - currentValue) / peakValue) * 100;
    const recoveryNeeded = ((peakValue - currentValue) / currentValue) * 100;
    const monthsToRecover = recoveryNeeded > 0 ? Math.ceil(recoveryNeeded / monthlyReturn) : 0;
    
    return {
      drawdownPercent,
      recoveryNeeded,
      monthsToRecover,
      dollarLoss: peakValue - currentValue
    };
  }, [peakValue, currentValue, monthlyReturn]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingDown className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Managing Trading Drawdowns</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Psychology & Risk</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Drawdowns are inevitable in trading. How you manage them—both mathematically and psychologically—
          separates successful traders from those who blow up. Every great trader has faced significant 
          drawdowns. The key is surviving them with your capital and mindset intact.
        </p>
      </div>

      <Tabs defaultValue="understanding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="understanding">Understanding</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        {/* Understanding Tab */}
        <TabsContent value="understanding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is Drawdown?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="text-lg font-mono text-center text-primary">
                  Drawdown = (Peak Value - Current Value) / Peak Value × 100%
                </pre>
              </div>

              <p className="text-muted-foreground">
                Drawdown measures the decline from a historical peak in your account value. It's the most 
                important risk metric because it shows how much pain you'll endure during losing periods.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Max Drawdown</h4>
                  <p className="text-sm text-muted-foreground">
                    The largest peak-to-trough decline ever experienced. Key metric for evaluating strategies.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Average Drawdown</h4>
                  <p className="text-sm text-muted-foreground">
                    Typical drawdown during normal trading. Helps set realistic expectations.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">Drawdown Duration</h4>
                  <p className="text-sm text-muted-foreground">
                    Time from peak to recovery. Often more psychologically damaging than depth.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Types of Drawdowns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Types of Drawdowns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Normal Variance (Expected)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 5-15% for most strategies</li>
                    <li>• Part of any trading system</li>
                    <li>• Occurs even with positive edge</li>
                    <li>• Recover in weeks to few months</li>
                  </ul>
                  <p className="text-xs text-green-400 mt-2">✓ Normal, don't change anything</p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-semibold text-amber-400 mb-2">Strategy Drawdown (Concerning)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 15-25% decline</li>
                    <li>• May indicate regime change</li>
                    <li>• Strategy may need adjustment</li>
                    <li>• Reduce size, reassess edge</li>
                  </ul>
                  <p className="text-xs text-amber-400 mt-2">⚠️ Review, possibly adapt</p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Severe Drawdown (Critical)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 25-40% decline</li>
                    <li>• Likely trading errors or broken strategy</li>
                    <li>• Stop trading, full review needed</li>
                    <li>• May take months/years to recover</li>
                  </ul>
                  <p className="text-xs text-red-400 mt-2">🛑 Stop and reassess everything</p>
                </div>

                <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/30">
                  <h4 className="font-semibold text-red-500 mb-2">Catastrophic Drawdown (Crisis)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 40%+ decline</li>
                    <li>• Account survival threatened</li>
                    <li>• Likely need to reset completely</li>
                    <li>• Recovery mathematically very difficult</li>
                  </ul>
                  <p className="text-xs text-red-500 mt-2">☠️ Major reassessment required</p>
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
                Drawdown & Recovery Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="peak">Peak Account Value ($)</Label>
                    <Input
                      id="peak"
                      type="number"
                      value={peakValue}
                      onChange={(e) => setPeakValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current">Current Account Value ($)</Label>
                    <Input
                      id="current"
                      type="number"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Expected Monthly Return: {monthlyReturn}%</Label>
                    <Slider
                      value={[monthlyReturn]}
                      onValueChange={(v) => setMonthlyReturn(v[0])}
                      min={1}
                      max={15}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    drawdownCalc.drawdownPercent < 10 ? 'bg-green-500/10 border border-green-500/30' :
                    drawdownCalc.drawdownPercent < 25 ? 'bg-amber-500/10 border border-amber-500/30' :
                    'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <p className="text-sm text-muted-foreground">Current Drawdown</p>
                    <p className={`text-3xl font-bold ${
                      drawdownCalc.drawdownPercent < 10 ? 'text-green-400' :
                      drawdownCalc.drawdownPercent < 25 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {drawdownCalc.drawdownPercent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${drawdownCalc.dollarLoss.toLocaleString()} loss from peak
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p className="text-sm text-muted-foreground">Return Needed to Recover</p>
                    <p className="text-xl font-bold text-purple-400">
                      {drawdownCalc.recoveryNeeded.toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground">Estimated Recovery Time</p>
                    <p className="text-xl font-bold text-blue-400">
                      {drawdownCalc.monthsToRecover} months
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      At {monthlyReturn}% monthly returns
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Math Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                The Asymmetry of Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Losses and gains are not symmetrical. A 50% loss requires a 100% gain to recover. 
                This is why avoiding large drawdowns is paramount.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Drawdown</th>
                      <th className="text-left py-2 px-3">Recovery Needed</th>
                      <th className="text-left py-2 px-3">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dd: 10, recovery: 11.1, diff: 'Easy' },
                      { dd: 20, recovery: 25, diff: 'Moderate' },
                      { dd: 30, recovery: 42.9, diff: 'Hard' },
                      { dd: 40, recovery: 66.7, diff: 'Very Hard' },
                      { dd: 50, recovery: 100, diff: 'Extreme' },
                      { dd: 60, recovery: 150, diff: 'Near Impossible' },
                      { dd: 75, recovery: 300, diff: 'Practically Impossible' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-muted/50">
                        <td className={`py-2 px-3 font-semibold ${
                          row.dd <= 20 ? 'text-green-400' : row.dd <= 40 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          -{row.dd}%
                        </td>
                        <td className="py-2 px-3 text-primary">+{row.recovery}%</td>
                        <td className="py-2 px-3">
                          <Badge className={
                            row.dd <= 20 ? 'bg-green-500/20 text-green-400' :
                            row.dd <= 40 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }>
                            {row.diff}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                The Psychology of Drawdowns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Emotional Cycle of Drawdowns
                </p>
                <p className="text-sm text-muted-foreground">
                  Understanding the emotional stages helps you recognize and manage them before making 
                  destructive decisions.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { stage: 'Denial', desc: '"It\'s just a normal pullback, I\'ll be back soon"', color: 'text-blue-400' },
                  { stage: 'Frustration', desc: '"Why isn\'t my strategy working? The market is wrong."', color: 'text-amber-400' },
                  { stage: 'Desperation', desc: '"I need to make it back NOW. Let me increase size..."', color: 'text-orange-400' },
                  { stage: 'Panic', desc: '"I\'m going to lose everything. Maybe I should stop trading."', color: 'text-red-400' },
                  { stage: 'Capitulation', desc: 'Quit at the worst time, often right before recovery.', color: 'text-red-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <span className={`font-semibold ${item.color} min-w-[100px]`}>{item.stage}</span>
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-semibold mb-2">The Professional Response</p>
                <p className="text-sm text-muted-foreground">
                  Professionals expect drawdowns as part of trading. They have pre-defined rules for 
                  reducing size, taking breaks, and reviewing strategy. They never increase risk to 
                  "make it back."
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Drawdown Mistakes to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Increasing position size to recover faster",
                    result: "Turns moderate drawdown into catastrophic one",
                    fix: "Reduce size during drawdowns, not increase"
                  },
                  {
                    mistake: "Abandoning strategy at the worst time",
                    result: "Locks in losses right before recovery",
                    fix: "Have pre-defined rules for when to truly stop"
                  },
                  {
                    mistake: "Switching to new untested strategies",
                    result: "Compounds losses with unfamiliar methods",
                    fix: "Stick to tested approach unless fundamentally broken"
                  },
                  {
                    mistake: "Revenge trading to make it back",
                    result: "Emotional decisions lead to larger losses",
                    fix: "Take a break, return with clear head"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-red-400/80 mt-1">→ {item.result}</p>
                    <p className="text-sm text-green-400 mt-2">✓ {item.fix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Drawdown Recovery Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                A systematic approach to recovering from drawdowns increases your chances of survival 
                and prevents emotional decision-making.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Step 1: Reduce Position Size (Immediate)</h4>
                  <p className="text-sm text-muted-foreground">
                    Cut position size by 50% during drawdown. This reduces further damage and psychological pressure.
                    Rule: At 10% DD, cut to 50% size. At 20% DD, cut to 25% size.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">Step 2: Review Trading (1-3 Days)</h4>
                  <p className="text-sm text-muted-foreground">
                    Analyze recent trades. Is this normal variance or something changed? 
                    Are you making execution errors? Has market regime shifted?
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">Step 3: Take a Break if Needed</h4>
                  <p className="text-sm text-muted-foreground">
                    If emotionally compromised, step away for days or weeks. Paper trade to confirm 
                    strategy still works before risking real money.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Step 4: Gradual Size Increase</h4>
                  <p className="text-sm text-muted-foreground">
                    Only increase size after proving strategy works at reduced size. 
                    Increase in 25% increments, not back to full immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Max Loss Rules */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Pre-Defined Max Loss Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Professional traders have pre-defined rules that trigger automatically. 
                Decide these BEFORE you need them.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Daily Max Loss
                  </h4>
                  <p className="text-2xl font-bold text-green-400">2%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stop trading for the day. No exceptions.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Weekly Max Loss
                  </h4>
                  <p className="text-2xl font-bold text-amber-400">5%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take rest of week off. Review trades.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Monthly Max Loss
                  </h4>
                  <p className="text-2xl font-bold text-red-400">10%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full review. Reduce size 50% next month.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DrawdownVisualizer;
