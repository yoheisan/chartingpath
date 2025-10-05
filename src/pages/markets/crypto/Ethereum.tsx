import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, ExternalLink, ArrowLeft, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Ethereum = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/crypto">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cryptocurrency Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ethereum (ETH)
          </h1>
          <p className="text-xl text-muted-foreground">
            The world's programmable blockchain - powering DeFi, NFTs, and Web3
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                What is Ethereum?
              </CardTitle>
              <CardDescription>A decentralized computing platform and smart contract network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Ethereum is a decentralized blockchain platform launched in 2015 by Vitalik Buterin and others. Unlike Bitcoin which is primarily digital money, Ethereum is a programmable blockchain that enables developers to build decentralized applications (dApps) using smart contracts. ETH is the native cryptocurrency used to pay for transactions and computational services on the network.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Key Characteristics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• No maximum supply (inflationary)</li>
                    <li>• Block time: ~12 seconds</li>
                    <li>• Consensus: Proof of Stake (since Sept 2022)</li>
                    <li>• Smart contract platform</li>
                    <li>• EVM (Ethereum Virtual Machine)</li>
                    <li>• Market cap rank: #2</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Market Stats (Typical)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Market cap: $200B - $400B</li>
                    <li>• Daily volume: $8B - $20B</li>
                    <li>• Circulating: ~120M ETH</li>
                    <li>• All-time high: $4,891 (Nov 2021)</li>
                    <li>• Staking yield: ~3-4% APR</li>
                    <li>• Gas fees: Variable (EIP-1559)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                The Merge & Ethereum 2.0
              </CardTitle>
              <CardDescription>Ethereum's transition to Proof of Stake</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">What Changed in The Merge (September 2022)?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  The Merge transitioned Ethereum from energy-intensive Proof of Work (mining) to energy-efficient Proof of Stake (staking). This reduced Ethereum's energy consumption by 99.95% and set the stage for future scalability upgrades.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Before (PoW)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Miners secure network</li>
                    <li>• High energy consumption</li>
                    <li>• ~13,000 ETH daily issuance</li>
                    <li>• ~4.3% annual inflation</li>
                    <li>• GPU mining profitable</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">After (PoS)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Validators stake 32 ETH</li>
                    <li>• 99.95% less energy</li>
                    <li>• ~1,700 ETH daily issuance</li>
                    <li>• Often deflationary (with EIP-1559)</li>
                    <li>• No mining hardware needed</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h5 className="font-semibold mb-2">Ethereum Roadmap (Post-Merge)</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• The Surge: Scaling through sharding and rollups (100,000+ TPS target)</li>
                  <li>• The Scourge: Censorship resistance and decentralization</li>
                  <li>• The Verge: Verkle trees for easier node operation</li>
                  <li>• The Purge: Reducing storage requirements</li>
                  <li>• The Splurge: Various improvements and optimizations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ethereum Ecosystem</CardTitle>
              <CardDescription>What's built on Ethereum?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">DeFi (Decentralized Finance)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    ~$50B+ Total Value Locked in Ethereum DeFi
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Uniswap (DEX)</li>
                    <li>• Aave (Lending/Borrowing)</li>
                    <li>• Maker (DAI stablecoin)</li>
                    <li>• Curve (Stablecoin swaps)</li>
                    <li>• Lido (Liquid staking)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">NFTs & Gaming</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Majority of NFT trading happens on Ethereum
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• OpenSea (NFT marketplace)</li>
                    <li>• Bored Ape Yacht Club</li>
                    <li>• CryptoPunks</li>
                    <li>• Axie Infinity</li>
                    <li>• Gods Unchained</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Layer 2 Scaling Solutions</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Cheaper and faster transactions while inheriting Ethereum security
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Arbitrum (Optimistic rollup)</li>
                    <li>• Optimism (Optimistic rollup)</li>
                    <li>• Polygon (Sidechain/zkEVM)</li>
                    <li>• zkSync (ZK rollup)</li>
                    <li>• Base (Coinbase L2)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Stablecoins</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Most stablecoins are issued on Ethereum
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• USDT (Tether) - $80B+</li>
                    <li>• USDC (Circle) - $25B+</li>
                    <li>• DAI (MakerDAO) - $5B+</li>
                    <li>• BUSD, TUSD, others</li>
                    <li>• Critical for DeFi liquidity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Price Drivers</CardTitle>
              <CardDescription>What moves ETH price?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Network Activity</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• DeFi Total Value Locked (TVL)</li>
                    <li>• Daily active addresses</li>
                    <li>• Gas fees and network usage</li>
                    <li>• ETH burned via EIP-1559</li>
                    <li>• NFT trading volume</li>
                    <li>• Layer 2 adoption rates</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Staking Metrics</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Total ETH staked (~25M ETH)</li>
                    <li>• Staking yield rates</li>
                    <li>• Exchange outflows to staking</li>
                    <li>• Validator queue length</li>
                    <li>• Liquid staking dominance (Lido)</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Development & Upgrades</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Protocol upgrades (hard forks)</li>
                    <li>• Scaling solutions progress</li>
                    <li>• Developer activity</li>
                    <li>• Institutional adoption</li>
                    <li>• ETF approval speculation</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Market Factors</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Bitcoin price correlation</li>
                    <li>• ETH/BTC ratio trends</li>
                    <li>• Regulatory news</li>
                    <li>• Competition (Solana, Cardano)</li>
                    <li>• Macro risk appetite</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>EIP-1559 & Deflationary Mechanism</CardTitle>
              <CardDescription>Understanding Ethereum's supply dynamics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How EIP-1559 Works</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Implemented in August 2021, EIP-1559 introduced a base fee that gets burned (removed from supply) with each transaction. During high network activity, more ETH is burned than issued, making ETH deflationary.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">Before EIP-1559</p>
                  <p className="text-xs text-muted-foreground">All gas fees went to miners, constant inflation</p>
                </div>
                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">After EIP-1559</p>
                  <p className="text-xs text-muted-foreground">Base fee burned, only tips to validators</p>
                </div>
                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">Current State</p>
                  <p className="text-xs text-muted-foreground">Often deflationary, ~2M ETH burned total</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-semibold mb-2">Supply Formula Post-Merge</p>
                <p className="text-sm text-muted-foreground">
                  Net Supply Change = Staking Rewards (~1,700 ETH/day) - Burned Fees (varies by network usage)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  When network is busy (high gas fees), burn rate exceeds issuance → deflationary. When quiet, slightly inflationary.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://ultrasound.money/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Ultrasound Money (Burn Tracker) <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading & Investing in Ethereum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• ETH often outperforms BTC in bull markets (higher beta)</li>
                  <li>• Watch ETH/BTC ratio for relative strength trades</li>
                  <li>• Consider staking for passive yield (3-4% APR)</li>
                  <li>• Monitor gas fees - high fees = high network usage = bullish</li>
                  <li>• Layer 2 adoption can affect ETH demand positively (reduced selling pressure)</li>
                  <li>• DeFi TVL growth typically correlates with ETH price</li>
                  <li>• Major upgrades (Shanghai, Dencun) often catalysts</li>
                  <li>• More regulatory risk than Bitcoin (securities classification debate)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How to Buy & Store ETH</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Exchanges</p>
                    <p className="text-xs text-muted-foreground">Coinbase, Kraken, Binance, Gemini</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Self-Custody Wallets</p>
                    <p className="text-xs text-muted-foreground">MetaMask, Ledger, Trezor, Rainbow</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">ETFs (Future)</p>
                    <p className="text-xs text-muted-foreground">Spot ETH ETFs pending approval</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Essential Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://ethereum.org/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Ethereum.org <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://etherscan.io/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Etherscan Explorer <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://defillama.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      DeFi Llama (TVL) <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://beaconcha.in/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Beacon Chain Explorer <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://l2beat.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      L2Beat (Layer 2 Data) <ExternalLink className="ml-2 h-3 w-3" />
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

export default Ethereum;