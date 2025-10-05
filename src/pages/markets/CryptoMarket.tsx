import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Zap, Clock, BarChart3, Shield } from "lucide-react";

const CryptoMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Cryptocurrency Market
          </h1>
          <p className="text-xl text-muted-foreground">
            The digital asset market revolutionizing finance with 24/7 trading
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                What is Cryptocurrency Trading?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Cryptocurrency trading involves buying and selling digital assets like Bitcoin, Ethereum, and thousands of other cryptocurrencies. These decentralized digital currencies use blockchain technology and operate independently of central banks.
              </p>
              <p>
                Crypto markets are known for high volatility, 24/7 trading availability, and the potential for significant gains (and losses).
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
                    <span><strong>Market Cap:</strong> $2+ trillion total market capitalization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Trading Hours:</strong> 24/7/365 - Never closes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Volatility:</strong> Extremely high - rapid price movements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Decentralization:</strong> No central authority control</span>
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
                  <li><strong>HODLing:</strong> Long-term holding strategy</li>
                  <li><strong>Day Trading:</strong> Capitalizing on daily volatility</li>
                  <li><strong>Swing Trading:</strong> Trading medium-term price swings</li>
                  <li><strong>Arbitrage:</strong> Profiting from exchange price differences</li>
                  <li><strong>DCA (Dollar Cost Averaging):</strong> Regular fixed-amount purchases</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Cryptocurrencies</CardTitle>
              <CardDescription>Leading digital assets by market cap</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Bitcoin (BTC)</h4>
                  <p className="text-sm text-muted-foreground">First cryptocurrency, digital gold</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Ethereum (ETH)</h4>
                  <p className="text-sm text-muted-foreground">Smart contract platform</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Binance Coin (BNB)</h4>
                  <p className="text-sm text-muted-foreground">Exchange token ecosystem</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Solana (SOL)</h4>
                  <p className="text-sm text-muted-foreground">High-speed blockchain</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Cardano (ADA)</h4>
                  <p className="text-sm text-muted-foreground">Research-driven blockchain</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Ripple (XRP)</h4>
                  <p className="text-sm text-muted-foreground">Payment settlement system</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Crypto Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Choose a reputable exchange (Coinbase, Binance, Kraken)</li>
                <li>Set up secure wallet storage (hardware wallet recommended)</li>
                <li>Understand blockchain technology basics</li>
                <li>Learn about different types of cryptocurrencies</li>
                <li>Start with small amounts and major cryptocurrencies</li>
                <li>Use two-factor authentication (2FA) for security</li>
                <li>Never invest more than you can afford to lose</li>
                <li>Stay updated on regulatory changes and news</li>
                <li>Beware of scams and do thorough research (DYOR)</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-amber-500">⚠️ Important Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Cryptocurrency markets are extremely volatile and speculative</li>
                <li>• Regulatory landscape is still evolving globally</li>
                <li>• Many projects are scams or have no real utility</li>
                <li>• Price manipulation and market manipulation exist</li>
                <li>• Tax implications vary by country - consult a tax professional</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CryptoMarket;
