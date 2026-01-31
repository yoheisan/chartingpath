/**
 * SentimentAnalysisVisualizer - Sentiment Trading Education
 * 
 * Professional-grade content covering:
 * - NLP fundamentals for traders
 * - Sentiment scoring methodologies
 * - Data sources and signal integration
 * - Practical implementation
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Target,
  Newspaper,
  Twitter,
  Globe,
  Zap,
  Database
} from 'lucide-react';

export const SentimentAnalysisVisualizer = () => {
  const [selectedExample, setSelectedExample] = useState<'bullish' | 'bearish' | 'neutral'>('bullish');

  const sentimentExamples = {
    bullish: {
      text: "Apple beats earnings expectations, raises guidance for Q4. Analysts upgrade to Strong Buy.",
      score: 0.85,
      signals: ["earnings_beat", "guidance_raise", "analyst_upgrade"],
      action: "Bullish signal - consider long entry"
    },
    bearish: {
      text: "SEC launches investigation into company's accounting practices. CFO resigns unexpectedly.",
      score: -0.92,
      signals: ["regulatory_risk", "executive_departure", "accounting_concern"],
      action: "Bearish signal - avoid or short"
    },
    neutral: {
      text: "Company announces routine board meeting scheduled for next week. No agenda disclosed.",
      score: 0.05,
      signals: ["routine_announcement"],
      action: "No actionable signal"
    }
  };

  const example = sentimentExamples[selectedExample];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Sentiment Analysis Trading</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Advanced NLP</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Sentiment analysis uses Natural Language Processing (NLP) to extract trading signals from 
          news, social media, and alternative data. By quantifying market mood before it moves prices, 
          sentiment traders gain an edge. This guide covers the full pipeline from data collection to 
          signal generation.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="signals">Signal Generation</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is Sentiment Analysis?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  Sentiment Analysis = <span className="text-primary font-semibold">Converting text into numerical trading signals</span>
                </p>
              </div>

              <p className="text-muted-foreground">
                Markets move on information. Before the age of algorithms, traders read newspapers 
                and formed opinions. Today, NLP algorithms can process millions of documents in 
                milliseconds, extracting sentiment before humans can react. This creates alpha for 
                those who deploy it correctly.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <Newspaper className="w-6 h-6 text-blue-400 mb-2" />
                  <h4 className="font-semibold mb-1">News Sentiment</h4>
                  <p className="text-sm text-muted-foreground">
                    Earnings, M&A, product launches, regulatory actions. Structured and reliable.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Twitter className="w-6 h-6 text-cyan-400 mb-2" />
                  <h4 className="font-semibold mb-1">Social Sentiment</h4>
                  <p className="text-sm text-muted-foreground">
                    Twitter/X, Reddit, StockTwits. Noisy but fast. Captures retail mood.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <Globe className="w-6 h-6 text-green-400 mb-2" />
                  <h4 className="font-semibold mb-1">Alternative Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Satellite imagery, credit card data, app downloads. Unique alpha sources.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NLP Basics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                NLP Fundamentals for Traders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">1. Tokenization</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Breaking text into words or subwords for analysis.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    "AAPL beats earnings" → ["AAPL", "beats", "earnings"]
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">2. Named Entity Recognition (NER)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Identifying companies, people, locations, financial metrics.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    "Apple" → ORG, "Tim Cook" → PERSON, "$3.2B" → MONEY
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">3. Sentiment Scoring</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Assigning numerical scores from -1 (bearish) to +1 (bullish).
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    "Revenue surges 40%" → +0.85 | "Layoffs announced" → -0.70
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">4. Event Extraction</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Identifying specific events: earnings, FDA approvals, insider trades.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    Event: FDA_APPROVAL | Drug: XYZ | Company: BIOX | Date: 2024-03-15
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="data-sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Sentiment Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Source</th>
                      <th className="text-left py-2 px-3">Latency</th>
                      <th className="text-left py-2 px-3">Signal Quality</th>
                      <th className="text-left py-2 px-3">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Reuters/Bloomberg</td>
                      <td className="py-2 px-3 text-green-400">Milliseconds</td>
                      <td className="py-2 px-3"><Badge className="bg-green-500/20 text-green-400">Excellent</Badge></td>
                      <td className="py-2 px-3 text-red-400">$$$$$</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Twitter/X Firehose</td>
                      <td className="py-2 px-3 text-green-400">Real-time</td>
                      <td className="py-2 px-3"><Badge className="bg-amber-500/20 text-amber-400">Mixed</Badge></td>
                      <td className="py-2 px-3 text-amber-400">$$$</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">SEC Filings</td>
                      <td className="py-2 px-3 text-amber-400">Minutes</td>
                      <td className="py-2 px-3"><Badge className="bg-green-500/20 text-green-400">High</Badge></td>
                      <td className="py-2 px-3 text-green-400">Free</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3 font-semibold">Reddit (API)</td>
                      <td className="py-2 px-3 text-amber-400">Minutes</td>
                      <td className="py-2 px-3"><Badge className="bg-amber-500/20 text-amber-400">Noisy</Badge></td>
                      <td className="py-2 px-3 text-green-400">$</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold">Earnings Call Transcripts</td>
                      <td className="py-2 px-3 text-amber-400">Hours</td>
                      <td className="py-2 px-3"><Badge className="bg-green-500/20 text-green-400">High</Badge></td>
                      <td className="py-2 px-3 text-amber-400">$$</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Pro Tip: Start with Free Sources
                </p>
                <p className="text-sm text-muted-foreground">
                  SEC EDGAR, Yahoo Finance, and free Twitter API tiers are enough to build and 
                  validate a sentiment strategy. Scale up to premium feeds only after proving profitability.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Pre-Built Sentiment Data Vendors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For traders who don't want to build NLP pipelines, these vendors provide ready-to-use 
                sentiment scores:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400">RavenPack</h4>
                  <p className="text-sm text-muted-foreground">Industry leader. Institutional-grade. Expensive.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400">Quandl/Nasdaq</h4>
                  <p className="text-sm text-muted-foreground">Wide coverage. API-friendly. Mid-tier pricing.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400">StockTwits</h4>
                  <p className="text-sm text-muted-foreground">Retail sentiment. Free tier. Good for small caps.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400">Alpha Vantage</h4>
                  <p className="text-sm text-muted-foreground">Free tier available. News sentiment API.</p>
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
                <Zap className="w-5 h-5 text-amber-400" />
                Building a Sentiment Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 1: Data Ingestion</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-2">
                    <pre>{`# Python example - news ingestion
import feedparser
import requests

# RSS feeds for financial news
feeds = [
    "https://finance.yahoo.com/rss/",
    "https://feeds.bloomberg.com/markets/news.rss"
]

for feed_url in feeds:
    feed = feedparser.parse(feed_url)
    for entry in feed.entries:
        process_article(entry.title, entry.summary)`}</pre>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 2: Text Processing</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-2">
                    <pre>{`# Using spaCy for NLP
import spacy
nlp = spacy.load("en_core_web_sm")

def extract_entities(text):
    doc = nlp(text)
    return [(ent.text, ent.label_) 
            for ent in doc.ents 
            if ent.label_ in ["ORG", "MONEY", "PERCENT"]]`}</pre>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 3: Sentiment Scoring</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-2">
                    <pre>{`# Using FinBERT for financial sentiment
from transformers import pipeline

classifier = pipeline("sentiment-analysis", 
                      model="ProsusAI/finbert")

def get_sentiment(text):
    result = classifier(text)[0]
    # Returns: {'label': 'positive', 'score': 0.95}
    return result`}</pre>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Step 4: Signal Aggregation</h4>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm mb-2">
                    <pre>{`# Aggregate sentiment by ticker and time
def aggregate_sentiment(ticker, timeframe="1h"):
    articles = get_articles(ticker, timeframe)
    scores = [get_sentiment(a.text)['score'] 
              for a in articles]
    
    return {
        'ticker': ticker,
        'avg_sentiment': np.mean(scores),
        'article_count': len(scores),
        'signal_strength': np.mean(scores) * len(scores)
    }`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Implementation Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Using generic sentiment models",
                    fix: "Use finance-specific models like FinBERT that understand 'bearish', 'bullish'"
                  },
                  {
                    mistake: "Ignoring sarcasm and context",
                    fix: "Financial Twitter is full of sarcasm—train models on labeled financial text"
                  },
                  {
                    mistake: "Not handling duplicate news",
                    fix: "Same story from 10 sources ≠ 10x signal. Deduplicate by content hash"
                  },
                  {
                    mistake: "Trading on stale sentiment",
                    fix: "Sentiment decays fast. News > 1 hour old often already priced in"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-green-400 mt-1">✓ {item.fix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signal Generation Tab */}
        <TabsContent value="signals" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Live Sentiment Signal Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                {(['bullish', 'bearish', 'neutral'] as const).map(type => (
                  <Badge 
                    key={type}
                    variant={selectedExample === type ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setSelectedExample(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-2">Sample News:</p>
                <p className="font-medium">{example.text}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  example.score > 0.3 ? 'bg-green-500/10 border-green-500/30' :
                  example.score < -0.3 ? 'bg-red-500/10 border-red-500/30' :
                  'bg-muted/30'
                }`}>
                  <p className="text-sm text-muted-foreground">Sentiment Score</p>
                  <p className={`text-3xl font-bold ${
                    example.score > 0.3 ? 'text-green-400' :
                    example.score < -0.3 ? 'text-red-400' :
                    'text-muted-foreground'
                  }`}>
                    {example.score > 0 ? '+' : ''}{example.score.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Detected Signals:</p>
                  <div className="flex flex-wrap gap-1">
                    {example.signals.map((signal, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                example.score > 0.3 ? 'bg-green-500/10 border border-green-500/30' :
                example.score < -0.3 ? 'bg-red-500/10 border border-red-500/30' :
                'bg-muted/30 border'
              }`}>
                <p className="text-sm text-muted-foreground">Trading Action:</p>
                <p className="font-semibold flex items-center gap-2">
                  {example.score > 0.3 ? <TrendingUp className="w-4 h-4 text-green-400" /> :
                   example.score < -0.3 ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                   <Activity className="w-4 h-4 text-muted-foreground" />}
                  {example.action}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trading Strategies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Sentiment Trading Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">News Momentum</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Enter on strong positive sentiment (&gt;0.7)</li>
                    <li>• Hold for 1-3 days</li>
                    <li>• Exit on sentiment reversal or profit target</li>
                    <li>• Works best on earnings surprises</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 mb-2">Sentiment Mean Reversion</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Fade extreme sentiment readings</li>
                    <li>• Enter when sentiment &gt; +0.9 or &lt; -0.9</li>
                    <li>• Bet on overreaction reversal</li>
                    <li>• Higher risk, contrarian approach</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <h4 className="font-semibold text-purple-400 mb-2">Sentiment + Technical</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use sentiment as filter</li>
                    <li>• Only take long technical setups if sentiment positive</li>
                    <li>• Reduces false signals</li>
                    <li>• Best of both worlds</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-semibold text-amber-400 mb-2">Event-Driven</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Trade specific event types (FDA, earnings)</li>
                    <li>• Pre-position before announcements</li>
                    <li>• Exit immediately after event</li>
                    <li>• Requires fast execution</li>
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

export default SentimentAnalysisVisualizer;
