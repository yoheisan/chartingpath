import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Calculator, 
  Shield,
  BookOpen,
  Users,
  Crown,
  Settings,
  AlertTriangle,
  Code2,
  Download,
  Play,
  HelpCircle,
  CheckCircle,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ai-builder");

  const faqData = {
    "ai-builder": {
      title: "AI Strategy Builder",
      icon: <Brain className="h-5 w-5" />,
      description: "Complete guide to building AI-powered trading strategies",
      sections: [
        {
          category: "Getting Started",
          questions: [
            {
              question: "What is the AI Strategy Builder?",
              answer: (
                <div className="space-y-3">
                  <p>The AI Strategy Builder is our flagship tool that converts natural language descriptions into professional Pine Script trading strategies for TradingView and other platforms.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Natural language to code conversion</li>
                      <li>• Visual condition builder with drag-and-drop interface</li>
                      <li>• Multi-platform support (Pine Script, MQL4, MQL5)</li>
                      <li>• Built-in risk management with ATR-based stops</li>
                      <li>• Multi-timeframe analysis support</li>
                      <li>• Instant backtesting integration</li>
                    </ul>
                  </div>
                  <p><strong>Example:</strong> "15m BTC strategy using EMA crossover with RSI confirmation and ATR-based stops" becomes a complete, professional trading strategy.</p>
                </div>
              )
            },
            {
              question: "How do I select the right financial instrument?",
              answer: (
                <div className="space-y-3">
                  <p>Choose your instrument category first, then select the specific asset. This ensures optimal strategy parameters for your chosen market.</p>
                  <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Forex (FX)</h4>
                      <p className="text-xs text-muted-foreground">EUR/USD, GBP/USD, USD/JPY, etc.</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Crypto</h4>
                      <p className="text-xs text-muted-foreground">BTC/USD, ETH/USD, BNB/USD, etc.</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Stocks</h4>
                      <p className="text-xs text-muted-foreground">AAPL, TSLA, GOOGL, etc.</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm">Commodities</h4>
                      <p className="text-xs text-muted-foreground">Gold, Silver, Oil, etc.</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Tip:</strong> Different markets have unique characteristics. Crypto strategies often use shorter timeframes, while stock strategies may focus on earnings patterns.</p>
                  </div>
                </div>
              )
            },
            {
              question: "What's the difference between Natural Language and Visual Builder modes?",
              answer: (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-bullish rounded-full"></div>
                        <h4 className="font-semibold">Natural Language Mode</h4>
                      </div>
                      <p className="text-sm mb-3">Describe your strategy in plain English and let AI convert it to code.</p>
                      <div className="space-y-2">
                        <div className="text-xs">
                          <strong>Best for:</strong>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>• Beginners and non-coders</li>
                            <li>• Quick strategy prototyping</li>
                            <li>• Complex multi-condition strategies</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <h4 className="font-semibold">Visual Builder Mode</h4>
                      </div>
                      <p className="text-sm mb-3">Build strategies using visual condition blocks with precise control.</p>
                      <div className="space-y-2">
                        <div className="text-xs">
                          <strong>Best for:</strong>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>• Advanced users wanting precision</li>
                            <li>• Complex multi-timeframe setups</li>
                            <li>• Fine-tuning specific parameters</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Pro Tip:</strong> Start with Natural Language to get the basic structure, then switch to Visual Builder for fine-tuning.</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Visual Builder Features",
          questions: [
            {
              question: "What is Stars Aligned Mode?",
              answer: (
                <div className="space-y-3">
                  <p>Stars Aligned Mode determines how multiple conditions are combined in your strategy logic.</p>
                  <div className="grid md:grid-cols-2 gap-4 my-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 bg-bullish/20 border border-bullish/30 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-bullish" />
                        </div>
                        <h4 className="font-semibold">Stars Aligned (AND)</h4>
                      </div>
                      <p className="text-sm mb-2">ALL conditions must be true simultaneously for a signal.</p>
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <strong>Example:</strong> RSI &gt; 50 AND EMA crossed above AND Volume &gt; average
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">More selective, fewer but higher-quality signals.</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <h4 className="font-semibold">OR Mode</h4>
                      </div>
                      <p className="text-sm mb-2">ANY condition can trigger a signal independently.</p>
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <strong>Example:</strong> RSI &gt; 70 OR Price breaks resistance OR Volume spike
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">More frequent signals, requires careful risk management.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How do Indicator Conditions work?",
              answer: (
                <div className="space-y-4">
                  <p>Indicator Conditions let you build complex technical analysis rules using popular indicators with precise parameters.</p>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-sm">Supported Indicators:</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>• EMA (Exponential Moving Average)</div>
                        <div>• SMA (Simple Moving Average)</div>
                        <div>• RSI (Relative Strength Index)</div>
                        <div>• MACD (Moving Average Convergence Divergence)</div>
                        <div>• Bollinger Bands</div>
                        <div>• Stochastic Oscillator</div>
                        <div>• ATR (Average True Range)</div>
                        <div>• Volume indicators</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example Setup:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">#1</Badge>
                          <span>EMA(21) crosses above EMA(50)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">#2</Badge>
                          <span>RSI(14) is above 50</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">#3</Badge>
                          <span>MACD line is above signal line</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">This creates a trend-following strategy with momentum confirmation.</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Multi-timeframe Support:</strong> Each condition can use different timeframes (1m, 5m, 15m, 1h, 4h, 1D) for sophisticated analysis.</p>
                  </div>
                </div>
              )
            },
            {
              question: "What are Price Action conditions and how do I use them?",
              answer: (
                <div className="space-y-4">
                  <p>Price Action conditions analyze raw price movement patterns without indicators, focusing on candlestick behavior and support/resistance interactions.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Close vs Open</h4>
                        <p className="text-xs mb-2">Compare candle close to open price.</p>
                        <div className="space-y-1 text-xs">
                            <div>• <strong>Bullish:</strong> Close &gt; Open (green candle)</div>
                            <div>• <strong>Bearish:</strong> Close &lt; Open (red candle)</div>
                          <div>• <strong>Doji:</strong> Close = Open (indecision)</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Candle Pattern</h4>
                        <p className="text-xs mb-2">Detect specific candlestick formations.</p>
                        <div className="space-y-1 text-xs">
                          <div>• Hammer, Doji, Engulfing</div>
                          <div>• Reversal signals at key levels</div>
                          <div>• Continuation patterns in trends</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">S/R Touch</h4>
                        <p className="text-xs mb-2">Support and Resistance level interactions.</p>
                        <div className="space-y-1 text-xs">
                          <div>• Touch Support (potential bounce)</div>
                          <div>• Touch Resistance (potential rejection)</div>
                          <div>• Bounce confirmations</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2">Breakout</h4>
                        <p className="text-xs mb-2">Price breaking key levels with momentum.</p>
                        <div className="space-y-1 text-xs">
                          <div>• Breakout above resistance</div>
                          <div>• Breakdown below support</div>
                          <div>• Retest confirmations</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Example Strategy:</strong> "Enter long on bullish engulfing pattern at EMA support with 2% minimum candle body size"</p>
                  </div>
                </div>
              )
            },
            {
              question: "How do Time & Session conditions work?",
              answer: (
                <div className="space-y-4">
                  <p>Time & Session conditions filter trades based on specific time windows, trading sessions, or market hours to optimize entry timing.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Session Windows</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>London Session:</strong>
                          <div className="text-xs text-muted-foreground">03:00 - 12:00 EST</div>
                          <div className="text-xs">High volatility, GBP/EUR pairs</div>
                        </div>
                        <div>
                          <strong>New York Session:</strong>
                          <div className="text-xs text-muted-foreground">08:00 - 17:00 EST</div>
                          <div className="text-xs">USD pairs, stock market overlap</div>
                        </div>
                        <div>
                          <strong>Asian Session:</strong>
                          <div className="text-xs text-muted-foreground">18:00 - 03:00 EST</div>
                          <div className="text-xs">JPY pairs, range-bound markets</div>
                        </div>
                        <div>
                          <strong>Session Overlap:</strong>
                          <div className="text-xs text-muted-foreground">08:00 - 12:00 EST</div>
                          <div className="text-xs">Highest volume and volatility</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Common Time Filters:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Market Hours Only:</strong>
                          <div className="text-xs text-muted-foreground">Avoid low-liquidity periods</div>
                        </div>
                        <div>
                          <strong>First 2 Hours:</strong>
                          <div className="text-xs text-muted-foreground">Capture session opening momentum</div>
                        </div>
                        <div>
                          <strong>Exclude News Times:</strong>
                          <div className="text-xs text-muted-foreground">Avoid high-impact news volatility</div>
                        </div>
                        <div>
                          <strong>Weekend Filter:</strong>
                          <div className="text-xs text-muted-foreground">Trade weekdays only</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Pro Tip:</strong> Combine session filters with indicator conditions. Example: "EMA crossover during London session first 2 hours only."</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Risk Management",
          questions: [
            {
              question: "How does ATR-based risk management work?",
              answer: (
                <div className="space-y-4">
                  <p>ATR (Average True Range) based risk management automatically adjusts stop-loss and take-profit levels based on market volatility, providing dynamic position sizing.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Stop Loss (ATR Multiplier)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Conservative:</span>
                          <Badge variant="secondary">1.0-1.5x ATR</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Moderate:</span>
                          <Badge variant="secondary">1.5-2.0x ATR</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Aggressive:</span>
                          <Badge variant="secondary">2.0-3.0x ATR</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Tighter stops in low volatility, wider in high volatility periods.</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Take Profit (Risk:Reward)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Conservative:</span>
                          <Badge variant="outline">1:1 to 1:2</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Balanced:</span>
                          <Badge variant="outline">1:2 to 1:3</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Aggressive:</span>
                          <Badge variant="outline">1:3 to 1:5</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Higher reward targets for better risk-adjusted returns.</p>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Example Calculation:</h4>
                    <div className="text-sm space-y-1">
                      <div>ATR(14) = 50 pips</div>
                      <div>Stop Loss = 1.5 × 50 = 75 pips</div>
                      <div>Take Profit = 3.0 × 75 = 225 pips (1:3 ratio)</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Adapts automatically to changing market conditions.</p>
                  </div>
                </div>
              )
            },
            {
              question: "What are Trailing Stops and Early Exit rules?",
              answer: (
                <div className="space-y-4">
                  <p>Advanced risk management features that help lock in profits and minimize losses as trades develop.</p>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <h4 className="font-semibold">Trailing Stops</h4>
                      </div>
                      <p className="text-sm mb-3">Automatically moves stop-loss in your favor as the trade becomes profitable.</p>
                      <div className="bg-muted/50 p-3 rounded">
                        <div className="text-sm space-y-2">
                          <div><strong>ATR Trailing:</strong> Trails by 1.5x ATR distance</div>
                          <div><strong>Percentage Trailing:</strong> Trails by fixed percentage (e.g., 2%)</div>
                          <div><strong>Indicator Trailing:</strong> Use EMA or other indicators as trailing reference</div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <h4 className="font-semibold">Early Exit Rules</h4>
                      </div>
                      <p className="text-sm mb-3">Conditions that can close positions before reaching stop-loss or take-profit.</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Signal Reversal:</strong>
                          <div className="text-xs text-muted-foreground">Exit when entry signals reverse</div>
                        </div>
                        <div>
                          <strong>Time-based:</strong>
                          <div className="text-xs text-muted-foreground">Close after X hours/days</div>
                        </div>
                        <div>
                          <strong>Profit Target:</strong>
                          <div className="text-xs text-muted-foreground">Partial exits at milestones</div>
                        </div>
                        <div>
                          <strong>Volatility Change:</strong>
                          <div className="text-xs text-muted-foreground">Exit if ATR changes significantly</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Best Practice:</strong> Combine trailing stops with early exit rules. Example: "Trail by 2x ATR, but exit if RSI becomes overbought (&gt;70) for longs."</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Code Generation & Export",
          questions: [
            {
              question: "What platforms can I export to?",
              answer: (
                <div className="space-y-4">
                  <p>ChartingPath supports multiple trading platforms with tier-based access to ensure you can use your strategies anywhere.</p>
                  <div className="grid gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Platform Support by Tier</h4>
                        <Badge variant="outline">Multi-Platform Export</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                          <div>
                            <div className="font-medium">Pine Script v5 (TradingView)</div>
                            <div className="text-xs text-muted-foreground">All tiers • Most popular platform</div>
                          </div>
                          <Badge variant="default">All Plans</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                          <div>
                            <div className="font-medium">MQL4 (MetaTrader 4)</div>
                            <div className="text-xs text-muted-foreground">Pro+ • Expert Advisors (EAs)</div>
                          </div>
                          <Badge variant="secondary">Pro+</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                          <div>
                            <div className="font-medium">MQL5 (MetaTrader 5)</div>
                            <div className="text-xs text-muted-foreground">Elite • Advanced Expert Advisors</div>
                          </div>
                          <Badge className="bg-purple-600">Elite</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Export Features:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>• Pattern-based scripts with optimized exits</div>
                        <div>• Risk management parameters included</div>
                        <div>• Dynamic SL/TP recalculation</div>
                        <div>• Backtesting-ready code</div>
                        <div>• Step-by-step deployment guides</div>
                        <div>• SL breach detection warnings</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How do generation quotas work?",
              answer: (
                <div className="space-y-4">
                  <p>Generation quotas ensure fair usage while providing ample capacity for strategy development across all subscription tiers.</p>
                  <div className="grid gap-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 p-3 border-b">
                        <h4 className="font-semibold">Daily Generation Limits</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Free</div>
                            <div className="text-xs text-muted-foreground">Test the platform capabilities</div>
                          </div>
                          <Badge variant="outline">1 generation/day</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Starter</div>
                            <div className="text-xs text-muted-foreground">Getting started with strategy development</div>
                          </div>
                          <Badge variant="secondary">5 generations/day</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Pro</div>
                            <div className="text-xs text-muted-foreground">Regular strategy development</div>
                          </div>
                          <Badge variant="secondary">20 generations/day</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Pro+</div>
                            <div className="text-xs text-muted-foreground">Heavy development workloads</div>
                          </div>
                          <Badge variant="secondary">50 generations/day</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Elite</div>
                            <div className="text-xs text-muted-foreground">Professional strategy development</div>
                          </div>
                          <Badge className="bg-purple-600">Unlimited</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Code2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Generated Pine Script Output</h4>
                          <div className="bg-card border border-border rounded p-3 font-mono text-xs text-muted-foreground">
                            //@version=5<br/>
                            strategy("AI Generated Strategy", overlay=true)<br/>
                            // Entry conditions generated from your setup<br/>
                            longCondition = ta.crossover(ta.ema(close, 21), ta.ema(close, 50))<br/>
                            // Risk management with ATR-based stops<br/>
                            if (longCondition)<br/>
                            &nbsp;&nbsp;&nbsp;&nbsp;strategy.entry("Long", strategy.long)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "tools": {
      title: "Trading Tools",
      icon: <Calculator className="h-5 w-5" />,
      description: "Essential calculators and utilities for traders",
      sections: [
        {
          category: "Calculators",
          questions: [
            {
              question: "How do I use the Pip Calculator?",
              answer: (
                <div className="space-y-3">
                  <p>The Pip Calculator helps determine the monetary value of pip movements across different currency pairs and position sizes.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Calculation Formula:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Standard Lot (100,000 units):</strong> 1 pip = $10 (for USD pairs)</div>
                      <div><strong>Mini Lot (10,000 units):</strong> 1 pip = $1 (for USD pairs)</div>
                      <div><strong>Micro Lot (1,000 units):</strong> 1 pip = $0.10 (for USD pairs)</div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Example Calculation:</h4>
                    <div className="text-sm space-y-1">
                      <div>Currency Pair: EUR/USD</div>
                      <div>Position Size: 0.5 lots (50,000 units)</div>
                      <div>Price Movement: 20 pips</div>
                      <div className="font-medium text-green-600">Profit/Loss: $100</div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What does the Risk Calculator help with?",
              answer: (
                <div className="space-y-3">
                  <p>The Risk Calculator determines optimal position sizes based on your account balance, risk tolerance, and stop-loss distance.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Risk Management Rules</h4>
                      <div className="text-xs space-y-1">
                        <div>• Never risk more than 1-2% per trade</div>
                        <div>• Adjust position size based on stop distance</div>
                        <div>• Consider correlation between positions</div>
                        <div>• Factor in spread and commission costs</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Position Size Formula</h4>
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <div>Account Balance: $10,000</div>
                        <div>Risk per Trade: 2% = $200</div>
                        <div>Stop Loss: 50 pips</div>
                        <div><strong>Position Size: 0.4 lots</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What is the Market Breadth Report?",
              answer: (
                <div className="space-y-4">
                  <p>The Market Breadth Report is an AI-powered daily market analysis tool that provides comprehensive insights across multiple asset classes.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Key Features:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Multi-Market Coverage:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Stocks (SPY, QQQ, DIA)<br/>
                            • Forex (EUR/USD, GBP/USD, USD/JPY)<br/>
                            • Crypto (Bitcoin, Ethereum)<br/>
                            • Commodities (Gold, Silver, Oil)
                          </div>
                        </div>
                        <div>
                          <strong>Analysis Types:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Real-time price movements<br/>
                            • Market sentiment analysis<br/>
                            • Cross-asset correlations<br/>
                            • Trading outlook and opportunities
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Email Subscription</h4>
                      <div className="text-sm space-y-2">
                        <div>• Daily or weekly reports delivered to your inbox</div>
                        <div>• Customizable market selection</div>
                        <div>• Timezone-aware delivery</div>
                        <div>• Professional or concise tone options</div>
                        <div>• Weekend reports cover Friday's action and weekly trends</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Free Feature:</strong> Available to all members. Generate instant reports or subscribe for automated delivery.</p>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Advanced Tools",
          questions: [
            {
              question: "What is the Strategy Workspace?",
              answer: (
                <div className="space-y-4">
                  <p>The Strategy Workspace is our all-in-one platform combining strategy building, backtesting, and analysis tools in a unified interface.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Integrated Features:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Pattern Library:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • 20+ classic chart patterns<br/>
                            • Detailed formation criteria<br/>
                            • Success rates and statistics<br/>
                            • Real market examples
                          </div>
                        </div>
                        <div>
                          <strong>Strategy Builder:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Visual strategy creation<br/>
                            • Multi-indicator combinations<br/>
                            • Pine Script generation<br/>
                            • Risk management tools
                          </div>
                        </div>
                        <div>
                          <strong>Backtester:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Historical performance testing<br/>
                            • Multiple market data sources<br/>
                            • Detailed metrics and reports<br/>
                            • Parameter optimization
                          </div>
                        </div>
                        <div>
                          <strong>Strategy Execution:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Real-time signal monitoring<br/>
                            • Automated trade logging<br/>
                            • Performance tracking<br/>
                            • Risk alerts
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Unified Workflow:</strong> Build, test, analyze, and execute strategies all in one place without switching tools.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What is Paper Trading and how does it work?",
              answer: (
                <div className="space-y-4">
                  <p>Paper Trading allows you to practice trading with virtual money in real market conditions, testing strategies without financial risk.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Features:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Portfolio Management:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • $10,000 starting virtual balance<br/>
                            • Real-time P&L tracking<br/>
                            • Position management<br/>
                            • Trade history
                          </div>
                        </div>
                        <div>
                          <strong>Trade Execution:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Long and short positions<br/>
                            • Stop-loss & take-profit orders<br/>
                            • Multiple position sizes<br/>
                            • Trade notes and tags
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Performance Tracking:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Win rate and profit factor calculations</div>
                        <div>• Maximum drawdown monitoring</div>
                        <div>• Average win/loss analysis</div>
                        <div>• Learning achievements and milestones</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Best Practice:</strong> Use paper trading to validate your strategies before risking real capital. Track your performance over at least 50 trades.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How does Strategy History work?",
              answer: (
                <div className="space-y-4">
                  <p>The Strategy Workspace maintains a history of your backtest runs, allowing you to review and compare past performance analyses.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">History Features:</h4>
                      <div className="text-sm space-y-2">
                        <div>• View recent backtest runs</div>
                        <div>• Compare results across instruments</div>
                        <div>• Star favorite configurations</div>
                        <div>• Filter by timeframe and pattern</div>
                        <div>• Export results for documentation</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Analysis Tools:</h4>
                      <div className="text-sm space-y-2">
                        <div>• Performance metric summaries</div>
                        <div>• Trade log review</div>
                        <div>• Equity curve visualization</div>
                        <div>• Risk-adjusted return metrics</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Pro Tip:</strong> Review your history to identify which pattern/timeframe combinations perform best in different market conditions.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How does the Alert System work?",
              answer: (
                <div className="space-y-4">
                  <p>The Alert System monitors markets 24/7 and notifies you when specific chart patterns or conditions are detected.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Alert Types:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Pattern Alerts:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Head & Shoulders detection<br/>
                            • Double Top/Bottom formations<br/>
                            • Triangle breakouts<br/>
                            • Cup & Handle patterns
                          </div>
                        </div>
                        <div>
                          <strong>Technical Alerts:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Moving average crossovers<br/>
                            • RSI/MACD signals<br/>
                            • Support/Resistance tests<br/>
                            • Volume spikes
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Alert Limits by Plan:</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Free:</strong> Limited alerts</div>
                        <div><strong>Starter/Pro:</strong> Active alert monitoring</div>
                        <div><strong>Pro+/Elite:</strong> Full alert access with priority delivery</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Delivery:</strong> Receive alerts via email with pattern details, entry/exit levels, and stop loss/take profit brackets.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How do I use the Quiz Hub?",
              answer: (
                <div className="space-y-4">
                  <p>The Quiz Hub helps you test and improve your trading knowledge through interactive quizzes covering patterns, technical analysis, and trading psychology.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Available Quizzes:</h4>
                      <div className="grid gap-3 text-sm">
                        <div>
                          <strong>Pattern Identification Quiz:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            Test your ability to recognize chart patterns by sight. Learn to identify formations without labels.
                          </div>
                        </div>
                        <div>
                          <strong>Pattern Quiz:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            Answer questions about pattern characteristics, trading rules, and success rates.
                          </div>
                        </div>
                        <div>
                          <strong>Trading Knowledge Quiz:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            Comprehensive assessment covering risk management, technical analysis, and trading psychology.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Learning Features:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Immediate feedback on answers</div>
                        <div>• Detailed explanations for correct/incorrect answers</div>
                        <div>• Progress tracking and mastery levels</div>
                        <div>• Recommended learning paths based on results</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Study Tip:</strong> Take each quiz multiple times to reinforce learning. Focus on topics where you scored below 70%.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How does the Backtesting Workspace work?",
              answer: (
                <div className="space-y-4">
                  <p>The Backtesting Workspace provides comprehensive strategy performance analysis with detailed metrics and optimization tools.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Key Metrics</h4>
                      <div className="text-xs space-y-1">
                        <div>• Total Return & Drawdown</div>
                        <div>• Sharpe & Sortino Ratios</div>
                        <div>• Win Rate & Profit Factor</div>
                        <div>• Maximum Consecutive Losses</div>
                        <div>• Average Trade Duration</div>
                        <div>• Risk-Adjusted Returns</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Analysis Features</h4>
                      <div className="text-xs space-y-1">
                        <div>• Monte Carlo Simulations</div>
                        <div>• Walk-Forward Analysis</div>
                        <div>• Parameter Optimization</div>
                        <div>• Market Condition Filtering</div>
                        <div>• Multi-Timeframe Testing</div>
                        <div>• Commission & Slippage Modeling</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Integration:</strong> Seamlessly import strategies from AI Builder and test across 10+ years of historical data.</p>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "learning": {
      title: "Learning Center",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Educational resources and pattern recognition tools",
      sections: [
        {
          category: "Chart Patterns",
          questions: [
            {
              question: "How do I use the Pattern Generator?",
              answer: (
                <div className="space-y-4">
                  <p>The Pattern Generator creates realistic chart patterns for educational purposes and strategy testing.</p>
                  <div className="grid gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Available Patterns</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Reversal Patterns:</strong>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <div>• Head and Shoulders</div>
                            <div>• Inverse Head and Shoulders</div>
                            <div>• Double Top/Bottom</div>
                            <div>• Triple Top/Bottom</div>
                          </div>
                        </div>
                        <div>
                          <strong>Continuation Patterns:</strong>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <div>• Ascending/Descending Triangles</div>
                            <div>• Symmetrical Triangles</div>
                            <div>• Bull/Bear Flags</div>
                            <div>• Pennants</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Learning Method:</strong> Generate patterns, study the formation rules, then test your recognition skills with the Pattern Quiz.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What's included in the Pattern Library?",
              answer: (
                <div className="space-y-4">
                  <p>The Pattern Library is a comprehensive database of chart patterns with detailed analysis, trading rules, and statistical performance data.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Pattern Information Includes:</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Formation Rules:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Exact criteria for pattern identification<br/>
                            • Volume confirmation requirements<br/>
                            • Timeframe considerations
                          </div>
                        </div>
                        <div>
                          <strong>Trading Strategy:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Entry and exit points<br/>
                            • Stop-loss placement<br/>
                            • Target calculation methods
                          </div>
                        </div>
                        <div>
                          <strong>Statistical Data:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Success rates across markets<br/>
                            • Average target achievement<br/>
                            • Failure mode analysis
                          </div>
                        </div>
                        <div>
                          <strong>Examples:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Real market examples<br/>
                            • Successful and failed patterns<br/>
                            • Different market conditions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What is the Learning Center?",
              answer: (
                <div className="space-y-4">
                  <p>The Learning Center is our comprehensive educational hub with in-depth articles covering all aspects of technical analysis and trading.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Content Categories:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Chart Patterns:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Head & Shoulders<br/>
                            • Double Top/Bottom<br/>
                            • Triangles, Wedges, Flags<br/>
                            • Cup & Handle, Rectangles
                          </div>
                        </div>
                        <div>
                          <strong>Technical Analysis:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Support & Resistance<br/>
                            • Moving Averages, RSI, MACD<br/>
                            • Fibonacci Retracements<br/>
                            • Volume Analysis
                          </div>
                        </div>
                        <div>
                          <strong>Price Action:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Candlestick Patterns<br/>
                            • Breakout Trading<br/>
                            • Pin Bar Strategy<br/>
                            • Price Action Basics
                          </div>
                        </div>
                        <div>
                          <strong>Risk & Psychology:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Position Sizing<br/>
                            • Risk Management<br/>
                            • Trading Psychology<br/>
                            • Trading Discipline
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Article Features:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Detailed explanations with visual examples</div>
                        <div>• Practical trading strategies and setups</div>
                        <div>• Real-world application guidance</div>
                        <div>• Links to related tools and quizzes</div>
                        <div>• Mobile-friendly reading experience</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Filter by Category:</strong> Use the category filters to focus on specific topics. Start with Chart Patterns if you're new to technical analysis.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How reliable are the pattern success rates shown?",
              answer: (
                <div className="space-y-4">
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Important Disclaimer</h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                          The "success rate" in the pattern library is based on historical statistical analysis and backtesting data from Thomas Bulkowski's Encyclopedia of Chart Patterns. These percentages represent the historical likelihood of a pattern achieving its measured move target when correctly identified and traded.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">What the Success Rates Mean:</h4>
                      <div className="space-y-2 text-sm">
                        <div>• <strong>Historical Performance:</strong> Based on thousands of real market examples analyzed over decades</div>
                        <div>• <strong>Pattern Completion:</strong> Percentage showing how often the pattern achieved its theoretical target</div>
                        <div>• <strong>Market-Tested:</strong> Data collected from various market conditions and timeframes</div>
                        <div>• <strong>Statistical Average:</strong> Represents typical performance, not guaranteed outcomes</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Important Limitations:</h4>
                      <div className="space-y-2 text-sm">
                        <div>• <strong>Not Guarantees:</strong> Past performance does not guarantee future results</div>
                        <div>• <strong>Market Dependent:</strong> Success rates vary significantly based on market conditions, volatility, and economic environment</div>
                        <div>• <strong>Execution Matters:</strong> Individual results depend on entry/exit timing, risk management, and trade execution</div>
                        <div>• <strong>Context Critical:</strong> Pattern effectiveness varies by timeframe, asset class, and overall market trend</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Recommendation:</strong> Use success rates as general guidance for pattern reliability, but always combine with your own analysis, risk management, and paper trading before implementing any strategy with real money.
                      </p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How does the Pattern Quiz help me learn?",
              answer: (
                <div className="space-y-4">
                  <p>The Pattern Quiz uses spaced repetition and adaptive difficulty to efficiently build your pattern recognition skills.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Quiz Features</h4>
                      <div className="text-xs space-y-1">
                        <div>• Real market chart segments</div>
                        <div>• Multiple difficulty levels</div>
                        <div>• Immediate feedback with explanations</div>
                        <div>• Progress tracking and statistics</div>
                        <div>• Weak area identification</div>
                        <div>• Personalized review sessions</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Learning Methodology</h4>
                      <div className="text-xs space-y-1">
                        <div>• Adaptive algorithm adjusts difficulty</div>
                        <div>• Focus on commonly confused patterns</div>
                        <div>• Spaced repetition for long-term retention</div>
                        <div>• Performance analytics and improvement tracking</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Mastery Path:</strong> Start with basic patterns, advance through intermediate, and master complex multi-pattern formations.</p>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "membership": {
      title: "Membership & Account",
      icon: <Crown className="h-5 w-5" />,
      description: "Account management, subscriptions, and member features",
      sections: [
        {
          category: "Subscription Plans",
          questions: [
            {
              question: "What are the differences between subscription tiers?",
              answer: (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-3 border-b">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline">FREE</Badge>
                          <h4 className="font-semibold">Free Plan</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 1 AI strategy generation per day</div>
                        <div>• Pine Script export only</div>
                        <div>• Full Screener access (ungated)</div>
                        <div>• Basic pattern library access</div>
                        <div>• Standard calculators (Pip, Risk)</div>
                        <div className="text-xs text-muted-foreground">Perfect for exploring the platform</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-primary/10 p-3 border-b">
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary">STARTER</Badge>
                          <h4 className="font-semibold">Starter Plan</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 5 AI strategy generations per day</div>
                        <div>• Pine Script export</div>
                        <div>• Full pattern library + quiz</div>
                        <div>• Backtesting workspace access</div>
                        <div>• Save strategies to library</div>
                        <div className="text-xs text-muted-foreground">Getting started with automated trading</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden border-blue-200 dark:border-blue-800">
                      <div className="bg-blue-500/10 p-3 border-b border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-blue-600">PRO</Badge>
                          <h4 className="font-semibold">Professional Trader</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 20 AI strategy generations per day</div>
                        <div>• Pine Script + MQL4 export</div>
                        <div>• Full Pattern Lab research access</div>
                        <div>• Script export with optimized exits</div>
                        <div>• Pair trading analysis</div>
                        <div className="text-xs text-muted-foreground">Ideal for serious traders</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden border-orange-200 dark:border-orange-800">
                      <div className="bg-orange-500/10 p-3 border-b border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-orange-600">PRO+</Badge>
                          <h4 className="font-semibold">Advanced Trader</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 50 AI strategy generations per day</div>
                        <div>• All Pro features plus MQL5 export</div>
                        <div>• Visual Builder access</div>
                        <div>• Basket trading analysis</div>
                        <div>• Tick data access</div>
                        <div>• Community sharing features</div>
                        <div className="text-xs text-muted-foreground">For advanced strategy development</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden border-purple-200 dark:border-purple-800">
                      <div className="bg-purple-500/10 p-3 border-b border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-purple-600">ELITE</Badge>
                          <h4 className="font-semibold">Professional Developer</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• Unlimited AI strategy generations</div>
                        <div>• All platform exports (Pine Script, MQL4, MQL5)</div>
                        <div>• All features unlocked</div>
                        <div>• Priority email support (4-12 hour response)</div>
                        <div>• Custom indicator development assistance</div>
                        <div className="text-xs text-muted-foreground">For professional strategy developers</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How do I upgrade or manage my subscription?",
              answer: (
                <div className="space-y-3">
                  <p>Subscription management is handled through your Member Account dashboard with instant access to new features upon upgrade.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Upgrade Process:</h4>
                      <div className="text-sm space-y-1">
                        <div>1. Go to Account → Subscription in the member area</div>
                        <div>2. Select your desired plan</div>
                        <div>3. Complete secure payment</div>
                        <div>4. Features activate immediately</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">For detailed billing policies:</strong> See our comprehensive billing and payment policies in the "Billing & Payments" section below, including upgrade prorating, refund policies, and cancellation terms.
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Billing & Payments",
          questions: [
            {
              question: "How does upgrading without payment work?",
              answer: (
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong className="text-foreground">Upgrading:</strong> You can upgrade your annual subscription at any time with no extra transactions needed. All remaining days of your current plan will be automatically converted into equivalent value days on the new tier. You don't lose anything, just use the remaining amount to switch to a better version. Thus, the remaining period of your subscription will be reduced and your next payment date will be switched.
                  </p>
                  <p>
                    <strong className="text-foreground">Downgrading:</strong> If you downgrade, your current plan will stay exactly as it is until its subscription date. Then, once it expires, your new downgraded plan will go live at the selected rate.
                  </p>
                  <p className="font-medium text-foreground">
                    Remember, it's not a free trial. Once upgraded, there will be no option to revert this action. However, you'll be able to set a downgraded plan for the next billing period.
                  </p>
                </div>
              )
            },
            {
              question: "Can I cancel anytime?",
              answer: (
                <div className="text-muted-foreground space-y-2">
                  <p>
                    You can cancel your subscription anytime and it will not auto-renew after the current paid term. Paid service will remain active for the duration of the paid term.
                  </p>
                  <p className="font-medium text-foreground">
                    A canceled trial will stop immediately after cancellation.
                  </p>
                </div>
              )
            },
            {
              question: "What is your Refund Policy?",
              answer: (
                <div className="text-muted-foreground space-y-2">
                  <p>
                    Refunds are available for annual plans only and must be requested within 14 calendar days of payment. To request a refund, contact our support team.
                  </p>
                  <p>
                    There are no refunds for upgrades to a more expensive plan, monthly plans or market data, even if the subscription is cancelled on the same day as the payment has gone through.
                  </p>
                  <p className="font-medium text-foreground">
                    Please note that users who filed a chargeback/dispute request or a claim are not eligible for a refund.
                  </p>
                </div>
              )
            },
            {
              question: "How do plan upgrades affect billing?",
              answer: (
                <div className="text-muted-foreground">
                  <p>
                    When you upgrade to a higher tier, we automatically calculate the prorated difference and apply your remaining subscription value to the new plan. Your billing cycle adjusts accordingly, and you'll see the updated next payment date in your account.
                  </p>
                </div>
              )
            },
            {
              question: "What payment methods do you accept?",
              answer: (
                <div className="text-muted-foreground space-y-2">
                  <p>
                    We accept all major payment methods through our secure Stripe integration:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Credit cards (Visa, MasterCard, American Express)</li>
                    <li>Debit cards</li>
                    <li>PayPal</li>
                    <li>Apple Pay and Google Pay</li>
                    <li>Bank transfers (for annual subscriptions)</li>
                  </ul>
                  <p className="text-sm">
                    All payments are processed securely with industry-standard encryption.
                  </p>
                </div>
              )
            }
          ]
        },
        {
          category: "Script Export & Platform Support",
          questions: [
            {
              question: "What's included in the Script Export feature?",
              answer: (
                <div className="text-muted-foreground space-y-2">
                  <p>
                    Pattern-based trading scripts exported from Pattern Lab and backtest results. Each script includes the exact entry/exit logic, dynamic SL/TP calculation, and deployment guides.
                  </p>
                  <p className="text-sm">
                    Scripts are generated based on validated pattern detections with optimized exits derived from historical backtest data.
                  </p>
                </div>
              )
            },
            {
              question: "What platforms do your scripts work with?",
              answer: (
                <div className="text-muted-foreground space-y-2">
                  <p>
                    Our scripts are compatible with TradingView (Pine Script v5), MetaTrader 4 (MQL4), and MetaTrader 5 (MQL5).
                  </p>
                  <p className="text-sm">
                    Each export includes platform-specific code and step-by-step deployment instructions.
                  </p>
                </div>
              )
            }
          ]
        },
        {
          category: "Member Features",
          questions: [
            {
              question: "What's included in the Member Community?",
              answer: (
                <div className="space-y-3">
                  <p>The Member Community is an exclusive forum for strategy discussion, market analysis, and peer learning.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Discussion Areas</h4>
                      <div className="text-xs space-y-1">
                        <div>• Strategy sharing and reviews</div>
                        <div>• Market analysis and insights</div>
                        <div>• Platform-specific implementation help</div>
                        <div>• Backtesting results discussion</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Community Benefits</h4>
                      <div className="text-xs space-y-1">
                        <div>• Learn from experienced traders</div>
                        <div>• Get feedback on your strategies</div>
                        <div>• Access to community-voted resources</div>
                        <div>• Direct interaction with developers</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How do Member Scripts and Downloads work?",
              answer: (
                <div className="space-y-3">
                  <p>Member Scripts provides access to a curated library of professional-grade trading strategies and utilities.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Available Content:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Premium strategy templates</div>
                        <div>• Custom indicators and tools</div>
                        <div>• Risk management utilities</div>
                        <div>• Educational Pine Script examples</div>
                        <div>• Platform installation guides</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Quality Assurance:</strong> All scripts are tested and documented with performance metrics and usage instructions.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What is the Elite Dashboard?",
              answer: (
                <div className="space-y-4">
                  <p>The Elite Dashboard is an exclusive feature for Elite subscribers, providing advanced tools and personalized insights.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Elite Features:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Advanced Analytics:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Portfolio performance metrics<br/>
                            • Strategy win/loss analysis<br/>
                            • Risk-adjusted returns<br/>
                            • Custom performance reports
                          </div>
                        </div>
                        <div>
                          <strong>Exclusive Tools:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Unlimited pattern alerts<br/>
                            • Priority backtesting queue<br/>
                            • Advanced market scanning<br/>
                            • Strategy optimization tools
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Priority Support:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Direct email support with 4-12 hour response time</div>
                        <div>• Weekly strategy review sessions</div>
                        <div>• Custom indicator development assistance</div>
                        <div>• One-on-one onboarding call</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-3 rounded-lg">
                      <p className="text-sm"><strong className="text-purple-600 dark:text-purple-400">Elite Only:</strong> Access to beta features, exclusive webinars, and the Elite traders community.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What are the Market Coverage pages?",
              answer: (
                <div className="space-y-4">
                  <p>Market Coverage pages provide detailed information about trading different asset classes with specific strategies and considerations for each market.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Available Markets:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Stocks:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Major indices (S&P 500, NASDAQ, Dow)<br/>
                            • Stock sectors analysis<br/>
                            • Earnings season strategies<br/>
                            • Growth vs value approaches
                          </div>
                        </div>
                        <div>
                          <strong>Forex:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Major currency pairs<br/>
                            • Cross currency pairs<br/>
                            • Session timing strategies<br/>
                            • Economic calendar impact
                          </div>
                        </div>
                        <div>
                          <strong>Cryptocurrency:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Bitcoin & Ethereum analysis<br/>
                            • Altcoin opportunities<br/>
                            • 24/7 market dynamics<br/>
                            • Volatility management
                          </div>
                        </div>
                        <div>
                          <strong>Commodities:</strong>
                          <div className="text-xs text-muted-foreground mt-1">
                            • Precious metals (Gold, Silver)<br/>
                            • Energy markets (Oil, Natural Gas)<br/>
                            • Agricultural commodities<br/>
                            • Industrial metals
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">What Each Page Includes:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Market characteristics and trading hours</div>
                        <div>• Recommended strategies for each asset class</div>
                        <div>• Volatility patterns and seasonal trends</div>
                        <div>• Risk management considerations</div>
                        <div>• Correlation with other markets</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Educational Focus:</strong> Learn how different markets behave and adapt your trading approach accordingly.</p>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "troubleshooting": {
      title: "Troubleshooting",
      icon: <Settings className="h-5 w-5" />,
      description: "Common issues and solutions",
      sections: [
        {
          category: "Common Issues",
          questions: [
            {
              question: "My generated strategy isn't working in TradingView. What should I check?",
              answer: (
                <div className="space-y-4">
                  <p>Most TradingView issues stem from platform limitations or incorrect script setup. Here's a systematic troubleshooting approach:</p>
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold text-sm">Common Pine Script Errors:</h4>
                      <div className="text-sm space-y-2 mt-2">
                        <div>
                          <strong>Compilation Errors:</strong>
                          <div className="text-xs text-muted-foreground">• Check for syntax errors or missing brackets</div>
                          <div className="text-xs text-muted-foreground">• Ensure all variable names are valid</div>
                          <div className="text-xs text-muted-foreground">• Verify Pine Script version compatibility</div>
                        </div>
                        <div>
                          <strong>Runtime Issues:</strong>
                          <div className="text-xs text-muted-foreground">• Insufficient historical data for indicators</div>
                          <div className="text-xs text-muted-foreground">• Timeframe mismatches</div>
                          <div className="text-xs text-muted-foreground">• Alert frequency limitations</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Quick Fixes:</h4>
                      <div className="text-sm space-y-1">
                        <div>1. Copy the entire script without modifications</div>
                        <div>2. Create a new Pine Script indicator/strategy</div>
                        <div>3. Check that your chart has enough historical bars</div>
                        <div>4. Verify the timeframe matches your strategy design</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "I've reached my generation quota. What are my options?",
              answer: (
                <div className="space-y-3">
                  <p>Generation quotas reset daily, but there are several ways to maximize your usage:</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Immediate Options:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Wait for daily reset at 00:00 JST</div>
                        <div>• Use Visual Builder to refine without generating</div>
                        <div>• Copy/modify existing saved strategies</div>
                        <div>• Upgrade to higher tier for more generations</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Optimization Tips:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Plan strategies before generating</div>
                        <div>• Use templates as starting points</div>
                        <div>• Save successful strategies to library</div>
                        <div>• Test ideas with Visual Builder first</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "The backtesting results don't match my live trading. Why?",
              answer: (
                <div className="space-y-4">
                  <p>Discrepancies between backtesting and live results are common and usually due to execution differences. Here's what to consider:</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Common Causes of Differences:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <strong>Execution Factors:</strong>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <div>• Slippage during volatile periods</div>
                            <div>• Commission and spread costs</div>
                            <div>• Order fill delays</div>
                            <div>• Market liquidity differences</div>
                          </div>
                        </div>
                        <div>
                          <strong>Data Differences:</strong>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <div>• Historical vs real-time data variations</div>
                            <div>• Different broker spreads</div>
                            <div>• Weekend gap handling</div>
                            <div>• News event impact exclusion</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Improvement Strategies:</h4>
                      <div className="text-sm space-y-1">
                        <div>• Include realistic commission/spread costs in backtests</div>
                        <div>• Use conservative slippage assumptions</div>
                        <div>• Test on multiple market conditions</div>
                        <div>• Implement proper position sizing</div>
                        <div>• Account for execution delays in fast markets</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What does 'Timeout' mean in trade outcomes?",
              answer: (
                <div className="space-y-4">
                  <p>In our backtesting and pattern analysis, every trade has one of three possible outcomes. Understanding these is essential for interpreting performance metrics.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Trade Outcome Types:</h4>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong className="text-emerald-600 dark:text-emerald-400">Win (TP Hit)</strong>
                            <div className="text-xs text-muted-foreground mt-1">
                              Price reached the Take Profit target before the Stop Loss or time limit. This is counted as a winning trade in win rate calculations.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong className="text-red-600 dark:text-red-400">Loss (SL Hit)</strong>
                            <div className="text-xs text-muted-foreground mt-1">
                              Price hit the Stop Loss before reaching the Take Profit. This is counted as a losing trade.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong className="text-amber-600 dark:text-amber-400">Timeout</strong>
                            <div className="text-xs text-muted-foreground mt-1">
                              The trade reached the maximum holding period (100 bars) without hitting either the TP or SL. The trade is closed at the current market price. The actual P&L depends on where price was at exit—it could be a small profit, small loss, or breakeven.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Why Use a Time Stop?</h4>
                      <div className="space-y-2 text-sm">
                        <div>• <strong>Opportunity Cost:</strong> Capital tied up in stagnant trades can't capture other opportunities</div>
                        <div>• <strong>Thesis Invalidation:</strong> If a pattern doesn't play out within a reasonable timeframe, the original setup thesis is considered invalid</div>
                        <div>• <strong>Risk Management:</strong> Prevents indefinite exposure to overnight/weekend gaps and unexpected news events</div>
                        <div>• <strong>Industry Standard:</strong> Professional traders and Bulkowski research commonly use 50–100 bar time stops</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Important:</strong> Timeouts are NOT counted as "wins" in our win rate calculations, even if they exit with a small profit. This ensures statistical accuracy—only clean TP hits are considered wins.
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Technical Support",
          questions: [
            {
              question: "How do I contact support?",
              answer: (
                <div className="space-y-3">
                  <p>We offer multiple support channels based on your subscription tier:</p>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">Community Forum</div>
                        <div className="text-xs text-muted-foreground">General questions, peer support</div>
                      </div>
                      <Badge variant="outline">All Plans</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">Priority Forum Support</div>
                        <div className="text-xs text-muted-foreground">Faster response times, developer attention</div>
                      </div>
                      <Badge variant="secondary">Pro+</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium text-sm">Direct Email Support</div>
                        <div className="text-xs text-muted-foreground">Personal assistance, complex issues</div>
                      </div>
                      <Badge className="bg-purple-600">Elite</Badge>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                    <p className="text-sm"><strong>Response Times:</strong> Community (24-48h), Priority (12-24h), Email (4-12h during business hours).</p>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "script-export": {
      title: "Script Export",
      icon: <Code2 className="h-5 w-5" />,
      description: "Exporting pattern trades to TradingView, MetaTrader, and other platforms",
      sections: [
        {
          category: "Pattern-to-Script Workflow",
          questions: [
            {
              question: "How do I export a detected pattern as an executable script?",
              answer: (
                <div className="space-y-4">
                  <p>When you find an active pattern in the Screener or Pattern Lab, you can export it as a ready-to-deploy trading script for TradingView, MT4, or MT5.</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Export Workflow</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">1</Badge>
                        <div>
                          <strong>Find Pattern:</strong> Identify an active pattern in the Screener or Pattern Lab results
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">2</Badge>
                        <div>
                          <strong>Click Export:</strong> Select "Export Script" and choose your platform (Pine Script, MT4, or MT5)
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">3</Badge>
                        <div>
                          <strong>Deploy Script:</strong> Paste the code into TradingView's Pine Editor or MetaEditor
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">4</Badge>
                        <div>
                          <strong>Execute Trade:</strong> Script auto-enters at current market price with calculated SL/TP
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Supported Platforms:</strong> TradingView Pine Script v5, MetaTrader 4 (MQL4), MetaTrader 5 (MQL5)</p>
                  </div>
                </div>
              )
            },
            {
              question: "What happens if the price has moved since the pattern was detected?",
              answer: (
                <div className="space-y-4">
                  <p>This is a common scenario in trading. Our exported scripts use <strong>Dynamic Entry Logic</strong> to handle stale entries intelligently.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-bullish/20 border border-bullish/30 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-bullish" />
                        </div>
                        <h4 className="font-semibold">Market Entry + Recalculated Brackets</h4>
                      </div>
                      <div className="text-sm space-y-2">
                        <p>When deployed, the script enters at the <strong>current market price</strong> (not the original detection price).</p>
                        <p>Stop Loss and Take Profit are <strong>recalculated dynamically</strong> to maintain the same Risk:Reward ratio.</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Example</h4>
                      <div className="text-xs space-y-2 font-mono">
                        <div><span className="text-muted-foreground">Original Detection:</span></div>
                        <div>Entry: 1.0850 | SL: 1.0800 | TP: 1.1000</div>
                        <div className="pt-2"><span className="text-muted-foreground">At Deployment (price moved to 1.0900):</span></div>
                        <div>Entry: 1.0900 | SL: 1.0845 | TP: 1.1065</div>
                        <div className="pt-2 text-bullish">R:R Ratio: Preserved at 1:3</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">How SL/TP Recalculation Works:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Script uses ATR (Average True Range) × 2 for stop distance</li>
                      <li>• Take Profit = Stop Distance × Your Target R:R</li>
                      <li>• This maintains consistent risk per trade regardless of entry price</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: "What if the Stop Loss was already hit before I deployed the script?",
              answer: (
                <div className="space-y-4">
                  <p>The exported script includes an <strong>SL Breach Detection</strong> system that warns you if the original stop loss level was already violated.</p>
                  <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <h4 className="font-semibold text-orange-700 dark:text-orange-400">Warning Behavior</h4>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">If the original SL was breached, you'll see a visual warning label on the chart:</p>
                    <div className="mt-2 bg-orange-100 dark:bg-orange-900/30 p-2 rounded text-xs font-mono">
                      ⚠️ SL BREACHED<br/>
                      Original SL: 1.0800<br/>
                      Proceed with caution
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Your Options When SL is Breached:</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="border rounded p-3">
                        <strong className="text-green-600">✓ Proceed Anyway</strong>
                        <p className="text-xs text-muted-foreground mt-1">The trade still executes. You believe the pattern remains valid despite the breach.</p>
                      </div>
                      <div className="border rounded p-3">
                        <strong className="text-red-600">✗ Cancel Trade</strong>
                        <p className="text-xs text-muted-foreground mt-1">Remove the script. The pattern thesis is invalidated—look for fresh setups.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Pro Tip:</strong> If SL was breached, the pattern's original thesis may be invalid. Consider the breach a signal to re-evaluate rather than force the trade.</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Platform Deployment",
          questions: [
            {
              question: "How do I deploy a script to TradingView?",
              answer: (
                <div className="space-y-4">
                  <p>TradingView deployment is straightforward with our exported Pine Script v5 code.</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Step-by-Step Deployment</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">1</Badge>
                        <div>
                          <strong>Open Pine Editor:</strong> In TradingView, click "Pine Editor" tab at the bottom of the chart
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">2</Badge>
                        <div>
                          <strong>Paste Code:</strong> Delete any existing code and paste the exported script
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">3</Badge>
                        <div>
                          <strong>Add to Chart:</strong> Click "Add to Chart" button. The strategy appears on your chart
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">4</Badge>
                        <div>
                          <strong>Verify Timeframe:</strong> Ensure your chart timeframe matches the pattern's timeframe (e.g., 1D, 4H)
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">5</Badge>
                        <div>
                          <strong>Configure Inputs:</strong> Click the settings gear to adjust Risk %, R:R ratio, and other parameters
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">For Backtesting</h4>
                      <p className="text-xs text-muted-foreground">The script runs as a "strategy" so you can see historical performance in the Strategy Tester tab.</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">For Live Alerts</h4>
                      <p className="text-xs text-muted-foreground">Right-click the strategy on chart → "Add Alert" to receive notifications when signals trigger.</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How do I deploy a script to MetaTrader 4 or 5?",
              answer: (
                <div className="space-y-4">
                  <p>MetaTrader deployment requires compiling the EA (Expert Advisor) code in MetaEditor.</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Step-by-Step Deployment</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">1</Badge>
                        <div>
                          <strong>Open MetaEditor:</strong> In MT4/MT5, press F4 or click Tools → MetaQuotes Language Editor
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">2</Badge>
                        <div>
                          <strong>Create New EA:</strong> File → New → Expert Advisor → Enter a name → Next → Finish
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">3</Badge>
                        <div>
                          <strong>Paste Code:</strong> Replace all generated code with the exported MQ4/MQ5 script
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">4</Badge>
                        <div>
                          <strong>Compile:</strong> Press F7 or click Compile. Check for 0 errors in the log
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">5</Badge>
                        <div>
                          <strong>Attach to Chart:</strong> In MT4/MT5, find the EA in Navigator → Expert Advisors → Drag onto chart
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">6</Badge>
                        <div>
                          <strong>Enable Auto Trading:</strong> Click "AutoTrading" button in toolbar (must show green)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <strong className="text-sm text-orange-700 dark:text-orange-400">Important Settings</strong>
                    </div>
                    <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                      <li>• In EA Properties: Enable "Allow live trading"</li>
                      <li>• In Tools → Options → Expert Advisors: Check "Allow automated trading"</li>
                      <li>• Test on demo account first before live trading</li>
                    </ul>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "Script Behavior",
          questions: [
            {
              question: "How does the script calculate position size?",
              answer: (
                <div className="space-y-4">
                  <p>The exported scripts use <strong>Risk-Based Position Sizing</strong> to automatically calculate lot size based on your account and risk parameters.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Position Size Formula</h4>
                    <div className="bg-card border border-border rounded p-3 font-mono text-sm">
                      <div>Risk Amount = Account Balance × (Risk % / 100)</div>
                      <div className="mt-2">Stop Distance = ATR(14) × 2</div>
                      <div className="mt-2">Position Size = Risk Amount / Stop Distance</div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Example Calculation</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Inputs:</strong>
                        <ul className="text-xs mt-1 space-y-1">
                          <li>• Account Balance: $10,000</li>
                          <li>• Risk Per Trade: 1%</li>
                          <li>• ATR(14): 0.0050</li>
                        </ul>
                      </div>
                      <div>
                        <strong>Calculation:</strong>
                        <ul className="text-xs mt-1 space-y-1">
                          <li>• Risk Amount: $100</li>
                          <li>• Stop Distance: 0.0100 (100 pips)</li>
                          <li>• Position Size: 0.10 lots</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Adjustable:</strong> You can change the Risk % in the script's input parameters to control position size. Lower risk = smaller positions.</p>
                  </div>
                </div>
              )
            },
            {
              question: "What is the fill model used by the exported scripts?",
              answer: (
                <div className="space-y-4">
                  <p>All exported scripts use the <strong>Bar-Close Signal, Next-Bar-Open Fill</strong> model to match our backtest engine.</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Execution Model</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center font-semibold">1</div>
                        <div>
                          <strong>Signal Evaluation:</strong> Entry conditions checked only when bar closes (confirmed)
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center font-semibold">2</div>
                        <div>
                          <strong>Order Placement:</strong> If conditions met, order queued for next bar
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center font-semibold">3</div>
                        <div>
                          <strong>Fill Price:</strong> Trade executed at next bar's open price
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Why This Matters</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">This model ensures <strong>backtest ↔ live parity</strong>. Your script's real performance should closely match the backtest results, avoiding the common "looks good in backtest, fails live" problem.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-1">TradingView</h4>
                      <code className="text-xs text-muted-foreground">process_orders_on_close=false</code>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-1">MetaTrader</h4>
                      <code className="text-xs text-muted-foreground">IsNewBar() + iATR(..., 1)</code>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "Can I customize the script after export?",
              answer: (
                <div className="space-y-4">
                  <p>Absolutely! The exported code is fully editable and documented for customization.</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Commonly Customized Parameters</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="border rounded p-2">
                          <strong>Risk Per Trade %</strong>
                          <p className="text-xs text-muted-foreground">Default: 1%. Adjust for your risk appetite.</p>
                        </div>
                        <div className="border rounded p-2">
                          <strong>R:R Ratio</strong>
                          <p className="text-xs text-muted-foreground">Default: Pattern's original ratio. Override to 2:1, 3:1, etc.</p>
                        </div>
                        <div className="border rounded p-2">
                          <strong>ATR Multiplier</strong>
                          <p className="text-xs text-muted-foreground">Default: 2×. Use 1.5× for tighter stops, 3× for wider.</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="border rounded p-2">
                          <strong>Entry Mode</strong>
                          <p className="text-xs text-muted-foreground">Market entry (default) or use original detection price.</p>
                        </div>
                        <div className="border rounded p-2">
                          <strong>SL Breach Warning</strong>
                          <p className="text-xs text-muted-foreground">Enable/disable the warning label display.</p>
                        </div>
                        <div className="border rounded p-2">
                          <strong>Magic Number (MT4/5)</strong>
                          <p className="text-xs text-muted-foreground">Unique ID to track this EA's trades.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Advanced Users:</strong> The code includes clear section comments (=== INDICATORS ===, === EXECUTION ===) so you can easily find and modify specific logic blocks.</p>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    }
  };

  const filteredSections = (sections: any[]) => {
    if (!searchTerm) return sections;
    
    return sections.map(section => ({
      ...section,
      questions: section.questions.filter((q: any) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof q.answer === 'string' ? q.answer.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      )
    })).filter(section => section.questions.length > 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive guide to ChartingPath's features, tools, and trading capabilities. 
              Find answers to common questions and learn how to maximize your trading potential.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            {Object.entries(faqData).map(([key, data]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                {data.icon}
                <span className="hidden sm:inline">{data.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(faqData).map(([key, data]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {data.icon}
                      <div>
                        <CardTitle>{data.title}</CardTitle>
                        <CardDescription>{data.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              <div className="space-y-8">
                {filteredSections(data.sections).map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <div className="w-1 h-8 bg-primary rounded-full"></div>
                      {section.category}
                    </h2>
                    
                    <div className="space-y-4">
                      {section.questions.map((qa: any, qaIndex: number) => (
                        <Collapsible key={qaIndex}>
                          <CollapsibleTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-left text-card-foreground">{qa.question}</h3>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </CardHeader>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <Card className="mt-2 border-l-4 border-l-primary">
                              <CardContent className="pt-6">
                                {typeof qa.answer === 'string' ? <p>{qa.answer}</p> : qa.answer}
                              </CardContent>
                            </Card>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredSections(data.sections).length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or browse other categories.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our support team is here to help you succeed with your trading strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/pricing">
                    <Crown className="h-4 w-4 mr-2" />
                    View Plans & Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;