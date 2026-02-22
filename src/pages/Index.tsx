import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, ArrowRight, TrendingUp, Bell, Shield, Activity,
  Search, FlaskConical, Code, BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import ActionCard from '@/components/landing/ActionCard';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingTeaser from '@/components/landing/PricingTeaser';
import { PatternScreenerTeaser } from '@/components/landing/PatternScreenerTeaser';
import { EdgeAtlasSection } from '@/components/landing/EdgeAtlasSection';
import { usePrefetchArticles } from '@/hooks/usePrefetchArticles';
import { CopilotShowcase } from '@/components/landing/CopilotShowcase';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { prefetchArticles } = usePrefetchArticles();

  // Prime articles cache on homepage load for instant /learn navigation
  useEffect(() => {
    prefetchArticles();
  }, [prefetchArticles]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScreenerClick = () => {
    track('pricing_clicked', { source: 'landing_cta_screener' });
    navigate('/patterns/live');
  };

  const handleAlertClick = () => {
    track('pricing_clicked', { source: 'landing_cta_create_alert' });
    if (isAuthenticated) {
      navigate('/members/alerts');
    } else {
      navigate('/auth?redirect=/members/alerts');
    }
  };

  // Activity cards configuration
  const activityCards = [
    {
      title: "Scan the Market",
      description: "Discover active pattern setups across 1,100+ instruments in real-time.",
      bullets: ["Live pattern detection", "Quality scores & metrics", "Filter by asset class"],
      ctaText: "Open Screener",
      ctaLink: "/patterns/live",
      icon: Activity,
      bestFor: "Signal discovery",
      slug: "screener",
    },
    {
      title: "Research & Backtest",
      description: "Validate any pattern on any ticker with historical performance data.",
      bullets: ["Win rates & expectancy", "Visual Proof charts", "Custom timeframes"],
      ctaText: "Open Pattern Lab",
      ctaLink: "/pattern-lab",
      icon: Search,
      bestFor: "Research & validation",
      slug: "pattern_lab",
    },
    {
      title: "Create Alerts",
      description: "Get notified when pattern setups appear on your watchlist.",
      bullets: ["Multi-pattern support", "Email notifications", "Manage active alerts"],
      ctaText: "Create Alert",
      ctaLink: "/members/alerts",
      icon: Bell,
      bestFor: "Stay informed",
      slug: "alerts",
      requiresAuth: true,
    },
    {
      title: "Export Scripts",
      description: "Download ready-to-use Pine Script and MQL code for your strategies.",
      bullets: ["Pine Script & MQL", "Customizable templates", "Subscriber access"],
      ctaText: "Browse Scripts",
      ctaLink: "/members/scripts",
      icon: Code,
      bestFor: "Automate trading",
      slug: "scripts",
      requiresAuth: true,
    },
    {
      title: "Learn Patterns",
      description: "Master chart patterns with interactive examples and quizzes.",
      bullets: ["Pattern library", "Interactive quizzes", "Trading rules"],
      ctaText: "Explore Learn",
      ctaLink: "/chart-patterns/library",
      icon: BookOpen,
      bestFor: "Education",
      slug: "learn",
    },
  ];

  // Always use activity-first landing regardless of wedge mode
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background">
          <div className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 40%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(var(--accent)) 0%, transparent 50%)',
            }}
          />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-4xl text-center px-6">
          {/* H1 - Primary headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in">
            <span className="text-foreground">Discover signals.</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Research. Execute. Automate.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Find pattern-based setups, validate with historical data, and export trading scripts—all in one platform.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              onClick={handleScreenerClick}
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Activity className="h-5 w-5 mr-2" />
              Open Screener
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleAlertClick}
              className="px-8 py-6 text-lg"
            >
              <Bell className="h-5 w-5 mr-2" />
              Create your first alert
            </Button>
          </div>
          
          {/* Trust Block */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Signals on closed candles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Assumptions documented</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Built for repeatability</span>
            </div>
          </div>
        </div>
      </section>

      {/* Edge Atlas — Proven patterns ranked by historical edge */}
      <EdgeAtlasSection />

      {/* Pattern Screener Table - TradingView-style */}
      <PatternScreenerTeaser />

      {/* Choose Your Action Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Choose Your Next Action</h2>
            <p className="text-muted-foreground">Pick an activity based on your current goal</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activityCards.map((card) => (
              <ActionCard
                key={card.slug}
                {...card}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Copilot Moat Showcase */}
      <CopilotShowcase />

      {/* How It Works */}
      <HowItWorks />

      {/* Pricing Teaser */}
      <PricingTeaser />

      {/* Disclaimer */}
      <section className="py-8 px-6 border-t">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Disclaimer:</strong> ChartingPath provides educational tools and backtesting software. 
              Past performance does not guarantee future results. Trading involves substantial risk of loss. 
              Alerts and signals are for informational purposes only and do not constitute financial advice.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
