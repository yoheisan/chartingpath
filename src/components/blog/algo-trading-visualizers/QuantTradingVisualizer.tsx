/**
 * QuantTradingVisualizer - Quantitative Trading Education
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, AlertTriangle, CheckCircle, BookOpen, Lightbulb, BarChart3, Target, Database, Activity
} from 'lucide-react';

export const QuantTradingVisualizer = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Quantitative Trading</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Data-Driven Strategies</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Quantitative trading uses mathematical models, statistical analysis, and data science to 
          identify trading opportunities. From factor models to systematic execution, quants bring 
          scientific rigor to financial markets.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="factors">Factor Models</TabsTrigger>
          <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
        </TabsList>

        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is Quantitative Trading?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  Quant Trading = <span className="text-primary font-semibold">Data + Math + Systematic Execution</span>
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Data-Driven</h4>
                  <p className="text-sm text-muted-foreground">Decisions based on statistical evidence, not intuition</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Calculator className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Mathematical</h4>
                  <p className="text-sm text-muted-foreground">Models tested with rigorous statistical methods</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Systematic</h4>
                  <p className="text-sm text-muted-foreground">Rules applied consistently without emotion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Factor Investing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Factors are quantifiable characteristics that explain stock returns. Academic research 
                has identified factors that have historically delivered excess returns.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: "Value", desc: "Buy cheap stocks (low P/E, P/B)", metric: "P/E < 15" },
                  { name: "Momentum", desc: "Buy past winners", metric: "12-month return > median" },
                  { name: "Quality", desc: "Buy profitable companies", metric: "High ROE, low debt" },
                  { name: "Size", desc: "Small caps outperform", metric: "Market cap < $2B" },
                  { name: "Low Volatility", desc: "Less risky stocks perform well", metric: "Low 12-month vol" },
                  { name: "Dividend Yield", desc: "High dividend payers", metric: "Yield > 3%" }
                ].map((factor, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold text-primary">{factor.name}</h4>
                    <p className="text-sm text-muted-foreground">{factor.desc}</p>
                    <Badge className="mt-2 bg-muted text-muted-foreground">{factor.metric}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtesting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Backtesting Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  "Use point-in-time data to avoid survivorship and lookahead bias",
                  "Walk-forward validation, not random train/test splits",
                  "Include transaction costs, slippage, and market impact",
                  "Test across multiple time periods and market regimes",
                  "Out-of-sample testing is mandatory before deployment",
                  "If Sharpe > 2 in backtest, you probably have a bug"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                Execution Algorithms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400">TWAP</h4>
                  <p className="text-sm text-muted-foreground">Time-Weighted Average Price. Spread orders evenly over time.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400">VWAP</h4>
                  <p className="text-sm text-muted-foreground">Volume-Weighted Average Price. Match market volume profile.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400">Implementation Shortfall</h4>
                  <p className="text-sm text-muted-foreground">Minimize slippage from decision price to execution.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400">Iceberg</h4>
                  <p className="text-sm text-muted-foreground">Hide large orders by showing only small pieces.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantTradingVisualizer;
