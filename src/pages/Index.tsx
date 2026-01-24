import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, ArrowRight, TrendingUp, Bell, Shield, 
  Search, FlaskConical, Code, BookOpen, Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { wedgeConfig, featuredPresets, WEDGE_PATTERN_ID_MAP } from '@/config/wedge';
import { track } from '@/services/analytics';
import ActionCard from '@/components/landing/ActionCard';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingTeaser from '@/components/landing/PricingTeaser';
import PatternScreenerTable from '@/components/landing/PatternScreenerTable';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
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

  const handleSetupFinderClick = () => {
    track('pricing_clicked', { source: 'landing_cta_setup_finder' });
    navigate('/projects/setup-finder/new');
  };

  const handleAlertClick = () => {
    track('pricing_clicked', { source: 'landing_cta_create_alert' });
    if (isAuthenticated) {
      navigate('/members/alerts');
    } else {
      navigate('/auth?redirect=/members/alerts');
    }
  };

  const handlePresetsClick = () => {
    track('pricing_clicked', { source: 'landing_presets_view_all' });
    navigate('/strategy-workspace');
  };

  // Activity cards configuration
  const activityCards = [
    {
      title: "Find Setups",
      description: "Scan a universe for pattern-based setups with entries + SL/TP.",
      bullets: ["Multi-market scan", "Repeatable rules", "Fast run time"],
      ctaText: "Run Setup Finder",
      ctaLink: "/projects/setup-finder/new",
      icon: Search,
      bestFor: "Daily scanners",
      slug: "setup_finder",
    },
    {
      title: "Backtest a Playbook",
      description: "Turn a pattern into a testable playbook in minutes.",
      bullets: ["Pick symbol/timeframe", "Choose patterns", "Run backtest"],
      ctaText: "Open Workspace",
      ctaLink: "/strategy-workspace",
      icon: FlaskConical,
      bestFor: "System builders",
      slug: "workspace",
    },
    {
      title: "Create Alerts",
      description: "Get notified when your playbook conditions are met.",
      bullets: ["Rule-based triggers", "Clear conditions", "Retry-safe"],
      ctaText: "Create Alert",
      ctaLink: "/members/alerts",
      icon: Bell,
      bestFor: "Active traders",
      slug: "alerts",
      requiresAuth: true,
    },
    {
      title: "Use Scripts",
      description: "Download and deploy ready-to-use trading scripts.",
      bullets: ["Filter by strategy", "Preview + download", "Subscriber access"],
      ctaText: "Browse Scripts",
      ctaLink: "/members/scripts",
      icon: Code,
      bestFor: "Advanced users",
      slug: "scripts",
      requiresAuth: true,
    },
    {
      title: "Learn Patterns",
      description: "Learn chart patterns with examples and executable rules.",
      bullets: ["Pattern library", "Practical rules", "TradingView-friendly"],
      ctaText: "Explore Learn",
      ctaLink: "/pattern-library",
      icon: BookOpen,
      bestFor: "Beginners",
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
            <span className="text-foreground">TradingView chart patterns</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              → repeatable trade plans.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Scan markets, backtest playbooks, and trigger alerts—without prompts.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              onClick={handleSetupFinderClick}
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Run Setup Finder
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

      {/* Pattern Screener Table - TradingView-style */}
      <PatternScreenerTable />

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

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Presets Section */}
      {wedgeConfig.wedgeEnabled && (
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="secondary" className="px-3 py-1">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Crypto • 1H Timeframe
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-3">Featured Presets</h2>
              <p className="text-muted-foreground">One-click playbooks ready to backtest and alert</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {featuredPresets.slice(0, 10).map((preset, idx) => (
                <Card 
                  key={idx} 
                  className="hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => navigate('/strategy-workspace')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {preset.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      1H {WEDGE_PATTERN_ID_MAP[preset.patternId] || preset.patternId}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" onClick={handlePresetsClick}>
                See all presets in Workspace
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Presets are starter configurations—always validate with your risk rules.
            </p>
          </div>
        </section>
      )}

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
