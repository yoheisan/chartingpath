import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const RiskCalculator = () => {
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercentage, setRiskPercentage] = useState("");
  const [stopLossPips, setStopLossPips] = useState("");
  const [currencyPair, setCurrencyPair] = useState("");
  const [accountCurrency, setAccountCurrency] = useState("");
  const [results, setResults] = useState<{
    positionSize: number;
    riskAmount: number;
    pipValue: number;
  } | null>(null);

  const currencyPairs = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
    "EUR/GBP", "EUR/JPY", "GBP/JPY", "CHF/JPY", "AUD/JPY", "CAD/JPY", "NZD/JPY"
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

  const calculateRisk = () => {
    if (!accountBalance || !riskPercentage || !stopLossPips || !currencyPair || !accountCurrency) return;

    const balance = parseFloat(accountBalance);
    const riskPercent = parseFloat(riskPercentage);
    const slPips = parseFloat(stopLossPips);
    
    const riskAmount = balance * (riskPercent / 100);
    
    // Simplified pip value calculation (in reality, would use real-time rates)
    const isJpyPair = currencyPair.includes("JPY");
    let pipValue = isJpyPair ? 0.91 : 9.10; // Approximate values for demo
    
    const positionSize = riskAmount / (slPips * pipValue);
    
    setResults({
      positionSize: Math.round(positionSize * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      pipValue: pipValue
    });
    
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'calc_risk_submit', {
        event_category: 'Tools',
        event_label: currencyPair,
        value: riskAmount
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Risk Management Calculator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculate your optimal position size based on your risk tolerance and stop loss. Never risk more than you can afford to lose.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Parameters</CardTitle>
              <CardDescription>
                Enter your trading parameters to calculate optimal position size
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-balance">Account Balance</Label>
                <Input
                  id="account-balance"
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk-percentage">Risk % per Trade</Label>
                <Input
                  id="risk-percentage"
                  type="number"
                  step="0.1"
                  max="10"
                  placeholder="2.0"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Recommended: 1-3% per trade</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stop-loss">Stop Loss (pips)</Label>
                <Input
                  id="stop-loss"
                  type="number"
                  step="1"
                  placeholder="50"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency-pair">Currency Pair</Label>
                <Select value={currencyPair} onValueChange={setCurrencyPair}>
                  <SelectTrigger id="currency-pair">
                    <SelectValue placeholder="Select currency pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyPairs.map((pair) => (
                      <SelectItem key={pair} value={pair}>
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-currency">Account Currency</Label>
                <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                  <SelectTrigger id="account-currency">
                    <SelectValue placeholder="Select account currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={calculateRisk}
                className="w-full"
                disabled={!accountBalance || !riskPercentage || !stopLossPips || !currencyPair || !accountCurrency}
              >
                Calculate Risk
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>
                Your calculated position size and risk exposure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Recommended Position Size:</div>
                      <div className="text-2xl font-bold text-primary">
                        {results.positionSize} lots
                      </div>
                    </div>

                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="text-sm text-muted-foreground mb-1">Estimated Risk:</div>
                      <div className="text-2xl font-bold text-destructive">
                        ${results.riskAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Balance:</span>
                      <span className="text-foreground">${parseFloat(accountBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Percentage:</span>
                      <span className="text-foreground">{riskPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="text-foreground">{stopLossPips} pips</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency Pair:</span>
                      <span className="text-foreground">{currencyPair}</span>
                    </div>
                  </div>

                  {parseFloat(riskPercentage) > 5 && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-destructive">High Risk Warning</div>
                        <div className="text-muted-foreground">Risking more than 5% per trade is not recommended for long-term success.</div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your risk parameters to see the position size calculation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Educational Content */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Risk Management Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">1-3% Rule</h4>
                <p className="text-sm text-muted-foreground">
                  Never risk more than 1-3% of your account on a single trade. This ensures long-term survival.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Position Sizing</h4>
                <p className="text-sm text-muted-foreground">
                  Calculate your position size based on your stop loss distance, not your desired profit.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Consistency</h4>
                <p className="text-sm text-muted-foreground">
                  Use the same risk percentage for every trade to maintain consistent risk exposure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> All results are estimates. Educational use only. Not financial advice. Past performance does not guarantee future results. 
            Always conduct your own research and consider your risk tolerance before trading.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskCalculator;