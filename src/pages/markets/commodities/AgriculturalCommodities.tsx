import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wheat, TrendingUp, ExternalLink, ArrowLeft, Cloud } from "lucide-react";
import { Link } from "react-router-dom";

const AgriculturalCommodities = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/commodities">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commodity Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Agricultural Commodities
          </h1>
          <p className="text-xl text-muted-foreground">
            Food and fiber commodities that feed and clothe the world
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wheat className="h-5 w-5" />
                Grains: Corn & Wheat
              </CardTitle>
              <CardDescription>Staple crops powering global food supply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Corn (C)</h5>
                  <p className="text-sm text-muted-foreground mb-3">
                    The largest US crop by volume. Used for animal feed (40%), ethanol production (40%), and food products (20%). Highly seasonal with planting in spring and harvest in fall.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Traded on CBOT (CME Group)</li>
                    <li>• Contract size: 5,000 bushels</li>
                    <li>• Tick value: $12.50 per cent/bushel</li>
                    <li>• Planting: April-May | Harvest: Sept-Nov</li>
                    <li>• US produces 35% of global supply</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Wheat (W)</h5>
                  <p className="text-sm text-muted-foreground mb-3">
                    Global staple food grain. Three types traded in US: hard red winter, soft red winter, and spring wheat. Multiple growing regions worldwide.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Traded on CBOT, KCBT, MGE</li>
                    <li>• Contract size: 5,000 bushels</li>
                    <li>• Tick value: $12.50 per cent/bushel</li>
                    <li>• Two seasons: winter and spring wheat</li>
                    <li>• Global production more distributed</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Weather conditions during planting and growing seasons</li>
                  <li>• USDA monthly crop reports (WASDE - World Agricultural Supply and Demand Estimates)</li>
                  <li>• Planting intentions and acreage reports (March/June)</li>
                  <li>• Global demand: China, EU, developing nations</li>
                  <li>• Dollar strength (impacts export competitiveness)</li>
                  <li>• Ethanol policy and mandates (corn)</li>
                  <li>• Geopolitical issues: Ukraine/Russia exports (wheat)</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/agriculture/grains/corn.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Corn Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.cmegroup.com/markets/agriculture/grains/wheat.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Wheat Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.usda.gov/oce/commodity/wasde" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    USDA WASDE Reports <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soybeans & Oilseeds</CardTitle>
              <CardDescription>Protein and oil-rich crops</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Soybeans are crushed into soybean meal (animal feed) and soybean oil (cooking oil, biodiesel). The "crush spread" represents the profit margin of processing soybeans into products.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Contract Specifications</h5>
                <div className="grid md:grid-cols-3 gap-3 mt-2">
                  <div>
                    <p className="font-medium text-sm">Soybeans (S)</p>
                    <ul className="text-xs space-y-1 text-muted-foreground mt-1">
                      <li>• 5,000 bushels</li>
                      <li>• $12.50/cent move</li>
                      <li>• Harvest: Sept-Nov</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Soybean Meal (SM)</p>
                    <ul className="text-xs space-y-1 text-muted-foreground mt-1">
                      <li>• 100 short tons</li>
                      <li>• $10/$1 move</li>
                      <li>• High protein feed</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Soybean Oil (BO)</p>
                    <ul className="text-xs space-y-1 text-muted-foreground mt-1">
                      <li>• 60,000 pounds</li>
                      <li>• $6/$0.01 move</li>
                      <li>• Cooking/biodiesel</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Market Drivers</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Chinese demand (60% of global soybean imports)</li>
                  <li>• US-China trade relations and tariffs</li>
                  <li>• South American production (Brazil, Argentina)</li>
                  <li>• Crush margins and processing demand</li>
                  <li>• Biodiesel mandates and renewable diesel demand</li>
                  <li>• Weather in US Midwest during July-August (critical period)</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.cmegroup.com/markets/agriculture/oilseeds/soybean.html" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    CME Soybeans <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.nass.usda.gov/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    USDA NASS Data <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soft Commodities: Coffee, Sugar, Cotton, Cocoa</CardTitle>
              <CardDescription>Tropical and subtropical agricultural products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Coffee (KC)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Arabica coffee on ICE Futures US</li>
                    <li>• Contract: 37,500 pounds</li>
                    <li>• Brazil produces 40% of global supply</li>
                    <li>• Weather and frost risks critical</li>
                    <li>• Currency: Brazilian Real correlation</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Sugar (SB)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Sugar #11 (world) on ICE Futures</li>
                    <li>• Contract: 112,000 pounds</li>
                    <li>• Brazil, India, Thailand top producers</li>
                    <li>• Ethanol alternative use (Brazil)</li>
                    <li>• Oil prices influence (ethanol demand)</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Cotton (CT)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Traded on ICE Futures US</li>
                    <li>• Contract: 50,000 pounds</li>
                    <li>• US, India, China major producers</li>
                    <li>• Textile demand driver</li>
                    <li>• Weather sensitive crop</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Cocoa (CC)</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Traded on ICE Futures US</li>
                    <li>• Contract: 10 metric tons</li>
                    <li>• West Africa 70% of production</li>
                    <li>• Political instability risks</li>
                    <li>• Chocolate demand growth</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Common Market Factors</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Weather patterns: El Niño/La Niña effects</li>
                  <li>• Currency movements in producing countries</li>
                  <li>• Political stability in tropical regions</li>
                  <li>• Global economic growth and consumer demand</li>
                  <li>• Transportation and logistics costs</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.theice.com/products/15/Coffee-C-Futures" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    ICE Coffee Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.theice.com/products/23/Sugar-No-11-Futures" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    ICE Sugar Futures <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trading Agricultural Commodities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Best Practices</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Master the USDA report schedule (monthly WASDE, weekly crop progress)</li>
                  <li>• Monitor weather during critical growing periods (pollination, filling)</li>
                  <li>• Understand seasonal patterns: plant, grow, harvest cycles</li>
                  <li>• Track global production shifts (South America vs US timing)</li>
                  <li>• Learn about spread trading (calendar spreads, inter-commodity spreads)</li>
                  <li>• Follow farmer selling patterns and elevator stocks</li>
                  <li>• Use agricultural ETFs (DBA, CORN, WEAT, SOYB) for simpler exposure</li>
                  <li>• Be prepared for limit-up/limit-down days after major reports</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Critical Weather Resources
                </h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.noaa.gov/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      NOAA Weather <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.cpc.ncep.noaa.gov/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Climate Prediction Center <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://droughtmonitor.unl.edu/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Drought Monitor <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Data Sources</h4>
                <div className="flex flex-wrap gap-2">
                  <a href="https://www.usda.gov/topics/farming/crop-production" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      USDA Crop Production <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.fas.usda.gov/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      USDA FAS (Foreign Ag) <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                  <a href="https://www.agweb.com/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      AgWeb Market Data <ExternalLink className="ml-2 h-3 w-3" />
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

export default AgriculturalCommodities;