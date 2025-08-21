import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import { PatternLibrary } from "@/components/PatternLibrary";
import { PatternQuiz } from "@/components/PatternQuiz";
import { TradingStrategies } from "@/components/TradingStrategies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, BookOpen, Brain, Calculator, Shield, Users, Bot, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthButton from "@/components/AuthButton";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "library" | "strategies" | "quiz">("generator");
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleEmailOptIn = () => {
    setShowEmailModal(true);
    // Track analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lead_captured', {
        event_category: 'engagement',
        event_label: 'homepage_hero'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
                <img 
                  src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                  alt="ChartingPath Logo" 
                  className="h-6 w-6 object-contain brightness-0 invert"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChartingPath
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/tools/pip-calculator" className="text-muted-foreground hover:text-foreground transition-colors">
                Calculators
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/members/community" className="text-muted-foreground hover:text-foreground transition-colors">
                Community
              </Link>
              <AuthButton />
            </nav>

            <div className="md:hidden">
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <img 
                src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                alt="ChartingPath Logo" 
                className="h-8 w-8 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChartingPath
            </h1>
          </div>
          
          <h2 className="text-6xl font-bold mb-6 leading-tight">
            Turn Charts Into Trading Scripts — 
            <span className="text-primary">Without the Guesswork</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Learn candlestick chart reading, access ready-to-use automated trading scripts, and master risk management — all in one platform.
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-12">
            <Button size="lg" onClick={handleEmailOptIn} className="px-8 py-4 text-lg">
              Get Free Starter Scripts
            </Button>
            <Button variant="outline" size="lg" asChild className="px-8 py-4 text-lg">
              <Link to="/tools/pip-calculator">Try the Pip Calculator</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>No coding required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Plug & play scripts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Risk management built-in</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">📊 Master the Charts</h3>
              <p className="text-muted-foreground">
                Beginner-friendly education to decode candlestick patterns and understand market movements with confidence.
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">🤖 Automate Trading</h3>
              <p className="text-muted-foreground">
                Access a library of plug-and-play Pine, Python, and MQL scripts that implement proven trading strategies.
              </p>
            </Card>
            
            <Card className="p-8 text-center">
              <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">🛡️ Control Your Risk</h3>
              <p className="text-muted-foreground">
                Built-in calculators for pip values and position sizing to protect your capital and optimize returns.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Tools</h2>
            <p className="text-xl text-muted-foreground">Start with our free calculators and educational resources</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center gap-4">
                  <Calculator className="h-10 w-10 text-primary" />
                  <CardTitle className="text-2xl">Pip Calculator</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground mb-6">
                  Calculate pip values for any currency pair and lot size. Essential for proper position sizing and risk management.
                </p>
                <Button asChild className="w-full">
                  <Link to="/tools/pip-calculator">Try Now</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="p-8">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center gap-4">
                  <Shield className="h-10 w-10 text-primary" />
                  <CardTitle className="text-2xl">Risk Management Calculator</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground mb-6">
                  Determine optimal position sizes based on your risk tolerance and stop loss levels.
                </p>
                <Button asChild className="w-full">
                  <Link to="/tools/risk-calculator">Calculate Risk</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <Users className="h-16 w-16 text-primary mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-6">Join a Global Trading Community</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Learn together, share strategies, and get support in our free and premium Discord channels.
          </p>
          <Button size="lg" asChild className="px-8 py-4 text-lg">
            <a href="https://discord.gg/chartingpath" target="_blank" rel="noopener noreferrer">
              Join the Community
            </a>
          </Button>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Start free with our tools, upgrade when you're ready to go pro.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 relative">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold text-primary">$29<span className="text-lg text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Script Library (20+ strategies)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Basic Pip & Risk Calculators</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Monthly tutorials</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-8 relative border-primary scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">Most Popular</Badge>
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-primary">$79<span className="text-lg text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Everything in Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Chart Pattern Email Alerts (3 alerts)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Advanced Script Library</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Video Course: Zero to First Bot</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Pro Calculators (CSV export)</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-8 relative">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl">Elite</CardTitle>
                <div className="text-4xl font-bold text-primary">$199<span className="text-lg text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Everything in Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Unlimited Chart Pattern Alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Lifetime access option</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Premium Discord role</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Script Generator early access</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Button size="lg" asChild className="px-8 py-4 text-lg">
            <Link to="/pricing">View Pricing <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Educational Content Tabs */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Learn & Practice</h2>
            <p className="text-xl text-muted-foreground">Master chart patterns with our interactive tools</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <Card className="p-2 inline-flex">
              <Button
                variant={activeTab === "generator" ? "default" : "ghost"}
                onClick={() => setActiveTab("generator")}
                className="px-6"
              >
                Pattern Generator
              </Button>
              <Button
                variant={activeTab === "library" ? "default" : "ghost"}
                onClick={() => setActiveTab("library")}
                className="px-6"
              >
                Pattern Library
              </Button>
              <Button
                variant={activeTab === "strategies" ? "default" : "ghost"}
                onClick={() => setActiveTab("strategies")}
                className="px-6"
              >
                Trading Strategies
              </Button>
              <Button
                variant={activeTab === "quiz" ? "default" : "ghost"}
                onClick={() => setActiveTab("quiz")}
                className="px-6"
              >
                Pattern Quiz
              </Button>
            </Card>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {activeTab === "generator" && <ChartPatternGenerator />}
            {activeTab === "library" && <PatternLibrary />}
            {activeTab === "strategies" && <TradingStrategies />}
            {activeTab === "quiz" && <PatternQuiz />}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to automate your trading strategies?</h2>
          <p className="text-xl mb-8 opacity-90">Get started today with our free starter pack.</p>
          <Button size="lg" variant="secondary" onClick={handleEmailOptIn} className="px-8 py-4 text-lg">
            Get Free Starter Scripts
          </Button>
        </div>
      </section>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Get Your Free Starter Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Enter your email to receive our free starter pack with 3 ready-to-use trading scripts.
              </p>
              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={() => setShowEmailModal(false)} className="flex-1">
                    Send Scripts
                  </Button>
                  <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer Disclaimer */}
      <footer className="py-8 px-6 bg-background border-t">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            Educational purposes only. Not financial advice. Past performance does not guarantee future results.
          </p>
          <div className="mt-2">
            <Link to="/admin/login" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
