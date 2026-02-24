import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, ArrowRight, TrendingUp, Bell, Shield, Activity,
  Search, FlaskConical, Code, BookOpen, BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

  // Activity cards configuration - now with i18n
  const activityCards = [
    {
      title: t('landing.dashboard', 'Trading Dashboard'),
      description: t('landing.dashboardDesc', 'Full command center with live charts, pattern overlays, watchlists, and market overview.'),
      bullets: [t('landing.dashboardBullet1', 'TradingView-style charts'), t('landing.dashboardBullet2', 'Pattern overlay & study'), t('landing.dashboardBullet3', 'Market overview panel')],
      ctaText: t('landing.openDashboard', 'Open Dashboard'),
      ctaLink: "/members/dashboard",
      icon: BarChart3,
      bestFor: t('landing.bestForDashboard', 'Full workspace'),
      slug: "dashboard",
    },
    {
      title: t('landing.scanMarket', 'Scan the Market'),
      description: t('landing.scanMarketDesc', 'Discover active pattern setups across 1,100+ instruments in real-time.'),
      bullets: [t('landing.scanBullet1', 'Live pattern detection'), t('landing.scanBullet2', 'Quality scores & metrics'), t('landing.scanBullet3', 'Filter by asset class')],
      ctaText: t('landing.openScreener', 'Open Screener'),
      ctaLink: "/patterns/live",
      icon: Activity,
      bestFor: t('landing.bestForDiscovery', 'Signal discovery'),
      slug: "screener",
    },
    {
      title: t('landing.researchBacktest', 'Research & Backtest'),
      description: t('landing.researchDesc', 'Validate any pattern on any ticker with historical performance data.'),
      bullets: [t('landing.researchBullet1', 'Win rates & expectancy'), t('landing.researchBullet2', 'Visual Proof charts'), t('landing.researchBullet3', 'Custom timeframes')],
      ctaText: t('landing.openPatternLab', 'Open Pattern Lab'),
      ctaLink: "/pattern-lab",
      icon: Search,
      bestFor: t('landing.bestForResearch', 'Research & validation'),
      slug: "pattern_lab",
    },
    {
      title: t('landing.createAlerts', 'Create Alerts'),
      description: t('landing.createAlertsDesc', 'Get notified when pattern setups appear on your watchlist.'),
      bullets: [t('landing.alertsBullet1', 'Multi-pattern support'), t('landing.alertsBullet2', 'Email notifications'), t('landing.alertsBullet3', 'Manage active alerts')],
      ctaText: t('landing.createAlert', 'Create Alert'),
      ctaLink: "/members/alerts",
      icon: Bell,
      bestFor: t('landing.bestForAlerts', 'Stay informed'),
      slug: "alerts",
      requiresAuth: true,
    },
    {
      title: t('landing.exportScripts', 'Export Scripts'),
      description: t('landing.exportScriptsDesc', 'Download ready-to-use Pine Script and MQL code for your strategies.'),
      bullets: [t('landing.scriptsBullet1', 'Pine Script & MQL'), t('landing.scriptsBullet2', 'Customizable templates'), t('landing.scriptsBullet3', 'Subscriber access')],
      ctaText: t('landing.browseScripts', 'Browse Scripts'),
      ctaLink: "/members/scripts",
      icon: Code,
      bestFor: t('landing.bestForScripts', 'Automate trading'),
      slug: "scripts",
      requiresAuth: true,
    },
    {
      title: t('landing.learnPatterns', 'Learn Patterns'),
      description: t('landing.learnPatternsDesc', 'Master chart patterns with interactive examples and quizzes.'),
      bullets: [t('landing.learnBullet1', 'Pattern library'), t('landing.learnBullet2', 'Interactive quizzes'), t('landing.learnBullet3', 'Trading rules')],
      ctaText: t('landing.exploreLearn', 'Explore Learn'),
      ctaLink: "/chart-patterns/library",
      icon: BookOpen,
      bestFor: t('landing.bestForLearn', 'Education'),
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
        
        {/* Grid overlay */}
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
            <span className="text-foreground">{t('hero.headline1', 'Discover signals.')}</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('hero.headline2', 'Research. Execute. Automate.')}
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t('hero.subtitle', 'Find pattern-based setups, validate with historical data, and export trading scripts—all in one platform.')}
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              onClick={handleScreenerClick}
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <Activity className="h-5 w-5 mr-2" />
              {t('hero.cta', 'Open Screener')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleAlertClick}
              className="px-8 py-6 text-lg"
            >
              <Bell className="h-5 w-5 mr-2" />
              {t('hero.ctaSecondary', 'Create your first alert')}
            </Button>
          </div>
          
          {/* Trust Block */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{t('hero.trustSignals', 'Signals on closed candles')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{t('hero.trustAssumptions', 'Assumptions documented')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{t('hero.trustRepeatability', 'Built for repeatability')}</span>
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
            <h2 className="text-3xl font-bold mb-3">{t('landing.chooseAction', 'Choose Your Next Action')}</h2>
            <p className="text-muted-foreground">{t('landing.chooseActionSubtitle', 'Pick an activity based on your current goal')}</p>
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
              <strong>{t('common.warning', 'Disclaimer')}:</strong> {t('landing.disclaimer', 'ChartingPath provides educational tools and backtesting software. Past performance does not guarantee future results. Trading involves substantial risk of loss. Alerts and signals are for informational purposes only and do not constitute financial advice.')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
