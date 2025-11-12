import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import { PatternLibrary } from "@/components/PatternLibrary";
import { PatternQuiz } from "@/components/PatternQuiz";
import { TradingStrategies } from "@/components/TradingStrategies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bot, CheckCircle, ArrowRight, BarChart3, Shield, Calculator, Globe, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/hero-trading-space.jpg';
import { useMarketReport } from '@/contexts/MarketReportContext';

const Index = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "library" | "strategies" | "quiz">("generator");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { prefetchReport } = useMarketReport();
  const navigate = useNavigate();
  
  // Check authentication status and detect user language
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
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
    
    checkAuth();
    detectAndSetLanguage();
    
    // Pre-fetch market report in background
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    prefetchReport(timezone);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetScripts = () => {
    if (!isAuthenticated) {
      // Redirect to auth page if not logged in
      navigate('/auth');
    } else {
      // Redirect to member scripts page if logged in
      navigate('/members/scripts');
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--accent)) 0%, transparent 50%), radial-gradient(circle at 40% 20%, hsl(var(--primary-glow)) 0%, transparent 50%)',
              animation: 'pulse 8s ease-in-out infinite'
            }}
          />
        </div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            animation: 'grid-flow 20s linear infinite'
          }}
        />
        
        {/* Floating Geometric Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-primary/20 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-accent/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 border border-primary-glow/20 rotate-45 animate-float" style={{ animationDelay: '4s' }} />
          
          {/* Data Grid Lines */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-pulse" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '1s' }} />
            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '2s' }} />
          </svg>
        </div>
        
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 backdrop-blur-[1px]" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-5xl text-center px-6">
          {/* Logo with Glow Effect */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="relative p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
              <img 
                src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                alt="ChartingPath Logo" 
                className="relative h-8 w-8 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              ChartingPath
            </h1>
          </div>
          
          {/* Main Headline with Gradient Text */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Map the trade
              </span>
              <span className="text-primary animate-pulse">.</span>
              <br />
              <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                Make the trade
              </span>
              <span className="text-accent animate-pulse" style={{ animationDelay: '0.5s' }}>.</span>
            </h2>
            <div className="relative inline-block">
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('hero.subtitle', 'The best trades require research, then commitment.')}
              </p>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
          </div>
          
          {/* CTA Button with Advanced Effects */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
              <Button 
                size="lg" 
                asChild
                className="relative px-12 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Link to="/pricing">{t('hero.cta', 'Get started for free')}</Link>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              {t('hero.free_text', '$0 forever, no credit card needed')}
            </p>
          </div>

          {/* Features with Glassmorphism */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 backdrop-blur-md border border-border/50 hover:bg-card/60 transition-all">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{t('features.no_coding', 'No coding required')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 backdrop-blur-md border border-border/50 hover:bg-card/60 transition-all">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{t('features.plug_play', 'Plug & play scripts')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 backdrop-blur-md border border-border/50 hover:bg-card/60 transition-all">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{t('features.risk_management', 'Risk management built-in')}</span>
            </div>
          </div>
        </div>
        
        {/* Futuristic Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="relative">
            <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center backdrop-blur-sm bg-card/20">
              <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
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




      {/* Market Breadth Report Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">AI-Powered Analysis</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Daily Market Breadth Report
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get comprehensive AI-powered market analysis delivered to your inbox. Stay informed about what happened across stocks, forex, crypto, and commodities—all in one report.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Multi-Market Coverage</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze stocks, forex, cryptocurrencies, and commodities in one comprehensive report
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI summarizes complex market movements into actionable insights
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Customizable Delivery</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose your timezone, preferred markets, and delivery schedule
                    </p>
                  </div>
                </div>
              </div>

              <Button size="lg" asChild className="px-8">
                <Link to="/tools/market-breadth">
                  View Sample Report <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <Card className="p-8 shadow-elegant">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Today's Market Snapshot</h4>
                    <p className="text-sm text-muted-foreground">Updated daily across all markets</p>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Stock Market</span>
                    <Badge variant="secondary">Covered</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Forex Market</span>
                    <Badge variant="secondary">Covered</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cryptocurrency</span>
                    <Badge variant="secondary">Covered</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commodities</span>
                    <Badge variant="secondary">Covered</Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    ✨ Free to use • 📧 Email delivery available
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA - Only show to non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-20 px-6 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to automate your trading strategies?</h2>
            <p className="text-xl mb-8 opacity-90">Get started today with our free starter pack.</p>
            <Button size="lg" variant="secondary" onClick={handleGetScripts} className="px-8 py-4 text-lg">
              Get Free Starter Scripts
            </Button>
          </div>
        </section>
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
