import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ExternalLink, ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const MajorIndices = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/stocks">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Major Stock Indices
          </h1>
          <p className="text-xl text-muted-foreground">
            Track overall market performance through major benchmarks
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                S&P 500
              </CardTitle>
              <CardDescription>500 largest US companies by market capitalization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  The S&P 500 is the most widely followed equity index, representing about 80% of US stock market capitalization. It's considered the best single gauge of large-cap US equities and is used as a benchmark for countless investment portfolios. The index is market-cap weighted, meaning larger companies have more influence.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 500 large-cap US companies</li>
                    <li>• Market-cap weighted methodology</li>
                    <li>• Float-adjusted weighting</li>
                    <li>• Rebalanced quarterly</li>
                    <li>• ~$40 trillion market cap</li>
                    <li>• Average annual return: ~10% historically</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Top Holdings (as % of index)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Apple (AAPL): ~7%</li>
                    <li>• Microsoft (MSFT): ~6.5%</li>
                    <li>• Amazon (AMZN): ~3%</li>
                    <li>• NVIDIA (NVDA): ~3%</li>
                    <li>• Alphabet (GOOGL): ~2%</li>
                    <li>• Top 10: ~30% of total index</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Sector Breakdown</h4>
                <div className="grid md:grid-cols-3 gap-2">
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Information Technology</p>
                    <p className="text-xs text-muted-foreground">~29%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Healthcare</p>
                    <p className="text-xs text-muted-foreground">~13%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Financials</p>
                    <p className="text-xs text-muted-foreground">~13%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Consumer Discretionary</p>
                    <p className="text-xs text-muted-foreground">~10%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Communication Services</p>
                    <p className="text-xs text-muted-foreground">~9%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Industrials</p>
                    <p className="text-xs text-muted-foreground">~8%</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How to Trade/Invest</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• ETFs: SPY (most liquid), IVV, VOO (lower expense ratios)</li>
                  <li>• Futures: E-mini S&P 500 (ES), Micro E-mini (MES)</li>
                  <li>• Options on SPY for hedging or speculation</li>
                  <li>• Index mutual funds with low fees</li>
                  <li>• CFDs for international traders</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.spglobal.com/spdji/en/indices/equity/sp-500/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    S&P 500 Official <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.tradingview.com/symbols/SPX/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    SPX Chart <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.cmegroup.com/markets/equities/sp/e-mini-sandp500.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    ES Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dow Jones Industrial Average (DJIA)</CardTitle>
              <CardDescription>30 blue-chip US industrial companies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  The Dow is the oldest and most well-known US stock index, created in 1896. Unlike other major indices, it's price-weighted rather than market-cap weighted, meaning higher-priced stocks have more influence regardless of company size. The 30 components are hand-picked to represent major industries.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Only 30 components</li>
                    <li>• Price-weighted (unique methodology)</li>
                    <li>• "Blue chip" stocks only</li>
                    <li>• Components rarely change</li>
                    <li>• Oldest stock index (since 1896)</li>
                    <li>• Often moves with S&P 500</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Notable Components</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• UnitedHealth Group (UNH)</li>
                    <li>• Goldman Sachs (GS)</li>
                    <li>• Microsoft (MSFT)</li>
                    <li>• Home Depot (HD)</li>
                    <li>• McDonald's (MCD)</li>
                    <li>• Boeing (BA)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How to Trade/Invest</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• ETF: DIA (SPDR Dow Jones Industrial Average)</li>
                  <li>• Futures: DJIA futures, Mini Dow (YM)</li>
                  <li>• Options on DIA</li>
                  <li>• Note: Less diverse than S&P 500, more concentrated</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.spglobal.com/spdji/en/indices/equity/dow-jones-industrial-average/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    DJIA Official <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.tradingview.com/symbols/DJI/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    DJI Chart <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NASDAQ Composite & NASDAQ-100</CardTitle>
              <CardDescription>Tech-heavy US indices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">NASDAQ Composite</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Includes all stocks listed on NASDAQ exchange (~3,000+ companies). Heavy tech weighting.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 3,000+ companies</li>
                    <li>• Market-cap weighted</li>
                    <li>• ~50% Technology sector</li>
                    <li>• Includes many small-caps</li>
                    <li>• Higher volatility than S&P 500</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">NASDAQ-100</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Top 100 largest non-financial NASDAQ companies. More focused, more liquid.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 100 largest non-financial stocks</li>
                    <li>• Heavy tech concentration</li>
                    <li>• Most popular for trading</li>
                    <li>• Top holdings: AAPL, MSFT, NVDA, AMZN</li>
                    <li>• Higher growth potential</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Top Holdings (NASDAQ-100)</h4>
                <div className="grid md:grid-cols-3 gap-2">
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Apple</p>
                    <p className="text-xs text-muted-foreground">~10%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Microsoft</p>
                    <p className="text-xs text-muted-foreground">~9%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">NVIDIA</p>
                    <p className="text-xs text-muted-foreground">~5%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Amazon</p>
                    <p className="text-xs text-muted-foreground">~4.5%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Meta</p>
                    <p className="text-xs text-muted-foreground">~3.5%</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-xs font-medium">Tesla</p>
                    <p className="text-xs text-muted-foreground">~3%</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How to Trade/Invest</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• QQQ (Invesco NASDAQ-100 ETF) - most popular</li>
                  <li>• Futures: Nasdaq-100 E-mini (NQ), Micro (MNQ)</li>
                  <li>• Options on QQQ (highly liquid)</li>
                  <li>• TQQQ (3x leveraged bull), SQQQ (3x leveraged bear)</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.nasdaq.com/market-activity/index/comp" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    NASDAQ Composite <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.nasdaq.com/market-activity/index/ndx" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    NASDAQ-100 <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    NQ Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Indices</CardTitle>
              <CardDescription>Major global stock market benchmarks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">FTSE 100 (UK)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 100 largest UK companies</li>
                    <li>• Heavy in financials, energy, materials</li>
                    <li>• Trade: ISF ETF, CFDs</li>
                    <li>• Hours: 3am-11:30am EST</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">DAX (Germany)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 40 largest German companies</li>
                    <li>• Eurozone economic bellwether</li>
                    <li>• Trade: EWG ETF, DAX futures</li>
                    <li>• Hours: 3am-11:30am EST</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Nikkei 225 (Japan)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 225 major Japanese stocks</li>
                    <li>• Price-weighted like Dow</li>
                    <li>• Trade: EWJ ETF, Nikkei futures</li>
                    <li>• Hours: 7pm-5:30am EST</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Hang Seng (Hong Kong)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 50 largest Hong Kong stocks</li>
                    <li>• China exposure proxy</li>
                    <li>• Trade: EWH ETF</li>
                    <li>• Hours: 9:30pm-4am EST</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.londonstockexchange.com/indices/ftse-100" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    FTSE 100 <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.deutsche-boerse.com/dbg-en/products-services/indices/dax" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    DAX <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://indexes.nikkei.co.jp/en/nkave" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Nikkei 225 <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Trading & Investing in Indices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Indices offer diversification - single trade, broad exposure</li>
                  <li>• ETFs: best for long-term investors (low fees, tax efficient)</li>
                  <li>• Futures: best for traders (leverage, nearly 24-hour trading)</li>
                  <li>• Options: for hedging portfolios or speculation</li>
                  <li>• Watch expense ratios on ETFs (VOO 0.03% vs SPY 0.09%)</li>
                  <li>• Consider tax implications (ETF vs mutual fund vs futures)</li>
                  <li>• Dollar-cost averaging works well with index investing</li>
                  <li>• Rebalance periodically if holding multiple indices</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.investing.com/indices/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Global Indices <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://finance.yahoo.com/world-indices/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Yahoo Finance Indices <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.etf.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      ETF Research <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MajorIndices;