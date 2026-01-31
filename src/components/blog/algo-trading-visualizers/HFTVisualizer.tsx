/**
 * HFTVisualizer - High-Frequency Trading Education
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, AlertTriangle, CheckCircle, XCircle, BookOpen, Lightbulb, Server, Clock, Activity
} from 'lucide-react';

export const HFTVisualizer = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">High-Frequency Trading</h2>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Institutional Only</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          High-Frequency Trading (HFT) operates at microsecond speeds, exploiting tiny price 
          inefficiencies millions of times per day. While retail traders can't compete directly, 
          understanding HFT helps you avoid being the counterparty to these strategies.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="retail">For Retail Traders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is HFT?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  HFT = <span className="text-primary font-semibold">Speed + Volume + Tiny Edges = Profits</span>
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Microsecond Execution</h4>
                  <p className="text-sm text-muted-foreground">Trades in 1-10 microseconds</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Millions of Trades</h4>
                  <p className="text-sm text-muted-foreground">Thousands of trades per second</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <h4 className="font-semibold">Tiny Profit per Trade</h4>
                  <p className="text-sm text-muted-foreground">Fractions of a penny × volume</p>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Barrier to Entry
                </p>
                <p className="text-sm text-muted-foreground">
                  HFT requires $10M+ in infrastructure, co-location at exchanges, specialized 
                  hardware (FPGAs), and teams of engineers. It is not accessible to retail traders.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Common HFT Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { name: "Market Making", desc: "Provide liquidity by quoting both bid and ask, earning the spread", edge: "Inventory management, adverse selection avoidance" },
                  { name: "Latency Arbitrage", desc: "Exploit price differences across exchanges before they equalize", edge: "Fastest connection wins" },
                  { name: "Statistical Arbitrage", desc: "Trade correlated instruments when spreads diverge temporarily", edge: "Speed + accurate pricing models" },
                  { name: "News Trading", desc: "Parse and trade on news releases in milliseconds", edge: "NLP + direct news feeds" }
                ].map((strategy, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <h4 className="font-semibold text-primary">{strategy.name}</h4>
                    <p className="text-sm text-muted-foreground">{strategy.desc}</p>
                    <p className="text-xs text-primary mt-2">Edge: {strategy.edge}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                HFT Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400">Co-Location</h4>
                  <p className="text-sm text-muted-foreground">Servers placed directly in exchange data centers. Every meter of cable = nanoseconds of latency.</p>
                  <p className="text-xs text-muted-foreground mt-2">Cost: $10K-50K/month per exchange</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400">FPGA/ASIC</h4>
                  <p className="text-sm text-muted-foreground">Custom hardware that processes market data 10-100x faster than software.</p>
                  <p className="text-xs text-muted-foreground mt-2">Cost: $500K-2M to develop</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400">Direct Feeds</h4>
                  <p className="text-sm text-muted-foreground">Raw exchange data feeds, bypassing consolidated tape delays.</p>
                  <p className="text-xs text-muted-foreground mt-2">Cost: $5K-50K/month per feed</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400">Low-Latency Networks</h4>
                  <p className="text-sm text-muted-foreground">Microwave towers, hollow fiber, shortest path routing.</p>
                  <p className="text-xs text-muted-foreground mt-2">Cost: $1M+ to build</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retail" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                What Retail Traders Should Know
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Don't Compete
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You can't beat HFT on speed</li>
                    <li>• Scalping strategies are eaten by spread</li>
                    <li>• Very short-term predictions are hopeless</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Your Edge
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Trade on longer timeframes (days+)</li>
                    <li>• Use limit orders, not market orders</li>
                    <li>• Focus on small caps HFT ignores</li>
                    <li>• Exploit your patience as an edge</li>
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

export default HFTVisualizer;
