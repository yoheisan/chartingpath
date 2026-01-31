/**
 * MachineLearningVisualizer - ML Trading Education
 * 
 * Professional-grade content covering:
 * - ML fundamentals for trading
 * - Feature engineering
 * - Model selection and training
 * - Avoiding overfitting
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
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
  GitBranch,
  Layers,
  TrendingUp
} from 'lucide-react';

export const MachineLearningVisualizer = () => {
  const [selectedModel, setSelectedModel] = useState<'rf' | 'xgb' | 'lstm' | 'transformer'>('rf');

  const models = {
    rf: {
      name: "Random Forest",
      difficulty: "Beginner",
      pros: ["Robust to overfitting", "Feature importance", "Fast training"],
      cons: ["Can't capture sequences", "Limited extrapolation"],
      useCase: "Cross-sectional stock ranking"
    },
    xgb: {
      name: "XGBoost/LightGBM",
      difficulty: "Intermediate",
      pros: ["State-of-art tabular performance", "Fast inference", "Handles missing data"],
      cons: ["Requires careful tuning", "Memory intensive"],
      useCase: "General prediction, Kaggle competitions"
    },
    lstm: {
      name: "LSTM Neural Network",
      difficulty: "Advanced",
      pros: ["Captures time dependencies", "Sequence modeling", "Non-linear patterns"],
      cons: ["Prone to overfitting", "Slow training", "Hard to interpret"],
      useCase: "Price forecasting, regime detection"
    },
    transformer: {
      name: "Transformer/Attention",
      difficulty: "Expert",
      pros: ["Long-range dependencies", "Parallel training", "State-of-art NLP"],
      cons: ["Massive data needs", "Compute intensive", "Black box"],
      useCase: "Multi-asset models, sentiment analysis"
    }
  };

  const model = models[selectedModel];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Machine Learning Trading</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">AI-Powered Predictions</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Machine Learning applies statistical algorithms to find patterns in market data that humans 
          can't see. From simple decision trees to deep neural networks, ML is transforming 
          quantitative trading. This guide covers practical implementation while avoiding the traps 
          that destroy most ML trading systems.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="features">Feature Engineering</TabsTrigger>
          <TabsTrigger value="models">Model Selection</TabsTrigger>
          <TabsTrigger value="pitfalls">Pitfalls</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                ML Trading Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  ML Trading = <span className="text-primary font-semibold">Features → Model → Predictions → Trading Signals</span>
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">1. Data</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Price, volume, fundamentals, alternative data
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Layers className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">2. Features</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transform raw data into model inputs
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">3. Model</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Learn patterns from historical data
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">4. Signals</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Convert predictions to buy/sell decisions
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Uncomfortable Truth
                </p>
                <p className="text-sm text-muted-foreground">
                  Most ML trading systems fail. Markets are noisy, non-stationary, and adversarial. 
                  What worked in backtest rarely works live. This guide teaches you to build systems 
                  that might actually survive real markets.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Problem Framing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                ML Problem Types in Trading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Classification</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Predict discrete outcomes: up/down, buy/sell/hold
                  </p>
                  <div className="bg-muted/50 p-2 rounded text-sm font-mono">
                    y = 1 if return &gt; 0 else 0
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Regression</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Predict continuous values: future returns, volatility
                  </p>
                  <div className="bg-muted/50 p-2 rounded text-sm font-mono">
                    y = next_day_return
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">Ranking</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Rank stocks by expected performance
                  </p>
                  <div className="bg-muted/50 p-2 rounded text-sm font-mono">
                    Long top 10%, short bottom 10%
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">Time Series</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Sequential predictions respecting time order
                  </p>
                  <div className="bg-muted/50 p-2 rounded text-sm font-mono">
                    y[t+1] = f(X[t], X[t-1], ...)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Feature Engineering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Features Matter More Than Models
                </p>
                <p className="text-sm text-muted-foreground">
                  A simple model with great features beats a complex model with bad features every time. 
                  Spend 80% of your time on feature engineering.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Price-Based Features</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    <pre>{`# Common price features
returns_1d = (close - close.shift(1)) / close.shift(1)
returns_5d = (close - close.shift(5)) / close.shift(5)
ma_20 = close.rolling(20).mean()
ma_ratio = close / ma_20
volatility_20d = returns_1d.rolling(20).std()
high_low_range = (high - low) / close`}</pre>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Technical Indicators</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    <pre>{`# Momentum & Trend
rsi_14 = ta.momentum.RSIIndicator(close, 14).rsi()
macd = ta.trend.MACD(close).macd()
adx = ta.trend.ADXIndicator(high, low, close).adx()
bb_pctb = ta.volatility.BollingerBands(close).bollinger_pband()`}</pre>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">Volume Features</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    <pre>{`# Volume analysis
volume_ma_ratio = volume / volume.rolling(20).mean()
obv = ta.volume.OnBalanceVolumeIndicator(close, volume).on_balance_volume()
vwap = (close * volume).cumsum() / volume.cumsum()
dollar_volume = close * volume  # Liquidity proxy`}</pre>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">Feature Scaling</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    <pre>{`# Always scale features for ML
from sklearn.preprocessing import StandardScaler, RobustScaler

# StandardScaler for normal distributions
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)

# RobustScaler for outliers (recommended)
robust_scaler = RobustScaler()
X_robust = robust_scaler.fit_transform(X_train)`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Model Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {(['rf', 'xgb', 'lstm', 'transformer'] as const).map(type => (
                  <Badge 
                    key={type}
                    variant={selectedModel === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedModel(type)}
                  >
                    {models[type].name}
                  </Badge>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-xl font-bold">{model.name}</h4>
                    <Badge className="mt-1 bg-primary/20 text-primary">{model.difficulty}</Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-semibold text-green-400 mb-2">Advantages</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {model.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm font-semibold text-red-400 mb-2">Disadvantages</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {model.cons.map((con, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-400" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-semibold">Best Use Case:</span> {model.useCase}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Example */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Quick Start Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{`# Complete ML trading pipeline
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit

# 1. Prepare features and target
X = df[['returns_5d', 'rsi_14', 'macd', 'volume_ratio']].dropna()
y = (df['returns_1d'].shift(-1) > 0).astype(int)  # Next day direction

# 2. Time-series cross-validation (CRITICAL!)
tscv = TimeSeriesSplit(n_splits=5)

# 3. Train model
model = RandomForestClassifier(n_estimators=100, max_depth=5)
for train_idx, val_idx in tscv.split(X):
    X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
    y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
    model.fit(X_train, y_train)
    print(f"Val Accuracy: {model.score(X_val, y_val):.3f}")

# 4. Generate signals
predictions = model.predict_proba(X)[:, 1]
signals = pd.Series(predictions, index=X.index)
signals = (signals > 0.6).astype(int)  # Confidence threshold`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pitfalls Tab */}
        <TabsContent value="pitfalls" className="space-y-6">
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Critical ML Trading Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Lookahead Bias",
                  desc: "Using future information in training features",
                  example: "Using same-day close to predict same-day direction",
                  fix: "Always shift target variable. Use point-in-time data."
                },
                {
                  title: "Overfitting",
                  desc: "Model memorizes training data instead of learning patterns",
                  example: "99% train accuracy, 50% test accuracy",
                  fix: "Regularization, early stopping, simpler models, more data"
                },
                {
                  title: "Non-Stationarity",
                  desc: "Market regimes change; what worked stops working",
                  example: "Model trained on bull market fails in bear market",
                  fix: "Rolling training windows, regime-aware models"
                },
                {
                  title: "Data Snooping",
                  desc: "Trying hundreds of features until something 'works'",
                  example: "Testing 100 indicators, selecting 3 that backtest well",
                  fix: "Pre-specify hypotheses, out-of-sample validation, paper trade"
                },
                {
                  title: "Survivorship Bias",
                  desc: "Training on stocks that exist today, ignoring delisted ones",
                  example: "Not including 2008 bankruptcies in training data",
                  fix: "Use point-in-time constituent data, include delistings"
                }
              ].map((pitfall, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-red-400 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    {pitfall.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">{pitfall.desc}</p>
                  <div className="bg-red-500/10 p-2 rounded text-xs text-red-400 mb-2">
                    Example: {pitfall.example}
                  </div>
                  <div className="bg-green-500/10 p-2 rounded text-xs text-green-400">
                    Fix: {pitfall.fix}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Best Practices Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "Use walk-forward or TimeSeriesSplit—never random shuffle",
                  "Keep 20%+ data as truly held-out final test set",
                  "Start simple (Random Forest) before going deep learning",
                  "Monitor feature importance and remove low-value features",
                  "Paper trade for 3+ months before real money",
                  "Build robust features, not clever ones",
                  "If it looks too good to be true, you have a bug"
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

export default MachineLearningVisualizer;
