import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, TrendingUp, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const EnergyCommodities = () => {
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
            Energy Commodities
          </h1>
          <p className="text-xl text-muted-foreground">
            The world's most actively traded commodities powering global economies
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Crude Oil (WTI & Brent)
              </CardTitle>
              <CardDescription>The most traded commodity globally</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Crude oil is the world's most actively traded commodity. Two main benchmarks dominate: West Texas Intermediate (WTI) for North American crude and Brent for international markets. Prices are influenced by OPEC decisions, geopolitical tensions, economic growth, and inventory levels.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">WTI (West Texas Intermediate)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• US benchmark crude oil</li>
                    <li>• Traded on NYMEX (CME Group)</li>
                    <li>• Contract size: 1,000 barrels</li>
                    <li>• Tick value: $10 per $1 move</li>
                    <li>• Delivery: Cushing, Oklahoma</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Brent Crude</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• International benchmark</li>
                    <li>• Traded on ICE Futures Europe</li>
                    <li>• Contract size: 1,000 barrels</li>
                    <li>• Covers North Sea production</li>
                    <li>• Used for 2/3 of global oil pricing</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• OPEC+ production decisions and output quotas</li>
                  <li>• US crude oil inventories (EIA weekly reports)</li>
                  <li>• Geopolitical tensions in Middle East and major producers</li>
                  <li>• Global economic growth and industrial demand</li>
                  <li>• US Dollar strength (inverse relationship)</li>
                  <li>• Refinery capacity and seasonal demand patterns</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME WTI Contracts <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.theice.com/products/219/Brent-Crude-Futures" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    ICE Brent Contracts <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.eia.gov/petroleum/supply/weekly/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    EIA Weekly Reports <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Natural Gas</CardTitle>
              <CardDescription>Essential for heating and power generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Natural gas is a crucial energy commodity used for heating, electricity generation, and industrial processes. Highly seasonal with winter demand spikes. US market dominated by Henry Hub pricing, while international markets use LNG pricing.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Contract Specifications</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Traded on NYMEX (CME Group)</li>
                  <li>• Contract size: 10,000 MMBtu</li>
                  <li>• Tick value: $10 per $0.001 move</li>
                  <li>• Delivery: Henry Hub, Louisiana</li>
                  <li>• High volatility during weather extremes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Weather patterns (heating degree days, cooling degree days)</li>
                  <li>• EIA weekly storage reports (every Thursday)</li>
                  <li>• Seasonal demand: winter heating, summer cooling</li>
                  <li>• LNG export capacity and international demand</li>
                  <li>• Production levels and drilling activity</li>
                  <li>• Coal-to-gas switching in power generation</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/energy/natural-gas/natural-gas.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Natural Gas <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.eia.gov/naturalgas/weekly/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    EIA Storage Reports <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gasoline & Heating Oil</CardTitle>
              <CardDescription>Refined petroleum products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Refined products traded as RBOB Gasoline and Heating Oil (ULSD) futures. Closely tied to crude oil but with distinct seasonal patterns. Gasoline peaks in summer driving season, heating oil in winter months.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">RBOB Gasoline</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Contract: 42,000 gallons (1,000 barrels)</li>
                    <li>• Peak season: May-August (driving)</li>
                    <li>• Crack spreads vs crude oil</li>
                    <li>• Refinery utilization key driver</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Heating Oil (ULSD)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Contract: 42,000 gallons (1,000 barrels)</li>
                    <li>• Peak season: October-March (heating)</li>
                    <li>• Inventory levels critical</li>
                    <li>• Also used as diesel proxy</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/energy/refined-products/rbob-gasoline.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME RBOB Gasoline <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.cmegroup.com/markets/energy/refined-products/heating-oil.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Heating Oil <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Energy Commodities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Monitor EIA reports religiously (weekly inventory data)</li>
                  <li>• Track OPEC+ meeting schedules and production quotas</li>
                  <li>• Watch weather forecasts for demand predictions</li>
                  <li>• Understand crack spreads (refining margins)</li>
                  <li>• Be aware of contract rollover dates to avoid delivery</li>
                  <li>• Use energy ETFs (USO, UNG) for simpler exposure</li>
                  <li>• Account for high leverage in futures (typically 5-10% margin)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.eia.gov/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      EIA Official Site <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.opec.org/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      OPEC Official Site <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://oilprice.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Oil Price News <ExternalLink className="ml-2 h-3 w-3" />
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

export default EnergyCommodities;