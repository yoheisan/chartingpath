import { Link } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, Target, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Risk Management Fundamentals for Traders</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Risk Management</span>
            <span>•</span>
            <span>10 min read</span>
            <span>•</span>
            <span>Essential Skills</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Shield className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Risk management is the difference between long-term success and failure in trading. 
              Master these principles to protect your capital and survive in the markets.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">The 1% Rule</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Never risk more than 1-2% of your trading capital on a single trade. This ensures that even a string of losses won't devastate your account.
          </p>

          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">Example:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Account Size: $10,000</li>
              <li>• Maximum Risk per Trade: $100 (1%)</li>
              <li>• With this rule, you can survive 100 consecutive losses</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Position Sizing</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Calculate your position size based on your risk tolerance and stop loss distance: Position Size = (Account Risk) / (Stop Loss Distance in dollars)
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Risk-Reward Ratio</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Always aim for at least a 2:1 reward-to-risk ratio. This means if you risk $100, you should target at least $200 profit.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Stop Loss Strategies</h2>
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Stop</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Place stop beyond key support/resistance, chart patterns, or swing points.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Percentage Stop</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Set stop at fixed percentage from entry (e.g., 2-5% for stocks, 1-2% for forex).
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ATR-Based Stop</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Use Average True Range indicator to set stops based on market volatility.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Diversification</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Don't put all your capital into one asset or market. Spread risk across different instruments, sectors, and strategies.
          </p>

          <Alert className="mb-8 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <ul className="space-y-2 mt-2">
                <li>• Never risk more than 1-2% per trade</li>
                <li>• Always use stop losses - no exceptions</li>
                <li>• Target minimum 2:1 risk-reward ratios</li>
                <li>• Keep trading journal to track performance</li>
              </ul>
            </AlertDescription>
          </Alert>
        </article>
      </div>
    </div>
  );
};

export default RiskManagement;
