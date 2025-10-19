import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, TrendingUp, CheckCircle2, Target } from "lucide-react";
import { Link } from "react-router-dom";

const TradingJournal = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Trading Journal: Your Path to Consistent Improvement
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Learn how to maintain a comprehensive trading journal that accelerates your learning curve, reveals hidden patterns, and transforms you into a consistently profitable trader.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Why Keep a Trading Journal?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                A trading journal is the most powerful tool for improvement that most traders neglect. It transforms trading from random gambling into a systematic, improvable skill through data-driven self-analysis.
              </p>
              <p>
                Professional traders universally maintain detailed journals because they understand that what gets measured gets improved. Your journal reveals patterns in your behavior that you cannot see in the moment.
              </p>
              <p className="font-semibold text-foreground">
                Reality: Without a journal, you are flying blind. With a journal, you have a roadmap to consistent profitability.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Benefits of Journaling</h2>
          
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Benefits</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Identify which setups are actually profitable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Discover optimal entry and exit timing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Track strategy performance over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Optimize position sizing and risk management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Psychological Benefits</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Recognize emotional patterns and triggers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Build discipline through accountability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Track discipline score over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Gain confidence from data-backed success</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                What to Include in Every Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="font-semibold text-foreground">Essential Components (Required for Every Trade):</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Trade Details</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Date and time of entry/exit</li>
                    <li>Instrument/ticker symbol</li>
                    <li>Direction (long/short)</li>
                    <li>Entry price and exit price</li>
                    <li>Position size (shares/lots/contracts)</li>
                    <li>Stop loss and take profit levels</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Setup Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Strategy name (e.g., Breakout, Pin Bar, etc.)</li>
                    <li>Timeframe analyzed</li>
                    <li>Technical setup description</li>
                    <li>Why you took the trade (confluence factors)</li>
                    <li>Market conditions at entry</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Risk Management</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Risk amount in dollars ($)</li>
                    <li>Risk percentage of account (%)</li>
                    <li>Risk-reward ratio planned (e.g., 1:2)</li>
                    <li>Actual risk-reward ratio achieved</li>
                    <li>Portfolio heat at time of entry</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Results</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Profit/loss in dollars</li>
                    <li>Profit/loss in R-multiples</li>
                    <li>Win or loss</li>
                    <li>Partial exits if applicable</li>
                    <li>Hold time (time in trade)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Screenshots</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Chart at entry (with annotations)</li>
                    <li>Chart at exit</li>
                    <li>Higher timeframe context</li>
                    <li>Order execution details</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Discipline Score</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Did setup meet all criteria? (Yes/No)</li>
                    <li>Followed entry rules? (1-10 scale)</li>
                    <li>Followed exit rules? (1-10 scale)</li>
                    <li>Emotional control? (1-10 scale)</li>
                    <li>Overall discipline score (1-10)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Notes and Reflection</h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>What went well?</li>
                    <li>What could be improved?</li>
                    <li>Emotional state before/during/after</li>
                    <li>Any mistakes made?</li>
                    <li>Key lesson learned</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Journal Format Options</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Spreadsheet Journal (Excel/Google Sheets)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p className="font-semibold text-foreground">Pros:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Easy to analyze data and calculate statistics</li>
                  <li>Can create charts and graphs automatically</li>
                  <li>Flexible customization</li>
                  <li>Free or low cost</li>
                </ul>
                
                <p className="font-semibold text-foreground mt-3">Cons:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Requires manual data entry</li>
                  <li>Screenshots stored separately</li>
                  <li>Less visually appealing</li>
                </ul>
                
                <p className="text-sm mt-3">
                  <strong className="text-foreground">Best for:</strong> Traders who want complete control and customization, good with data analysis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Dedicated Trading Journal Software</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p className="font-semibold text-foreground">Pros:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Purpose-built for trading analysis</li>
                  <li>Automated statistics and insights</li>
                  <li>Visual charts directly on platform</li>
                  <li>Trade import from brokers</li>
                  <li>Professional appearance</li>
                </ul>
                
                <p className="font-semibold text-foreground mt-3">Cons:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Monthly subscription cost</li>
                  <li>Learning curve</li>
                  <li>Less customization than spreadsheet</li>
                </ul>
                
                <p className="text-sm mt-3">
                  <strong className="text-foreground">Best for:</strong> Serious traders who want advanced analytics and professional tools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Written/Notebook Journal</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p className="font-semibold text-foreground">Pros:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Tangible and therapeutic</li>
                  <li>Great for emotional reflections</li>
                  <li>No technology required</li>
                  <li>Forces slower, more thoughtful analysis</li>
                </ul>
                
                <p className="font-semibold text-foreground mt-3">Cons:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Cannot analyze data statistically</li>
                  <li>Time consuming</li>
                  <li>Hard to search past entries</li>
                  <li>Chart screenshots require printing</li>
                </ul>
                
                <p className="text-sm mt-3">
                  <strong className="text-foreground">Best for:</strong> Beginners focusing on psychological development, or as supplement to digital journal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">4. Hybrid Approach (Recommended)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <p>Combine spreadsheet for data with written notes for psychology:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Spreadsheet: Trade metrics, statistics, performance data</li>
                  <li>Written: Emotional states, lessons learned, market observations</li>
                  <li>Screenshots: Cloud storage folder organized by date</li>
                </ul>
                
                <p className="text-sm mt-3">
                  <strong className="text-foreground">Best for:</strong> Comprehensive analysis combining quantitative and qualitative insights
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Weekly and Monthly Review Process</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Regular Review Routine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Weekly Review (Every Sunday)</h3>
                <ol className="space-y-2 text-sm">
                  <li><strong className="text-foreground">1. Calculate Week Statistics:</strong> Win rate, average R, profit/loss, discipline score</li>
                  <li><strong className="text-foreground">2. Review Every Trade:</strong> Look at screenshots, read notes, assess execution quality</li>
                  <li><strong className="text-foreground">3. Identify Patterns:</strong> Which setups worked? Which failed? Any emotional patterns?</li>
                  <li><strong className="text-foreground">4. Rate Discipline:</strong> Overall discipline score for the week (1-10)</li>
                  <li><strong className="text-foreground">5. Set Next Week Goals:</strong> Specific, measurable improvement targets</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Monthly Deep Dive (First Weekend of Month)</h3>
                <ol className="space-y-2 text-sm">
                  <li><strong className="text-foreground">1. Performance Metrics:</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>Total profit/loss and percentage return</li>
                      <li>Win rate, average win, average loss</li>
                      <li>Expectancy and profit factor</li>
                      <li>Max drawdown and recovery time</li>
                      <li>Best and worst trades</li>
                    </ul>
                  </li>
                  <li><strong className="text-foreground">2. Strategy Analysis:</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>Performance by strategy type</li>
                      <li>Performance by timeframe</li>
                      <li>Performance by market instrument</li>
                      <li>Performance by time of day</li>
                    </ul>
                  </li>
                  <li><strong className="text-foreground">3. Discipline Assessment:</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>Average discipline score trend</li>
                      <li>Number of rule violations</li>
                      <li>Common mistakes identified</li>
                      <li>Progress on psychological goals</li>
                    </ul>
                  </li>
                  <li><strong className="text-foreground">4. Adjustment Plan:</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>What to keep doing (working well)</li>
                      <li>What to stop doing (not working)</li>
                      <li>What to start doing (new improvements)</li>
                      <li>Specific goals for next month</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Key Metrics to Track</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Essential Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Basic Metrics</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Total trades taken</li>
                    <li>• Win rate (%)</li>
                    <li>• Average win ($)</li>
                    <li>• Average loss ($)</li>
                    <li>• Net profit/loss ($)</li>
                    <li>• Return on account (%)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Advanced Metrics</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Expectancy per trade</li>
                    <li>• Profit factor</li>
                    <li>• Average R-multiple</li>
                    <li>• Max drawdown (%)</li>
                    <li>• Sharpe ratio</li>
                    <li>• Calmar ratio</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="font-semibold text-foreground mb-2">Expectancy Formula:</p>
                <div className="font-mono text-sm">
                  Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
                </div>
                <p className="text-xs mt-2">
                  Positive expectancy means you will be profitable over many trades. This is your edge.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Using Your Journal to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Pattern Recognition</h3>
                <p className="text-sm mb-2">Your journal reveals patterns you cannot see in real-time:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Time of day when you trade best/worst</li>
                  <li>Market conditions where your strategy thrives/fails</li>
                  <li>Emotional triggers that lead to bad trades</li>
                  <li>Specific setups with highest/lowest win rate</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Strategy Optimization</h3>
                <p className="text-sm mb-2">Data-driven strategy improvement:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Eliminate low-performing setups</li>
                  <li>Double down on highest-performing setups</li>
                  <li>Optimize entry and exit timing</li>
                  <li>Adjust position sizing based on setup type</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Psychological Growth</h3>
                <p className="text-sm mb-2">Track and improve mental game:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Notice improvement in discipline scores over time</li>
                  <li>Identify recurring emotional mistakes</li>
                  <li>Celebrate progress and build confidence</li>
                  <li>Hold yourself accountable to your rules</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Common Journaling Mistakes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <div>
                    <strong className="text-foreground">Only Journaling Winning Trades:</strong> You learn more from losses. Journal EVERY trade.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <div>
                    <strong className="text-foreground">Incomplete Information:</strong> Missing key details makes analysis impossible later.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <div>
                    <strong className="text-foreground">Not Reviewing Regularly:</strong> A journal without review is just a diary. Review weekly/monthly.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <div>
                    <strong className="text-foreground">Being Dishonest:</strong> Lying to yourself defeats the purpose. Brutal honesty is required.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <div>
                    <strong className="text-foreground">No Action from Insights:</strong> Identifying problems without changing behavior is pointless.
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Start Your Trading Journal Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Begin tracking your trades systematically and watch your performance improve through data-driven insights.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/members/dashboard">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Access Trading Dashboard
                  </button>
                </Link>
                <Link to="/learn/trading-discipline">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Learn About Discipline
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

export default TradingJournal;
