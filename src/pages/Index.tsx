import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, ArrowRight, TrendingUp, Bell, Shield, Activity,
  Search, FlaskConical, Code, BookOpen, BarChart3, Bot
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import { trackEvent } from '@/lib/analytics';
import ActionCard from '@/components/landing/ActionCard';
import HowItWorks from '@/components/landing/HowItWorks';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import PricingTeaser from '@/components/landing/PricingTeaser';
import { PatternScreenerTeaser } from '@/components/landing/PatternScreenerTeaser';
import { EdgeAtlasSection } from '@/components/landing/EdgeAtlasSection';
import { usePrefetchArticles } from '@/hooks/usePrefetchArticles';
import { CopilotShowcase } from '@/components/landing/CopilotShowcase';
import { PageMeta } from '@/components/PageMeta';
import { WebApplicationJsonLd } from '@/components/JsonLd';
import { MetricStrip } from '@/components/landing/MetricStrip';
import { useSectionTracking } from '@/hooks/useSectionTracking';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { prefetchArticles } = usePrefetchArticles();

  // Section tracking refs
  const heroRef = useSectionTracking('hero');
  const howItWorksRef = useSectionTracking('how_it_works');
  const screenerRef = useSectionTracking('screener_teaser');
  const edgeAtlasRef = useSectionTracking('edge_atlas');
  const actionsRef = useSectionTracking('action_cards');
  const copilotRef = useSectionTracking('copilot');
  const pricingRef = useSectionTracking('pricing');

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
    trackEvent('landing.cta_click', { button: 'hero_see_setups' });
    navigate('/patterns/live');
  };

  const handleBacktestClick = () => {
    track('pricing_clicked', { source: 'landing_cta_backtest' });
    trackEvent('landing.cta_click', { button: 'hero_try_backtest' });
    navigate('/pattern-lab');
  };

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
      bullets: [t('landing.scanBullet1', 'Live pattern detection'), t('landing.scanBullet2', 'Quality scores & metrics'), t('landing.scanBulletCopilot', '💡 Ask Copilot to find setups')],
      ctaText: t('landing.openScreener', 'Open Screener'),
      ctaLink: "/patterns/live",
      icon: Activity,
      bestFor: t('landing.bestForDiscovery', 'Signal discovery'),
      slug: "screener",
    },
    {
      title: t('landing.researchBacktest', 'Research & Backtest'),
      description: t('landing.researchDesc', 'Validate any pattern on any ticker with historical performance data.'),
      bullets: [t('landing.researchBullet1', 'Win rates & expectancy'), t('landing.researchBullet2', 'Visual Proof charts'), t('landing.researchBulletCopilot', '💡 Ask Copilot to validate')],
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
      bullets: [t('landing.scriptsBullet1', 'Pine Script & MQL'), t('landing.scriptsBullet2', 'Customizable templates'), t('landing.scriptsBulletCopilot', '💡 Generate via Copilot ⌘K')],
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

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="ChartingPath – Chart Pattern Screener & Backtesting Platform"
        description="Find chart pattern setups before they break out. Scan 1,100+ instruments, validate with 320K+ historical trades, and export Pine Script strategies."
        canonicalPath="/"
      />
      <WebApplicationJsonLd />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in">
            <span className="text-foreground">
              {t('hero.headline1', 'Find Chart Pattern Setups')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('hero.headline2', 'Before They Break Out')}
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t('hero.subtitle', 'Scan 1,100+ instruments. Validate with 320,000+ historical trades. Get entry, stop-loss, and target — in seconds.')}
          </p>
          
          {/* Ticker Search — prominent */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <UniversalSymbolSearch
              onSelect={(symbol) => navigate(`/instruments/${symbol}`)}
              trigger={
                <button className="w-full max-w-xl mx-auto flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-primary/30 bg-card/80 backdrop-blur-sm hover:border-primary/60 transition-all shadow-lg hover:shadow-primary/10 group cursor-pointer">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground text-base group-hover:text-foreground transition-colors">
                    Search any ticker — AAPL, BTC, EUR/USD…
                  </span>
                  <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] text-muted-foreground border border-border">
                    1,100+ instruments
                  </kbd>
                </button>
              }
            />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              onClick={handleScreenerClick}
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              {t('hero.cta', "See Today's Setups")}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleBacktestClick}
              className="px-8 py-6 text-lg"
            >
              <FlaskConical className="h-5 w-5 mr-2" />
              {t('hero.ctaSecondary', 'Try a Free Backtest')}
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

          {/* Copilot hint */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground/70 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <Bot className="h-3.5 w-3.5" />
            <span>{t('hero.copilotHint', 'Powered by AI Trading Copilot — press ⌘K anywhere')}</span>
          </div>

          {/* Metric Strip */}
          <MetricStrip />
        </div>
      </section>

      {/* How It Works — moved to position 2 */}
      <div ref={howItWorksRef}>
        <HowItWorks />
      </div>

      {/* AI Copilot — moved up for visibility */}
      <div ref={copilotRef}>
        <CopilotShowcase />
      </div>

      {/* Pattern Screener Table */}
      <div ref={screenerRef}>
        <PatternScreenerTeaser />
      </div>

      {/* Edge Atlas */}
      <div ref={edgeAtlasRef}>
        <EdgeAtlasSection />
      </div>

      {/* Choose Your Action */}
      <section ref={actionsRef} className="py-16 px-6 bg-muted/30">
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

      {/* Pricing Teaser */}
      <div ref={pricingRef}>
        <PricingTeaser />
      </div>

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
