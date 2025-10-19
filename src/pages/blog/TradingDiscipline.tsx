import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Target, CheckCircle2, AlertTriangle, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const TradingDiscipline = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Trading Discipline: Following Your Plan Consistently
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Build unshakeable discipline to execute your trading rules flawlessly, even during drawdowns, winning streaks, and emotionally challenging market conditions.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Why Discipline is Everything
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                You can have the best trading strategy in the world, but without discipline to execute it consistently, you will fail. Discipline is what separates profitable traders from the 90% who lose money.
              </p>
              <p>
                Trading discipline means following your predetermined rules without deviation, regardless of emotions, recent results, or market noise. It is the ability to do what you know you should do, even when you do not feel like doing it.
              </p>
              <p className="font-semibold text-foreground">
                Key Truth: Your edge comes from consistent execution, not perfect prediction.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">The Pillars of Trading Discipline</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Following Your Trading Plan</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Your trading plan is your rulebook. Every trade must meet your predefined criteria.</p>
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="font-semibold text-foreground mb-2">Essential Plan Components:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Entry criteria (exact conditions required)</li>
                    <li>Position sizing rules (fixed percentage or algorithm)</li>
                    <li>Stop loss placement methodology</li>
                    <li>Profit target calculation</li>
                    <li>Maximum daily loss limit</li>
                    <li>Maximum number of trades per day/week</li>
                    <li>Markets and timeframes traded</li>
                  </ul>
                </div>
                
                <p className="font-semibold text-foreground">
                  Rule: If a setup does not meet ALL criteria, do not take it. No exceptions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Accepting Every Result</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Discipline means accepting losses as part of the process without emotional reaction.</p>
                
                <ul className="list-disc pl-6 space-y-1">
                  <li>Every loss is just one outcome in a series of probabilities</li>
                  <li>No single trade defines your success or failure</li>
                  <li>Focus on process, not individual results</li>
                  <li>A perfect setup that loses is still a good trade</li>
                </ul>
                
                <p className="mt-3 font-semibold text-foreground">
                  Mindset Shift: Think in terms of the next 100 trades, not the next 1 trade.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Emotional Detachment</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Disciplined traders execute trades mechanically without emotional attachment to outcomes.</p>
                
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-foreground">Signs of Poor Emotional Control:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Excitement after wins, depression after losses</li>
                      <li>Revenge trading after a loss</li>
                      <li>Overtrading after a win</li>
                      <li>Moving stops to avoid losses</li>
                      <li>Taking profits early due to fear</li>
                    </ul>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-semibold text-foreground">Signs of Good Emotional Control:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Same routine and process for every trade</li>
                      <li>Neutral reaction to wins and losses</li>
                      <li>Can walk away after max loss hit</li>
                      <li>Never check trades obsessively</li>
                      <li>Follow exit rules without hesitation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">4. Consistency Over Perfection</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Discipline is about consistent execution, not perfect trades. A disciplined losing trade is better than an undisciplined winning trade.</p>
                
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-foreground">Why Consistency Matters:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• You can only improve what you can measure</li>
                    <li>• Consistent execution reveals true strategy edge</li>
                    <li>• Random actions produce random results</li>
                    <li>• Professional traders are boringly consistent</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Common Discipline Breakdowns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Revenge Trading:</strong> Attempting to quickly recover losses by taking impulsive, oversized trades
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <div>
                    <strong className="text-foreground">FOMO Trading:</strong> Entering trades without proper setup because you fear missing out
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Moving Stops:</strong> Adjusting stop losses to avoid being stopped out, usually resulting in larger losses
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Overtrading:</strong> Taking too many trades after wins, driven by overconfidence
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Cherry-Picking Setups:</strong> Only taking trades you feel good about rather than all valid setups
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <div>
                    <strong className="text-foreground">Pre-Market Bias:</strong> Deciding market direction before the day starts and forcing trades
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Building Unbreakable Discipline</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Practical Discipline Techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. Pre-Trade Checklist</h3>
                <p className="mb-2">Create a physical checklist that must be completed before every trade:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>✓ Setup meets all entry criteria</li>
                  <li>✓ Risk calculated and acceptable (1-2%)</li>
                  <li>✓ Stop loss predetermined and placed</li>
                  <li>✓ Profit target calculated</li>
                  <li>✓ Position size calculated correctly</li>
                  <li>✓ No emotional state influencing decision</li>
                  <li>✓ Daily loss limit not reached</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">2. The 5-Minute Rule</h3>
                <p>When you identify a setup, wait 5 minutes before entering. This prevents impulsive trades and allows you to verify all criteria. If the setup is still valid after 5 minutes and meets all requirements, take it.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">3. Daily Trading Window</h3>
                <p className="mb-2">Limit trading to specific hours when you are most focused and markets are most active:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Prevents overtrading throughout the day</li>
                  <li>Ensures you are mentally fresh</li>
                  <li>Focuses activity on highest probability times</li>
                  <li>Creates routine and structure</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">4. Maximum Trade Limits</h3>
                <p className="mb-2">Set daily and weekly trade limits to prevent overtrading:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Day traders: 3-5 trades per day maximum</li>
                  <li>Swing traders: 5-10 trades per week maximum</li>
                  <li>Stop trading once limit reached, even if you see setups</li>
                  <li>Forces you to be selective with entries</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">5. Daily Loss Limit (Hard Stop)</h3>
                <p className="mb-2">Set a maximum daily loss limit and absolutely stop trading if reached:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Conservative: 1-2% of account per day</li>
                  <li>Moderate: 2-3% of account per day</li>
                  <li>Close platform immediately when hit</li>
                  <li>Do not return until next trading session</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">The Discipline Development Process</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phase 1: Mechanical Trading (Months 1-3)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Focus entirely on following rules with zero discretion:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Take every valid setup, no cherry-picking</li>
                  <li>Exit at predetermined levels, no adjustments</li>
                  <li>Use checklist for every trade</li>
                  <li>Goal: Perfect execution, not profit</li>
                </ul>
                <p className="text-sm italic mt-2">This phase builds the habit of consistent execution.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phase 2: Controlled Discretion (Months 4-6)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Begin incorporating controlled judgment:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Can skip setups if multiple factors against them</li>
                  <li>Can adjust targets based on price action</li>
                  <li>Must document reasoning for every discretionary decision</li>
                  <li>Goal: Develop pattern recognition within rules</li>
                </ul>
                <p className="text-sm italic mt-2">This phase adds nuance while maintaining structure.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phase 3: Expert Execution (Months 7+)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Discipline becomes automatic:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Rules are internalized, no longer need checklist</li>
                  <li>Can read market context and adjust accordingly</li>
                  <li>Emotions no longer influence decisions</li>
                  <li>Goal: Consistent profitability with minimal effort</li>
                </ul>
                <p className="text-sm italic mt-2">This is where discipline becomes second nature.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Discipline Maintenance Habits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Daily and weekly routines to maintain discipline long-term:</p>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Morning Routine (Before Trading)</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Review trading rules and plan</li>
                    <li>Set daily goals (process-focused, not profit-focused)</li>
                    <li>Visualize executing perfect trades</li>
                    <li>Clear mind through meditation or exercise</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Evening Routine (After Trading)</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Journal all trades with screenshots</li>
                    <li>Rate discipline on each trade (1-10 scale)</li>
                    <li>Identify any rule violations and why they occurred</li>
                    <li>Plan how to prevent violations tomorrow</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Weekly Review</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Calculate average discipline score</li>
                    <li>Review equity curve for consistency</li>
                    <li>Identify patterns in rule violations</li>
                    <li>Update trading rules if needed</li>
                    <li>Set discipline goals for next week</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Measuring Your Discipline</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Discipline Scorecard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Rate yourself on these metrics after each trade (1-10 scale):</p>
              
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Setup Selection:</p>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>• Did it meet all entry criteria? (10 = yes, 1 = no)</li>
                    <li>• Was entry timing optimal? (10 = perfect, 1 = late/early)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Risk Management:</p>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>• Correct position size? (10 = yes, 1 = way off)</li>
                    <li>• Stop loss placed as planned? (10 = yes, 1 = no/moved)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Trade Management:</p>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>• Exited per rules? (10 = yes, 1 = emotional exit)</li>
                    <li>• No position monitoring obsession? (10 = calm, 1 = checked 50x)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Emotional Control:</p>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>• Neutral reaction to outcome? (10 = robotic, 1 = emotional)</li>
                    <li>• Next trade unaffected? (10 = same process, 1 = changed approach)</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg mt-4">
                <p className="font-semibold text-foreground mb-2">Target Scores:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Beginner Trader: Average 5-6/10 (still developing habits)</li>
                  <li>• Intermediate Trader: Average 7-8/10 (mostly disciplined)</li>
                  <li>• Professional Trader: Average 9-10/10 (consistent excellence)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Consequences for Lack of Discipline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>Hold yourself accountable with predetermined consequences for rule violations:</p>
              
              <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">Minor Violations (moved stop, emotional exit):</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Immediate 30-minute break from trading</li>
                  <li>Write detailed analysis of what happened</li>
                  <li>Reduce position size by 50% for next 3 trades</li>
                </ul>
              </div>
              
              <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">Major Violations (revenge trade, FOMO entry):</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Stop trading for remainder of day</li>
                  <li>Write 500-word essay on discipline</li>
                  <li>Review all trades from past month</li>
                  <li>Next day trade demo account only</li>
                </ul>
              </div>
              
              <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">Repeated Violations (3+ in one week):</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Take full week off from live trading</li>
                  <li>Trade demo account with perfect discipline</li>
                  <li>Complete trading psychology exercises</li>
                  <li>Modify rules to address recurring issue</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Develop Your Trading Discipline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Start building your discipline foundation with structured practice and accountability tools.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/members/trading">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Practice With Demo
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

export default TradingDiscipline;
