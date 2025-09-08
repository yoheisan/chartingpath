import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import { PatternLibrary } from "@/components/PatternLibrary";
import { PatternQuiz } from "@/components/PatternQuiz";
import { TradingStrategies } from "@/components/TradingStrategies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bot, CheckCircle, ArrowRight, BarChart3, Shield, Calculator, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-trading-space.jpg';

const Index = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "library" | "strategies" | "quiz">("generator");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { t } = useTranslation();
  
  // Detect user language on first visit
  useEffect(() => {
    const detectAndSetLanguage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('detect-user-language');
        if (data && data.language) {
          console.log('Detected language:', data.language);
        }
      } catch (error) {
        console.error('Language detection error:', error);
      }
    };
    
    detectAndSetLanguage();
  }, []);

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
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            filter: 'brightness(0.4)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-5xl text-center px-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <img 
                src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                alt="ChartingPath Logo" 
                className="h-8 w-8 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-4xl font-bold text-white">
              ChartingPath
            </h1>
          </div>
          
          {/* Main Headline */}
          <div className="mb-8">
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-tight">
              Plan first<span className="text-primary">/</span><br />
              Then commit<span className="text-primary">.</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle', 'The best trades require research, then commitment.')}
            </p>
          </div>
          
          {/* CTA Button */}
          <div className="mb-12">
            <Button 
              size="lg" 
              onClick={handleEmailOptIn} 
              className="px-12 py-6 text-lg font-semibold bg-white text-background hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {t('hero.cta', 'Get started for free')}
            </Button>
            <p className="text-white/70 text-sm mt-4">
              {t('hero.free_text', '$0 forever, no credit card needed')}
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{t('features.no_coding', 'No coding required')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{t('features.plug_play', 'Plug & play scripts')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{t('features.risk_management', 'Risk management built-in')}</span>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2"></div>
          </div>
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
          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms and Conditions
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/admin/login" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
