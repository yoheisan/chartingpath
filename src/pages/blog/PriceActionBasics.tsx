import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PriceActionBasics = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Price Action Trading: Reading Raw Market Dynamics</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Price Action</span>
            <span>•</span>
            <span>12 min read</span>
            <span>•</span>
            <span>Core Skills</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <TrendingUp className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Price action trading involves analyzing raw price movements without indicators. It's the purest form of technical analysis, 
              reading what the market is actually doing rather than what indicators say it's doing.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Why Price Action?</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>No Lag:</strong> Indicators are derived from price, creating lag. Price action is real-time.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Clean Charts:</strong> See market structure clearly without indicator clutter</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Universal:</strong> Works across all markets and timeframes</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground"><strong>Institutional Method:</strong> How professional traders actually trade</span>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Market Structure</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Understanding market structure is the foundation of price action trading. Markets move in swings creating higher highs/lows (uptrend) 
            or lower highs/lows (downtrend).
          </p>

          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Higher Highs and Higher Lows (HH/HL)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Uptrend:</strong> Each peak is higher than previous, each trough is higher than previous. 
                Indicates strong buying pressure and bullish control.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lower Highs and Lower Lows (LH/LL)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Downtrend:</strong> Each peak is lower than previous, each trough is lower than previous. 
                Indicates strong selling pressure and bearish control.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equal Highs and Lows</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <strong>Range/Consolidation:</strong> Price oscillates between defined boundaries. No clear trend. 
                Indicates indecision and equilibrium between buyers and sellers.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Price Action Concepts</h2>

          <h3 className="text-xl font-semibold mt-8 mb-4">1. Swing Points</h3>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Swing highs and lows are the peaks and troughs that define market structure. Draw horizontal lines at these points - 
            they often become future support/resistance.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-4">2. Break of Structure (BOS)</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
            <p className="text-muted-foreground">
              When price breaks a previous swing high (uptrend) or swing low (downtrend), it confirms trend continuation. 
              This validates the current trend and often provides entry opportunities on pullbacks.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">3. Change of Character (ChoCh)</h3>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground">
              When price fails to make new highs in uptrend or new lows in downtrend, it signals potential reversal. 
              For example, in uptrend, if price makes lower high instead of higher high, trend may be reversing.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Support and Resistance in Price Action</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            In price action trading, S/R levels are identified purely from price behavior, not indicators:
          </p>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-2 text-muted-foreground">
              <li>• Previous swing highs become resistance</li>
              <li>• Previous swing lows become support</li>
              <li>• Areas where price rejected multiple times</li>
              <li>• Round psychological numbers ($100, $50, etc.)</li>
              <li>• Previous breakout/breakdown levels</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Price Action Trading Strategy</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li><strong className="text-foreground">Identify Trend:</strong> Determine if market is trending or ranging based on swing structure</li>
              <li><strong className="text-foreground">Mark Key Levels:</strong> Draw S/R at swing points and previous reaction levels</li>
              <li><strong className="text-foreground">Wait for Pullback:</strong> In trends, wait for price to pullback to key level</li>
              <li><strong className="text-foreground">Look for Rejection:</strong> Watch for bullish/bearish candle patterns at levels</li>
              <li><strong className="text-foreground">Enter on Confirmation:</strong> Enter when price confirms rejection with momentum candle</li>
              <li><strong className="text-foreground">Set Stop Loss:</strong> Place stop beyond structure (swing point or S/R level)</li>
              <li><strong className="text-foreground">Target Next Structure:</strong> Target next swing point or major S/R level</li>
            </ol>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Reading Candlestick Momentum</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Strong Bullish Candles:</strong> Large green bodies, small wicks, close near high. Shows aggressive buying.
            </p>
            <p className="text-muted-foreground mb-3">
              <strong className="text-foreground">Strong Bearish Candles:</strong> Large red bodies, small wicks, close near low. Shows aggressive selling.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Indecision Candles:</strong> Small bodies, long wicks both sides (doji, spinning tops). Shows uncertainty.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Mistakes</h2>
          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Trading against clear market structure</li>
                <li>• Ignoring higher timeframe structure</li>
                <li>• Entering without confirmation from price action</li>
                <li>• Not respecting key support and resistance levels</li>
                <li>• Overcomplicating - price action should be simple</li>
                <li>• Not practicing pattern recognition on historical charts</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-12">
            <li>Price action is reading raw price without indicators</li>
            <li>Market structure (HH/HL or LH/LL) defines trend direction</li>
            <li>Swing points become future support and resistance</li>
            <li>Break of structure confirms trend, change of character signals reversal</li>
            <li>Trade with structure, not against it</li>
            <li>Combine multiple timeframes for best results</li>
          </ol>
        </article>
      </div>
    </div>
  );
};

export default PriceActionBasics;
