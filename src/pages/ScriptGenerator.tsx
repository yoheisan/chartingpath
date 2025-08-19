import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Rocket, ArrowLeft, Sparkles, Code, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ScriptGenerator = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lead_captured', {
        event_category: 'Waitlist',
        event_label: 'script_generator'
      });
    }

    setIsSubmitted(true);
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
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Automated Script Generator
            </h1>
            <div className="px-3 py-1 bg-accent/20 text-accent text-sm font-semibold rounded-full">
              Coming Soon 🚀
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soon you'll select candlestick patterns, entry/exit rules, and risk settings — and instantly generate scripts in Pine, Python, or MQL.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Preview Form (Disabled) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Script Configuration
              </CardTitle>
              <CardDescription>
                Preview of the upcoming script generator interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 opacity-60">
              <div className="space-y-2">
                <Label>Pattern(s)</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patterns..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hammer">Hammer</SelectItem>
                    <SelectItem value="engulfing">Engulfing</SelectItem>
                    <SelectItem value="doji">Doji</SelectItem>
                    <SelectItem value="ema-cross">EMA Cross</SelectItem>
                    <SelectItem value="rsi-divergence">RSI Divergence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entry Rule</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entry rule..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakout">Breakout</SelectItem>
                    <SelectItem value="pullback">Pullback</SelectItem>
                    <SelectItem value="reversal">Reversal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exit Rule</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exit rule..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tp-sl">TP/SL</SelectItem>
                    <SelectItem value="trailing-stop">Trailing Stop</SelectItem>
                    <SelectItem value="opposite-signal">Opposite Signal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="risk-percent">Risk %</Label>
                  <Input id="risk-percent" placeholder="2.0" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stop-loss">Stop Loss</Label>
                  <Input id="stop-loss" placeholder="50 pips" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="take-profit">Take Profit (R:R)</Label>
                  <Input id="take-profit" placeholder="2:1" disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output Format</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="pine" disabled />
                    <Label htmlFor="pine" className="text-sm">Pine Script</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="python" disabled />
                    <Label htmlFor="python" className="text-sm">Python</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="mql5" disabled />
                    <Label htmlFor="mql5" className="text-sm">MQL5</Label>
                  </div>
                </div>
              </div>

              <Button disabled className="w-full">
                <Code className="h-4 w-4 mr-2" />
                Generate Script
              </Button>
            </CardContent>
          </Card>

          {/* Waitlist Signup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Join the Waitlist
              </CardTitle>
              <CardDescription>
                Be the first to try the automated script generator when it launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSubmitted ? (
                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={!email}>
                      Join Waitlist for Early Access
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <h4 className="font-semibold text-foreground mb-2">What You'll Get:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• First access to the script generator</li>
                        <li>• Free credits to test the platform</li>
                        <li>• Exclusive early-bird pricing</li>
                        <li>• Priority support and feedback channel</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                      <h4 className="font-semibold text-foreground mb-2">Expected Features:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Visual pattern selection interface</li>
                        <li>• Multi-language script output</li>
                        <li>• Backtesting integration</li>
                        <li>• Risk management automation</li>
                        <li>• Custom indicator combinations</li>
                      </ul>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">You're on the list!</h3>
                  <p className="text-muted-foreground">
                    We'll notify you as soon as the script generator is ready. Keep an eye on your inbox!
                  </p>
                  <Button variant="outline" asChild className="mt-4">
                    <Link to="/">Return to Home</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technology Preview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Technology Preview</CardTitle>
            <CardDescription>
              A glimpse into the advanced automation coming to ChartingPath
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Multi-Platform Output</h4>
                <p className="text-sm text-muted-foreground">
                  Generate scripts for TradingView Pine Script, Python (for MT4/MT5), and MQL5 from a single configuration.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent/10 w-12 h-12 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">AI-Powered Logic</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms analyze pattern combinations and generate optimized entry/exit logic based on historical performance.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/10 w-12 h-12 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">Instant Deployment</h4>
                <p className="text-sm text-muted-foreground">
                  One-click deployment to your trading platform with automated backtesting and performance validation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> Under development. Educational purposes only. Not financial advice. Past performance does not guarantee future results.
            Generated scripts should be thoroughly tested before live trading.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;