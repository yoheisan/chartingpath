import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Navigation from "@/components/Navigation";
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
                      <li>• Multi-platform support (Pine Script, MQL4/5, cTrader, NinjaTrader)</li>
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
                            <div className="font-medium">Pine Script (TradingView)</div>
                            <div className="text-xs text-muted-foreground">All tiers • Most popular platform</div>
                          </div>
                          <Badge variant="default">All Plans</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                          <div>
                            <div className="font-medium">MQL4 & MQL5 (MetaTrader)</div>
                            <div className="text-xs text-muted-foreground">Pro+ • Expert Advisors (EAs)</div>
                          </div>
                          <Badge variant="secondary">Pro+</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded">
                          <div>
                            <div className="font-medium">cTrader & NinjaTrader</div>
                            <div className="text-xs text-muted-foreground">Elite • Advanced platforms</div>
                          </div>
                          <Badge className="bg-purple-600">Elite</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Export Features:</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>• Complete strategy files with documentation</div>
                        <div>• Risk management parameters included</div>
                        <div>• Alert system setup instructions</div>
                        <div>• Backtesting-ready code</div>
                        <div>• Custom parameter optimization</div>
                        <div>• Installation guides for each platform</div>
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
                            <div className="font-medium">Starter (Free)</div>
                            <div className="text-xs text-muted-foreground">Test the platform capabilities</div>
                          </div>
                          <Badge variant="outline">1 generation</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Pro</div>
                            <div className="text-xs text-muted-foreground">Regular strategy development</div>
                          </div>
                          <Badge variant="secondary">15 generations</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Pro+</div>
                            <div className="text-xs text-muted-foreground">Heavy development workloads</div>
                          </div>
                          <Badge variant="secondary">30 generations</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Elite</div>
                            <div className="text-xs text-muted-foreground">Professional strategy development</div>
                          </div>
                          <Badge className="bg-purple-600">50 generations</Badge>
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
            }
          ]
        },
        {
          category: "Advanced Tools",
          questions: [
            {
              question: "What is the MultiScript Converter (Forge)?",
              answer: (
                <div className="space-y-4">
                  <p>The Forge is our advanced code conversion tool that translates strategies between different trading platforms while preserving logic and functionality.</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Supported Conversions</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>From Pine Script:</strong>
                        <div className="text-xs text-muted-foreground mt-1">
                          • To MQL4/MQL5 (MetaTrader)<br/>
                          • To cTrader (C#)<br/>
                          • To NinjaTrader (C#)
                        </div>
                      </div>
                      <div>
                        <strong>From MQL4/MQL5:</strong>
                        <div className="text-xs text-muted-foreground mt-1">
                          • To Pine Script<br/>
                          • To cTrader<br/>
                          • Cross-version conversion
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 border border-border p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Pro Feature:</strong> Available for Pro+ and Elite subscribers. Maintains complex logic, custom functions, and optimization parameters.</p>
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
                      <div className="bg-primary text-primary-foreground p-3 border-b">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-primary-foreground border-primary-foreground/40">FREE</Badge>
                          <h4 className="font-semibold text-primary-foreground">Starter Plan</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 1 AI strategy generation per day</div>
                        <div>• Pine Script export only</div>
                        <div>• Basic pattern library access</div>
                        <div>• Standard calculators (Pip, Risk)</div>
                        <div>• Community forum access</div>
                        <div className="text-xs text-muted-foreground">Perfect for testing the platform</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden border-blue-200 dark:border-blue-800">
                      <div className="bg-primary text-primary-foreground p-3 border-b border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-blue-600">PRO</Badge>
                          <h4 className="font-semibold text-primary-foreground">Professional Trader</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 15 AI strategy generations per day</div>
                        <div>• Pine Script + MQL4 export</div>
                        <div>• Full pattern library + quiz</div>
                        <div>• Advanced backtesting workspace</div>
                        <div>• Priority community support</div>
                        <div>• Strategy library saves</div>
                        <div className="text-xs text-muted-foreground">Ideal for serious traders</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden border-purple-200 dark:border-purple-800">
                      <div className="bg-primary text-primary-foreground p-3 border-b border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2">
                           <Badge className="bg-purple-600">ELITE</Badge>
                          <h4 className="font-semibold text-primary-foreground">Professional Developer</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm">
                        <div>• 50 AI strategy generations per day</div>
                        <div>• All platform exports (Pine, MQL4/5, cTrader, NT)</div>
                        <div>• MultiScript Converter (Forge) access</div>
                        <div>• Advanced strategy optimization</div>
                        <div>• Priority email support</div>
                        <div>• White-label options available</div>
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
          category: "Script Library & Platform Support",
          questions: [
            {
              question: "What's included in the Script Library?",
              answer: (
                <div className="text-muted-foreground">
                  <p>
                    Ready-to-use trading scripts for Pine Script (TradingView), Python (MT4/MT5), and MQL5. Each script includes setup instructions, backtesting results, and customization guides.
                  </p>
                </div>
              )
            },
            {
              question: "What platforms do your scripts work with?",
              answer: (
                <div className="text-muted-foreground">
                  <p>
                    Our scripts are compatible with TradingView (Pine Script), MetaTrader 4/5 (Python & MQL), and most major trading platforms.
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
      <Navigation />
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
          <TabsList className="grid w-full grid-cols-5 mb-8">
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
                <Button asChild>
                  <Link to="/members/community">
                    <Users className="h-4 w-4 mr-2" />
                    Join Community
                  </Link>
                </Button>
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