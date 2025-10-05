import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, ExternalLink, ArrowLeft, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const MajorCurrencyPairs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/forex">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forex Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Major Currency Pairs
          </h1>
          <p className="text-xl text-muted-foreground">
            The most liquid and actively traded forex pairs in the world
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                EUR/USD - The Euro Dollar
              </CardTitle>
              <CardDescription>The world's most traded currency pair</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  EUR/USD represents 25-30% of all forex trading volume. It shows how many US dollars are needed to buy one euro. This pair is influenced by the monetary policies of the European Central Bank (ECB) and the Federal Reserve, economic data from both regions, and global risk sentiment.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Trading Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Tightest spreads (often 0.1-0.2 pips)</li>
                    <li>• Highest liquidity</li>
                    <li>• Average daily range: 70-100 pips</li>
                    <li>• Most active: 8am-11am EST, 2pm-4pm EST</li>
                    <li>• Lower volatility compared to other majors</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Drivers</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• ECB and Fed interest rate decisions</li>
                    <li>• US Non-Farm Payrolls (NFP)</li>
                    <li>• Eurozone GDP and inflation</li>
                    <li>• German economic data (Eurozone engine)</li>
                    <li>• US Dollar Index (DXY) movements</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Economic Indicators to Watch</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">US Indicators</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Non-Farm Payrolls (1st Friday)</li>
                      <li>• CPI & Core CPI (monthly)</li>
                      <li>• FOMC meetings (8 times/year)</li>
                      <li>• GDP (quarterly)</li>
                      <li>• Retail Sales (monthly)</li>
                    </ul>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Eurozone Indicators</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• ECB policy meetings</li>
                      <li>• German IFO & ZEW surveys</li>
                      <li>• Eurozone CPI (monthly)</li>
                      <li>• Manufacturing PMI</li>
                      <li>• ECB President speeches</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.ecb.europa.eu/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    European Central Bank <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.federalreserve.gov/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Federal Reserve <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.investing.com/currencies/eur-usd" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    EUR/USD Live Chart <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GBP/USD - The Cable</CardTitle>
              <CardDescription>British Pound vs US Dollar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Nicknamed "Cable" from the telegraph cable that transmitted exchange rates between London and New York in the 1800s. Known for its volatility, especially around UK economic data and Bank of England decisions. Brexit continues to influence this pair.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Trading Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Higher volatility than EUR/USD</li>
                    <li>• Average daily range: 100-150 pips</li>
                    <li>• Spreads: 0.5-1.5 pips typically</li>
                    <li>• Most active: London/NY overlap</li>
                    <li>• Large intraday swings common</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Drivers</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Bank of England (BoE) policy</li>
                    <li>• UK employment and GDP data</li>
                    <li>• Political developments (Parliament)</li>
                    <li>• Brexit-related news</li>
                    <li>• Risk sentiment (GBP risk-sensitive)</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.bankofengland.co.uk/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Bank of England <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.ons.gov.uk/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    UK Statistics (ONS) <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>USD/JPY - The Gopher</CardTitle>
              <CardDescription>US Dollar vs Japanese Yen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Second most traded pair after EUR/USD. The Japanese Yen is considered a safe-haven currency. USD/JPY is highly sensitive to risk sentiment, US Treasury yields, and Bank of Japan intervention. Often used as a barometer for Asian market sentiment.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Trading Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Tight spreads: 0.1-0.5 pips</li>
                    <li>• High liquidity, especially Asian session</li>
                    <li>• Average daily range: 60-80 pips</li>
                    <li>• Carry trade favorite (interest rate differential)</li>
                    <li>• Influenced by stock market sentiment</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Drivers</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• US Treasury yields (strong correlation)</li>
                    <li>• Risk-on/risk-off sentiment</li>
                    <li>• Bank of Japan (BoJ) interventions</li>
                    <li>• Japanese trade balance</li>
                    <li>• S&P 500 performance (correlation)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Important Considerations</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• JPY strengthens during risk-off periods (safe haven)</li>
                  <li>• BoJ maintains ultra-loose monetary policy (yield curve control)</li>
                  <li>• Watch for BoJ intervention, especially above 150.00</li>
                  <li>• Strong correlation with 10-year US Treasury yields</li>
                  <li>• Tokyo session (7pm-4am EST) sees highest JPY activity</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.boj.or.jp/en/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Bank of Japan <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.mof.go.jp/english/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Japan Ministry of Finance <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>USD/CHF - The Swissie</CardTitle>
              <CardDescription>US Dollar vs Swiss Franc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  The Swiss Franc is another safe-haven currency, often moving inversely to EUR/USD due to Switzerland's proximity to the Eurozone. Known for stability and low volatility under normal conditions, but can spike during risk-off events.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Trading Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Lower volatility than other majors</li>
                    <li>• Inverse correlation with EUR/USD (80%+)</li>
                    <li>• Spreads: 1-2 pips typically</li>
                    <li>• Safe-haven flows increase volatility</li>
                    <li>• Most active during European hours</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Drivers</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Swiss National Bank (SNB) policy</li>
                    <li>• Global risk sentiment</li>
                    <li>• Eurozone economic health</li>
                    <li>• Gold prices (CHF correlation)</li>
                    <li>• SNB interventions</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.snb.ch/en/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Swiss National Bank <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Major Pairs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Trade during peak liquidity hours (London/NY overlap 8am-12pm EST)</li>
                  <li>• Avoid trading during major news releases if you're not prepared</li>
                  <li>• Use economic calendars to track high-impact events</li>
                  <li>• Understand central bank cycles and interest rate differentials</li>
                  <li>• Major pairs offer tightest spreads - ideal for beginners</li>
                  <li>• Watch correlations: EUR/USD vs USD/CHF (negative), USD/JPY vs stocks (positive)</li>
                  <li>• Pay attention to safe-haven flows during market stress</li>
                  <li>• Use proper position sizing (1-2% risk per trade maximum)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Essential Trading Resources
                </h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Forex Factory Calendar <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.dailyfx.com/economic-calendar" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      DailyFX Calendar <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.myfxbook.com/forex-economic-calendar" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Myfxbook Calendar <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.babypips.com/learn/forex" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      BabyPips Education <ExternalLink className="ml-2 h-3 w-3" />
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

export default MajorCurrencyPairs;