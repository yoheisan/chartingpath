import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Globe, Clock, BarChart3, Users } from "lucide-react";

const ForexMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Forex (Foreign Exchange) Market
          </h1>
          <p className="text-xl text-muted-foreground">
            The world's largest and most liquid financial market, trading $7.5 trillion daily
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                What is Forex Trading?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Forex trading involves buying and selling currencies in pairs (e.g., EUR/USD). When you trade forex, you're simultaneously buying one currency and selling another, profiting from changes in exchange rates.
              </p>
              <p>
                The forex market is decentralized and operates 24 hours a day, 5 days a week, making it accessible to traders worldwide at any time.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Daily Volume:</strong> $7.5 trillion traded daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Trading Hours:</strong> 24 hours, 5 days a week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Leverage:</strong> High leverage available (up to 1:500)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Liquidity:</strong> Extremely high, instant execution</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Popular Trading Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li><strong>Scalping:</strong> Very short-term trades (seconds to minutes)</li>
                  <li><strong>Day Trading:</strong> Opening and closing within same day</li>
                  <li><strong>Swing Trading:</strong> Holding for days to weeks</li>
                  <li><strong>Position Trading:</strong> Long-term trend following</li>
                  <li><strong>Carry Trade:</strong> Profiting from interest rate differentials</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Major Currency Pairs</CardTitle>
              <CardDescription>Most traded forex pairs worldwide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">EUR/USD</h4>
                  <p className="text-sm text-muted-foreground">Euro vs US Dollar - Most liquid</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">GBP/USD</h4>
                  <p className="text-sm text-muted-foreground">British Pound vs US Dollar</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">USD/JPY</h4>
                  <p className="text-sm text-muted-foreground">US Dollar vs Japanese Yen</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">USD/CHF</h4>
                  <p className="text-sm text-muted-foreground">US Dollar vs Swiss Franc</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">AUD/USD</h4>
                  <p className="text-sm text-muted-foreground">Australian Dollar vs US Dollar</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">USD/CAD</h4>
                  <p className="text-sm text-muted-foreground">US Dollar vs Canadian Dollar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Forex</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Choose a regulated forex broker with competitive spreads</li>
                <li>Understand pip values, lot sizes, and leverage</li>
                <li>Learn fundamental analysis (economic indicators, news events)</li>
                <li>Master technical analysis and chart patterns</li>
                <li>Practice with a demo account first</li>
                <li>Start small with major currency pairs</li>
                <li>Use proper risk management (never risk more than 1-2% per trade)</li>
                <li>Keep a trading journal to track performance</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ForexMarket;
