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
  Activity,
  FlaskConical,
  Bell,
  FileCode,
  BookOpen,
  Crown,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Scan
} from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("screener");

  const faqData = {
    "screener": {
      title: "Screener",
      icon: <Activity className="h-5 w-5 text-amber-500" />,
      description: "Live pattern detection across markets",
      sections: [
        {
          category: "Getting Started",
          questions: [
            {
              question: "What is the Screener?",
              answer: (
                <div className="space-y-3">
                  <p>The Screener is our free, real-time pattern detection tool that scans 1,100+ instruments across stocks, forex, crypto, and commodities for active chart patterns.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Key Features:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Real-time pattern detection across multiple markets</li>
                      <li>• Entry, Stop Loss, and Take Profit levels for each pattern</li>
                      <li>• Quality scores based on pattern formation</li>
                      <li>• Trend alignment indicators</li>
                      <li>• Historical performance stats per pattern type</li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground"><strong>Access:</strong> The Screener is completely free and ungated for all users.</p>
                </div>
              )
            },
            {
              question: "How do I filter patterns in the Screener?",
              answer: (
                <div className="space-y-3">
                  <p>Use the filter controls to narrow down patterns by market, timeframe, direction, and quality.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Asset Filters</h4>
                      <div className="text-xs space-y-1">
                        <div>• Stocks (US equities)</div>
                        <div>• Forex (major & minor pairs)</div>
                        <div>• Crypto (BTC, ETH, top altcoins)</div>
                        <div>• Commodities (Gold, Oil, etc.)</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Pattern Filters</h4>
                      <div className="text-xs space-y-1">
                        <div>• Timeframe (1H, 4H, Daily, Weekly)</div>
                        <div>• Direction (Bullish/Bearish)</div>
                        <div>• Quality (A/B/C grades)</div>
                        <div>• Pattern type (specific patterns)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What do the pattern quality grades mean?",
              answer: (
                <div className="space-y-4">
                  <p>Quality grades reflect how well a pattern matches its ideal formation criteria.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-bullish text-white">A</Badge>
                      <div>
                        <strong>High Quality</strong>
                        <p className="text-xs text-muted-foreground">Clean formation, strong volume confirmation, trend alignment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="secondary">B</Badge>
                      <div>
                        <strong>Medium Quality</strong>
                        <p className="text-xs text-muted-foreground">Acceptable formation with minor deviations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">C</Badge>
                      <div>
                        <strong>Lower Quality</strong>
                        <p className="text-xs text-muted-foreground">Pattern detected but with significant deviations from ideal</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: "How ChartingPath Identifies Patterns",
          questions: [
            {
              question: "What methodology does ChartingPath use for pattern detection?",
              answer: (
                <div className="space-y-4">
                  <p>ChartingPath uses a <strong>three-layer detection pipeline</strong> based on institutional-grade standards established by Thomas Bulkowski's pattern research.</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Scan className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Layer 1 — Bulkowski Engine (Structural Detection)</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        The engine scans price action using adaptive lookback windows (up to 120 bars) with peak/trough detection to identify structural formations. Each pattern must satisfy strict formation rules before being registered.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Layer 2 — Context Validator (Probabilistic Confirmation)</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Every detection passes through a 6-factor weighted validation model analyzing trend alignment (30%), RSI (15%), MACD momentum (15%), ADX strength (15%), volume conviction (15%), and risk calibration (10%). Patterns must score above the confirmation threshold to proceed.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Layer 3 — Multi-Timeframe Confluence (Final Gate)</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Confirmed patterns are validated against the next higher timeframe (e.g., 4H pattern → Daily check). The model evaluates HTF trend direction (40%), S/R proximity (25%), HTF momentum via MACD + RSI (20%), and cross-TF volume profile (15%). Patterns trading against strong higher-timeframe opposition are rejected.
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <strong>Result:</strong> Patterns must pass all three layers to appear in the Screener, Chart overlays, and research views. Only <em>fully confirmed</em> patterns are displayed — significantly reducing false positives.
                  </div>
                </div>
              )
            },
            {
              question: "How is each pattern identified? (Full definitions)",
              answer: (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Below are the structural rules enforced by ChartingPath's Bulkowski Engine for each of the 15 supported patterns.</p>
                  
                  {/* Reversal Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Bearish Reversal Patterns
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Double Top</div>
                        <p className="text-xs text-muted-foreground mt-1">Two peaks at approximately the same price level (±1.5% tolerance) separated by a trough. Requires a prior uptrend of ≥2%. Confirmed on a break below the neckline (trough level).</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Triple Top</div>
                        <p className="text-xs text-muted-foreground mt-1">Three peaks at similar price levels (±1.5%) with two intervening troughs. Requires a prior uptrend of ≥2%. Confirmed on a break below the lowest trough (neckline).</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Head & Shoulders</div>
                        <p className="text-xs text-muted-foreground mt-1">Three peaks where the middle peak (Head) is higher than both outer peaks (Shoulders). Shoulders must be approximately symmetric (within 30% height tolerance). Requires a prior uptrend of ≥3%. Confirmed on a neckline break.</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Rising Wedge</div>
                        <p className="text-xs text-muted-foreground mt-1">Converging trendlines with both support and resistance sloping upward, with resistance rising at a shallower angle. Requires ≥3 touches on each trendline. Bearish breakdown expected.</p>
                      </div>
                    </div>
                  </div>

                  {/* Bullish Reversal Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Bullish Reversal Patterns
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Double Bottom</div>
                        <p className="text-xs text-muted-foreground mt-1">Two troughs at approximately the same price level (±1.5% tolerance) separated by a peak. Requires a prior downtrend of ≥2%. Confirmed on a break above the neckline (peak level).</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Triple Bottom</div>
                        <p className="text-xs text-muted-foreground mt-1">Three troughs at similar price levels (±1.5%) with two intervening peaks. Requires a prior downtrend of ≥2%. Confirmed on a break above the highest peak (neckline).</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Inverse Head & Shoulders</div>
                        <p className="text-xs text-muted-foreground mt-1">Three troughs where the middle trough (Head) is lower than both outer troughs (Shoulders). Symmetric shoulder tolerance of 30%. Requires a prior downtrend of ≥3%. Confirmed on a neckline breakout.</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Falling Wedge</div>
                        <p className="text-xs text-muted-foreground mt-1">Converging trendlines with both support and resistance sloping downward, with support falling at a shallower angle. Requires ≥3 touches on each trendline. Bullish breakout expected.</p>
                      </div>
                    </div>
                  </div>

                  {/* Continuation Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                      Continuation Patterns
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Bull Flag</div>
                        <p className="text-xs text-muted-foreground mt-1">A sharp upward move (flagpole, ≥5% gain) followed by a tight, downward-sloping consolidation channel. The flag body should retrace no more than 50% of the pole. ADX &gt; 20 required. Bullish continuation on upside break.</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Bear Flag</div>
                        <p className="text-xs text-muted-foreground mt-1">A sharp downward move (flagpole, ≥5% drop) followed by a tight, upward-sloping consolidation channel. The flag body should retrace no more than 50% of the pole. ADX &gt; 20 required. Bearish continuation on downside break.</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Cup & Handle</div>
                        <p className="text-xs text-muted-foreground mt-1">A rounded bottom (cup) followed by a shallow pullback (handle). The cup must form over at least 7 bars with a prior uptrend of ≥5%. The handle should retrace less than 50% of the cup depth. Bullish breakout above the rim.</p>
                      </div>
                    </div>
                  </div>

                  {/* Triangle Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Triangle Patterns
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Ascending Triangle</div>
                        <p className="text-xs text-muted-foreground mt-1">Flat resistance with rising support. Requires ≥3 touches on each trendline. Higher lows converge toward a horizontal ceiling. Bullish breakout expected above resistance.</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Descending Triangle</div>
                        <p className="text-xs text-muted-foreground mt-1">Flat support with declining resistance. Requires ≥3 touches on each trendline. Lower highs converge toward a horizontal floor. Bearish breakdown expected below support.</p>
                      </div>
                    </div>
                  </div>

                  {/* Momentum Breakouts */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-primary" />
                      Momentum Breakout Patterns
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Donchian Breakout (Long)</div>
                        <p className="text-xs text-muted-foreground mt-1">Price closes above the highest high of the past N bars (Donchian channel). Requires ADX &gt; 20 for trend confirmation. No excessive retracement from recent highs. Bullish momentum signal.</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">Donchian Breakout (Short)</div>
                        <p className="text-xs text-muted-foreground mt-1">Price closes below the lowest low of the past N bars (Donchian channel). Requires ADX &gt; 20 for trend confirmation. No excessive retracement from recent lows. Bearish momentum signal.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What is the quality scoring system?",
              answer: (
                <div className="space-y-4">
                  <p>Each detected pattern receives a quality grade (A through F) based on a <strong>9-factor weighted model</strong>:</p>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">Structural Factors</div>
                        <div className="text-xs text-muted-foreground">• Prior Trend strength</div>
                        <div className="text-xs text-muted-foreground">• Structural symmetry</div>
                        <div className="text-xs text-muted-foreground">• Price action quality</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Volume & Volatility</div>
                        <div className="text-xs text-muted-foreground">• Volume confirmation</div>
                        <div className="text-xs text-muted-foreground">• Relative volume</div>
                        <div className="text-xs text-muted-foreground">• Volatility regime</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Context Factors</div>
                        <div className="text-xs text-muted-foreground">• ADX trend strength</div>
                        <div className="text-xs text-muted-foreground">• Historical win rate</div>
                        <div className="text-xs text-muted-foreground">• Pattern symmetry</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge className="bg-emerald-600 text-white min-w-8 justify-center">A</Badge>
                      <span className="text-sm">Score 8–10: Institutional quality, strong confluence</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge className="bg-sky-600 text-white min-w-8 justify-center">B</Badge>
                      <span className="text-sm">Score 6–8: Solid formation with minor deviations</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge variant="secondary" className="min-w-8 justify-center">C</Badge>
                      <span className="text-sm">Score 4–6: Acceptable but with notable imperfections</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge variant="outline" className="min-w-8 justify-center">D–F</Badge>
                      <span className="text-sm">Score 0–4: Marginal formation, use with caution</span>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What does the validation pipeline filter out?",
              answer: (
                <div className="space-y-4">
                  <p>Each detection must survive three sequential layers. Rejection at any layer removes the pattern from all views:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Scan className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <strong className="text-sm">Layer 1 — Bulkowski Engine</strong>
                        <p className="text-xs text-muted-foreground">Structural geometry must match Bulkowski's formation rules (prior trend, touch counts, symmetry)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <strong className="text-sm">Layer 2 — Context Validator</strong>
                        <p className="text-xs text-muted-foreground">Composite score ≥ 0.15 required (6-factor: trend, RSI, MACD, ADX, volume, risk). Rejected if ≤ −0.15</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Layers className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <strong className="text-sm">Layer 3 — MTF Confluence</strong>
                        <p className="text-xs text-muted-foreground">Higher-timeframe trend, S/R proximity, momentum, and volume must not oppose the pattern direction. Rejected if score ≤ −0.20</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <strong className="text-sm">Fully Confirmed</strong>
                        <p className="text-xs text-muted-foreground">Pattern passes all 3 layers → displayed in Screener, Charts, and Research views</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p>This three-layer pipeline ensures only patterns with structural validity, technical context support, and multi-timeframe alignment reach the user — providing institutional-grade signal quality.</p>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "pattern-lab": {
      title: "Pattern Lab",
      icon: <FlaskConical className="h-5 w-5 text-violet-500" />,
      description: "Historical pattern backtesting and research",
      sections: [
        {
          category: "Research Workflow",
          questions: [
            {
              question: "What is Pattern Lab?",
              answer: (
                <div className="space-y-3">
                  <p>Pattern Lab is our research tool for backtesting chart patterns on historical data. Validate pattern performance before trading with real money.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Capabilities:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Scan historical data for pattern occurrences</li>
                      <li>• View win rates, average R-multiples, and holding periods</li>
                      <li>• Filter by timeframe, asset, and pattern type</li>
                      <li>• Export validated patterns to trading scripts</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: "How are Pattern Lab credits calculated?",
              answer: (
                <div className="space-y-3">
                  <p>Credits scale based on the scope of your research query:</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Factors:</h4>
                    <div className="text-sm space-y-1">
                      <div>• Number of symbols scanned</div>
                      <div>• Historical lookback period</div>
                      <div>• Number of patterns analyzed</div>
                      <div>• Timeframe granularity</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Credits are estimated before you run a project, so you always know the cost upfront.</p>
                </div>
              )
            },
            {
              question: "How reliable are the backtest results?",
              answer: (
                <div className="space-y-4">
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Important Disclaimer</h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                          Backtest results are based on historical data and do not guarantee future performance. Real trading involves slippage, spreads, and execution delays not fully captured in backtests.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Our Methodology:</h4>
                    <div className="text-sm space-y-1">
                      <div>• Bar-close signal, next-bar-open fill model</div>
                      <div>• Configurable slippage and commission</div>
                      <div>• ATR-based dynamic SL/TP calculation</div>
                      <div>• Outcome tracking for each detected pattern</div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "alerts": {
      title: "Alerts",
      icon: <Bell className="h-5 w-5 text-emerald-500" />,
      description: "Pattern detection notifications",
      sections: [
        {
          category: "Alert System",
          questions: [
            {
              question: "How do pattern alerts work?",
              answer: (
                <div className="space-y-3">
                  <p>Set up alerts for specific patterns on instruments you're watching. When a pattern forms, you'll receive a notification with entry, SL, and TP levels.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Alert Contents:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Pattern name and direction</li>
                      <li>• Entry price with SL/TP brackets</li>
                      <li>• Quality score and trend alignment</li>
                      <li>• Historical win rate for that pattern</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: "What are the alert limits per plan?",
              answer: (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Active Alerts by Plan:</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between"><span>Free</span><span>3 alerts</span></div>
                      <div className="flex justify-between"><span>Starter</span><span>10 alerts</span></div>
                      <div className="flex justify-between"><span>Pro</span><span>25 alerts</span></div>
                      <div className="flex justify-between"><span>Pro+</span><span>50 alerts</span></div>
                      <div className="flex justify-between"><span>Elite</span><span>Unlimited</span></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Alerts are delivered via email with full pattern details.</p>
                </div>
              )
            }
          ]
        }
      ]
    },
    "scripts": {
      title: "Scripts",
      icon: <FileCode className="h-5 w-5 text-cyan-500" />,
      description: "Export trading scripts for TradingView and MetaTrader",
      sections: [
        {
          category: "Script Export",
          questions: [
            {
              question: "What platforms can I export scripts to?",
              answer: (
                <div className="space-y-4">
                  <p>Export pattern-based trading scripts with optimized exits to multiple platforms.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Pine Script v5 (TradingView)</div>
                        <div className="text-xs text-muted-foreground">All plans</div>
                      </div>
                      <Badge variant="default">All Plans</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">MQL4 (MetaTrader 4)</div>
                        <div className="text-xs text-muted-foreground">Expert Advisors</div>
                      </div>
                      <Badge variant="secondary">Pro+</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">MQL5 (MetaTrader 5)</div>
                        <div className="text-xs text-muted-foreground">Advanced EAs</div>
                      </div>
                      <Badge className="bg-purple-600">Elite</Badge>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "What's included in exported scripts?",
              answer: (
                <div className="space-y-3">
                  <p>Each exported script includes the complete trade logic derived from Pattern Lab backtests.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Script Contents:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Entry logic based on pattern detection</li>
                      <li>• Dynamic SL/TP recalculation using ATR</li>
                      <li>• Risk-based position sizing</li>
                      <li>• SL breach detection warnings</li>
                      <li>• Step-by-step deployment guide</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: "How do I deploy a script to TradingView?",
              answer: (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Deployment Steps:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">1</Badge>
                        <span>Open Pine Editor in TradingView (bottom panel)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">2</Badge>
                        <span>Paste the exported script code</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">3</Badge>
                        <span>Click "Add to Chart"</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">4</Badge>
                        <span>Configure input parameters (Risk %, R:R ratio)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">5</Badge>
                        <span>Set alerts for live notifications</span>
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
    "learning": {
      title: "Learning",
      icon: <BookOpen className="h-5 w-5 text-purple-500" />,
      description: "Pattern Library, articles, and quizzes",
      sections: [
        {
          category: "Educational Resources",
          questions: [
            {
              question: "What's in the Pattern Library?",
              answer: (
                <div className="space-y-3">
                  <p>A comprehensive database of chart patterns with formation rules, trading strategies, and historical statistics.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Pattern Categories</h4>
                      <div className="text-xs space-y-1">
                        <div>• Reversal patterns (H&S, Double Top/Bottom)</div>
                        <div>• Continuation patterns (Flags, Triangles)</div>
                        <div>• Candlestick patterns</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">Each Pattern Includes</h4>
                      <div className="text-xs space-y-1">
                        <div>• Formation criteria</div>
                        <div>• Entry/exit rules</div>
                        <div>• Historical success rates</div>
                        <div>• Real examples</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: "How does the Pattern Quiz work?",
              answer: (
                <div className="space-y-3">
                  <p>Test your pattern recognition skills with real chart examples and adaptive difficulty.</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Quiz Features:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Real market chart segments</li>
                      <li>• Multiple difficulty levels</li>
                      <li>• Immediate feedback with explanations</li>
                      <li>• Progress tracking</li>
                    </ul>
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
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Important Note</h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm">
                          Success rates are based on historical statistical analysis and do not guarantee future results. Market conditions vary significantly.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Use success rates as guidance, but always apply proper risk management.</p>
                </div>
              )
            }
          ]
        }
      ]
    },
    "account": {
      title: "Account & Billing",
      icon: <Crown className="h-5 w-5 text-yellow-500" />,
      description: "Subscriptions, billing, and account management",
      sections: [
        {
          category: "Subscription Plans",
          questions: [
            {
              question: "What are the subscription tiers?",
              answer: (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">FREE</Badge>
                        <span className="font-semibold">Free</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Full Screener access, limited alerts, basic Pattern Library
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">STARTER</Badge>
                        <span className="font-semibold">Starter</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pattern Lab access, 10 alerts, Pine Script export
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>PRO</Badge>
                        <span className="font-semibold">Pro</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Extended lookback, 25 alerts, priority support
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-600">ELITE</Badge>
                        <span className="font-semibold">Elite</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Unlimited alerts, MQL4/5 export, dedicated support
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Link to="/projects/pricing" className="text-primary underline">View full pricing details →</Link>
                  </p>
                </div>
              )
            },
            {
              question: "What is your refund policy?",
              answer: (
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    Refunds are available for annual plans only and must be requested within 14 calendar days of payment.
                  </p>
                  <p>
                    Monthly plans and upgrades are non-refundable.
                  </p>
                  <p className="font-medium text-foreground">
                    Users who filed chargebacks are not eligible for refunds.
                  </p>
                </div>
              )
            },
            {
              question: "What payment methods do you accept?",
              answer: (
                <div className="space-y-2 text-muted-foreground">
                  <p>We accept payments through Stripe:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Credit/Debit cards (Visa, MasterCard, Amex)</li>
                    <li>PayPal</li>
                    <li>Apple Pay and Google Pay</li>
                  </ul>
                </div>
              )
            },
            {
              question: "How do plan upgrades work?",
              answer: (
                <div className="text-muted-foreground">
                  <p>
                    When you upgrade, we calculate the prorated difference and apply your remaining subscription value to the new plan. Your billing cycle adjusts accordingly.
                  </p>
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
              Find answers about ChartingPath's pattern detection tools, research features, and trading automation.
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
                Can't find the answer you're looking for? Check our pricing page for support options.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/projects/pricing">
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
