import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Link } from "react-router-dom";

const MoneyManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Money Management: Building and Protecting Capital
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Master advanced capital allocation strategies, portfolio management techniques, and drawdown recovery methods to build lasting wealth in the markets.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                What is Money Management?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Money management is the systematic approach to allocating, preserving, and growing your trading capital. While position sizing focuses on individual trades, money management encompasses your entire trading business - from capital allocation to profit withdrawal strategies.
              </p>
              <p>
                Effective money management separates professional traders who compound wealth over decades from those who blow up their accounts. It is about making strategic decisions about your entire portfolio, not just single trades.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Core Money Management Principles</h2>
          
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preservation First</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Your first goal is to not lose money. Your second goal is to not forget the first goal.</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Protect capital above all else</li>
                  <li>Small losses are easier to recover from</li>
                  <li>A 50% loss requires a 100% gain to recover</li>
                  <li>Focus on not losing rather than winning big</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consistency Over Home Runs</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Sustainable returns beat sporadic big wins that are followed by big losses.</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Aim for steady monthly returns</li>
                  <li>Compound small gains consistently</li>
                  <li>Avoid boom-bust cycles</li>
                  <li>Build sustainable edge</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                The Power of Compounding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Understanding compound returns is crucial. Small, consistent gains compound exponentially over time, while large, inconsistent returns often lead to ruin.
              </p>
              
              <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                <p className="font-semibold text-foreground">Example: $10,000 Starting Capital</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">Conservative (2% monthly average):</p>
                    <ul className="pl-6 space-y-1">
                      <li>• Year 1: $12,682</li>
                      <li>• Year 3: $20,328</li>
                      <li>• Year 5: $32,620</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Aggressive (5% monthly average):</p>
                    <ul className="pl-6 space-y-1">
                      <li>• Year 1: $17,959</li>
                      <li>• Year 3: $57,803</li>
                      <li>• Year 5: $186,169</li>
                    </ul>
                  </div>
                  <p className="text-xs italic mt-2">*Assumes no withdrawals and consistent returns</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Capital Allocation Strategies</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">The Core-Satellite Approach</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Divide your capital into core and satellite positions based on confidence and strategy type.</p>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Core Portfolio (70-80%):</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Proven, tested strategies</li>
                    <li>Lower risk, steady returns</li>
                    <li>Longer timeframe positions</li>
                    <li>More diversified</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-foreground mb-2">Satellite Portfolio (20-30%):</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>New strategies being tested</li>
                    <li>Higher risk, higher potential return</li>
                    <li>Opportunistic trades</li>
                    <li>More concentrated bets</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strategy Allocation</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Allocate capital across different uncorrelated strategies to smooth equity curve.</p>
                
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Example Split:</p>
                  <ul className="space-y-1">
                    <li>• 30% - Trend Following</li>
                    <li>• 30% - Mean Reversion</li>
                    <li>• 20% - Breakout Trading</li>
                    <li>• 20% - Swing Trading</li>
                  </ul>
                </div>
                
                <p className="text-sm">Each strategy performs differently in various market conditions, reducing overall portfolio volatility.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Exposure Limits</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Set maximum exposure limits for different asset classes and markets.</p>
                
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-foreground">Single Market:</p>
                    <p className="text-sm">Maximum 20-30% of capital</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Asset Class:</p>
                    <p className="text-sm">Maximum 40-50% of capital</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sector:</p>
                    <p className="text-sm">Maximum 25-35% of capital</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Drawdown Management</h2>
          
          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Understanding Drawdowns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                A drawdown is the peak-to-trough decline in your account during a specific period. Managing drawdowns is critical because large drawdowns require exponentially larger gains to recover.
              </p>
              
              <div className="bg-background p-4 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">Recovery Required:</p>
                <ul className="space-y-1 text-sm">
                  <li>• 10% loss requires 11.1% gain to recover</li>
                  <li>• 20% loss requires 25% gain to recover</li>
                  <li>• 30% loss requires 42.9% gain to recover</li>
                  <li>• 50% loss requires 100% gain to recover</li>
                </ul>
              </div>
              
              <p className="font-semibold text-foreground">
                Key Takeaway: Protect your capital! Recovering from large drawdowns is extremely difficult.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Drawdown Response Protocol</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">5% Drawdown</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Review recent trades for errors</li>
                  <li>Check if you are following your plan</li>
                  <li>Continue trading normally if no issues found</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">10% Drawdown</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Reduce position sizes by 25-50%</li>
                  <li>Review strategy performance and market conditions</li>
                  <li>Take a day off to clear your mind</li>
                  <li>Analyze what is going wrong</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">15-20% Drawdown</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Reduce position sizes by 50-75%</li>
                  <li>Consider taking a break from trading</li>
                  <li>Thoroughly review strategy and execution</li>
                  <li>May need to adjust or stop certain strategies</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">25%+ Drawdown</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Stop trading immediately</li>
                  <li>Complete strategy and risk management review</li>
                  <li>Identify what went wrong (strategy, execution, or psychological)</li>
                  <li>Do not resume until issues are identified and resolved</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Profit Management</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profit Taking Strategy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Regular profit withdrawal prevents you from risking all gains and provides psychological wins.</p>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground mb-2">Conservative Approach:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Withdraw 50% of monthly profits</li>
                      <li>Reinvest 50% to compound account</li>
                      <li>Maintains steady growth while securing gains</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-foreground mb-2">Aggressive Approach:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Withdraw profits only when account doubles</li>
                      <li>Reinvest all profits for maximum compounding</li>
                      <li>Higher risk but faster growth potential</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-foreground mb-2">Hybrid Approach:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Withdraw monthly expenses from profits</li>
                      <li>Reinvest remaining profits</li>
                      <li>Balance lifestyle and growth</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scaling Capital</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>As your account grows, adjust your approach to maintain performance.</p>
                
                <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">Small Account ($1,000-$10,000):</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Focus on skill development</li>
                      <li>Reinvest all profits</li>
                      <li>Can trade smaller, more volatile instruments</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-foreground">Medium Account ($10,000-$100,000):</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Balance growth and withdrawals</li>
                      <li>Diversify across strategies</li>
                      <li>Reduce leverage as account grows</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-foreground">Large Account ($100,000+):</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Focus on capital preservation</li>
                      <li>Regular profit withdrawals</li>
                      <li>Trade more liquid instruments</li>
                      <li>Lower percentage returns acceptable</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Account Growth Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>Set specific milestones to track progress and adjust your approach.</p>
              
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-semibold text-foreground mb-2">Milestone Actions:</p>
                  <ul className="space-y-2 text-sm">
                    <li><strong className="text-foreground">First $1,000 profit:</strong> Celebrate and analyze what worked</li>
                    <li><strong className="text-foreground">Account doubles:</strong> Withdraw original capital or 50% of total</li>
                    <li><strong className="text-foreground">$10,000 account:</strong> Start diversifying strategies</li>
                    <li><strong className="text-foreground">$50,000 account:</strong> Consider this a business, optimize operations</li>
                    <li><strong className="text-foreground">$100,000 account:</strong> Focus on preservation and consistency</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Risk of Ruin</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Understanding Your Risk of Ruin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Risk of ruin is the probability of losing your entire trading capital. It depends on your win rate, risk-reward ratio, and risk per trade.
              </p>
              
              <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">High Risk of Ruin Scenarios:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Low win rate (below 40%) with poor risk-reward</li>
                  <li>Risking more than 5% per trade</li>
                  <li>No stop losses or risk management</li>
                  <li>Revenge trading after losses</li>
                </ul>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-foreground">Low Risk of Ruin Scenarios:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Win rate above 50% or good risk-reward ratio (2:1+)</li>
                  <li>Risking 1% or less per trade</li>
                  <li>Proper diversification across strategies</li>
                  <li>Disciplined execution of tested strategy</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Monthly Money Management Routine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Establish a monthly routine to review and optimize your money management:</p>
              
              <ol className="space-y-3">
                <li>
                  <strong className="text-foreground">Review Account Performance:</strong>
                  <p className="text-sm mt-1">Calculate monthly return, drawdown, and compare to goals</p>
                </li>
                <li>
                  <strong className="text-foreground">Analyze Strategy Allocation:</strong>
                  <p className="text-sm mt-1">Which strategies performed best? Should allocation be adjusted?</p>
                </li>
                <li>
                  <strong className="text-foreground">Check Risk Metrics:</strong>
                  <p className="text-sm mt-1">Review maximum drawdown, win rate, average risk-reward</p>
                </li>
                <li>
                  <strong className="text-foreground">Calculate Profit Withdrawal:</strong>
                  <p className="text-sm mt-1">Withdraw planned percentage of profits</p>
                </li>
                <li>
                  <strong className="text-foreground">Adjust Position Sizing:</strong>
                  <p className="text-sm mt-1">Recalculate position sizes based on new account balance</p>
                </li>
                <li>
                  <strong className="text-foreground">Set Next Month Goals:</strong>
                  <p className="text-sm mt-1">Define realistic profit targets and maximum drawdown limits</p>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Implement Effective Money Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Start tracking your capital allocation and develop a comprehensive money management plan for long-term success.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/member/dashboard">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Track Performance
                  </button>
                </Link>
                <Link to="/risk-calculator">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Risk Calculator
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

export default MoneyManagement;
