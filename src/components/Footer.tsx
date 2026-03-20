import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { wedgeConfig } from "@/config/wedge";

const Footer = () => {
  const { t } = useTranslation();
  const isWedgeMode = wedgeConfig.wedgeEnabled;
  
  // Wedge mode: minimal footer with only core links
  if (isWedgeMode) {
    return (
      <footer className="border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            {/* Logo and Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
                  <img 
                    src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                    alt="ChartingPath Logo" 
                    className="h-6 w-6 object-contain brightness-0 invert"
                  />
                </div>
                <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ChartingPath
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('footer.description', 'Multi-asset chart pattern detection for stocks, forex, crypto, and commodities.')}
              </p>
            </div>

            {/* Research */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t('footer.research', 'Research')}</h3>
              <nav className="flex flex-col gap-2">
                <Link to="/patterns/live" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.screener', 'Screener')}
                </Link>
                <Link to="/projects/pattern-lab/new" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.patternLab', 'Pattern Lab')}
                </Link>
                <Link to="/members/scripts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.scripts', 'Scripts')}
                </Link>
                <Link to="/projects/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.pricing', 'Pricing')}
                </Link>
              </nav>
            </div>

            {/* Learning */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t('footer.learning', 'Learning')}</h3>
              <nav className="flex flex-col gap-2">
                <Link to="/chart-patterns/library" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.patternLibrary', 'Pattern Library')}
                </Link>
                <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.blogArticles', 'Blog & Articles')}
                </Link>
                <Link to="/chart-patterns/quiz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.patternQuizzes', 'Pattern Quizzes')}
                </Link>
              </nav>
            </div>

            {/* Tools & Company - matches header More dropdown */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t('navigation.more', 'More')}</h3>
              <nav className="flex flex-col gap-2">
                <Link to="/tools/pip-calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.pipCalculator', 'Pip Calculator')}
                </Link>
                <Link to="/tools/risk-calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.riskCalculator', 'Risk Calculator')}
                </Link>
                <Link to="/tools/economic-calendar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.economicCalendar', 'Economic Calendar')}
                </Link>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.faq', 'FAQ')}
                </Link>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.about', 'About')}
                </Link>
                <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('navigation.contactSupport', 'Contact Support')}
                </Link>
              </nav>
            </div>
          </div>

          {/* Copyright and Legal */}
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>{t('footer.copyright', '© {{year}} ChartingPath. Market Leap Partners Inc. All rights reserved.', { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms', 'Terms')}</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy', 'Privacy')}</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }
  
  // Full footer for non-wedge mode
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo and Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
                <img 
                  src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                  alt="ChartingPath Logo" 
                  className="h-6 w-6 object-contain brightness-0 invert"
                />
              </div>
              <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChartingPath
              </Link>
            </div>
          </div>

          {/* Tools Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">{t('footer.tools', 'Tools')}</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/projects/pattern-lab/new" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.patternLab', 'Pattern Lab')}
              </Link>
              <Link to="/tools/pip-calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.pipCalculator', 'Pip Calculator')}
              </Link>
              <Link to="/tools/risk-calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.riskCalculator', 'Risk Calculator')}
              </Link>
              <Link to="/tools/market-breadth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.marketBreadth', 'Market Breadth Report')}
              </Link>
            </nav>
          </div>

          {/* Learning Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">{t('footer.learning', 'Learning')}</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.learningCenter', 'Learning Center')}
              </Link>
              <Link to="/chart-patterns/generator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.patternGenerator', 'Pattern Generator')}
              </Link>
              <Link to="/chart-patterns/library" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.patternLibrary', 'Pattern Library')}
              </Link>
              <Link to="/chart-patterns/strategies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.tradingStrategies', 'Trading Strategies')}
              </Link>
              <Link to="/chart-patterns/quiz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.patternQuiz', 'Pattern Quiz')}
              </Link>
            </nav>
          </div>


          {/* Company Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">{t('footer.company', 'Company')}</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.about', 'About')}
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.faq', 'FAQ')}
              </Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.pricing', 'Pricing')}
              </Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('navigation.contactSupport', 'Contact Support')}
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright and Legal */}
        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t('footer.copyright', '© {{year}} ChartingPath. Market Leap Partners Inc. All rights reserved.', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms', 'Terms')}</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy', 'Privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
