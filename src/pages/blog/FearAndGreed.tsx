import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const FearAndGreed = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Overcoming Fear and Greed: The Trader's Greatest Enemies
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Understand and control the two emotions that destroy more trading accounts than any technical mistake or bad strategy ever could.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                The Fear and Greed Cycle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Fear and greed are hardwired survival mechanisms that served our ancestors well but wreak havoc on modern trading performance. These emotions create a vicious cycle that traps traders in self-destructive patterns.
              </p>
              <p>
                Markets are designed to exploit these emotions. When you are most afraid, it is often the best time to buy. When you are most greedy, it is usually time to sell. Understanding this paradox is crucial for trading success.
              </p>
              <p className="font-semibold text-foreground">
                Core Principle: Your emotions are your enemy. The market rewards those who can act against their instincts.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Understanding Fear in Trading</h2>
          
          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                How Fear Manifests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Fear of Losing Money</h3>
                <p className="mb-2">The most common fear that causes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Hesitation to enter valid setups</li>
                  <li>Taking profits too early</li>
                  <li>Moving stop losses to avoid getting stopped out</li>
                  <li>Revenge trading to quickly recover losses</li>
                  <li>Analysis paralysis and missed opportunities</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Fear of Missing Out (FOMO)</h3>
                <p className="mb-2">Creates impulsive behavior like:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Entering trades without proper setup</li>
                  <li>Chasing price after missing initial entry</li>
                  <li>Overtrading to not miss opportunities</li>
                  <li>Taking trades outside your strategy</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Fear of Being Wrong</h3>
                <p className="mb-2">Ego-driven fear leading to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Refusing to cut losses (not admitting mistake)</li>
                  <li>Adding to losing positions (averaging down)</li>
                  <li>Blaming the market or others for losses</li>
                  <li>Not following stop losses</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Understanding Greed in Trading</h2>
          
          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TrendingUp className="h-5 w-5" />
                How Greed Manifests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Wanting More Profit</h3>
                <p className="mb-2">Insatiable desire for gains causes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Not taking profits at predetermined targets</li>
                  <li>Letting winners turn into losers</li>
                  <li>Risking too much per trade for bigger gains</li>
                  <li>Overtrading after winning streaks</li>
                  <li>Using excessive leverage</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Get Rich Quick Mentality</h3>
                <p className="mb-2">Unrealistic profit expectations leading to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Taking excessive risks</li>
                  <li>Trading higher position sizes than appropriate</li>
                  <li>Gambling behavior instead of strategic trading</li>
                  <li>Ignoring risk management rules</li>
                  <li>Account blow-ups from overleveraging</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Overconfidence After Wins</h3>
                <p className="mb-2">Success-induced greed causes:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Increasing position sizes too quickly</li>
                  <li>Taking lower quality setups</li>
                  <li>Deviating from proven strategy</li>
                  <li>Believing you cannot lose</li>
                  <li>Giving back all profits plus more</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">The Fear-Greed Trader Lifecycle</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Typical Pattern (The Emotional Rollercoaster)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <p className="font-semibold text-foreground">Stage 1: Initial Success (Greed Rising)</p>
                  <p className="text-sm">Beginner luck or small wins build false confidence. Trader believes trading is easy money. Starts increasing position sizes and risk.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground">Stage 2: First Major Loss (Fear Enters)</p>
                  <p className="text-sm">Overconfidence leads to big loss. Fear sets in. Trader becomes hesitant and starts missing good setups out of fear.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground">Stage 3: Revenge Trading (Greed Returns)</p>
                  <p className="text-sm">Desperate to recover losses quickly. Takes impulsive, oversized trades. Breaks all rules trying to get back to even.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground">Stage 4: Deeper Drawdown (Fear Dominates)</p>
                  <p className="text-sm">Revenge trades fail. Account in significant drawdown. Paralyzed by fear or continues destructive pattern. May blow up account.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground">Stage 5: Capitulation or Growth</p>
                  <p className="text-sm">Either quits trading or finally learns emotional control. Those who succeed move past emotions to mechanical execution.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Strategies to Overcome Fear</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Accept Losses as Part of the Game</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Reframe your relationship with losses:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Losses are the cost of doing business (like rent for a shop)</li>
                  <li>No strategy wins 100% of the time</li>
                  <li>Your edge comes from consistency over 100+ trades</li>
                  <li>A perfectly executed losing trade is still a good trade</li>
                </ul>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Affirmation: I accept this loss as one outcome in a series of probabilistic events.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Risk Only What You Can Afford to Lose</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Fear intensifies when too much is at stake:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Never trade with money needed for bills or living expenses</li>
                  <li>Risk only 1-2% per trade maximum</li>
                  <li>If a loss would cause emotional distress, your size is too big</li>
                  <li>Trade smaller until losses do not affect you emotionally</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Use Demo Account First</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Build confidence through practice:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Practice strategy on demo until consistently profitable</li>
                  <li>Experience losses without financial pain</li>
                  <li>Develop trust in your strategy through repetition</li>
                  <li>Transition to live with smallest possible size</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">4. Mechanical Rule Following</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Remove decision-making in the moment:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Predefine all entry, exit, and stop loss criteria</li>
                  <li>Use alerts or automation when possible</li>
                  <li>Never make in-trade adjustments</li>
                  <li>If setup meets criteria, you must take it (no fear)</li>
                </ul>
                <p className="mt-3 text-sm">
                  The decision was made when you created your rules. Execution is just following the plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">5. Focus on Process, Not Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Judge yourself on execution, not results:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Did you follow your rules? Success.</li>
                  <li>Did you execute your plan flawlessly? Success.</li>
                  <li>The outcome is irrelevant to this trade</li>
                  <li>Track discipline score, not just profit/loss</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Strategies to Overcome Greed</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Set Realistic Profit Targets</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Combat greed with predetermined exits:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Calculate profit targets before entering trade</li>
                  <li>Place limit orders at target levels</li>
                  <li>Scale out at multiple targets (e.g., 50% at 2R, 50% at 3R)</li>
                  <li>Never move targets further away in-trade</li>
                </ul>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Remember: A profit taken is better than a profit given back.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Maximum Position Size Limits</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Prevent overleveraging:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Never risk more than 2% on any single trade</li>
                  <li>Cap total portfolio risk at 6% across all positions</li>
                  <li>Do not increase size after winning streaks</li>
                  <li>Scale up position sizes gradually over months, not days</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Regular Profit Withdrawals</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Lock in gains to prevent giving them back:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Withdraw 25-50% of monthly profits</li>
                  <li>Psychologically satisfying (tangible success)</li>
                  <li>Prevents risking accumulated gains</li>
                  <li>Forces disciplined capital management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">4. Daily and Weekly Trade Limits</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Prevent overtrading driven by greed:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Set maximum number of trades per day (3-5 for day trading)</li>
                  <li>Set maximum number of trades per week (5-10 for swing trading)</li>
                  <li>Once limit reached, stop trading regardless of opportunity</li>
                  <li>Forces quality over quantity</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">5. Post-Win Cooling Period</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Prevent overconfidence after big wins:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>After a big win (5R+), take mandatory 24-hour break</li>
                  <li>After 3 consecutive wins, take 1-2 hour break</li>
                  <li>Use break to journal and review, not to find next trade</li>
                  <li>Return to trading with fresh perspective</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                The Neutral Mindset: Beyond Fear and Greed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Professional traders operate from a state of emotional neutrality - neither fearful nor greedy, simply executing their edge mechanically.
              </p>
              
              <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                <p className="font-semibold text-foreground">Characteristics of Neutral Mindset:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Same reaction to wins and losses (neutral observation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>No emotional attachment to individual trades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Focus on process execution, not profit targets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Comfortable sitting out when no valid setups exist</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Think in probabilities, not certainties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Accept uncertainty as inherent to trading</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4">
                <p className="font-semibold text-foreground mb-2">How to Develop Neutral Mindset:</p>
                <ol className="space-y-2 text-sm">
                  <li><strong className="text-foreground">1.</strong> Practice meditation or mindfulness daily</li>
                  <li><strong className="text-foreground">2.</strong> Separate self-worth from trading results</li>
                  <li><strong className="text-foreground">3.</strong> Trade smaller until emotions are absent</li>
                  <li><strong className="text-foreground">4.</strong> Journal emotional reactions and identify triggers</li>
                  <li><strong className="text-foreground">5.</strong> View trading as a long-term probability game</li>
                  <li><strong className="text-foreground">6.</strong> Build identity outside of trading success</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Self-Assessment: Are You Controlled by Emotions?</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Emotional Trading Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Answer honestly. If you answer YES to 3+ questions, you have an emotional control problem:</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Do you feel anxious or excited during trades?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Have you ever moved a stop loss to avoid being stopped out?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Do you take larger trades after winning streaks?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Have you revenge traded to recover losses?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Do you exit winning trades too early out of fear?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Do you hesitate to enter valid setups after losses?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Have you held losing trades hoping they would recover?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Do you check trades obsessively throughout the day?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Does your mood depend on trading results?</label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <label>Have you overtrade after seeing other traders' profits?</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Master Your Trading Psychology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Develop emotional control and mental discipline to trade with consistency and confidence.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/learn/trading-psychology">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Trading Psychology Guide
                  </button>
                </Link>
                <Link to="/learn/trading-discipline">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Build Discipline
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
};

export default FearAndGreed;
