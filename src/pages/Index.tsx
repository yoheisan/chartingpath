import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Shield, FlaskConical } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import { trackEvent } from '@/lib/analytics';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingTeaser from '@/components/landing/PricingTeaser';
import { PatternScreenerTeaser } from '@/components/landing/PatternScreenerTeaser';
import { EdgeAtlasSection } from '@/components/landing/EdgeAtlasSection';
import { usePrefetchArticles } from '@/hooks/usePrefetchArticles';
import { CopilotShowcase } from '@/components/landing/CopilotShowcase';
import { PageMeta } from '@/components/PageMeta';
import { WebApplicationJsonLd } from '@/components/JsonLd';
import { MetricStrip } from '@/components/landing/MetricStrip';
import { useSectionTracking } from '@/hooks/useSectionTracking';
import LivePatternPreview from '@/components/landing/LivePatternPreview';
import MarketPulseChart from '@/components/landing/MarketPulseChart';
import { SocialProof } from '@/components/landing/SocialProof';
import { EmailLeadCapture } from '@/components/landing/EmailLeadCapture';
import { ScrollSignupModal } from '@/components/landing/ScrollSignupModal';
import { HeroStatsBar } from '@/components/landing/HeroStatsBar';

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
  const copilotRef = useSectionTracking('copilot');
  const pricingRef = useSectionTracking('pricing');

  // Track landing page view for KPI funnel (fires into product_events + analytics_events)
  useEffect(() => {
    track('landing_view', { path: '/' });
    trackEvent('landing_view', { path: '/' });
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="ChartingPath — Pattern Detection with Proven Outcomes"
        description="The only chart pattern platform that tracks what actually happens after the pattern forms. 63K+ labeled outcomes across FX and US equities. Win rates by pattern, timeframe, and instrument — updated daily."
        canonicalPath="/"
      />
      <WebApplicationJsonLd />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[60vh] flex items-center overflow-hidden">
        {/* Background — subtle grid + glow */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07] blur-[100px] bg-primary pointer-events-none" />
        </div>
        
        {/* Content — two-column */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <Badge variant="secondary" className="mb-6 text-xs tracking-wide animate-fade-in">
                {t('landing.platformBadge', 'Chart Pattern Backtesting Platform')}
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.08] animate-fade-in tracking-tight">
                <span className="text-foreground">
                  {t('hero.headlinePrimary', 'Know if a pattern works')}
                </span>
                <br />
                <span className="text-primary">
                  {t('hero.headlineAccent', 'before you trade it')}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-[1.35rem] text-muted-foreground mb-10 max-w-xl animate-fade-in leading-relaxed" style={{ animationDelay: '0.1s' }}>
                {t('hero.subtitleMain', 'Every pattern backtested against 320,000+ real market outcomes. Win rates, expectancy, and quality grades — not guesswork.')}
              </p>

              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Button 
                  size="lg" 
                  onClick={() => {
                    (window as any).gtag?.('event', 'cta_click', { location: 'hero' });
                    handleScreenerClick();
                  }}
                  className="px-12 py-7 text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/20"
                >
                  <TrendingUp className="h-6 w-6 mr-3" />
                  {t('hero.ctaPrimary', 'See Live Patterns Free')}
                  <ArrowRight className="h-6 w-6 ml-3" />
                </Button>
              </div>
            </div>

            {/* Right — key stats */}
            <div className="hidden lg:grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-3xl font-bold text-foreground tabular-nums">320K+</p>
                <p className="text-sm text-muted-foreground mt-1">{t('hero.statTrades', 'Backtested trades')}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-3xl font-bold text-primary tabular-nums">{instrumentCount ? instrumentCount.toLocaleString() : '800'}+</p>
                <p className="text-sm text-muted-foreground mt-1">{t('hero.statInstruments', 'Instruments tracked')}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-3xl font-bold text-foreground tabular-nums">62%</p>
                <p className="text-sm text-muted-foreground mt-1">{t('hero.statWinRate', 'Avg win rate (Grade A)')}</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-3xl font-bold text-foreground tabular-nums">24/7</p>
                <p className="text-sm text-muted-foreground mt-1">{t('hero.statScanning', 'Live pattern scanning')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Strip — proof bar below hero */}
      <div className="border-t border-border/20 bg-card/30">
        <div className="container mx-auto">
          <MetricStrip />
        </div>
      </div>

      {/* Live Pattern Preview — visual proof above the fold */}
      <LivePatternPreview />

      {/* Market Pulse — Long vs Short detection chart */}
      <MarketPulseChart />

      {/* Social Proof */}
      <div className="border-t border-border/20">
        <SocialProof />
      </div>

      {/* AI Copilot */}
      <div ref={copilotRef} className="border-t border-border/20">
        <CopilotShowcase />
      </div>

      {/* Use-Case Showcase (replaces How It Works + Action Cards) */}
      <div ref={howItWorksRef} className="border-t border-border/20">
        <HowItWorks />
      </div>

      {/* Mid-page Signup CTA */}
      {!isAuthenticated && (
        <section className="py-20 px-4 md:px-6 lg:px-8 border-t border-border/20">
          <div className="container mx-auto">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  {t('hero.midPageHeadline', 'See the data behind the pattern')}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground">
                  {t('hero.midPageSubtext', 'Free account. No credit card. Real backtest data from day one.')}
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  size="lg"
                  onClick={() => {
                    (window as any).gtag?.('event', 'cta_click', { location: 'mid_page' });
                    navigate('/auth?mode=signup');
                  }}
                  className="px-10 py-7 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 whitespace-nowrap"
                >
                  {t('hero.createFreeAccount', 'Create Free Account')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
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

      {/* Email Lead Capture */}
      <EmailLeadCapture />

      {/* Pricing Teaser */}
      <div ref={pricingRef}>
        <PricingTeaser />
      </div>

      {/* Scroll-triggered signup modal for engaged guests */}
      <ScrollSignupModal />

      {/* Disclaimer */}
      <section className="py-8 px-6 border-t">
        <div className="container mx-auto">
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
