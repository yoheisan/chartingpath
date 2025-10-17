import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, TrendingUp, ExternalLink, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Altcoins = () => {
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
            Altcoins
          </h1>
          <p className="text-xl text-muted-foreground">
            Alternative cryptocurrencies beyond Bitcoin and Ethereum
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                What Are Altcoins?
              </CardTitle>
              <CardDescription>Understanding the broader cryptocurrency ecosystem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  "Altcoin" means any cryptocurrency other than Bitcoin. While Ethereum is technically an altcoin, it's often considered in its own category due to its size and dominance. The altcoin market includes thousands of projects with varying purposes, technologies, and risk profiles.
                </p>
                <p className="text-sm text-muted-foreground">
                  Altcoins typically offer higher potential returns but come with significantly higher risk. Many projects fail, and the market is highly speculative. However, some altcoins have found product-market fit and genuine adoption.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layer 1 Blockchains</CardTitle>
              <CardDescription>Competing smart contract platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Solana (SOL)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    High-speed blockchain focusing on scalability. ~65,000 TPS theoretical.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $20B - $80B range</li>
                    <li>• Known for: Speed, low fees, NFTs</li>
                    <li>• Tradeoffs: Less decentralized, outages</li>
                    <li>• Ecosystem: Jupiter, Phantom, Magic Eden</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Cardano (ADA)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Research-driven blockchain with peer-reviewed development approach.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $10B - $40B range</li>
                    <li>• Known for: Academic rigor, PoS</li>
                    <li>• Tradeoffs: Slower development</li>
                    <li>• Founder: Charles Hoskinson (ex-ETH)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Avalanche (AVAX)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fast finality blockchain with subnet architecture for customization.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $5B - $30B range</li>
                    <li>• Known for: Sub-second finality, subnets</li>
                    <li>• Tradeoffs: Higher hardware requirements</li>
                    <li>• Ecosystem: Trader Joe, Benqi</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Polkadot (DOT)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Interoperability-focused with parachain architecture for connected chains.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $5B - $35B range</li>
                    <li>• Known for: Interoperability, parachains</li>
                    <li>• Tradeoffs: Complex governance</li>
                    <li>• Founder: Gavin Wood (ex-ETH CTO)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Cosmos (ATOM)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Internet of blockchains with IBC protocol for cross-chain communication.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $2B - $12B range</li>
                    <li>• Known for: IBC, app chains</li>
                    <li>• Tradeoffs: Hub token value accrual debated</li>
                    <li>• Ecosystem: Osmosis, dYdX, Injective</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Others to Watch</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Sui (SUI) - Move language, high TPS</li>
                    <li>• Aptos (APT) - Ex-Meta, Move language</li>
                    <li>• Near (NEAR) - Sharding, JS developers</li>
                    <li>• Algorand (ALGO) - Pure PoS</li>
                    <li>• TON (TON) - Telegram integration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DeFi & Utility Tokens</CardTitle>
              <CardDescription>Tokens with specific use cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Chainlink (LINK)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Decentralized oracle network providing off-chain data to smart contracts.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Critical DeFi infrastructure</li>
                    <li>• Used by hundreds of protocols</li>
                    <li>• Market cap: $5B - $20B range</li>
                    <li>• Price feeds, VRF, automation</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Uniswap (UNI)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Governance token for largest decentralized exchange on Ethereum.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Leading DEX (24/7 billions in volume)</li>
                    <li>• Governance over protocol changes</li>
                    <li>• Market cap: $3B - $15B range</li>
                    <li>• Fee switch potential catalyst</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Aave (AAVE)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Decentralized lending protocol with billions in TVL.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Top lending platform</li>
                    <li>• Safety module staking</li>
                    <li>• Market cap: $1B - $6B range</li>
                    <li>• GHO stablecoin launch</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Maker (MKR)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Governance token for MakerDAO and DAI stablecoin system.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Controls $5B+ DAI supply</li>
                    <li>• Real-world asset integration</li>
                    <li>• Market cap: $1B - $4B range</li>
                    <li>• Revenue generating (fees)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stablecoins</CardTitle>
              <CardDescription>Price-stable cryptocurrencies pegged to fiat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Tether (USDT)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Largest stablecoin by market cap, most traded crypto asset.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: ~$90B</li>
                    <li>• Centralized, fiat-backed</li>
                    <li>• Highest liquidity</li>
                    <li>• Transparency concerns historically</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">USD Coin (USDC)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Fully-reserved stablecoin by Circle, institutional favorite.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: ~$25B</li>
                    <li>• Regulated, audited monthly</li>
                    <li>• DeFi integration heavy</li>
                    <li>• Backed 1:1 by cash/treasuries</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">DAI</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Decentralized stablecoin overcollateralized by crypto assets.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: ~$5B</li>
                    <li>• Most decentralized stablecoin</li>
                    <li>• Collateralized by ETH, USDC, RWAs</li>
                    <li>• MakerDAO governance</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Others</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• BUSD - Binance (being phased out)</li>
                    <li>• TUSD - TrueUSD</li>
                    <li>• FRAX - Algorithmic/fractional</li>
                    <li>• USDD - Tron's stablecoin</li>
                    <li>• GHO - Aave's stablecoin</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h5 className="font-semibold mb-2">Why Stablecoins Matter</h5>
                <p className="text-sm text-muted-foreground">
                  Stablecoins are the on/off ramps for crypto trading, the settlement layer for DeFi, and increasingly used for payments and remittances. They represent ~$130B in market cap and facilitate trillions in annual trading volume.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meme Coins & High-Risk Tokens</CardTitle>
              <CardDescription>Community-driven tokens with extreme volatility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Dogecoin (DOGE)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Original meme coin, started as joke but has massive community.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $10B - $80B range</li>
                    <li>• Elon Musk endorsements</li>
                    <li>• Inflationary supply</li>
                    <li>• Low transaction fees</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Shiba Inu (SHIB)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    "Dogecoin killer," ERC-20 token with large holder base.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $5B - $40B range</li>
                    <li>• Ecosystem: ShibaSwap, Shibarium L2</li>
                    <li>• Massive supply (quadrillions)</li>
                    <li>• High speculation, low utility</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-red-500/10">
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Warning: Extreme Risk
                </h5>
                <p className="text-sm text-muted-foreground mb-2">
                  Meme coins are purely speculative with no fundamental value. They experience 50-90% crashes regularly. Many new meme coins are pump-and-dump schemes or outright scams. Only invest what you can afford to lose completely.
                </p>
                <p className="text-sm text-muted-foreground">
                  New meme coins launch daily on platforms like pump.fun (Solana). Survival rate is less than 1%. Most go to zero within days/weeks.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Altcoins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Altcoins amplify Bitcoin's moves (higher beta)</li>
                  <li>• In bull markets, capital flows BTC → ETH → Large caps → Small caps</li>
                  <li>• In bear markets, reverse flow - small caps crash hardest</li>
                  <li>• Alt season = period when alts outperform BTC (watch BTC dominance)</li>
                  <li>• Research tokenomics: supply, inflation, unlock schedules</li>
                  <li>• Check liquidity before buying (low liquidity = high slippage)</li>
                  <li>• Beware of fully diluted valuation (FDV) vs market cap</li>
                  <li>• Use limit orders - market orders get wrecked on illiquid tokens</li>
                  <li>• Take profits incrementally - altcoins rarely maintain peaks</li>
                  <li>• Never invest more than 5-10% of portfolio in single altcoin</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Red Flags to Avoid</h4>
                <div className="border rounded-lg p-4 bg-red-500/10">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Anonymous team with no track record</li>
                    <li>• Unrealistic promises ("guaranteed returns")</li>
                    <li>• Heavy marketing, low substance</li>
                    <li>• Large team/insider token allocations</li>
                    <li>• No working product, just whitepaper</li>
                    <li>• Unclear use case or value proposition</li>
                    <li>• Low liquidity, high concentration (whale risk)</li>
                    <li>• Copy-paste code from other projects</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Research Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      CoinGecko <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://coinmarketcap.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      CoinMarketCap <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.tokenterminal.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Token Terminal (Metrics) <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://messari.io/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Messari Research <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://defillama.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      DeFi Llama <ExternalLink className="ml-2 h-3 w-3" />
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

export default Altcoins;