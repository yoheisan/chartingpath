/**
 * MartingaleVisualizer - Comprehensive Martingale Analysis
 * 
 * Industry-leading educational content covering:
 * - Historical origins and mathematics
 * - Why it fails in trading
 * - Safer alternatives
 * - Anti-Martingale approach
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Calculator, 
  XCircle,
  CheckCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Skull,
  Shield
} from 'lucide-react';

export const MartingaleVisualizer = () => {
  const [initialBet, setInitialBet] = useState(100);
  const [accountSize, setAccountSize] = useState(10000);
  const [lossingStreak, setLosingStreak] = useState(5);

  const martingaleCalc = useMemo(() => {
    const bets: number[] = [];
    let totalLoss = 0;
    
    for (let i = 0; i < lossingStreak; i++) {
      const bet = initialBet * Math.pow(2, i);
      bets.push(bet);
      totalLoss += bet;
    }
    
    const nextBet = initialBet * Math.pow(2, lossingStreak);
    const accountPercentUsed = (totalLoss / accountSize) * 100;
    const maxLossesBeforeBust = Math.floor(Math.log2(accountSize / initialBet)) + 1;
    
    return {
      bets,
      totalLoss,
      nextBet,
      accountPercentUsed,
      maxLossesBeforeBust,
      isBusted: totalLoss >= accountSize
    };
  }, [initialBet, accountSize, lossingStreak]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skull className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Martingale Strategy: A Path to Ruin</h2>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">High Risk</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The Martingale system is the most dangerous betting strategy ever conceived. It appears to offer 
          guaranteed profits but conceals catastrophic risk. Understanding why it fails is essential 
          knowledge for every trader. This system has bankrupted more gamblers and traders than any other.
        </p>
      </div>

      <Tabs defaultValue="what" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="what">What Is It</TabsTrigger>
          <TabsTrigger value="math">The Math</TabsTrigger>
          <TabsTrigger value="why-fails">Why It Fails</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        {/* What Is It Tab */}
        <TabsContent value="what" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                The Martingale System Explained
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <p className="text-red-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warning: This Strategy Will Eventually Destroy Your Account
                </p>
                <p className="text-sm text-muted-foreground">
                  The Martingale is presented here for educational purposes. Do not use it. Every experienced 
                  trader will tell you: Martingale works until it doesn't—and when it stops working, you lose everything.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-3">The Basic Rules</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Start with a base bet (e.g., $100)</li>
                  <li>2. If you lose, double your bet</li>
                  <li>3. Keep doubling after each loss</li>
                  <li>4. When you win, return to base bet</li>
                  <li>5. Each win recovers all losses + original profit</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" />
                  Historical Origins
                </p>
                <p className="text-sm text-muted-foreground">
                  Named after John Henry Martindale, an 18th-century London casino owner who encouraged 
                  gamblers to use this system. Ironically, the system benefited the casino, not the gamblers. 
                  Casinos loved it because it guaranteed eventual ruin.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why It Seems Attractive */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Why It Seems Attractive (The Trap)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Appears to Offer:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• "Guaranteed" profits</li>
                    <li>• Simple, mechanical rules</li>
                    <li>• Works most of the time</li>
                    <li>• Mathematical "proof" of success</li>
                    <li>• Consistent small wins</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Actually Delivers:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Guaranteed eventual ruin</li>
                    <li>• Exponentially increasing risk</li>
                    <li>• Catastrophic rare losses</li>
                    <li>• Account destruction</li>
                    <li>• Psychological trauma</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Math Tab */}
        <TabsContent value="math" className="space-y-6">
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-red-400" />
                Martingale Calculator: See The Destruction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="initial">Initial Bet ($)</Label>
                    <Input
                      id="initial"
                      type="number"
                      value={initialBet}
                      onChange={(e) => setInitialBet(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

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
                    <Label htmlFor="losses">Losing Streak Length</Label>
                    <Input
                      id="losses"
                      type="number"
                      min={1}
                      max={15}
                      value={lossingStreak}
                      onChange={(e) => setLosingStreak(Math.min(15, Number(e.target.value)))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${martingaleCalc.isBusted ? 'bg-red-600/20 border border-red-500' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                    <p className="text-sm text-muted-foreground">Total Lost After {lossingStreak} Losses</p>
                    <p className={`text-3xl font-bold ${martingaleCalc.isBusted ? 'text-red-500' : 'text-amber-400'}`}>
                      ${martingaleCalc.totalLoss.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {martingaleCalc.accountPercentUsed.toFixed(1)}% of account
                    </p>
                    {martingaleCalc.isBusted && (
                      <p className="text-red-500 font-semibold mt-2 flex items-center gap-2">
                        <Skull className="w-4 h-4" />
                        ACCOUNT DESTROYED
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p className="text-sm text-muted-foreground">Next Bet Required</p>
                    <p className="text-xl font-bold text-purple-400">
                      ${martingaleCalc.nextBet.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-muted-foreground">Max Losses Before Bust</p>
                    <p className="text-xl font-bold text-red-400">
                      {martingaleCalc.maxLossesBeforeBust} consecutive losses
                    </p>
                  </div>
                </div>
              </div>

              {/* Bet Progression */}
              <div>
                <Label className="mb-2 block">Bet Progression (Losses 1-{lossingStreak})</Label>
                <div className="flex flex-wrap gap-2">
                  {martingaleCalc.bets.map((bet, idx) => (
                    <div key={idx} className={`px-3 py-2 rounded text-sm font-mono ${
                      bet > accountSize * 0.25 ? 'bg-red-500/20 text-red-400' : 'bg-muted'
                    }`}>
                      #{idx + 1}: ${bet.toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Probability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Probability of Ruin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                With a fair coin flip (50% odds), the probability of a losing streak occurring:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Losing Streak</th>
                      <th className="text-left py-2 px-3">Probability (Single)</th>
                      <th className="text-left py-2 px-3">Expected in 1000 Trades</th>
                      <th className="text-left py-2 px-3">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">5 losses</td>
                      <td className="py-2 px-3">3.13%</td>
                      <td className="py-2 px-3">~31 times</td>
                      <td className="py-2 px-3"><Badge className="bg-yellow-500/20 text-yellow-400">Common</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">7 losses</td>
                      <td className="py-2 px-3">0.78%</td>
                      <td className="py-2 px-3">~8 times</td>
                      <td className="py-2 px-3"><Badge className="bg-orange-500/20 text-orange-400">Regular</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">10 losses</td>
                      <td className="py-2 px-3">0.10%</td>
                      <td className="py-2 px-3">~1 time</td>
                      <td className="py-2 px-3"><Badge className="bg-red-500/20 text-red-400">Inevitable</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">12 losses</td>
                      <td className="py-2 px-3">0.024%</td>
                      <td className="py-2 px-3">~0.24 times</td>
                      <td className="py-2 px-3"><Badge className="bg-red-600/20 text-red-500">Very Likely</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">The Fatal Flaw</p>
                <p className="text-sm text-muted-foreground">
                  You will trade more than 1000 times in your career. A 10-loss streak isn't unlikely—it's 
                  statistically guaranteed if you trade long enough. And with Martingale, that one streak 
                  destroys everything.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Why It Fails Tab */}
        <TabsContent value="why-fails" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Why Martingale Always Fails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Finite Capital vs. Infinite Losses",
                  detail: "You have limited money. The potential losing streak is unlimited. Eventually, you can't afford the next double.",
                  icon: TrendingDown
                },
                {
                  title: "Broker/Exchange Limits",
                  detail: "Position size limits, margin requirements, and table maximums prevent you from doubling indefinitely.",
                  icon: AlertTriangle
                },
                {
                  title: "Exponential Growth",
                  detail: "Bet sizes grow at 2^n. After 10 losses on a $100 start, you need $102,400 for the next bet. After 15: $3.2 million.",
                  icon: Activity
                },
                {
                  title: "Psychological Breaking Point",
                  detail: "Even if you have the capital, can you actually place a $100,000 bet after losing $100,000? Most can't.",
                  icon: Skull
                },
                {
                  title: "No Edge Created",
                  detail: "Martingale doesn't create an edge—it just manipulates bet sizes. The underlying win rate is unchanged.",
                  icon: Calculator
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Real Failures */}
          <Card className="border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-500" />
                Famous Martingale Disasters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border-l-4 border-red-500">
                <p className="font-semibold mb-1">Charles Wells - "The Man Who Broke the Bank at Monte Carlo" (1891)</p>
                <p className="text-sm text-muted-foreground">
                  Initially won 1 million francs using Martingale. Returned multiple times and eventually 
                  lost everything. Died penniless.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border-l-4 border-red-500">
                <p className="font-semibold mb-1">LTCM - Long-Term Capital Management (1998)</p>
                <p className="text-sm text-muted-foreground">
                  Nobel laureates used a form of Martingale with bond arbitrage. Lost $4.6 billion in 
                  months when correlations broke down. Required Federal Reserve intervention.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border-l-4 border-red-500">
                <p className="font-semibold mb-1">Forex Martingale EAs</p>
                <p className="text-sm text-muted-foreground">
                  Countless automated trading systems using Martingale show steady profits for months, 
                  then blow up spectacularly. Graveyards of Forex forums are filled with them.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alternatives Tab */}
        <TabsContent value="alternatives" className="space-y-6">
          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Safe Alternatives to Martingale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Fixed Fractional Position Sizing
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Risk a fixed percentage (1-2%) of your account on every trade. Simple, sustainable, used by professionals.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Position size decreases after losses</li>
                  <li>✓ Position size increases after wins</li>
                  <li>✓ Mathematically impossible to blow up</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Anti-Martingale (Reverse Martingale)
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Double after wins, not losses. Reduce after losses. Captures winning streaks, limits losses.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Risks profits, not capital</li>
                  <li>✓ Exploits hot streaks</li>
                  <li>✓ Preserves capital during drawdowns</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Kelly Criterion
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Mathematically optimal sizing based on your actual edge. Maximizes geometric growth.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Proven optimal for long-term growth</li>
                  <li>✓ Sizes positions based on actual edge</li>
                  <li>✓ Used by professional hedge funds</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Key Takeaway */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                The Ultimate Lesson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-amber-400">No position sizing system can turn a losing strategy profitable.</span>
                  <br /><br />
                  If you don't have an edge, no bet sizing will save you. Focus on developing an actual edge 
                  first (good entries, proper risk management, market understanding), then use sensible 
                  position sizing to maximize that edge.
                  <br /><br />
                  Martingale doesn't create edge—it just concentrates risk until destruction.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MartingaleVisualizer;
