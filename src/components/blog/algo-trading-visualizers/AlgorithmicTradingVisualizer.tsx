/**
 * AlgorithmicTradingVisualizer - Algo Trading Fundamentals
 * 
 * Professional-grade content covering:
 * - Algo trading fundamentals
 * - System architecture
 * - Strategy development lifecycle
 * - Live trading considerations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  Database,
  Server,
  Shield,
  Clock,
  Workflow
} from 'lucide-react';

export const AlgorithmicTradingVisualizer = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Algorithmic Trading Systems</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Systematic Trading</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Algorithmic trading uses computer programs to execute trades based on predefined rules. 
          From simple moving average crossovers to complex machine learning models, algo trading 
          removes emotion and enables consistent execution. This guide covers the complete journey 
          from idea to live trading.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="live">Going Live</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is Algorithmic Trading?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  Algo Trading = <span className="text-primary font-semibold">Rules + Automation + Discipline</span>
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Workflow className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Rule-Based</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clear, quantifiable entry/exit rules. No gut feelings.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Bot className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Automated</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Computer executes trades 24/7 without human intervention.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Disciplined</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    No emotion, no hesitation, no revenge trading.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  The Real Advantage
                </p>
                <p className="text-sm text-muted-foreground">
                  The biggest edge isn't speed or intelligence—it's consistency. Algorithms execute 
                  the same rules every time, while humans make emotional mistakes under pressure. 
                  A mediocre strategy executed perfectly beats a great strategy executed poorly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Types of Algo Trading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Types of Algorithmic Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Strategy Type</th>
                      <th className="text-left py-2 px-3">Holding Period</th>
                      <th className="text-left py-2 px-3">Capital Needed</th>
                      <th className="text-left py-2 px-3">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Trend Following</td>
                      <td className="py-2 px-3">Days to months</td>
                      <td className="py-2 px-3 text-green-400">$10K+</td>
                      <td className="py-2 px-3"><Badge className="bg-green-500/20 text-green-400">Beginner</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Mean Reversion</td>
                      <td className="py-2 px-3">Hours to days</td>
                      <td className="py-2 px-3 text-green-400">$25K+</td>
                      <td className="py-2 px-3"><Badge className="bg-amber-500/20 text-amber-400">Intermediate</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Statistical Arbitrage</td>
                      <td className="py-2 px-3">Minutes to days</td>
                      <td className="py-2 px-3 text-amber-400">$100K+</td>
                      <td className="py-2 px-3"><Badge className="bg-red-500/20 text-red-400">Advanced</Badge></td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Market Making</td>
                      <td className="py-2 px-3">Seconds</td>
                      <td className="py-2 px-3 text-red-400">$500K+</td>
                      <td className="py-2 px-3"><Badge className="bg-red-500/20 text-red-400">Expert</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold">High-Frequency</td>
                      <td className="py-2 px-3">Microseconds</td>
                      <td className="py-2 px-3 text-red-400">$10M+</td>
                      <td className="py-2 px-3"><Badge className="bg-purple-500/20 text-purple-400">Institutional</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                System Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Data Feed</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time & historical price data
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Signal Engine</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strategy logic & signal generation
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Risk Manager</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Position sizing & limits
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Execution</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order routing & broker API
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Minimal Python Architecture</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`# Core trading system structure
class TradingSystem:
    def __init__(self):
        self.data_feed = DataFeed()       # Market data
        self.strategy = Strategy()         # Signal generation
        self.risk_manager = RiskManager()  # Position limits
        self.executor = Executor()         # Broker connection
        
    def run(self):
        while market_open:
            # 1. Get latest data
            bar = self.data_feed.get_latest()
            
            # 2. Generate signal
            signal = self.strategy.process(bar)
            
            # 3. Apply risk checks
            if self.risk_manager.approve(signal):
                # 4. Execute trade
                self.executor.submit(signal)`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Recommended Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Beginner Stack</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Language:</strong> Python</li>
                    <li>• <strong>Backtest:</strong> Backtrader, Zipline</li>
                    <li>• <strong>Data:</strong> Yahoo Finance, Alpha Vantage</li>
                    <li>• <strong>Broker:</strong> Alpaca, Interactive Brokers</li>
                    <li>• <strong>Hosting:</strong> Local or AWS EC2</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <h4 className="font-semibold text-purple-400 mb-2">Professional Stack</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Language:</strong> Python + C++</li>
                    <li>• <strong>Backtest:</strong> Custom engine</li>
                    <li>• <strong>Data:</strong> Polygon, Databento</li>
                    <li>• <strong>Broker:</strong> FIX protocol, Prime broker</li>
                    <li>• <strong>Hosting:</strong> Co-located servers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-green-400" />
                Strategy Development Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Hypothesis",
                    desc: "Define a testable trading idea based on market theory or observation",
                    example: "Stocks with high short interest and positive earnings surprises squeeze higher"
                  },
                  {
                    step: 2,
                    title: "Data Collection",
                    desc: "Gather historical data for the assets and timeframes you'll trade",
                    example: "5 years of daily OHLCV + short interest + earnings dates"
                  },
                  {
                    step: 3,
                    title: "Feature Engineering",
                    desc: "Create indicators and variables that capture your hypothesis",
                    example: "Short interest ratio, days since earnings, earnings surprise %"
                  },
                  {
                    step: 4,
                    title: "Backtesting",
                    desc: "Simulate strategy on historical data with realistic assumptions",
                    example: "Include slippage, commission, and no lookahead bias"
                  },
                  {
                    step: 5,
                    title: "Validation",
                    desc: "Test on out-of-sample data; check for overfitting",
                    example: "Walk-forward analysis, Monte Carlo simulation"
                  },
                  {
                    step: 6,
                    title: "Demo Trading",
                    desc: "Run strategy on a demo account for 1-3 months",
                    example: "Compare demo fills to backtest expectations"
                  },
                  {
                    step: 7,
                    title: "Live Trading",
                    desc: "Deploy with real capital, starting small and scaling up",
                    example: "Start at 10% target size, scale to 100% over 3 months"
                  }
                ].map(item => (
                  <div key={item.step} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {item.step}
                      </div>
                      <h4 className="font-semibold">{item.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">{item.desc}</p>
                    <p className="text-xs text-primary ml-11 mt-1">Example: {item.example}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Trading Tab */}
        <TabsContent value="live" className="space-y-6">
          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Going Live: Critical Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Kill Switches</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Daily loss limit (stop if -2% account)</li>
                    <li>• Position size limits</li>
                    <li>• Connectivity monitoring</li>
                    <li>• Manual override capability</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 mb-2">Monitoring</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time P&L dashboard</li>
                    <li>• Execution quality metrics</li>
                    <li>• System health alerts</li>
                    <li>• Strategy drift detection</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Pre-Launch Checklist
                </p>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>☐ Paper traded for 30+ days</div>
                  <div>☐ Backtest matches paper results</div>
                  <div>☐ Kill switches tested</div>
                  <div>☐ Broker API tested extensively</div>
                  <div>☐ Slippage assumptions validated</div>
                  <div>☐ Monitoring dashboard ready</div>
                  <div>☐ Emergency contact procedures</div>
                  <div>☐ Starting at reduced size</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "Start with simple strategies before complex ones",
                  "Assume backtest results are overstated by 50%",
                  "Never deploy untested code to production",
                  "Log everything—you'll need it for debugging",
                  "Have a manual trading plan if systems fail",
                  "Scale position size gradually over months",
                  "Review and iterate on strategies monthly"
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
      </Tabs>
    </div>
  );
};

export default AlgorithmicTradingVisualizer;
