/**
 * RiskParityVisualizer - Risk Parity Portfolio Education
 * 
 * Professional-grade content covering:
 * - Risk parity fundamentals
 * - Risk budgeting
 * - Portfolio construction
 * - Rebalancing strategies
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  PieChart, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Shield,
  Target,
  Scale
} from 'lucide-react';

interface AssetAllocation {
  name: string;
  volatility: number;
  weight: number;
  riskContribution: number;
}

export const RiskParityVisualizer = () => {
  const [stockVol, setStockVol] = useState(16);
  const [bondVol, setBondVol] = useState(6);
  const [commodityVol, setCommodityVol] = useState(20);

  const riskParityCalc = useMemo(() => {
    // Calculate inverse volatility weights
    const invStockVol = 1 / stockVol;
    const invBondVol = 1 / bondVol;
    const invCommodityVol = 1 / commodityVol;
    const totalInvVol = invStockVol + invBondVol + invCommodityVol;
    
    const stockWeight = (invStockVol / totalInvVol) * 100;
    const bondWeight = (invBondVol / totalInvVol) * 100;
    const commodityWeight = (invCommodityVol / totalInvVol) * 100;
    
    // Traditional 60/40 comparison
    const traditional60_40RiskStock = (60 * stockVol) / (60 * stockVol + 40 * bondVol) * 100;
    
    const assets: AssetAllocation[] = [
      { name: 'Stocks', volatility: stockVol, weight: stockWeight, riskContribution: 33.3 },
      { name: 'Bonds', volatility: bondVol, weight: bondWeight, riskContribution: 33.3 },
      { name: 'Commodities', volatility: commodityVol, weight: commodityWeight, riskContribution: 33.3 }
    ];
    
    return {
      assets,
      stockWeight,
      bondWeight,
      commodityWeight,
      traditional60_40RiskStock
    };
  }, [stockVol, bondVol, commodityVol]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Risk Parity: Equal Risk Allocation</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Advanced Portfolio</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Risk Parity allocates capital so that each asset class contributes equally to portfolio risk, 
          rather than allocating equal dollars. Made famous by Bridgewater's All Weather fund, this approach 
          creates more balanced portfolios that perform across different economic environments.
        </p>
      </div>

      <Tabs defaultValue="concept" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="concept">Concept</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="pros-cons">Pros & Cons</TabsTrigger>
        </TabsList>

        {/* Concept Tab */}
        <TabsContent value="concept" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                The Problem with Traditional Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">The 60/40 Portfolio Illusion</p>
                <p className="text-sm text-muted-foreground">
                  A traditional 60% stocks / 40% bonds portfolio seems diversified, but stocks contribute 
                  approximately <span className="text-red-400 font-semibold">{riskParityCalc.traditional60_40RiskStock.toFixed(0)}%</span> of 
                  the portfolio's risk. You're not really diversified—you're mostly exposed to stock risk.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-red-400 mb-2">Traditional Allocation</h4>
                  <p className="text-sm text-muted-foreground mb-3">Equal dollar weights</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Stocks (60%)</span>
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full" style={{ width: `${riskParityCalc.traditional60_40RiskStock}%` }}></div>
                      </div>
                      <span className="text-sm text-red-400">{riskParityCalc.traditional60_40RiskStock.toFixed(0)}% risk</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bonds (40%)</span>
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${100 - riskParityCalc.traditional60_40RiskStock}%` }}></div>
                      </div>
                      <span className="text-sm text-blue-400">{(100 - riskParityCalc.traditional60_40RiskStock).toFixed(0)}% risk</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <h4 className="font-semibold text-primary mb-2">Risk Parity Allocation</h4>
                  <p className="text-sm text-muted-foreground mb-3">Equal risk weights</p>
                  <div className="space-y-2">
                    {riskParityCalc.assets.map((asset, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{asset.name} ({asset.weight.toFixed(0)}%)</span>
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '33%' }}></div>
                        </div>
                        <span className="text-sm text-primary">33% risk</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Formula */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                The Risk Parity Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="font-mono text-center text-primary text-lg">
                  Weight_i = (1/σ_i) / Σ(1/σ_j)
                </pre>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Each asset's weight is inversely proportional to its volatility
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">σ (sigma)</p>
                  <p className="font-semibold">Volatility</p>
                  <p className="text-xs text-muted-foreground mt-1">Standard deviation of returns</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">1/σ</p>
                  <p className="font-semibold">Inverse Volatility</p>
                  <p className="text-xs text-muted-foreground mt-1">Lower vol = higher allocation</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">Normalization</p>
                  <p className="font-semibold">Sum to 100%</p>
                  <p className="text-xs text-muted-foreground mt-1">Divide by sum of all inverse vols</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Origins: Bridgewater's All Weather
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-purple-500">
                <p className="font-semibold mb-1">Ray Dalio - Bridgewater Associates</p>
                <p className="text-sm text-muted-foreground">
                  In 1996, Dalio created the "All Weather" portfolio for his family trust, designed to 
                  perform well in any economic environment. The strategy manages over $80 billion today 
                  and inspired the risk parity movement.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  The Four Economic Environments
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>• Rising growth (stocks excel)</div>
                  <div>• Falling growth (bonds excel)</div>
                  <div>• Rising inflation (commodities excel)</div>
                  <div>• Falling inflation (bonds excel)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Risk Parity Weight Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <Label>Stock Volatility: {stockVol}%</Label>
                    <Slider
                      value={[stockVol]}
                      onValueChange={(v) => setStockVol(v[0])}
                      min={8}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Historical: 15-20%</p>
                  </div>

                  <div>
                    <Label>Bond Volatility: {bondVol}%</Label>
                    <Slider
                      value={[bondVol]}
                      onValueChange={(v) => setBondVol(v[0])}
                      min={2}
                      max={15}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Historical: 4-8%</p>
                  </div>

                  <div>
                    <Label>Commodity Volatility: {commodityVol}%</Label>
                    <Slider
                      value={[commodityVol]}
                      onValueChange={(v) => setCommodityVol(v[0])}
                      min={10}
                      max={35}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Historical: 15-25%</p>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">Risk Parity Weights:</p>
                  {riskParityCalc.assets.map((asset, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{asset.name}</span>
                        <span className="text-2xl font-bold text-primary">{asset.weight.toFixed(1)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Volatility: {asset.volatility}% → Risk contribution: 33.3%
                      </p>
                    </div>
                  ))}

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Notice: Lower volatility assets get higher allocations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Implementing Risk Parity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 1: Choose Asset Classes</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select uncorrelated asset classes that perform differently across economic regimes:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• US Stocks (growth)</div>
                    <div>• Long-term Treasuries (deflation)</div>
                    <div>• TIPS (inflation)</div>
                    <div>• Commodities (inflation)</div>
                    <div>• Gold (uncertainty)</div>
                    <div>• International stocks</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 2: Calculate Volatilities</h4>
                  <p className="text-sm text-muted-foreground">
                    Use trailing 60-day or 252-day standard deviation of returns. Update monthly or quarterly.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 3: Apply Inverse Volatility Weights</h4>
                  <p className="text-sm text-muted-foreground">
                    Calculate weight = (1/vol) / sum(1/all_vols) for each asset.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 4: Consider Leverage (Optional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Professional risk parity funds use leverage to bring low-volatility allocations (bonds) 
                    up to target returns. This is why bonds might be 50%+ of the portfolio.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 5: Rebalance Regularly</h4>
                  <p className="text-sm text-muted-foreground">
                    Rebalance monthly or when allocations drift more than 5% from targets. 
                    Volatilities change, so weights must adjust.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ETF Implementation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-400" />
                Sample ETF Implementation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Asset Class</th>
                      <th className="text-left py-2 px-3">Sample ETF</th>
                      <th className="text-left py-2 px-3">Approx. Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">US Stocks</td>
                      <td className="py-2 px-3 text-muted-foreground">VTI, SPY</td>
                      <td className="py-2 px-3 text-primary">20%</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Long-Term Treasuries</td>
                      <td className="py-2 px-3 text-muted-foreground">TLT, ZROZ</td>
                      <td className="py-2 px-3 text-primary">35%</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">TIPS</td>
                      <td className="py-2 px-3 text-muted-foreground">TIP, SCHP</td>
                      <td className="py-2 px-3 text-primary">20%</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Commodities</td>
                      <td className="py-2 px-3 text-muted-foreground">DBC, GSG</td>
                      <td className="py-2 px-3 text-primary">15%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Gold</td>
                      <td className="py-2 px-3 text-muted-foreground">GLD, IAU</td>
                      <td className="py-2 px-3 text-primary">10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Weights are approximate—recalculate based on current volatilities.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pros & Cons Tab */}
        <TabsContent value="pros-cons" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Advantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "True diversification across risk factors",
                    "Performs across different economic regimes",
                    "Lower drawdowns than equity-heavy portfolios",
                    "Mathematically rigorous approach",
                    "Reduces timing dependency",
                    "Better risk-adjusted returns historically"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  Disadvantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "May require leverage for target returns",
                    "Underperforms in strong bull markets",
                    "High bond allocation vulnerable to rising rates",
                    "More complex than traditional allocation",
                    "Transaction costs from rebalancing",
                    "Correlations can spike in crises"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                When to Use Risk Parity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Good For</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Long-term investors seeking stability</li>
                    <li>• Those who prioritize risk-adjusted returns</li>
                    <li>• Uncertainty about economic direction</li>
                    <li>• Retirement portfolios needing consistency</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Not Ideal For</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Maximum growth seekers</li>
                    <li>• Those uncomfortable with leverage</li>
                    <li>• Rising interest rate environments</li>
                    <li>• Short-term traders</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskParityVisualizer;
