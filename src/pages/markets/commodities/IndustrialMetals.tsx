import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hammer, TrendingUp, ExternalLink, ArrowLeft, Factory } from "lucide-react";
import { Link } from "react-router-dom";

const IndustrialMetals = () => {
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
            Industrial Metals
          </h1>
          <p className="text-xl text-muted-foreground">
            Base metals essential for manufacturing, construction, and technology
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-orange-500" />
                Copper
              </CardTitle>
              <CardDescription>Dr. Copper - The metal with a PhD in economics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Copper is nicknamed "Dr. Copper" because its price is considered a leading indicator of global economic health. Used extensively in construction, electrical wiring, electronics, and green energy infrastructure. Highly sensitive to economic growth expectations.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Contract Specifications</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Traded on COMEX (CME Group) and LME (London Metal Exchange)</li>
                  <li>• COMEX contract: 25,000 pounds (HG symbol)</li>
                  <li>• LME contract: 25 metric tons (more liquid globally)</li>
                  <li>• Tick value: $12.50 per $0.0005/lb (COMEX)</li>
                  <li>• Physical delivery or cash settlement</li>
                  <li>• Nearly 24-hour trading</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Global economic growth and GDP expansion</li>
                  <li>• China demand (50% of global consumption)</li>
                  <li>• Chinese housing and infrastructure activity</li>
                  <li>• Electric vehicle production (uses 4x more copper than ICE vehicles)</li>
                  <li>• Renewable energy infrastructure (solar, wind)</li>
                  <li>• Mining strikes and supply disruptions (Chile, Peru)</li>
                  <li>• Inventory levels at LME and COMEX warehouses</li>
                  <li>• Dollar strength (inverse correlation)</li>
                  <li>• Manufacturing PMI data globally</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Supply & Demand Dynamics</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Major Producers</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Chile: 28% (world's largest)</li>
                      <li>• Peru: 12%</li>
                      <li>• China: 9%</li>
                      <li>• Congo (DRC): 8%</li>
                      <li>• US: 6%</li>
                    </ul>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Major Consumers</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• China: 50% of global demand</li>
                      <li>• EU: 15%</li>
                      <li>• US: 8%</li>
                      <li>• Japan: 4%</li>
                      <li>• India: 3%</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/metals/base/copper.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Copper Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.lme.com/Metals/Non-ferrous/Copper" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    LME Copper <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://copperalliance.org/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    International Copper Association <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aluminum</CardTitle>
              <CardDescription>The lightweight manufacturing metal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Aluminum is the second most used metal after iron. Lightweight, corrosion-resistant, and infinitely recyclable. Major applications in transportation (autos, aircraft), packaging (cans), and construction. Energy-intensive production makes it sensitive to electricity costs.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Contract Specifications</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Primarily traded on LME (most liquid)</li>
                  <li>• LME contract: 25 metric tons</li>
                  <li>• CME also offers aluminum futures (referencing LME)</li>
                  <li>• Symbol: AL (LME), ALI (CME)</li>
                  <li>• Physical delivery from LME warehouses</li>
                  <li>• High stock levels typically (oversupply common)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Energy costs (aluminum smelting extremely energy-intensive)</li>
                  <li>• Chinese production and exports (60% of global production)</li>
                  <li>• Automotive industry trends (lightweighting for fuel efficiency)</li>
                  <li>• Packaging demand (beverage cans)</li>
                  <li>• Construction activity globally</li>
                  <li>• Bauxite and alumina supply (raw materials)</li>
                  <li>• Carbon credit costs (high emissions production)</li>
                  <li>• Premiums on physical metal (Midwest Premium in US)</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.lme.com/Metals/Non-ferrous/Aluminium" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    LME Aluminum <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://international-aluminium.org/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    International Aluminium Institute <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zinc, Nickel & Other Base Metals</CardTitle>
              <CardDescription>Critical metals for industrial applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Zinc (ZN)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Primary use: galvanizing steel to prevent corrosion. Also used in die-casting, brass production, and batteries.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• LME contract: 25 metric tons</li>
                    <li>• 50% demand from galvanizing</li>
                    <li>• China produces 50% of global supply</li>
                    <li>• Construction and auto demand drivers</li>
                    <li>• Mine supply often constrained</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Nickel (NI)</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Critical for stainless steel (70% of demand) and lithium-ion batteries for EVs (rapidly growing segment).
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• LME contract: 6 metric tons</li>
                    <li>• Indonesia largest producer (35%)</li>
                    <li>• Class 1 vs Class 2 nickel distinction</li>
                    <li>• EV battery demand surging</li>
                    <li>• High volatility (supply shocks)</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-4">
                <div className="border rounded-lg p-3">
                  <h5 className="font-semibold text-sm mb-2">Lead (PB)</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Batteries (80% of use)</li>
                    <li>• LME: 25 metric tons</li>
                    <li>• Recycling rates very high</li>
                    <li>• Auto battery demand</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <h5 className="font-semibold text-sm mb-2">Tin (SN)</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Solder (electronics)</li>
                    <li>• LME: 5 metric tons</li>
                    <li>• Supply concentrated</li>
                    <li>• Tech sector dependent</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <h5 className="font-semibold text-sm mb-2">Steel (HR, HRC)</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Construction base metal</li>
                    <li>• Regional pricing</li>
                    <li>• China production key</li>
                    <li>• Trade tariffs impact</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Common Drivers for Base Metals</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Global manufacturing PMI and industrial production</li>
                  <li>• Chinese economic policy and credit growth</li>
                  <li>• Infrastructure spending worldwide</li>
                  <li>• Energy transition and green technology adoption</li>
                  <li>• Supply chain disruptions and mine strikes</li>
                  <li>• Dollar strength and commodity financing</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.lme.com/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    LME All Metals <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.spglobal.com/commodityinsights/en/our-methodology/price-assessments/metals" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    S&P Global Platts Metals <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Industrial Metals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Monitor Chinese economic data (PMI, fixed asset investment, property sales)</li>
                  <li>• Track LME warehouse inventories (key supply indicator)</li>
                  <li>• Follow global manufacturing PMI releases</li>
                  <li>• Watch for mine disruptions and labor strikes</li>
                  <li>• Understand contango vs backwardation in forward curves</li>
                  <li>• Consider spread trades (copper-aluminum, zinc-lead)</li>
                  <li>• Use metals ETFs for diversified exposure (DBB, COPX)</li>
                  <li>• Account for LME 3-month forward being the benchmark (not spot)</li>
                  <li>• Be aware of Chinese market holidays (reduced demand)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Key Economic Indicators
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Leading Indicators</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Global PMI (manufacturing)</li>
                      <li>• ISM Manufacturing Index (US)</li>
                      <li>• China Caixin PMI</li>
                      <li>• Construction spending</li>
                      <li>• Auto production data</li>
                    </ul>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-2">Supply Indicators</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• LME warehouse stocks</li>
                      <li>• Mine production reports</li>
                      <li>• Smelter operating rates</li>
                      <li>• Import/export data (China)</li>
                      <li>• Treatment charges (TC/RC)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Essential Resources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.metalbulletin.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Metal Bulletin (Fastmarkets) <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.mining.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Mining.com News <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.argusmedia.com/en/metals" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Argus Metals <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.worldsteel.org/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      World Steel Association <ExternalLink className="ml-2 h-3 w-3" />
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

export default IndustrialMetals;