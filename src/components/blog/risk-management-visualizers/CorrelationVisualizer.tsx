/**
 * CorrelationVisualizer - Portfolio Correlation Education
 * 
 * Professional-grade content covering:
 * - Correlation fundamentals
 * - Diversification through correlation
 * - Correlation breakdown during crises
 * - Practical correlation analysis
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BookOpen,
  Lightbulb,
  BarChart3,
  Shield,
  Target,
  TrendingUp,
  Link2,
  Unlink2
} from 'lucide-react';

export const CorrelationVisualizer = () => {
  const [correlation, setCorrelation] = useState(0.3);
  const [asset1Vol, setAsset1Vol] = useState(20);
  const [asset2Vol, setAsset2Vol] = useState(15);
  const [weight1, setWeight1] = useState(50);

  const portfolioCalc = useMemo(() => {
    const w1 = weight1 / 100;
    const w2 = 1 - w1;
    const v1 = asset1Vol / 100;
    const v2 = asset2Vol / 100;
    
    // Portfolio variance formula
    const portfolioVariance = 
      Math.pow(w1, 2) * Math.pow(v1, 2) + 
      Math.pow(w2, 2) * Math.pow(v2, 2) + 
      2 * w1 * w2 * v1 * v2 * correlation;
    
    const portfolioVol = Math.sqrt(portfolioVariance) * 100;
    
    // Weighted average volatility (no diversification benefit)
    const weightedAvgVol = (w1 * asset1Vol) + (w2 * asset2Vol);
    
    // Diversification benefit
    const diversificationBenefit = weightedAvgVol - portfolioVol;
    const benefitPercent = (diversificationBenefit / weightedAvgVol) * 100;
    
    return {
      portfolioVol,
      weightedAvgVol,
      diversificationBenefit,
      benefitPercent
    };
  }, [correlation, asset1Vol, asset2Vol, weight1]);

  const getCorrelationLabel = (corr: number) => {
    if (corr <= -0.7) return { label: 'Strong Negative', color: 'text-green-400' };
    if (corr <= -0.3) return { label: 'Moderate Negative', color: 'text-green-400' };
    if (corr < 0.3) return { label: 'Low Correlation', color: 'text-blue-400' };
    if (corr < 0.7) return { label: 'Moderate Positive', color: 'text-amber-400' };
    return { label: 'Strong Positive', color: 'text-red-400' };
  };

  const corrLabel = getCorrelationLabel(correlation);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link2 className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Correlation: The Key to True Diversification</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Portfolio Science</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Correlation measures how assets move together. Understanding correlation is essential for 
          building truly diversified portfolios. Assets with low or negative correlation provide the 
          "free lunch" of diversification—reducing risk without sacrificing expected returns.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Correlation</TabsTrigger>
          <TabsTrigger value="practical">Practical Use</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Understanding Correlation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-center text-lg">
                  Correlation ranges from <span className="text-green-400 font-semibold">-1</span> to 
                  <span className="text-red-400 font-semibold"> +1</span>
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <Unlink2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="font-semibold text-green-400">-1 (Perfect Negative)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assets move exactly opposite. When one is up 10%, the other is down 10%.
                  </p>
                  <p className="text-xs text-green-400 mt-2">Maximum diversification benefit</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                  <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="font-semibold text-blue-400">0 (Uncorrelated)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No relationship. Movements are independent of each other.
                  </p>
                  <p className="text-xs text-blue-400 mt-2">Good diversification</p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                  <Link2 className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="font-semibold text-red-400">+1 (Perfect Positive)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assets move exactly together. When one is up 10%, so is the other.
                  </p>
                  <p className="text-xs text-red-400 mt-2">No diversification benefit</p>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  The Diversification Free Lunch
                </p>
                <p className="text-sm text-muted-foreground">
                  When you combine assets with correlation less than +1, the portfolio volatility is 
                  LESS than the weighted average of individual volatilities. This is the mathematical 
                  basis for diversification—you reduce risk without reducing expected return.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Common Correlations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Typical Asset Correlations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Asset Pair</th>
                      <th className="text-left py-2 px-3">Typical Correlation</th>
                      <th className="text-left py-2 px-3">Diversification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">S&P 500 vs Nasdaq</td>
                      <td className="py-2 px-3 text-red-400">0.90+</td>
                      <td className="py-2 px-3"><Badge className="bg-red-500/20 text-red-400">Poor</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">US Stocks vs Int'l Stocks</td>
                      <td className="py-2 px-3 text-amber-400">0.70</td>
                      <td className="py-2 px-3"><Badge className="bg-amber-500/20 text-amber-400">Moderate</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Stocks vs Bonds</td>
                      <td className="py-2 px-3 text-blue-400">0.0 to -0.3</td>
                      <td className="py-2 px-3"><Badge className="bg-blue-500/20 text-blue-400">Good</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Stocks vs Gold</td>
                      <td className="py-2 px-3 text-blue-400">0.0 to 0.1</td>
                      <td className="py-2 px-3"><Badge className="bg-blue-500/20 text-blue-400">Good</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Stocks vs Managed Futures</td>
                      <td className="py-2 px-3 text-green-400">-0.1 to 0.1</td>
                      <td className="py-2 px-3"><Badge className="bg-green-500/20 text-green-400">Excellent</Badge></td>
                    </tr>
                  </tbody>
                </table>
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
                Portfolio Volatility Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <Label>Correlation: {correlation.toFixed(2)}</Label>
                    <Slider
                      value={[correlation]}
                      onValueChange={(v) => setCorrelation(v[0])}
                      min={-1}
                      max={1}
                      step={0.05}
                      className="mt-2"
                    />
                    <p className={`text-sm mt-1 ${corrLabel.color}`}>{corrLabel.label}</p>
                  </div>

                  <div>
                    <Label>Asset 1 Volatility: {asset1Vol}%</Label>
                    <Slider
                      value={[asset1Vol]}
                      onValueChange={(v) => setAsset1Vol(v[0])}
                      min={5}
                      max={40}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Asset 2 Volatility: {asset2Vol}%</Label>
                    <Slider
                      value={[asset2Vol]}
                      onValueChange={(v) => setAsset2Vol(v[0])}
                      min={5}
                      max={40}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Asset 1 Weight: {weight1}% / Asset 2: {100 - weight1}%</Label>
                    <Slider
                      value={[weight1]}
                      onValueChange={(v) => setWeight1(v[0])}
                      min={10}
                      max={90}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-muted-foreground">Weighted Avg Volatility (No Diversification)</p>
                    <p className="text-2xl font-bold text-red-400">{portfolioCalc.weightedAvgVol.toFixed(1)}%</p>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Actual Portfolio Volatility</p>
                    <p className="text-3xl font-bold text-primary">{portfolioCalc.portfolioVol.toFixed(1)}%</p>
                  </div>

                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-muted-foreground">Diversification Benefit</p>
                    <p className="text-2xl font-bold text-green-400">
                      {portfolioCalc.diversificationBenefit.toFixed(1)}% volatility reduction
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({portfolioCalc.benefitPercent.toFixed(1)}% risk reduction)
                    </p>
                  </div>

                  <div className="p-3 bg-muted/30 rounded text-sm">
                    <p className="text-muted-foreground">
                      Try moving correlation to -1 to see maximum diversification benefit!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crisis Correlation Tab */}
        <TabsContent value="crisis" className="space-y-6">
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Correlation Breakdown During Crises
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">The Danger: Correlations Go to 1</p>
                <p className="text-sm text-muted-foreground">
                  During market crises, correlations between risky assets spike toward +1. Assets that 
                  seemed uncorrelated in normal times suddenly move together—usually downward. This is 
                  exactly when you need diversification most, but it fails you.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">2008 Financial Crisis</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Stocks, REITs, commodities all crashed</li>
                    <li>• Even "uncorrelated" hedge funds fell</li>
                    <li>• Only Treasuries and gold held up</li>
                    <li>• Correlation of risk assets went to 0.9+</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">March 2020 (COVID)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Everything sold off initially</li>
                    <li>• Even bonds dropped briefly</li>
                    <li>• Gold also fell (liquidity crunch)</li>
                    <li>• All correlations spiked to near 1</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" />
                  What Actually Works in Crises
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-semibold text-green-400">Historically Protective:</p>
                    <ul className="text-sm text-muted-foreground">
                      <li>• Long-term Treasury bonds</li>
                      <li>• Long volatility (VIX calls)</li>
                      <li>• Trend-following strategies</li>
                      <li>• Cash</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400">False Diversifiers:</p>
                    <ul className="text-sm text-muted-foreground">
                      <li>• International developed stocks</li>
                      <li>• Emerging market stocks</li>
                      <li>• REITs</li>
                      <li>• High-yield bonds</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practical Use Tab */}
        <TabsContent value="practical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Using Correlation in Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    title: "Look for Low/Negative Correlation",
                    detail: "Seek assets with correlation below 0.3 to your portfolio for meaningful diversification."
                  },
                  {
                    title: "Use Rolling Correlation",
                    detail: "60-day or 90-day rolling correlation shows how relationships change over time."
                  },
                  {
                    title: "Check Stress Correlation",
                    detail: "Calculate correlation only during down months to see crisis behavior."
                  },
                  {
                    title: "Don't Over-Diversify",
                    detail: "After 15-20 positions, additional diversification benefit is minimal."
                  },
                  {
                    title: "Rebalance Based on Correlation Changes",
                    detail: "If correlation increases, the diversification benefit decreases—consider adjusting."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Correlation Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Assuming correlation is stable",
                    fix: "Correlations change over time; recalculate regularly"
                  },
                  {
                    mistake: "Ignoring crisis correlation behavior",
                    fix: "Check how assets correlate during stress periods specifically"
                  },
                  {
                    mistake: "Thinking 10 stocks = diversification",
                    fix: "10 tech stocks have 0.8+ correlation; diversify across sectors/asset classes"
                  },
                  {
                    mistake: "Using correlation alone",
                    fix: "Also consider volatility, expected return, and tail behavior"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-green-400 mt-2">✓ {item.fix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CorrelationVisualizer;
