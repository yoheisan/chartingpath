import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Zap, Clock, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CryptoMarket = () => {
  return (
    <div className="min-h-screen bg-background">
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

          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/markets/crypto/bitcoin">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bitcoin (BTC)</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>#1 Market Cap - Digital Gold</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    First cryptocurrency, store of value, 21M supply cap.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Proof of Work</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Halving Cycles</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/markets/crypto/ethereum">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Ethereum (ETH)</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>#2 Market Cap - Smart Contracts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Programmable blockchain, DeFi, NFTs, Layer 2s.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Proof of Stake</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">EIP-1559</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/markets/crypto/altcoins">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Altcoins</span>
                    <ArrowRight className="h-4 w-4" />
                  </CardTitle>
                  <CardDescription>Layer 1s, DeFi, Meme Coins</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Solana, Cardano, stablecoins, and high-risk tokens.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Layer 1s</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Stablecoins</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Crypto Trading</CardTitle>
              <CardDescription>Navigate the crypto market safely with these essential steps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">1. Choose a Reputable Exchange</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select established exchanges with strong security records, regulatory compliance, and insurance coverage. Consider trading fees, available cryptocurrencies, and user experience.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Beginners: Coinbase, Kraken, Gemini (more regulated) | Advanced: Binance, KuCoin (more options)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">2. Set Up Secure Wallet Storage</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use hardware wallets (Ledger, Trezor) for long-term storage. Keep small amounts on exchanges for trading. Never share your private keys or seed phrases with anyone.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Hot wallets (exchange, mobile) for trading | Cold wallets (hardware) for long-term holding
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">3. Understand Blockchain Basics</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Learn fundamentals: blockchain technology, consensus mechanisms (PoW vs PoS), transaction confirmations, gas fees, and how cryptocurrencies differ from traditional finance.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Key concepts: Decentralization, immutability, transparency, cryptographic security
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">4. Research Different Crypto Types</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Understand categories: Layer 1s (Bitcoin, Ethereum), Layer 2s (Polygon, Arbitrum), DeFi tokens, NFT platforms, stablecoins (USDT, USDC), and meme coins. Each has different risk profiles.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Read whitepapers, check GitHub activity, review tokenomics, assess real-world utility
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">5. Start Small with Major Cryptos</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Begin with Bitcoin and Ethereum (70-80% of portfolio). Invest only what you can afford to lose completely. Start with $100-500 to learn without significant risk.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Avoid: Low market cap altcoins, new projects without history, meme coins as a beginner
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">6. Enable Maximum Security</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Activate 2FA (use authenticator apps, not SMS), whitelist withdrawal addresses, use unique strong passwords, enable withdrawal address whitelisting, and consider anti-phishing codes.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Security layers: 2FA + withdrawal whitelist + email confirmations + password manager
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">7. Practice Risk Management</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Never invest more than you can afford to lose. Crypto is highly speculative and volatile. Diversify across multiple cryptocurrencies. Don't use leverage as a beginner. Set stop-losses.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Rule: If losing this money would affect your daily life, don't invest it
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">8. Stay Informed and Vigilant</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Follow regulatory news, major partnerships, technological upgrades, and market sentiment. Use tools like CoinMarketCap, CoinGecko, and crypto news aggregators.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Red flags: Guaranteed returns, pressure to invest quickly, unknown teams, copied whitepapers
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">9. DYOR (Do Your Own Research)</h4>
                  <p className="text-sm text-muted-foreground">
                    Never invest based solely on social media hype, influencer recommendations, or FOMO. Verify information from multiple sources. Understand tax implications in your country.
                  </p>
                </div>
              </div>
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
