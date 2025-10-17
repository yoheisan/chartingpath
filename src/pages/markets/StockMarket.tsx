import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Building2, BarChart3, Users, Clock, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const StockMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Stock Market Trading
          </h1>
          <p className="text-xl text-muted-foreground">
            The world's largest and most popular financial market for trading company shares
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                What is the Stock Market?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The stock market is where investors buy and sell shares of publicly traded companies. When you own a stock, you own a piece of that company and can benefit from its growth and profitability.
              </p>
              <p>
                Major stock exchanges include the New York Stock Exchange (NYSE), NASDAQ, London Stock Exchange (LSE), and Tokyo Stock Exchange (TSE).
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
                    <span><strong>Market Size:</strong> Over $100 trillion global market capitalization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Trading Hours:</strong> Typically 9:30 AM - 4:00 PM local time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Participants:</strong> Individual investors, institutions, hedge funds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Accessibility:</strong> Global access through brokers</span>
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
                  <li><strong>Day Trading:</strong> Buying and selling within the same day</li>
                  <li><strong>Swing Trading:</strong> Holding positions for days or weeks</li>
                  <li><strong>Value Investing:</strong> Long-term investment in undervalued companies</li>
                  <li><strong>Growth Investing:</strong> Investing in high-growth potential companies</li>
                  <li><strong>Dividend Investing:</strong> Focus on stocks with regular dividend payments</li>
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
                  <CardDescription>Most liquid forex pairs</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    EUR/USD, GBP/USD, USD/JPY, USD/CHF - Tightest spreads and highest liquidity.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">EUR/USD</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">GBP/USD</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">USD/JPY</span>
                  </div>
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
                  <CardDescription>Higher volatility opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    EUR/GBP, GBP/JPY, AUD/JPY and emerging market currencies.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">EUR/JPY</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">GBP/JPY</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Exotics</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/markets/stocks/sectors">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Stock Market Sectors</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>11 GICS sectors explained</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Technology, Healthcare, Financials, and 8 more sectors for diversification.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Tech</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Healthcare</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Finance</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/markets/stocks/indices">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Major Stock Indices</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>Track overall market performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    S&P 500, Dow Jones, NASDAQ, and international indices.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">S&P 500</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">NASDAQ</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Dow Jones</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Stock Trading</CardTitle>
              <CardDescription>Your roadmap to becoming a successful stock trader</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">1. Choose a Reputable Broker</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select a regulated broker with competitive fees, user-friendly platform, and good customer support. Consider commission structures, account minimums, and available research tools.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Popular options: Fidelity, Charles Schwab, Interactive Brokers, TD Ameritrade
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">2. Master Fundamental Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Learn to evaluate company health through financial statements, earnings reports, P/E ratios, revenue growth, debt levels, and competitive positioning in their industry.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Key metrics: EPS, P/E ratio, PEG ratio, debt-to-equity, ROE, profit margins
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">3. Study Technical Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Understand chart patterns, support/resistance levels, moving averages, RSI, MACD, and volume analysis. Technical analysis helps identify optimal entry and exit points.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Essential tools: Candlestick patterns, trend lines, Fibonacci retracements
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">4. Practice with Paper Trading</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use demo accounts to practice strategies without risking real money. Track your performance, learn from mistakes, and build confidence before committing capital.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Minimum practice period: 2-3 months of consistent profitable trading
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">5. Start with Blue-Chip Stocks</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Begin with established, financially stable companies with proven track records. These large-cap stocks tend to be less volatile and more predictable for beginners.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Examples: Apple, Microsoft, Johnson & Johnson, Coca-Cola, Procter & Gamble
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">6. Diversify Your Portfolio</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Spread investments across different sectors (technology, healthcare, finance, consumer goods, energy) to reduce risk. Don't put all your capital in one stock or sector.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Recommended: 10-15 stocks across 5-7 different sectors
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">7. Develop Clear Trading Strategies</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Set specific entry and exit rules, stop-loss levels (typically 5-10% below entry), and profit targets. Use risk-reward ratios of at least 1:2 (risk $1 to potentially make $2).
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Never risk more than 1-2% of your total capital on a single trade
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">8. Continue Education</h4>
                    <p className="text-sm text-muted-foreground">
                      Stay updated on market news, economic indicators, and company developments. Read annual reports, follow financial news, and learn from experienced investors.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StockMarket;
