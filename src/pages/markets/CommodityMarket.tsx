import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Fuel, Clock, BarChart3, Wheat, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
                <Link to="/markets/commodities/energy">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Fuel className="h-5 w-5" />
                          Energy Commodities
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/markets/commodities/precious-metals">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Precious Metals
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/markets/commodities/agricultural">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Wheat className="h-5 w-5" />
                          Agricultural Commodities
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/markets/commodities/industrial-metals">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Industrial Metals
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Commodity Trading</CardTitle>
              <CardDescription>Your comprehensive guide to entering commodity markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">1. Choose Specialized Broker</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select brokers offering commodity futures, CFDs, or options. Ensure they provide access to major exchanges (CME, ICE, LME) and offer competitive margin requirements.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Popular platforms: Interactive Brokers, TD Ameritrade, E*TRADE (futures) | Plus500, IG (CFDs)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">2. Master Futures Contract Mechanics</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Learn contract specifications: size, tick value, expiration dates, delivery terms, margin requirements. Understand rollover process when moving between contract months.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Example: 1 crude oil contract = 1,000 barrels, $10 per $1 price move, expires monthly
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">3. Study Supply and Demand Factors</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Analyze production levels, inventory data, weather conditions, economic growth, currency movements, and geopolitical tensions. Each commodity has unique fundamental drivers.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Key reports: EIA (energy), USDA (agriculture), WASDE (crops), warehouse stocks (metals)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">4. Understand Seasonal Patterns</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Study historical price patterns: heating oil peaks in winter, natural gas demand rises in summer/winter, agricultural commodities follow planting/harvest cycles, gold rises during uncertainty.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Seasonal trades: Natural gas (winter spike), corn (harvest lows), crude oil (summer driving)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">5. Monitor Geopolitical Events</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Track OPEC decisions, Middle East tensions, trade wars, sanctions, central bank policies, and weather events (hurricanes, droughts). These significantly impact commodity prices.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Impact examples: OPEC cuts = oil up, drought = grain up, strong dollar = commodities down
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">6. Begin with Commodity ETFs</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Start with ETFs (GLD, USO, DBA) before trading futures. ETFs provide commodity exposure without leverage, expiration dates, or rollover costs. Lower risk for beginners.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Popular ETFs: GLD (gold), SLV (silver), USO (oil), DBA (agriculture), PDBC (broad commodities)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">7. Practice Strict Position Sizing</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Commodity futures use significant leverage (10-20x). Never risk more than 1-2% of capital per trade. Use stop-losses. Calculate position size based on contract value and volatility.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Warning: One crude oil contract represents $80,000+ in value with only $5,000 margin
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">8. Learn Market Structure Concepts</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Understand contango (future prices higher than spot) vs backwardation (future prices lower). Storage costs, interest rates, and convenience yield affect futures pricing.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Contango erodes long positions over time | Backwardation benefits long positions
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">9. Track Critical Data Releases</h4>
                  <p className="text-sm text-muted-foreground">
                    Follow regular reports: weekly petroleum status (EIA - Wednesday 10:30am ET), crop reports (USDA - monthly), inventory data (warehouses), weather forecasts, economic indicators.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CommodityMarket;
