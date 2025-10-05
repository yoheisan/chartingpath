import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Fuel, Clock, BarChart3, Wheat } from "lucide-react";

const CommodityMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Commodity Market
          </h1>
          <p className="text-xl text-muted-foreground">
            Trading physical goods and raw materials that power the global economy
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                What is Commodity Trading?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Commodity trading involves buying and selling raw materials and primary goods like oil, gold, agricultural products, and metals. These are physical assets that are standardized and interchangeable with others of the same type.
              </p>
              <p>
                Commodities are traded on specialized exchanges through futures contracts, options, and ETFs, allowing traders to speculate on price movements without physical delivery.
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
                    <span><strong>Market Size:</strong> Trillions in global annual trading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Trading Hours:</strong> Varies by commodity and exchange</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Fuel className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Leverage:</strong> Available through futures contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Wheat className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Inflation Hedge:</strong> Often rises with inflation</span>
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
                  <li><strong>Trend Following:</strong> Trading with long-term price trends</li>
                  <li><strong>Spread Trading:</strong> Trading price differences between contracts</li>
                  <li><strong>Seasonal Trading:</strong> Exploiting seasonal patterns</li>
                  <li><strong>Hedging:</strong> Protecting against price volatility</li>
                  <li><strong>Fundamental Analysis:</strong> Based on supply/demand factors</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Major Commodity Categories</CardTitle>
              <CardDescription>Different types of tradeable commodities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Energy Commodities</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Crude Oil (WTI, Brent)</p>
                      <p className="text-sm text-muted-foreground">Most traded commodity globally</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Natural Gas</p>
                      <p className="text-sm text-muted-foreground">Heating and power generation</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Gasoline</p>
                      <p className="text-sm text-muted-foreground">Refined petroleum product</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Precious Metals</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Gold</p>
                      <p className="text-sm text-muted-foreground">Safe-haven asset</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Silver</p>
                      <p className="text-sm text-muted-foreground">Industrial and investment metal</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Platinum</p>
                      <p className="text-sm text-muted-foreground">Automotive and jewelry</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Agricultural Commodities</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Corn</p>
                      <p className="text-sm text-muted-foreground">Major grain crop</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Wheat</p>
                      <p className="text-sm text-muted-foreground">Staple food commodity</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Coffee & Sugar</p>
                      <p className="text-sm text-muted-foreground">Soft commodities</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Industrial Metals</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Copper</p>
                      <p className="text-sm text-muted-foreground">Construction and electronics</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Aluminum</p>
                      <p className="text-sm text-muted-foreground">Manufacturing metal</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Zinc & Nickel</p>
                      <p className="text-sm text-muted-foreground">Industrial applications</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Commodity Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Choose a broker that offers commodity futures or CFDs</li>
                <li>Understand futures contracts and expiration dates</li>
                <li>Learn about supply and demand fundamentals</li>
                <li>Study seasonal patterns and cycles</li>
                <li>Monitor geopolitical events affecting commodities</li>
                <li>Start with commodity ETFs before futures</li>
                <li>Use proper position sizing due to leverage</li>
                <li>Understand storage costs and contango/backwardation</li>
                <li>Follow inventory reports and economic data</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CommodityMarket;
