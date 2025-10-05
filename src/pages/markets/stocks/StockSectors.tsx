import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const StockSectors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <Link to="/markets/stocks">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock Market
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Stock Market Sectors
          </h1>
          <p className="text-xl text-muted-foreground">
            Understanding the 11 GICS sectors for diversification and opportunity
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                GICS Sector Classification
              </CardTitle>
              <CardDescription>Global Industry Classification Standard - 11 sectors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  The GICS framework, developed by MSCI and S&P Dow Jones Indices, divides the market into 11 sectors, 25 industry groups, 74 industries, and 163 sub-industries. Understanding sector rotation and performance helps with portfolio diversification and identifying market trends.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Technology</CardTitle>
                <CardDescription>Software, hardware, semiconductors, IT services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~29%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Largest sector. High growth, high valuation. Includes FAANG stocks.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Apple, Microsoft, NVIDIA, Adobe, Salesforce, Oracle, Intel, Cisco</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Innovation cycles & product launches</li>
                    <li>• AI and cloud computing trends</li>
                    <li>• Interest rates (growth stock sensitivity)</li>
                    <li>• Semiconductor demand</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLK, VGT, FTEC</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Healthcare</CardTitle>
                <CardDescription>Pharmaceuticals, biotech, equipment, providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~13%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Defensive sector. Aging demographics. Drug pricing political risk.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Johnson & Johnson, UnitedHealth, Pfizer, Merck, AbbVie, Thermo Fisher</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• FDA approvals & clinical trials</li>
                    <li>• Drug pricing regulations</li>
                    <li>• Aging population trends</li>
                    <li>• M&A activity (pharma consolidation)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLV, VHT, IYH</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financials</CardTitle>
                <CardDescription>Banks, insurance, asset managers, REITs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~13%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Interest rate sensitive. Benefits from steepening yield curve.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">JPMorgan, Berkshire Hathaway, Bank of America, Wells Fargo, Goldman Sachs</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Interest rate levels & yield curve</li>
                    <li>• Credit quality & loan demand</li>
                    <li>• Regulations & capital requirements</li>
                    <li>• Economic growth expectations</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLF, VFH, IYF</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumer Discretionary</CardTitle>
                <CardDescription>Retailers, autos, hotels, restaurants, luxury</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~10%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cyclical sector. Economic sensitivity. Amazon dominates weighting.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Amazon, Tesla, Home Depot, McDonald's, Nike, Starbucks, Lowe's</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Consumer confidence & spending</li>
                    <li>• Employment & wage growth</li>
                    <li>• Gas prices (consumer budget)</li>
                    <li>• E-commerce vs brick-and-mortar</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLY, VCR, FDIS</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Services</CardTitle>
                <CardDescription>Telecom, media, entertainment, internet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~9%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Created in 2018 GICS reclassification. Meta and Google dominate.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Alphabet, Meta, Netflix, Disney, Comcast, T-Mobile, Verizon</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Digital advertising trends</li>
                    <li>• 5G rollout & spectrum auctions</li>
                    <li>• Streaming competition</li>
                    <li>• Regulatory scrutiny (antitrust)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLC, VOX, FCOM</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industrials</CardTitle>
                <CardDescription>Aerospace, defense, machinery, transportation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~8%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Economic cycle sensitive. Infrastructure spending beneficiary.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Caterpillar, Boeing, GE, Honeywell, UPS, Lockheed Martin, Raytheon</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Capital expenditure cycles</li>
                    <li>• Global trade volumes</li>
                    <li>• Government spending (defense)</li>
                    <li>• Manufacturing PMI</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLI, VIS, IYJ</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumer Staples</CardTitle>
                <CardDescription>Food, beverage, household products, tobacco</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~6%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Defensive sector. Stable demand regardless of economy.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Procter & Gamble, Coca-Cola, PepsiCo, Walmart, Costco, Philip Morris</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Population growth</li>
                    <li>• Input cost inflation</li>
                    <li>• Brand loyalty & pricing power</li>
                    <li>• Dividend yields (often high)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLP, VDC, FSTA</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Energy</CardTitle>
                <CardDescription>Oil & gas exploration, refining, equipment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~4%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Highly cyclical. Commodity price driven. ESG concerns impact.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">ExxonMobil, Chevron, ConocoPhillips, Schlumberger, Pioneer Natural</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Crude oil & natural gas prices</li>
                    <li>• OPEC+ production decisions</li>
                    <li>• Geopolitical tensions</li>
                    <li>• Energy transition policies</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLE, VDE, IYE</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilities</CardTitle>
                <CardDescription>Electric, gas, water utilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~2.5%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Most defensive sector. High dividends. Interest rate sensitive.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">NextEra Energy, Duke Energy, Southern Company, Dominion Energy</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Interest rate levels (inverse)</li>
                    <li>• Regulatory environment</li>
                    <li>• Weather patterns (demand)</li>
                    <li>• Renewable energy transition</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLU, VPU, IDU</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real Estate</CardTitle>
                <CardDescription>REITs, real estate management & development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~2.5%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Separated from Financials in 2016. High dividend yields.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">American Tower, Prologis, Crown Castle, Simon Property Group</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Interest rate environment</li>
                    <li>• Occupancy rates & rent growth</li>
                    <li>• Commercial vs residential trends</li>
                    <li>• Remote work impact (office REITs)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLRE, VNQ, IYR</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
                <CardDescription>Chemicals, metals & mining, packaging</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1">S&P 500 Weight: ~2%</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cyclical. Commodity exposed. China demand critical.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Major Companies</p>
                  <p className="text-xs text-muted-foreground">Linde, Sherwin-Williams, Freeport-McMoRan, Newmont, Dow Chemical</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Key Drivers</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Global manufacturing activity</li>
                    <li>• Commodity prices (metals, chemicals)</li>
                    <li>• Chinese economic growth</li>
                    <li>• Dollar strength (inverse)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Sector ETFs</p>
                  <p className="text-xs text-muted-foreground">XLB, VAW, IYM</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sector Rotation Strategy</CardTitle>
              <CardDescription>Understanding the economic cycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Early Cycle (Recovery)</h5>
                  <p className="text-sm text-muted-foreground mb-2">Economy bottoming, rates low, stimulus active</p>
                  <p className="text-sm font-medium">Outperformers:</p>
                  <p className="text-xs text-muted-foreground">Financials, Industrials, Technology, Consumer Discretionary</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Mid Cycle (Expansion)</h5>
                  <p className="text-sm text-muted-foreground mb-2">Strong growth, rising rates, full employment</p>
                  <p className="text-sm font-medium">Outperformers:</p>
                  <p className="text-xs text-muted-foreground">Technology, Industrials, Energy, Materials</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Late Cycle (Peak)</h5>
                  <p className="text-sm text-muted-foreground mb-2">Growth slowing, rates high, inflation concerns</p>
                  <p className="text-sm font-medium">Outperformers:</p>
                  <p className="text-xs text-muted-foreground">Energy, Utilities, Consumer Staples, Healthcare</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Recession</h5>
                  <p className="text-sm text-muted-foreground mb-2">Negative growth, rates falling, defensive positioning</p>
                  <p className="text-sm font-medium">Outperformers:</p>
                  <p className="text-xs text-muted-foreground">Utilities, Consumer Staples, Healthcare, Communication</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="https://www.msci.com/our-solutions/indexes/gics" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    GICS Methodology <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.sectorspdrs.com/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    SPDR Sector ETFs <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
                <a href="https://www.fidelity.com/sector-investing/overview" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Sector Research <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StockSectors;