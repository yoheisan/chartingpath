import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, ExternalLink, ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const PreciousMetals = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/commodities">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commodity Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Precious Metals
          </h1>
          <p className="text-xl text-muted-foreground">
            Safe-haven assets and stores of value throughout history
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Gold
              </CardTitle>
              <CardDescription>The ultimate safe-haven asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Gold has been a store of value for thousands of years. It serves as a hedge against inflation, currency devaluation, and economic uncertainty. Central banks hold gold reserves, and it's inversely correlated with the US Dollar.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Contract Specifications</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Traded on COMEX (CME Group)</li>
                  <li>• Contract size: 100 troy ounces</li>
                  <li>• Tick value: $10 per $1 move</li>
                  <li>• Symbol: GC (futures), /GC (E-mini)</li>
                  <li>• Trading hours: Nearly 24/5</li>
                  <li>• Delivery: COMEX-approved vaults</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• US Dollar strength (inverse relationship)</li>
                  <li>• Real interest rates (negative rates = bullish gold)</li>
                  <li>• Inflation expectations and actual CPI data</li>
                  <li>• Central bank gold purchases and reserves</li>
                  <li>• Geopolitical tensions and economic uncertainty</li>
                  <li>• Jewelry demand (India, China) - 40% of demand</li>
                  <li>• Mining production levels and costs</li>
                  <li>• ETF flows (GLD, IAU holdings)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Trading Vehicles</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm">Futures</p>
                    <p className="text-xs text-muted-foreground">COMEX gold futures (GC)</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm">ETFs</p>
                    <p className="text-xs text-muted-foreground">GLD, IAU, SGOL</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm">Physical</p>
                    <p className="text-xs text-muted-foreground">Coins, bars, allocated storage</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/metals/precious/gold.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Gold Contracts <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.gold.org/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    World Gold Council <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.kitco.com/gold-price-today-usa/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Kitco Gold Price <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Silver
              </CardTitle>
              <CardDescription>Industrial and investment metal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Silver serves dual purposes: industrial applications (50% of demand) and investment/monetary use. More volatile than gold due to smaller market size. Often called "the poor man's gold."
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Contract Specifications</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Traded on COMEX (CME Group)</li>
                  <li>• Contract size: 5,000 troy ounces</li>
                  <li>• Tick value: $25 per $0.005 move</li>
                  <li>• Symbol: SI (futures), /SI</li>
                  <li>• Higher volatility than gold</li>
                  <li>• Gold-to-silver ratio: key metric (typically 60-80)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Industrial demand (electronics, solar panels, batteries)</li>
                  <li>• Gold price movements (silver typically follows gold)</li>
                  <li>• Mining production and above-ground stockpiles</li>
                  <li>• Investment demand and ETF flows</li>
                  <li>• Global manufacturing activity (PMI data)</li>
                  <li>• Green energy transition (solar panel demand)</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/metals/precious/silver.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Silver Contracts <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.silverinstitute.org/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Silver Institute <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platinum & Palladium</CardTitle>
              <CardDescription>Automotive catalysts and industrial metals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Platinum (PL)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Primary use: diesel catalytic converters</li>
                    <li>• Contract size: 50 troy ounces</li>
                    <li>• Supply concentrated in South Africa</li>
                    <li>• Sensitive to auto industry trends</li>
                    <li>• Jewelry demand significant in Asia</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Palladium (PA)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Primary use: gasoline catalytic converters</li>
                    <li>• Contract size: 100 troy ounces</li>
                    <li>• Russia major producer (40%)</li>
                    <li>• Supply deficits common</li>
                    <li>• Most volatile precious metal</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Global auto sales and production (70% of demand)</li>
                  <li>• Emission standards and regulations</li>
                  <li>• Electric vehicle adoption rates</li>
                  <li>• Mining disruptions in South Africa and Russia</li>
                  <li>• Recycling rates from old catalytic converters</li>
                  <li>• Substitution between platinum and palladium</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/metals/precious/platinum.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Platinum <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.cmegroup.com/markets/metals/precious/palladium.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Palladium <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Precious Metals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Monitor US Dollar Index (DXY) - inverse relationship</li>
                  <li>• Track real interest rates (10-year TIPS yield)</li>
                  <li>• Watch Federal Reserve policy and rate decisions</li>
                  <li>• Follow central bank gold purchases (especially China, Russia)</li>
                  <li>• Use gold-silver ratio for relative value trades</li>
                  <li>• Consider ETFs (GLD, SLV, PPLT) for easier exposure</li>
                  <li>• Account for storage and insurance costs in physical metals</li>
                  <li>• Be aware of London fixing times (10:30 AM and 3:00 PM GMT)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Reports & Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.lbma.org.uk/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      LBMA (London Bullion) <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      CFTC COT Reports <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.investing.com/commodities/real-time-futures" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Live Prices <ExternalLink className="ml-2 h-3 w-3" />
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

export default PreciousMetals;