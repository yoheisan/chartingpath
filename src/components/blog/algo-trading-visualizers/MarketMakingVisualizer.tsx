/**
 * MarketMakingVisualizer - Market Making Education
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Layers, AlertTriangle, CheckCircle, BookOpen, Lightbulb, BarChart3, Activity, Scale
} from 'lucide-react';

export const MarketMakingVisualizer = () => {
  const [bid, setBid] = useState(99.95);
  const [ask, setAsk] = useState(100.05);
  const [tradesPerDay, setTradesPerDay] = useState(1000);

  const profit = useMemo(() => {
    const spread = ask - bid;
    const dailyProfit = (spread / 2) * tradesPerDay; // Approximate, assuming balanced flow
    return { spread, dailyProfit };
  }, [bid, ask, tradesPerDay]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Market Making Strategies</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Liquidity Provision</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Market makers provide liquidity by continuously quoting bid and ask prices. They profit 
          from the bid-ask spread while managing inventory risk. Understanding market making helps 
          traders understand market microstructure and execution costs.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="calculator">Spread Profit</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                How Market Making Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  Market Maker = <span className="text-primary font-semibold">Always Willing to Buy AND Sell</span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400">Bid (Buy) Quote</h4>
                  <p className="text-sm text-muted-foreground">Price at which MM is willing to buy from you</p>
                  <p className="text-2xl font-bold text-green-400 mt-2">$99.95</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400">Ask (Sell) Quote</h4>
                  <p className="text-sm text-muted-foreground">Price at which MM is willing to sell to you</p>
                  <p className="text-2xl font-bold text-red-400 mt-2">$100.05</p>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold mb-2">The Spread = $0.10</p>
                <p className="text-sm text-muted-foreground">
                  If MM buys at $99.95 and sells at $100.05 immediately, they profit $0.10. 
                  Do this thousands of times per day with minimal inventory risk = profits.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Market Making Profit Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Bid Price: ${bid.toFixed(2)}</Label>
                    <Slider
                      value={[bid]}
                      onValueChange={(v) => setBid(Math.min(v[0], ask - 0.01))}
                      min={99}
                      max={100}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Ask Price: ${ask.toFixed(2)}</Label>
                    <Slider
                      value={[ask]}
                      onValueChange={(v) => setAsk(Math.max(v[0], bid + 0.01))}
                      min={100}
                      max={101}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Trades per Day: {tradesPerDay}</Label>
                    <Slider
                      value={[tradesPerDay]}
                      onValueChange={(v) => setTradesPerDay(v[0])}
                      min={100}
                      max={10000}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground">Bid-Ask Spread</p>
                    <p className="text-2xl font-bold text-blue-400">${profit.spread.toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-muted-foreground">Estimated Daily Profit</p>
                    <p className="text-2xl font-bold text-green-400">${profit.dailyProfit.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Assuming balanced buy/sell flow</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Market Making Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Inventory Risk", desc: "Holding unwanted inventory when prices move against you", mitigation: "Skew quotes, hedge with futures" },
                { name: "Adverse Selection", desc: "Trading against informed traders who know more than you", mitigation: "Widen spreads on unusual activity" },
                { name: "Market Risk", desc: "Sudden price moves (news, crashes) before you can adjust", mitigation: "Automated quote pulling, position limits" },
                { name: "Technology Risk", desc: "System failures in a speed-critical environment", mitigation: "Redundancy, kill switches, monitoring" }
              ].map((risk, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400">{risk.name}</h4>
                  <p className="text-sm text-muted-foreground">{risk.desc}</p>
                  <p className="text-xs text-green-400 mt-2">Mitigation: {risk.mitigation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Quote Management Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400">Symmetric Quoting</h4>
                  <p className="text-sm text-muted-foreground">Quote same size on both sides. Simple but accumulates inventory.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400">Inventory Skewing</h4>
                  <p className="text-sm text-muted-foreground">Skew quotes to reduce inventory. Long inventory? Lower ask to sell more.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400">Volatility Adjustment</h4>
                  <p className="text-sm text-muted-foreground">Widen spreads when volatility increases to compensate for risk.</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400">Flow Toxicity Detection</h4>
                  <p className="text-sm text-muted-foreground">Detect informed flow and pull quotes before getting picked off.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketMakingVisualizer;
