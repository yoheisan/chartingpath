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
  const [instrumentCount, setInstrumentCount] = useState<number | null>(null);
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
    const fetchCount = async () => {
      const { count } = await supabase
        .from('instruments')
        .select('symbol', { count: 'exact', head: true })
        .eq('is_active', true);
      if (count != null) setInstrumentCount(count);
    };
    fetchCount();
  }, []);

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
    navigate('/projects/pattern-lab/new');
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
      description: t('landing.scanMarketDesc', `Discover active pattern setups across ${instrumentCount ? instrumentCount.toLocaleString() + '+' : '800+'} instruments in real-time.`),
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
        title="ChartingPath – Validate Chart Patterns with 320K+ Backtested Outcomes"
        description={`Know if a chart pattern works before you trade it. ${instrumentCount ? instrumentCount.toLocaleString() + '+' : '800+'} instruments backtested across 320,000+ real outcomes with win rates, expectancy, and quality grading.`}
        canonicalPath="/"
      />
      <WebApplicationJsonLd />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        {/* Background — subtle grid only */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto max-w-7xl text-center px-6">
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold mb-5 leading-[1.15] animate-fade-in tracking-tight">
            <span className="text-foreground">
              {t('hero.headlinePrimary', 'Know if a pattern works')}
            </span>
            <br />
            <span className="text-primary">
              {t('hero.headlineAccent', 'before you trade it')}
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-3 max-w-2xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: '0.1s' }}>
            {t('hero.subtitleMain', 'Every pattern backtested against 320,000+ real market outcomes. Win rates, expectancy, and quality grades — not guesswork.')}
          </p>
          
          <p className="text-sm text-muted-foreground/70 mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {t('hero.socialProof', '320,000+ pattern outcomes analyzed. Free to start — works alongside TradingView.')}
          </p>

          {/* Single prominent CTA */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              onClick={() => {
                (window as any).gtag?.('event', 'cta_click', { location: 'hero' });
                handleScreenerClick();
              }}
              className="px-10 py-7 text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/20"
            >
              <TrendingUp className="h-6 w-6 mr-3" />
              {t('hero.ctaPrimary', 'See Live Patterns Free')}
              <ArrowRight className="h-6 w-6 ml-3" />
            </Button>
          </div>

          {/* Sign Up CTA — prominent for guests */}
          {!isAuthenticated && (
            <div className="mb-10 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <Button
                size="lg"
                onClick={() => {
                  (window as any).gtag?.('event', 'cta_click', { location: 'hero_signup' });
                  navigate('/auth?mode=signup');
                }}
                className="px-8 py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t('hero.createFreeAccount', 'Create Free Account')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
          
          {/* Ticker Search */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <UniversalSymbolSearch
              onSelect={(symbol) => {
                trackEvent('landing.search_select', { symbol });
                navigate('/members/dashboard', { state: { initialSymbol: symbol } });
              }}
              trigger={
                <button className="w-full max-w-xl mx-auto flex items-center gap-3 px-5 py-4 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all group cursor-pointer">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground text-base group-hover:text-foreground transition-colors">
                    {t('hero.searchPlaceholder', 'Search any ticker — AAPL, BTC, EUR/USD…')}
                  </span>
                  <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] text-muted-foreground border border-border">
                    {instrumentCount ? `${instrumentCount.toLocaleString()}+ ${t('hero.instruments', 'instruments')}` : t('hero.instrumentsFallback', '800+ instruments')}
                  </kbd>
                </button>
              }
            />
          </div>

          {/* Secondary CTA */}
          <div className="flex justify-center mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-xs text-muted-foreground/70 animate-fade-in uppercase tracking-wider" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary/60" />
              <span>{t('hero.trustSignals', 'Every signal backtested')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary/60" />
              <span>{t('hero.trustAssumptions', 'Win rates shown upfront')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-primary/60" />
              <span>{t('hero.trustRepeatability', 'No black-box indicators')}</span>
            </div>
          </div>

          {/* Copilot hint */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Bot className="h-3 w-3" />
            <span>{t('hero.copilotHint', 'Powered by AI Trading Copilot — press ⌘K anywhere')}</span>
          </div>

          {/* Metric Strip */}
          <MetricStrip />
        </div>
      </section>

      {/* How It Works */}
      <div ref={howItWorksRef} className="border-t border-border/20">
        <HowItWorks />
      </div>

      {/* AI Copilot */}
      <div ref={copilotRef} className="border-t border-border/20">
        <CopilotShowcase />
      </div>

      {/* Mid-page Signup CTA */}
      {!isAuthenticated && (
        <section className="py-16 px-6 border-t border-border/20">
          <div className="container mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-10 md:p-14 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {t('hero.midPageHeadline', 'See the data behind the pattern')}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t('hero.midPageSubtext', 'Free account. No credit card. Real backtest data from day one.')}
              </p>
              <Button
                size="lg"
                onClick={() => {
                  (window as any).gtag?.('event', 'cta_click', { location: 'mid_page' });
                  navigate('/auth?mode=signup');
                }}
                className="px-10 py-7 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                {t('hero.createFreeAccount', 'Create Free Account')}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Pattern Screener Table */}
      <div ref={screenerRef}>
        <PatternScreenerTeaser />
      </div>

      {/* Edge Atlas */}
      <div ref={edgeAtlasRef}>
        <EdgeAtlasSection />
      </div>

      {/* Choose Your Action */}
      <section ref={actionsRef} className="py-20 px-6 border-t border-border/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">{t('landing.tools', 'Tools')}</p>
            <h2 className="text-3xl font-bold">{t('landing.chooseAction', 'Choose Your Next Action')}</h2>
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
        <div className="container mx-auto max-w-7xl">
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
