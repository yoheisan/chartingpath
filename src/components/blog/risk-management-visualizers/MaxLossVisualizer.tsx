/**
 * MaxLossVisualizer - Maximum Loss Rules Education
 * 
 * Professional-grade content covering:
 * - Daily/weekly/monthly loss limits
 * - Implementation strategies
 * - Circuit breaker systems
 * - Psychological benefits
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShieldOff, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  Clock,
  Shield,
  Target,
  Pause
} from 'lucide-react';

export const MaxLossVisualizer = () => {
  const [accountSize, setAccountSize] = useState(50000);
  const [dailyLimit, setDailyLimit] = useState(2);
  const [weeklyLimit, setWeeklyLimit] = useState(5);
  const [monthlyLimit, setMonthlyLimit] = useState(10);

  const limitsCalc = useMemo(() => {
    return {
      dailyDollar: accountSize * (dailyLimit / 100),
      weeklyDollar: accountSize * (weeklyLimit / 100),
      monthlyDollar: accountSize * (monthlyLimit / 100),
      dailyTrades: Math.floor((accountSize * dailyLimit / 100) / (accountSize * 0.01)), // Assuming 1% risk per trade
      weeklyTrades: Math.floor((accountSize * weeklyLimit / 100) / (accountSize * 0.01))
    };
  }, [accountSize, dailyLimit, weeklyLimit, monthlyLimit]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldOff className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Maximum Loss Rules: Your Circuit Breakers</h2>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Capital Protection</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Maximum loss rules are your circuit breakers—automatic triggers that force you to stop 
          trading before small losses become account-ending disasters. Every professional trading 
          desk has them. Individual traders need them even more.
        </p>
      </div>

      <Tabs defaultValue="concept" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="concept">Concept</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>

        {/* Concept Tab */}
        <TabsContent value="concept" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Why Max Loss Rules Exist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <p className="text-red-400 font-semibold mb-2">The Tilt Problem</p>
                <p className="text-sm text-muted-foreground">
                  After losses, traders often make worse decisions. They increase size to "make it back," 
                  take lower-quality setups, or abandon their strategy entirely. Max loss rules remove 
                  the option to continue when you're most likely to do damage.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Clock className="w-6 h-6 text-green-400 mb-2" />
                  <h4 className="font-semibold text-green-400 mb-1">Daily Max Loss</h4>
                  <p className="text-sm text-muted-foreground">
                    Stop trading for the day when limit is hit. Prevents one bad day from becoming 
                    a disaster.
                  </p>
                  <p className="text-xs text-green-400 mt-2">Typical: 2-3% of account</p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Clock className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="font-semibold text-amber-400 mb-1">Weekly Max Loss</h4>
                  <p className="text-sm text-muted-foreground">
                    Take the rest of the week off. Forces review and prevents compounding losses.
                  </p>
                  <p className="text-xs text-amber-400 mt-2">Typical: 5-6% of account</p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <Clock className="w-6 h-6 text-red-400 mb-2" />
                  <h4 className="font-semibold text-red-400 mb-1">Monthly Max Loss</h4>
                  <p className="text-sm text-muted-foreground">
                    Major circuit breaker. Requires comprehensive strategy review before resuming.
                  </p>
                  <p className="text-xs text-red-400 mt-2">Typical: 10-15% of account</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Who Uses Them */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Professional Application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-blue-500">
                  <p className="font-semibold">Prop Trading Firms</p>
                  <p className="text-sm text-muted-foreground">
                    Strict daily loss limits. Hit your limit? You're done for the day, no exceptions. 
                    Three consecutive days hitting limit? Reduced size or mandated break.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-green-500">
                  <p className="font-semibold">Hedge Funds</p>
                  <p className="text-sm text-muted-foreground">
                    Individual trader limits plus book-level limits. Portfolio managers have drawdown 
                    triggers that reduce exposure or trigger risk reviews.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-purple-500">
                  <p className="font-semibold">Market Makers</p>
                  <p className="text-sm text-muted-foreground">
                    Real-time loss monitoring with automatic position flattening if limits are breached. 
                    Technology enforces compliance, not willpower.
                  </p>
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
                Max Loss Calculator
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
                    <Label htmlFor="daily">Daily Max Loss (%)</Label>
                    <Input
                      id="daily"
                      type="number"
                      step="0.5"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="weekly">Weekly Max Loss (%)</Label>
                    <Input
                      id="weekly"
                      type="number"
                      step="0.5"
                      value={weeklyLimit}
                      onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthly">Monthly Max Loss (%)</Label>
                    <Input
                      id="monthly"
                      type="number"
                      step="1"
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-muted-foreground">Daily Limit</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${limitsCalc.dailyDollar.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~{limitsCalc.dailyTrades} trades at 1% risk each
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-muted-foreground">Weekly Limit</p>
                    <p className="text-2xl font-bold text-amber-400">
                      ${limitsCalc.weeklyDollar.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~{limitsCalc.weeklyTrades} trades at 1% risk each
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-muted-foreground">Monthly Limit</p>
                    <p className="text-2xl font-bold text-red-400">
                      ${limitsCalc.monthlyDollar.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      After this: full strategy review required
                    </p>
                  </div>

                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">Tip:</span> Write these numbers 
                      on a sticky note. When P&L hits them, you're done. No debate.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Implementing Max Loss Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 1: Set Your Limits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Daily: 2-3% (allows 2-3 full losses at 1% risk)</li>
                    <li>• Weekly: 5-6% (about 2-3 bad days)</li>
                    <li>• Monthly: 10-15% (serious drawdown territory)</li>
                    <li>• Quarterly: 20-25% (major strategy review trigger)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 2: Create Enforcement Mechanisms</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Write limits on physical sticky note visible during trading</li>
                    <li>• Set broker alerts at limit levels</li>
                    <li>• Tell accountability partner your limits</li>
                    <li>• Log out of platform when limit hit (remove temptation)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 3: Define Actions at Each Level</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><span className="text-green-400">Daily hit:</span> Stop trading, journal session, return tomorrow</li>
                    <li><span className="text-amber-400">Weekly hit:</span> No trading until Monday, review all week's trades</li>
                    <li><span className="text-red-400">Monthly hit:</span> 1 week break minimum, strategy review, paper trade first</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Gradual Reduction System
                </p>
                <p className="text-sm text-muted-foreground">
                  Instead of binary on/off, some traders reduce size progressively:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• At 50% of daily limit: reduce size by 50%</li>
                  <li>• At 75% of daily limit: reduce size by 75%</li>
                  <li>• At 100% of limit: done for the day</li>
                </ul>
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
                The Psychology Behind Max Loss Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Why We Need External Limits
                </p>
                <p className="text-sm text-muted-foreground">
                  In the heat of losing, our brain tells us we can "fix" things by trading more. 
                  We feel we're one trade away from getting back to even. This feeling is almost 
                  always wrong, and acting on it makes things worse. Max loss rules remove the 
                  decision from your emotional brain.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Without Max Loss Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• "One more trade to get even"</li>
                    <li>• "I'll double down to recover faster"</li>
                    <li>• "The market owes me"</li>
                    <li>• "I can't end the day down"</li>
                    <li>• Small loss → Catastrophic loss</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">With Max Loss Rules</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• "I hit my limit, I'm done"</li>
                    <li>• "Tomorrow is a new day"</li>
                    <li>• "I protected my capital"</li>
                    <li>• "I followed my rules"</li>
                    <li>• Small loss → Tomorrow's opportunity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Benefits Beyond Capital Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Reduces decision fatigue—you know exactly when to stop",
                  "Preserves mental capital for tomorrow",
                  "Forces review and learning instead of revenge trading",
                  "Builds discipline and rule-following behavior",
                  "Reduces overall account volatility",
                  "Improves long-term consistency and survival"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
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

export default MaxLossVisualizer;
