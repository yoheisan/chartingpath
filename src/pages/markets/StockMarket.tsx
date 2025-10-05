import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Building2, BarChart3, Users, Clock, Globe } from "lucide-react";

const StockMarket = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Stock Market Trading
          </h1>
          <p className="text-xl text-muted-foreground">
            The world's largest and most popular financial market for trading company shares
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                What is the Stock Market?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The stock market is where investors buy and sell shares of publicly traded companies. When you own a stock, you own a piece of that company and can benefit from its growth and profitability.
              </p>
              <p>
                Major stock exchanges include the New York Stock Exchange (NYSE), NASDAQ, London Stock Exchange (LSE), and Tokyo Stock Exchange (TSE).
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
                    <span><strong>Market Size:</strong> Over $100 trillion global market capitalization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Trading Hours:</strong> Typically 9:30 AM - 4:00 PM local time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Participants:</strong> Individual investors, institutions, hedge funds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-1 text-primary" />
                    <span><strong>Accessibility:</strong> Global access through brokers</span>
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
                  <li><strong>Day Trading:</strong> Buying and selling within the same day</li>
                  <li><strong>Swing Trading:</strong> Holding positions for days or weeks</li>
                  <li><strong>Value Investing:</strong> Long-term investment in undervalued companies</li>
                  <li><strong>Growth Investing:</strong> Investing in high-growth potential companies</li>
                  <li><strong>Dividend Investing:</strong> Focus on stocks with regular dividend payments</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Major Stock Indices</CardTitle>
              <CardDescription>Track the overall market performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">S&P 500</h4>
                  <p className="text-sm text-muted-foreground">500 largest US companies</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Dow Jones</h4>
                  <p className="text-sm text-muted-foreground">30 major US industrial companies</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">NASDAQ Composite</h4>
                  <p className="text-sm text-muted-foreground">Tech-heavy US index</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Choose a reputable broker with low fees and good platform</li>
                <li>Learn fundamental analysis (company financials, earnings reports)</li>
                <li>Study technical analysis and chart patterns</li>
                <li>Start with a demo account or paper trading</li>
                <li>Begin with established companies (blue-chip stocks)</li>
                <li>Diversify your portfolio across sectors</li>
                <li>Set clear entry and exit strategies</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StockMarket;
