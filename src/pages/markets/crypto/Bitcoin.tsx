import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bitcoin as BitcoinIcon, TrendingUp, ExternalLink, ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Bitcoin = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/crypto">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cryptocurrency Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bitcoin (BTC)
          </h1>
          <p className="text-xl text-muted-foreground">
            The first and largest cryptocurrency - digital gold
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BitcoinIcon className="h-5 w-5 text-orange-500" />
                What is Bitcoin?
              </CardTitle>
              <CardDescription>The original decentralized digital currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Bitcoin is the first cryptocurrency, created in 2009 by the pseudonymous Satoshi Nakamoto. It operates on a decentralized peer-to-peer network secured by blockchain technology. Bitcoin has a fixed supply cap of 21 million coins, with approximately 19.5 million already mined. Often called "digital gold," it's primarily used as a store of value and hedge against inflation.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Maximum supply: 21 million BTC</li>
                    <li>• Block time: ~10 minutes</li>
                    <li>• Consensus: Proof of Work (PoW)</li>
                    <li>• Halving: Every 210,000 blocks (~4 years)</li>
                    <li>• Divisible to 8 decimals (satoshis)</li>
                    <li>• Market dominance: 40-50%</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Market Stats (Typical)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $500B - $1.3T</li>
                    <li>• Daily volume: $15B - $50B</li>
                    <li>• Circulating: ~19.5M / 21M</li>
                    <li>• All-time high: $69,000 (Nov 2021)</li>
                    <li>• Inflation rate: ~1.7% (decreasing)</li>
                    <li>• Next halving: April 2024</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bitcoin Halving Cycles</CardTitle>
              <CardDescription>Understanding Bitcoin's supply schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">What is the Halving?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Every 210,000 blocks (~4 years), the Bitcoin mining reward is cut in half. This programmed scarcity is a key feature that makes Bitcoin deflationary over time. Historically, halvings have been followed by significant bull runs 12-18 months later.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="border rounded p-3">
                  <p className="font-medium text-sm">1st Halving (2012)</p>
                  <p className="text-xs text-muted-foreground mb-1">50 BTC → 25 BTC per block</p>
                  <p className="text-xs text-muted-foreground">Price: $12 → Peak $1,100 (2013)</p>
                </div>
                <div className="border rounded p-3">
                  <p className="font-medium text-sm">2nd Halving (2016)</p>
                  <p className="text-xs text-muted-foreground mb-1">25 BTC → 12.5 BTC per block</p>
                  <p className="text-xs text-muted-foreground">Price: $650 → Peak $19,700 (2017)</p>
                </div>
                <div className="border rounded p-3">
                  <p className="font-medium text-sm">3rd Halving (2020)</p>
                  <p className="text-xs text-muted-foreground mb-1">12.5 BTC → 6.25 BTC per block</p>
                  <p className="text-xs text-muted-foreground">Price: $8,800 → Peak $69,000 (2021)</p>
                </div>
                <div className="border rounded p-3">
                  <p className="font-medium text-sm">4th Halving (2024)</p>
                  <p className="text-xs text-muted-foreground mb-1">6.25 BTC → 3.125 BTC per block</p>
                  <p className="text-xs text-muted-foreground">Expected: April 2024</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-semibold mb-2">4-Year Cycle Pattern</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Year 1 (Post-halving): Accumulation, slow growth</li>
                  <li>• Year 2: Bull market, new ATH typically reached</li>
                  <li>• Year 3: Peak and correction, bear market begins</li>
                  <li>• Year 4: Bear market bottom, next halving approaching</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Price Drivers</CardTitle>
              <CardDescription>What moves Bitcoin's price?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Macro Factors</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• US Dollar strength (inverse correlation)</li>
                    <li>• Federal Reserve policy & interest rates</li>
                    <li>• Inflation data and expectations</li>
                    <li>• Global liquidity conditions</li>
                    <li>• Stock market risk sentiment</li>
                    <li>• Geopolitical tensions</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Crypto-Specific</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Halving events and anticipation</li>
                    <li>• Institutional adoption news</li>
                    <li>• ETF approvals and flows</li>
                    <li>• Exchange inflows/outflows</li>
                    <li>• Mining difficulty and hashrate</li>
                    <li>• Regulatory developments</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">On-Chain Metrics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Active addresses and transactions</li>
                    <li>• Exchange reserves (lower = bullish)</li>
                    <li>• Long-term holder behavior</li>
                    <li>• MVRV ratio (market value / realized value)</li>
                    <li>• Stock-to-Flow model</li>
                    <li>• Network hash rate trends</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Sentiment Indicators</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Fear & Greed Index</li>
                    <li>• Funding rates (perpetual futures)</li>
                    <li>• Options open interest</li>
                    <li>• Google Trends search volume</li>
                    <li>• Social media sentiment</li>
                    <li>• Whale wallet movements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How to Buy & Store Bitcoin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Buying Bitcoin</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Centralized Exchanges</p>
                    <p className="text-xs text-muted-foreground mb-2">Easiest for beginners. Fiat on-ramps.</p>
                    <p className="text-xs text-muted-foreground">Coinbase, Kraken, Binance, Gemini</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Bitcoin ETFs</p>
                    <p className="text-xs text-muted-foreground mb-2">Traditional brokerage accounts. No custody.</p>
                    <p className="text-xs text-muted-foreground">IBIT, FBTC, GBTC (spot ETFs)</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">P2P Platforms</p>
                    <p className="text-xs text-muted-foreground mb-2">Direct trades, more private.</p>
                    <p className="text-xs text-muted-foreground">Bisq, HodlHodl, LocalBitcoins</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Storage Options</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Self-Custody (Recommended)</h5>
                    <p className="text-sm text-muted-foreground mb-2">"Not your keys, not your coins"</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Hardware wallets: Ledger, Trezor, Coldcard</li>
                      <li>• Software wallets: Electrum, BlueWallet</li>
                      <li>• Multi-sig for large amounts</li>
                      <li>• Secure seed phrase backup</li>
                      <li>• Best for long-term holding</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Exchange Custody</h5>
                    <p className="text-sm text-muted-foreground mb-2">Convenient but you don't control keys</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Easy for beginners</li>
                      <li>• Good for active trading</li>
                      <li>• Exchange hacking risk</li>
                      <li>• Regulatory seizure risk</li>
                      <li>• Use only reputable exchanges</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Bitcoin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Understand Bitcoin is highly volatile (50%+ annual swings common)</li>
                  <li>• Use dollar-cost averaging (DCA) for long-term accumulation</li>
                  <li>• Only invest what you can afford to lose</li>
                  <li>• Consider tax implications (capital gains in most jurisdictions)</li>
                  <li>• Use stop-losses for trading positions</li>
                  <li>• Watch on-chain metrics for trend confirmation</li>
                  <li>• Be aware of funding rates when trading perpetual futures</li>
                  <li>• Avoid high leverage (10x+ extremely risky in crypto)</li>
                  <li>• Follow halving cycles for longer-term positioning</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Essential Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://bitcoin.org/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Bitcoin.org <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.blockchain.com/explorer" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Blockchain Explorer <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.lookintobitcoin.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      On-Chain Analytics <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.coinglass.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Derivatives Data <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Fear & Greed Index <ExternalLink className="ml-2 h-3 w-3" />
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

export default Bitcoin;