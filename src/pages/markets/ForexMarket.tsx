import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Globe, Clock, BarChart3, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ForexMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Forex (Foreign Exchange) Market
          </h1>
          <p className="text-xl text-muted-foreground">
            The world's largest and most liquid financial market, trading $7.5 trillion daily
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                What is Forex Trading?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Forex trading involves buying and selling currencies in pairs (e.g., EUR/USD). When you trade forex, you're simultaneously buying one currency and selling another, profiting from changes in exchange rates.
              </p>
              <p>
                The forex market is decentralized and operates 24 hours a day, 5 days a week, making it accessible to traders worldwide at any time.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Daily Volume:</strong> $7.5 trillion traded daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Trading Hours:</strong> 24 hours, 5 days a week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Leverage:</strong> High leverage available (up to 1:500)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Liquidity:</strong> Extremely high, instant execution</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Popular Trading Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li><strong>Scalping:</strong> Very short-term trades (seconds to minutes)</li>
                  <li><strong>Day Trading:</strong> Opening and closing within same day</li>
                  <li><strong>Swing Trading:</strong> Holding for days to weeks</li>
                  <li><strong>Position Trading:</strong> Long-term trend following</li>
                  <li><strong>Carry Trade:</strong> Profiting from interest rate differentials</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/markets/forex/major-pairs">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Major Currency Pairs</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">EUR/USD, GBP/USD, USD/JPY, USD/CHF - Tightest spreads.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/markets/forex/cross-pairs">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cross & Exotic Pairs</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">EUR/GBP, GBP/JPY, AUD/JPY and emerging markets.</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Forex Trading</CardTitle>
              <CardDescription>Your roadmap to currency trading</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">EUR/USD (Euro/US Dollar)</h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Most Liquid</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    The most traded currency pair globally, representing about 24% of daily forex volume. Highly liquid with tight spreads, making it ideal for all trading styles.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded">Lowest spreads</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">High liquidity</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Most predictable</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">GBP/USD (Cable)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      British Pound vs US Dollar. Known for higher volatility, offering larger price movements but also greater risk. Popular among day traders.
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded">High volatility</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">USD/JPY (Gopher)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      US Dollar vs Japanese Yen. Sensitive to Asian economic data and safe-haven flows. Popular for carry trades due to Japan's low interest rates.
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Carry trade favorite</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">USD/CHF (Swissie)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      US Dollar vs Swiss Franc. Often moves inversely to EUR/USD. CHF is considered a safe-haven currency during market turmoil.
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Safe haven</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">AUD/USD (Aussie)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Australian Dollar vs US Dollar. Commodity-correlated currency, influenced by China's economy and commodity prices, especially gold and iron ore.
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Commodity-linked</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">USD/CAD (Loonie)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      US Dollar vs Canadian Dollar. Heavily influenced by oil prices since Canada is a major oil exporter. Negative correlation with crude oil.
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Oil-dependent</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">NZD/USD (Kiwi)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      New Zealand Dollar vs US Dollar. Similar to AUD, influenced by dairy prices and Asian economic performance. Higher yield currency for carry trades.
                    </p>
                    <span className="text-xs bg-muted px-2 py-1 rounded">High yield</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Forex Trading</CardTitle>
              <CardDescription>Essential steps to begin your forex trading journey safely</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">1. Choose a Regulated Forex Broker</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select a broker regulated by reputable authorities (FCA, ASIC, NFA, CySEC). Compare spreads, commissions, execution speed, and available currency pairs.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Look for: tight spreads (0-2 pips), fast execution, no requotes, segregated client funds
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">2. Understand Forex Terminology</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Master key concepts: pip (smallest price move), lot sizes (standard=100k, mini=10k, micro=1k), leverage ratios, margin requirements, and spread costs.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Example: 1 pip in EUR/USD = $10 per standard lot, $1 per mini lot, $0.10 per micro lot
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">3. Learn Fundamental Analysis</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Study how economic indicators affect currency values: interest rates, GDP, inflation (CPI), employment data (NFP), central bank policies, and geopolitical events.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Key reports: NFP (US jobs), FOMC meetings, ECB decisions, retail sales, PMI data
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">4. Master Technical Analysis</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Learn chart patterns (head & shoulders, double tops/bottoms), indicators (RSI, MACD, Bollinger Bands), support/resistance levels, and trend analysis.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Focus on: price action trading, candlestick patterns, multiple timeframe analysis
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">5. Practice with Demo Account</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Trade with virtual money for at least 3-6 months until consistently profitable. Test different strategies, timeframes, and currency pairs without financial risk.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Goal: Achieve 3 consecutive profitable months before trading real money
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">6. Start Small with Major Pairs</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Begin trading EUR/USD or USD/JPY with micro lots. These pairs have the tightest spreads and highest liquidity, reducing your trading costs and slippage risk.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Initial capital: Start with at least $500-1000, trade micro lots (0.01-0.05)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">7. Implement Strict Risk Management</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Never risk more than 1-2% of account per trade. Use stop-losses on every trade. Maintain risk-reward ratios of at least 1:2. Avoid over-leveraging (use max 1:10 as beginner).
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Example: $1000 account = max $10-20 risk per trade, stop-loss 20 pips on EUR/USD
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">8. Maintain a Trading Journal</h4>
                  <p className="text-sm text-muted-foreground">
                    Record every trade: entry/exit points, reasons, emotions, market conditions, and outcome. Analyze weekly to identify patterns, mistakes, and areas for improvement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ForexMarket;
