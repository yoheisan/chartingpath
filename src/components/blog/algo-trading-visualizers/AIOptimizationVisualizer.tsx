/**
 * AIOptimizationVisualizer - AI Signal Optimization Education
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, AlertTriangle, CheckCircle, XCircle, BookOpen, Lightbulb, BarChart3, Activity, Target
} from 'lucide-react';

export const AIOptimizationVisualizer = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Signal Optimization</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Advanced ML</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          AI can enhance existing trading strategies by optimizing parameters, filtering signals, 
          and adapting to changing market conditions. This guide covers practical applications of 
          AI for strategy improvement, not replacement.
        </p>
      </div>

      <Tabs defaultValue="enhancement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="enhancement">Signal Enhancement</TabsTrigger>
          <TabsTrigger value="adaptive">Adaptive Systems</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio AI</TabsTrigger>
          <TabsTrigger value="pitfalls">Pitfalls</TabsTrigger>
        </TabsList>

        <TabsContent value="enhancement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Signal Enhancement Techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-primary font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  The Goal: Improve Existing Signals, Not Replace Them
                </p>
                <p className="text-sm text-muted-foreground">
                  Instead of building pure ML trading systems, use AI to filter and enhance 
                  signals from proven strategies. This reduces overfitting risk.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Signal Filtering", desc: "ML model predicts which signals will succeed. Only trade high-confidence signals.", example: "Filter RSI oversold signals by trend regime" },
                  { name: "Dynamic Parameters", desc: "AI adjusts indicator parameters based on current volatility/trend.", example: "Auto-adjust MA length based on market regime" },
                  { name: "Entry Timing", desc: "ML optimizes exact entry point after signal triggers.", example: "Wait for pullback confirmation after breakout signal" },
                  { name: "Position Sizing", desc: "AI determines optimal size based on signal quality and market conditions.", example: "Scale position with model confidence score" }
                ].map((technique, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold text-primary">{technique.name}</h4>
                    <p className="text-sm text-muted-foreground">{technique.desc}</p>
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">Example: {technique.example}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adaptive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Adaptive Trading Systems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Markets change over time. Adaptive systems detect regime changes and adjust strategy 
                parameters accordingly.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400">Regime Detection</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Hidden Markov Models for regime states</li>
                    <li>• Volatility clustering detection</li>
                    <li>• Trend strength classification</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400">Parameter Adaptation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li>• Online learning for real-time updates</li>
                    <li>• Bayesian optimization for tuning</li>
                    <li>• Ensemble methods for robustness</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`# Regime-aware strategy selection
def select_strategy(market_state):
    if market_state == 'trending':
        return TrendFollowingStrategy(fast_ma=10, slow_ma=50)
    elif market_state == 'mean_reverting':
        return MeanReversionStrategy(lookback=20, entry_z=2)
    else:  # choppy
        return ConservativeStrategy(no_trade=True)`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                AI for Portfolio Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400">Strategy Allocation</h4>
                  <p className="text-sm text-muted-foreground">ML determines how much capital to allocate to each strategy based on expected performance.</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400">Risk Budgeting</h4>
                  <p className="text-sm text-muted-foreground">AI predicts volatility and adjusts exposure to maintain target risk.</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <h4 className="font-semibold text-purple-400">Correlation Forecasting</h4>
                  <p className="text-sm text-muted-foreground">Predict when correlations will spike (crisis) and reduce exposure preemptively.</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-semibold text-amber-400">Drawdown Management</h4>
                  <p className="text-sm text-muted-foreground">ML detects early signs of strategy failure and reduces allocation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pitfalls" className="space-y-6">
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                AI Trading Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { mistake: "Over-optimization", desc: "AI finds parameters that only work on historical data", fix: "Use walk-forward validation, keep models simple" },
                { mistake: "Data snooping", desc: "Testing hundreds of features until something 'works'", fix: "Pre-specify hypotheses, use proper train/test splits" },
                { mistake: "Black box trust", desc: "Deploying models you don't understand", fix: "Use interpretable models, feature importance analysis" },
                { mistake: "Ignoring regime change", desc: "Model trained on bull market deployed in crash", fix: "Include diverse market conditions in training" }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <p className="font-semibold text-red-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {item.mistake}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  <p className="text-sm text-green-400 mt-2">✓ {item.fix}</p>
                </div>
              ))}
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
                  "Start by enhancing existing profitable strategies, not building from scratch",
                  "Use AI for filtering and sizing, not pure signal generation",
                  "Always have a human-understandable logic for why the strategy should work",
                  "Paper trade AI enhancements for 3+ months before live deployment",
                  "Monitor for model decay and retrain on schedule"
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

export default AIOptimizationVisualizer;
