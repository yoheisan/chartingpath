import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const PositionSizing = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Position Sizing: The Key to Long-Term Survival
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Master position sizing to protect your capital, manage risk effectively, and ensure long-term trading success regardless of market conditions.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Why Position Sizing Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Position sizing is the single most important factor in determining your long-term trading success. It determines how much capital you risk on each trade and directly impacts your ability to survive losing streaks and capitalize on winning streaks.
              </p>
              <p>
                Many traders focus on entry and exit strategies while neglecting position sizing, yet poor position sizing can destroy an otherwise profitable strategy. Even with a 60% win rate, risking too much per trade can lead to account ruin.
              </p>
              <p className="font-semibold text-foreground">
                Key principle: Your position size should be based on your risk tolerance, not your desire for profit.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">The 1-2% Rule</h2>
          
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>Core Position Sizing Principle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The foundation of sound position sizing is to never risk more than 1-2% of your total account value on any single trade. This rule ensures you can survive extended losing streaks without catastrophic losses.
              </p>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="font-semibold text-foreground mb-2">Example with $10,000 Account:</p>
                <ul className="space-y-1">
                  <li>• 1% risk = $100 per trade</li>
                  <li>• 2% risk = $200 per trade</li>
                  <li>• You can survive 50-100 consecutive losses</li>
                </ul>
              </div>
              
              <p>
                Conservative traders use 0.5-1% risk, while more aggressive traders might use 2%. Never exceed 2% unless you are an experienced professional with proven edge and emotional control.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Position Sizing Formulas</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Basic Position Size Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Standard Formula</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Position Size = (Account Balance × Risk %) ÷ (Entry Price - Stop Loss)
                </div>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                <p className="font-semibold text-foreground">Example Calculation:</p>
                <ul className="space-y-1">
                  <li>• Account Balance: $10,000</li>
                  <li>• Risk per trade: 1% ($100)</li>
                  <li>• Entry Price: $50.00</li>
                  <li>• Stop Loss: $49.00</li>
                  <li>• Risk per share: $1.00</li>
                </ul>
                <p className="font-bold text-foreground mt-3">
                  Position Size = $100 ÷ $1.00 = 100 shares
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forex Position Sizing</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  Lot Size = (Account × Risk %) ÷ (Stop Loss in Pips × Pip Value)
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Example:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Account: $10,000</li>
                    <li>• Risk: 1% ($100)</li>
                    <li>• Stop Loss: 50 pips</li>
                    <li>• Pip Value: $10 (standard lot)</li>
                  </ul>
                  <p className="font-bold text-foreground">
                    Lot Size = $100 ÷ (50 × $10) = 0.2 lots
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Futures Position Sizing</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3">
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  Contracts = (Account × Risk %) ÷ (Stop Distance × Point Value)
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Example (ES):</p>
                  <ul className="text-sm space-y-1">
                    <li>• Account: $50,000</li>
                    <li>• Risk: 1% ($500)</li>
                    <li>• Stop: 10 points</li>
                    <li>• Point Value: $50</li>
                  </ul>
                  <p className="font-bold text-foreground">
                    Contracts = $500 ÷ (10 × $50) = 1 contract
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Advanced Position Sizing Methods</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fixed Fractional Method</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Risk a fixed percentage of your current account balance on each trade. As your account grows, position sizes increase proportionally; as it shrinks, positions decrease automatically.
                </p>
                <p className="font-semibold text-foreground mb-2">Advantages:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Automatic adjustment to account size</li>
                  <li>Protects during drawdowns</li>
                  <li>Compounds gains during winning streaks</li>
                  <li>Simple to implement</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fixed Ratio Method</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Increase position size after making a specific dollar amount (the delta). More conservative than fixed fractional as it requires larger gains before increasing risk.
                </p>
                <p className="font-semibold text-foreground mb-2">Example:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Start with 1 contract with $10,000</li>
                  <li>Add 1 contract for every $2,000 gain</li>
                  <li>At $12,000: Trade 2 contracts</li>
                  <li>At $14,000: Trade 3 contracts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kelly Criterion</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Mathematical formula to determine optimal bet size based on win rate and average win/loss ratio. Often too aggressive for trading, so traders use "Half Kelly" or "Quarter Kelly".
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm mb-3">
                  Kelly % = (Win Rate × Avg Win) - ((1 - Win Rate) × Avg Loss) ÷ Avg Win
                </div>
                <p className="text-sm">
                  <strong className="text-foreground">Warning:</strong> Full Kelly can be very aggressive. Most traders use 25-50% of Kelly suggestion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volatility-Based Sizing</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">
                  Adjust position size based on market volatility using ATR (Average True Range). Reduce size in high volatility, increase in low volatility.
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm mb-3">
                  Position Size = (Account × Risk %) ÷ (ATR × ATR Multiplier)
                </div>
                <p className="font-semibold text-foreground mb-2">Benefits:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Maintains consistent dollar risk across different volatility regimes</li>
                  <li>Automatically reduces leverage in dangerous conditions</li>
                  <li>Allows for larger positions in stable markets</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Position Sizing Mistakes to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <div>
                    <strong className="text-foreground">Over-Risking:</strong> Risking more than 2% per trade dramatically increases risk of ruin
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <div>
                    <strong className="text-foreground">Fixed Dollar Stops:</strong> Using same dollar amount for all trades ignores volatility differences
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <div>
                    <strong className="text-foreground">Revenge Trading Larger:</strong> Increasing size after losses to "get it back" quickly
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <div>
                    <strong className="text-foreground">Ignoring Correlation:</strong> Taking multiple correlated positions effectively multiplies risk
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <div>
                    <strong className="text-foreground">Not Adjusting for Account Changes:</strong> Using fixed position sizes regardless of account balance
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <div>
                    <strong className="text-foreground">Overleveraging:</strong> Using maximum available leverage without considering risk
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Portfolio Heat and Correlation</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Managing Multiple Positions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Portfolio Heat</h3>
                <p>
                  Portfolio heat is the total amount of capital at risk across all open positions. Even with 1% risk per trade, having 10 uncorrelated positions means 10% portfolio heat.
                </p>
                <p className="mt-2 font-semibold text-foreground">
                  Recommended Maximum: 5-6% portfolio heat for most traders
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Correlation Risk</h3>
                <p>
                  Correlated positions amplify risk. Three 1% positions in correlated assets effectively create 3% risk on a single outcome.
                </p>
                <p className="mt-2">
                  <strong className="text-foreground">Solution:</strong> Reduce individual position size when trading correlated assets, or limit number of correlated positions.
                </p>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="font-semibold text-foreground mb-2">Example Adjustment:</p>
                <ul className="space-y-1">
                  <li>• 3 uncorrelated positions: 1% each = 3% total risk</li>
                  <li>• 3 highly correlated positions: 0.5% each = 1.5% total risk</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Position Sizing for Different Strategies</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Swing Trading</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Risk: 1-2% per trade</li>
                  <li>• Typical holding: 2-10 days</li>
                  <li>• Max concurrent positions: 5-8</li>
                  <li>• Portfolio heat: 5-6%</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Day Trading</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Risk: 0.5-1% per trade</li>
                  <li>• Daily loss limit: 2-3%</li>
                  <li>• Smaller size due to multiple trades</li>
                  <li>• Quick stops due to intraday volatility</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Position Trading</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Risk: 1-2% per trade</li>
                  <li>• Typical holding: Weeks to months</li>
                  <li>• Fewer positions: 3-5</li>
                  <li>• Wider stops to accommodate noise</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scalping</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Risk: 0.25-0.5% per trade</li>
                  <li>• Very high frequency</li>
                  <li>• Tight stops due to short timeframe</li>
                  <li>• Daily loss limit crucial</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Practical Position Sizing Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-muted-foreground">
                <li><strong className="text-foreground">1. Identify Trade Setup:</strong> Find entry, stop loss, and target</li>
                <li><strong className="text-foreground">2. Calculate Risk:</strong> Determine distance from entry to stop in dollars/pips</li>
                <li><strong className="text-foreground">3. Determine Risk Amount:</strong> Calculate 1-2% of current account balance</li>
                <li><strong className="text-foreground">4. Check Portfolio Heat:</strong> Ensure total risk across all positions stays under 6%</li>
                <li><strong className="text-foreground">5. Calculate Position Size:</strong> Use appropriate formula for your market</li>
                <li><strong className="text-foreground">6. Verify Affordability:</strong> Ensure you have margin/buying power for the position</li>
                <li><strong className="text-foreground">7. Execute Trade:</strong> Enter with calculated position size and predefined stop</li>
                <li><strong className="text-foreground">8. Document:</strong> Record risk amount and position size in trading journal</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Your Position Sizing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use our risk calculator to practice position sizing across different markets and scenarios.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/risk-calculator">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Risk Calculator
                  </button>
                </Link>
                <Link to="/paper-trading">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Practice Trading
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

export default PositionSizing;
