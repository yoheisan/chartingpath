import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Repeat, TrendingUp, ExternalLink, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const CrossCurrencyPairs = () => {
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
            Cross Currency Pairs & Exotics
          </h1>
          <p className="text-xl text-muted-foreground">
            Currency pairs that don't include the US Dollar - opportunities and risks
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Understanding Cross Pairs
              </CardTitle>
              <CardDescription>What are cross currency pairs?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Cross currency pairs (crosses) are currency pairs that do not include the US Dollar. They allow traders to directly express views on one currency versus another without USD exposure. While they offer diversification, crosses typically have wider spreads and lower liquidity than major pairs.
                </p>
                <p className="text-sm text-muted-foreground">
                  The most liquid crosses involve EUR, GBP, JPY, CHF, AUD, CAD, and NZD. Crosses are calculated from their respective USD pairs: EUR/GBP = EUR/USD ÷ GBP/USD.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Important Considerations
                </h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Wider spreads than major pairs (typically 2-5 pips)</li>
                  <li>• Lower liquidity, especially outside European/Asian sessions</li>
                  <li>• More susceptible to whipsaw movements</li>
                  <li>• May have higher margin requirements</li>
                  <li>• Less efficient price discovery</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>EUR Crosses</CardTitle>
              <CardDescription>Euro-based cross currency pairs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">EUR/GBP - Euro Pound</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Most liquid EUR cross. Reflects relative strength of Eurozone vs UK economy.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Tight range-bound trading common</li>
                    <li>• Brexit impact significant</li>
                    <li>• ECB vs BoE policy divergence</li>
                    <li>• Average range: 40-60 pips</li>
                    <li>• Best hours: European session</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">EUR/JPY - Euro Yen</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Risk sentiment barometer. Rises in risk-on, falls in risk-off.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• High volatility cross</li>
                    <li>• Carry trade favorite</li>
                    <li>• Follows stock market trends</li>
                    <li>• Average range: 80-120 pips</li>
                    <li>• Safe haven vs risk currency</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">EUR/CHF - Euro Franc</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Two European currencies. SNB closely monitors this pair.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Lower volatility</li>
                    <li>• SNB intervention risk</li>
                    <li>• High correlation (often range-bound)</li>
                    <li>• Safe haven vs safe haven</li>
                    <li>• Watch for SNB floor levels</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">EUR/AUD & EUR/CAD</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Commodity currency crosses showing risk sentiment.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Commodity price sensitive</li>
                    <li>• China demand impact (AUD)</li>
                    <li>• Oil prices affect (CAD)</li>
                    <li>• Higher volatility</li>
                    <li>• Interest rate differential trades</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.tradingview.com/symbols/EURGBP/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    EUR/GBP Chart <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.tradingview.com/symbols/EURJPY/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    EUR/JPY Chart <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GBP Crosses</CardTitle>
              <CardDescription>British Pound cross pairs - high volatility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">GBP/JPY - The Beast</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Nicknamed "The Beast" for extreme volatility and large pip moves.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Highest volatility major cross</li>
                    <li>• Average range: 120-180 pips</li>
                    <li>• Can move 200+ pips in a day</li>
                    <li>• Risk sentiment amplifier</li>
                    <li>• Popular with swing traders</li>
                    <li>• Not for beginners</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">GBP/CHF - Pound Swiss</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Volatile cross combining risk (GBP) and safe haven (CHF).
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• High volatility</li>
                    <li>• Risk-on/risk-off plays</li>
                    <li>• BoE vs SNB policy</li>
                    <li>• Wide spreads (3-5 pips)</li>
                    <li>• European session most active</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">GBP/AUD - Pound Aussie</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    High-yielding cross influenced by commodity prices and risk.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Large pip movements</li>
                    <li>• Commodity correlation</li>
                    <li>• China data impact</li>
                    <li>• Interest rate differential</li>
                    <li>• Wide spreads</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">GBP/CAD - Pound Loonie</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Oil price sensitivity combined with BoE policy impact.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Oil price correlation</li>
                    <li>• High volatility</li>
                    <li>• Good trending potential</li>
                    <li>• Brexit impact on GBP side</li>
                    <li>• BoE vs BoC policy</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  GBP Cross Trading Warning
                </h5>
                <p className="text-sm text-muted-foreground">
                  GBP crosses are extremely volatile and can produce massive pip swings. They require wider stops, larger capital, and are best suited for experienced traders. A 100-pip stop on GBP/JPY can be hit in minutes during volatile sessions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commodity Currency Crosses</CardTitle>
              <CardDescription>AUD, NZD, and CAD crosses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">AUD/JPY - Aussie Yen</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pure risk-on/risk-off play. Rises with stocks, falls with fear.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Risk sentiment indicator</li>
                    <li>• China growth proxy</li>
                    <li>• Commodity price correlation</li>
                    <li>• Carry trade popular</li>
                    <li>• High volatility</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">NZD/JPY - Kiwi Yen</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Highest interest rate differential historically. Carry trade favorite.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Extreme carry trade</li>
                    <li>• Follows risk sentiment</li>
                    <li>• Dairy prices impact</li>
                    <li>• Lower liquidity</li>
                    <li>• Asian session active</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">AUD/NZD - Aussie Kiwi</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Trans-Tasman cross. Two similar economies, subtle differences.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Range-bound often</li>
                    <li>• Interest rate spread</li>
                    <li>• Commodity divergence</li>
                    <li>• Lower volatility</li>
                    <li>• Technical levels respected</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">AUD/CAD & CAD/JPY</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Commodity-driven crosses sensitive to oil and metals.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Oil vs metals divergence</li>
                    <li>• Canada-US ties (CAD)</li>
                    <li>• China demand (AUD)</li>
                    <li>• Risk sentiment plays</li>
                    <li>• Central bank policy spreads</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Exotic Currency Pairs
              </CardTitle>
              <CardDescription>Emerging market currencies - highest risk and reward</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">What Are Exotic Pairs?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Exotic pairs include currencies from emerging markets paired with major currencies (usually USD). Examples: USD/TRY (Turkish Lira), USD/ZAR (South African Rand), USD/MXN (Mexican Peso), USD/BRL (Brazilian Real). They offer high volatility and potentially large moves but come with significant risks.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 border-orange-500/50">
                  <h5 className="font-semibold mb-2 text-orange-500">Opportunities</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Large pip movements (100s-1000s pips)</li>
                    <li>• High interest rate differentials</li>
                    <li>• Less crowded trades</li>
                    <li>• Carry trade potential</li>
                    <li>• Economic reform catalysts</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 border-red-500/50">
                  <h5 className="font-semibold mb-2 text-red-500">Risks</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Very wide spreads (10-50+ pips)</li>
                    <li>• Low liquidity, slippage common</li>
                    <li>• Political instability</li>
                    <li>• Economic crisis risk</li>
                    <li>• Capital controls possible</li>
                    <li>• Limited broker access</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-red-500/10">
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Warning: Not For Beginners
                </h5>
                <p className="text-sm text-muted-foreground">
                  Exotic pairs are only suitable for experienced traders with deep understanding of the specific country's economics, politics, and central bank policy. They require significantly more capital due to wider stops, and can gap dramatically on news. Many retail traders should avoid these entirely.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Cross & Exotic Pairs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Start with EUR and GBP crosses before exotic pairs</li>
                  <li>• Use wider stops than you would for majors (typically 1.5-2x)</li>
                  <li>• Reduce position size to account for higher volatility</li>
                  <li>• Trade during peak liquidity hours for each currency</li>
                  <li>• Understand the fundamental drivers of both currencies</li>
                  <li>• Watch for correlation breakdowns (opportunity or risk)</li>
                  <li>• Factor in higher spread costs when calculating risk/reward</li>
                  <li>• Avoid crosses during thin liquidity periods (higher slippage)</li>
                  <li>• For exotics: only risk 0.5-1% per trade (vs 1-2% for majors)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.tradingview.com/markets/currencies/cross-rates/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      TradingView Crosses <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.investing.com/currencies/cross-rates" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Investing.com Cross Rates <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.myfxbook.com/forex-market/correlation" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Currency Correlations <ExternalLink className="ml-2 h-3 w-3" />
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

export default CrossCurrencyPairs;