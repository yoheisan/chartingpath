import { Suspense, lazy, type ReactNode } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { PageCaptureButton } from "./components/dev/PageCaptureButton";
import { CommandPaletteProvider } from "./components/command-palette";
import { TradingCopilotProvider } from "./components/copilot";

// Retry wrapper for lazy imports that fail due to stale chunks after deploy
function lazyWithRetry(factory: () => Promise<any>, retries = 2): ReturnType<typeof lazy> {
  return lazy(() =>
    factory().catch((err: any) => {
      if (retries > 0) {
        // Force reload on chunk load failure (stale cache)
        return new Promise<any>((resolve) => setTimeout(resolve, 500)).then(() =>
          lazyWithRetry(factory, retries - 1) as any
        );
      }
      throw err;
    })
  );
}

// Skeleton loading fallback — gives instant visual structure
const withSuspense = (node: ReactNode) => (
  <Suspense fallback={<PageSkeleton />}>{node}</Suspense>
);

// Core pages (lazy to avoid pulling the entire route tree on first load)
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const StrategyDetail = lazy(() =>
  import("./pages/StrategyDetail").then((m) => ({ default: m.StrategyDetail }))
);
const PipCalculator = lazy(() => import("./pages/PipCalculator"));
const RiskCalculator = lazy(() => import("./pages/RiskCalculator"));
const MarketBreadthReport = lazy(() => import("./pages/MarketBreadthReport"));

const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar"));
const EmailPreview = lazy(() => import("./pages/EmailPreview"));

const PatternGenerator = lazy(() => import("./pages/PatternGenerator"));
const PatternLibraryPage = lazy(() => import("./pages/PatternLibraryPage"));
const TradingStrategiesPage = lazy(() => import("./pages/TradingStrategiesPage"));

// Strategy articles removed — migrated to /blog/:slug dynamic articles
const PatternQuizPage = lazy(() => import("./pages/PatternQuizPage"));
const PatternIdentificationQuizPage = lazy(() => import("./pages/PatternIdentificationQuizPage"));
const TradingKnowledgeQuizPage = lazy(() => import("./pages/TradingKnowledgeQuizPage"));
const StockMarketQuiz = lazy(() => import("./pages/StockMarketQuiz"));
const ForexQuiz = lazy(() => import("./pages/ForexQuiz"));
const CryptoQuiz = lazy(() => import("./pages/CryptoQuiz"));
const CommoditiesQuiz = lazy(() => import("./pages/CommoditiesQuiz"));

const Projects = lazy(() => import("./pages/Projects"));
const ProjectsPricing = lazy(() => import("./pages/ProjectsPricing"));
const PatternLabWizard = lazy(() => import("./pages/projects/PatternLabWizard"));
const PatternAuditPage = lazy(() => import("./pages/PatternAuditPage"));


const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const AgentScoring = lazy(() => import("./pages/AgentScoring"));
const EliteDashboard = lazy(() => import("./pages/EliteDashboard"));
const SharedBacktest = lazy(() => import("./pages/SharedBacktest"));
const SharedPattern = lazy(() => import("./pages/SharedPattern"));

const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MemberScripts = lazy(() => import("./pages/MemberScripts"));
const MemberDownloads = lazy(() => import("./pages/MemberDownloads"));
const MemberAlerts = lazy(() => import("./pages/MemberAlerts"));
const MemberAccount = lazy(() => import("./pages/MemberAccount"));

const Auth = lazy(() => import("./pages/Auth"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminContentManagement = lazy(() => import("./pages/AdminContentManagement"));
const SocialMediaCMS = lazy(() => import("./pages/SocialMediaCMS"));
const TranslationManagement = lazy(() =>
  import("./pages/TranslationManagement").then((m) => ({ default: m.TranslationManagement }))
);

const Terms = lazy(() => import("./pages/Terms"));
const EdgeAtlasPatternPage = lazy(() => import("./pages/EdgeAtlasPatternPage"));
const EdgeAtlasIndexPage = lazy(() => import("./pages/EdgeAtlasIndexPage"));
const PatternStatisticsPage = lazy(() => import("./pages/PatternStatisticsPage"));
const InstrumentPatternStatsPage = lazy(() => import("./pages/InstrumentPatternStatsPage"));
const TradingCopilotFeature = lazy(() => import("./pages/features/TradingCopilotFeature"));
const Copilot = lazy(() => import("./pages/Copilot"));
const InstrumentPage = lazy(() => import("./pages/InstrumentPage"));
const ProgrammaticPatternStatsPage = lazy(() => import("./pages/ProgrammaticPatternStatsPage"));
const PatternStatsIndexPage = lazy(() => import("./pages/PatternStatsIndexPage"));
const Privacy = lazy(() => import("./pages/Privacy"));

// Lazy-load blog pages
const BlogV2 = lazy(() => import("./pages/BlogV2"));
const DynamicArticle = lazy(() => import("./pages/blog/DynamicArticle"));

// Lazy-load other heavy pages
const FAQ = lazy(() => import("./pages/FAQ"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

const ProjectRun = lazy(() => import("./pages/projects/ProjectRun"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LivePatternsPage = lazy(() => import("./pages/LivePatternsPage"));
const PatternVisualizationPreview = lazy(() => import("./pages/PatternVisualizationPreview"));
const PaperTradingPage = lazy(() => import("./pages/PaperTradingPage"));

const AdminKPIDashboard = lazy(() => import("./pages/admin/AdminKPIDashboard"));
const AIJourneyAnalytics = lazy(() => import("./pages/admin/AIJourneyAnalytics"));
const OutcomeAnalytics = lazy(() => import("./pages/admin/OutcomeAnalytics"));
const PatternHealthMonitor = lazy(() => import("./pages/admin/PatternHealthMonitor"));
const CronJobMonitor = lazy(() => import("./pages/admin/CronJobMonitor"));

const App = () => (
  <TooltipProvider>
    <CommandPaletteProvider>
      <TradingCopilotProvider>
        <Toaster />
        <Sonner />
        <ScrollToTop />
        <PageCaptureButton />
        <Layout>
        <Routes>
          <Route path="/" element={withSuspense(<Index />)} />
          <Route path="/about" element={withSuspense(<About />)} />
          <Route path="/tools/pip-calculator" element={withSuspense(<PipCalculator />)} />
          <Route path="/tools/risk-calculator" element={withSuspense(<RiskCalculator />)} />
          <Route path="/tools/market-breadth" element={withSuspense(<MarketBreadthReport />)} />
          <Route path="/tools/script-generator" element={<Navigate to="/members/scripts" replace />} />
          <Route path="/tools/paper-trading" element={withSuspense(<PaperTradingPage />)} />
          <Route path="/tools/economic-calendar" element={withSuspense(<EconomicCalendar />)} />
          <Route path="/email-preview" element={withSuspense(<EmailPreview />)} />
          <Route path="/chart-patterns/generator" element={withSuspense(<PatternGenerator />)} />
          <Route path="/chart-patterns/library" element={withSuspense(<PatternLibraryPage />)} />
          <Route path="/patterns/live" element={withSuspense(<LivePatternsPage />)} />
          <Route path="/dev/pattern-preview" element={withSuspense(<PatternVisualizationPreview />)} />
          <Route path="/study" element={<Navigate to="/members/dashboard" replace />} />
          <Route path="/study/:symbol" element={<Navigate to="/members/dashboard" replace />} />
          <Route path="/chart-patterns/strategies" element={withSuspense(<TradingStrategiesPage />)} />
          <Route path="/chart-patterns/quiz" element={withSuspense(<PatternQuizPage />)} />
          <Route path="/quiz/pattern-identification" element={withSuspense(<PatternIdentificationQuizPage />)} />
          <Route path="/quiz/trading-knowledge" element={withSuspense(<TradingKnowledgeQuizPage />)} />
          <Route path="/quiz/stock-market" element={withSuspense(<StockMarketQuiz />)} />
          <Route path="/quiz/forex" element={withSuspense(<ForexQuiz />)} />
          <Route path="/quiz/crypto" element={withSuspense(<CryptoQuiz />)} />
          <Route path="/quiz/commodities" element={withSuspense(<CommoditiesQuiz />)} />
          <Route path="/learn" element={withSuspense(<BlogV2 />)} />
          {/* All /learn/* articles migrated to /blog/:slug dynamic system */}
          <Route path="/blog/:slug" element={withSuspense(<DynamicArticle />)} />
          <Route path="/learn/head-and-shoulders" element={<Navigate to="/blog/head-and-shoulders" replace />} />
          <Route path="/learn/double-top-bottom" element={<Navigate to="/blog/double-top-bottom" replace />} />
          <Route path="/learn/triangle-patterns" element={<Navigate to="/blog/triangle-patterns" replace />} />
          <Route path="/learn/wedge-patterns" element={<Navigate to="/blog/wedge-patterns" replace />} />
          <Route path="/learn/flag-pennant" element={<Navigate to="/blog/flag-pennant-patterns" replace />} />
          <Route path="/learn/cup-and-handle" element={<Navigate to="/blog/cup-and-handle" replace />} />
          <Route path="/learn/rectangle-pattern" element={<Navigate to="/blog/rectangle-pattern" replace />} />
          <Route path="/learn/support-resistance" element={<Navigate to="/blog/support-resistance" replace />} />
          <Route path="/learn/trend-analysis" element={<Navigate to="/blog/trend-analysis" replace />} />
          <Route path="/learn/volume-analysis" element={<Navigate to="/blog/volume-analysis" replace />} />
          <Route path="/learn/moving-averages" element={<Navigate to="/blog/moving-averages" replace />} />
          <Route path="/learn/rsi-indicator" element={<Navigate to="/blog/rsi-indicator" replace />} />
          <Route path="/learn/macd-indicator" element={<Navigate to="/blog/macd-indicator" replace />} />
          <Route path="/learn/fibonacci-retracements" element={<Navigate to="/blog/fibonacci-retracements" replace />} />
          <Route path="/learn/candlestick-patterns" element={<Navigate to="/blog/candlestick-patterns" replace />} />
          <Route path="/learn/price-action-basics" element={<Navigate to="/blog/price-action-basics" replace />} />
          <Route path="/learn/breakout-trading" element={<Navigate to="/blog/breakout-trading" replace />} />
          <Route path="/learn/pin-bar-strategy" element={<Navigate to="/blog/pin-bar-strategy" replace />} />
          <Route path="/learn/risk-management" element={<Navigate to="/blog/risk-management" replace />} />
          <Route path="/learn/position-sizing" element={<Navigate to="/blog/position-sizing" replace />} />
          <Route path="/learn/money-management" element={<Navigate to="/blog/money-management" replace />} />
          <Route path="/learn/trading-psychology" element={<Navigate to="/blog/trading-psychology" replace />} />
          <Route path="/learn/trading-discipline" element={<Navigate to="/blog/trading-discipline" replace />} />
          <Route path="/learn/fear-and-greed" element={<Navigate to="/blog/fear-and-greed" replace />} />
          <Route path="/learn/trading-journal" element={<Navigate to="/blog/trading-journal" replace />} />
          <Route path="/learn/trading-strategies-guide" element={<Navigate to="/blog/trading-strategies-guide" replace />} />
          <Route path="/community" element={withSuspense(<CommunityFeed />)} />
          <Route path="/tools/agent-scoring" element={withSuspense(<AgentScoring />)} />
          <Route path="/strategy-workspace" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/ai-builder" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/backtest" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/strategy" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/projects" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/projects/pricing" element={withSuspense(<ProjectsPricing />)} />
          <Route path="/projects/setup-finder/new" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/projects/portfolio-sim/new" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/projects/pattern-lab/new" element={withSuspense(<PatternLabWizard />)} />
          <Route path="/projects/pattern-lab/audit" element={withSuspense(<PatternAuditPage />)} />
          <Route path="/projects/runs/:runId" element={withSuspense(<ProjectRun />)} />
          
          <Route path="/pricing" element={<Navigate to="/projects/pricing" replace />} />
          <Route path="/members/trading" element={<Navigate to="/members/dashboard" replace />} />
          <Route path="/members/dashboard" element={withSuspense(<MemberDashboard />)} />
          <Route path="/elite" element={withSuspense(<EliteDashboard />)} />
          <Route path="/share/:token" element={withSuspense(<SharedBacktest />)} />
          <Route path="/s/:token" element={withSuspense(<SharedPattern />)} />
          <Route path="/members/scripts" element={withSuspense(<MemberScripts />)} />
          
          <Route path="/members/downloads" element={withSuspense(<MemberDownloads />)} />
          <Route path="/members/alerts" element={withSuspense(<MemberAlerts />)} />
          <Route path="/members/account" element={withSuspense(<MemberAccount />)} />
          <Route path="/auth" element={withSuspense(<Auth />)} />
          <Route path="/auth/*" element={withSuspense(<Auth />)} />
          <Route path="/admin/login" element={withSuspense(<AdminLogin />)} />
          <Route path="/admin/login/*" element={withSuspense(<AdminLogin />)} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={withSuspense(<AdminDashboard />)} />
          <Route path="/admin/content" element={withSuspense(<AdminContentManagement />)} />
          <Route path="/admin/kpi" element={withSuspense(<AdminKPIDashboard />)} />
          <Route path="/admin/translation-management" element={withSuspense(<TranslationManagement />)} />
          <Route path="/admin/translations" element={withSuspense(<TranslationManagement />)} />
          <Route path="/admin/journey-analytics" element={withSuspense(<AIJourneyAnalytics />)} />
          <Route path="/admin/outcome-analytics" element={withSuspense(<OutcomeAnalytics />)} />
          <Route path="/admin/pattern-health" element={withSuspense(<PatternHealthMonitor />)} />
          <Route path="/admin/social-cms" element={withSuspense(<SocialMediaCMS />)} />
          <Route path="/admin/cron-monitor" element={withSuspense(<CronJobMonitor />)} />
          <Route path="/strategy/:strategyId" element={withSuspense(<StrategyDetail />)} />
          <Route path="/terms" element={withSuspense(<Terms />)} />
          <Route path="/privacy" element={withSuspense(<Privacy />)} />
          <Route path="/faq" element={withSuspense(<FAQ />)} />
          <Route path="/support" element={withSuspense(<SupportPage />)} />
          <Route path="/edge-atlas" element={withSuspense(<EdgeAtlasIndexPage />)} />
          <Route path="/edge-atlas/:patternId" element={withSuspense(<EdgeAtlasPatternPage />)} />
          <Route path="/patterns/:patternId/statistics" element={withSuspense(<PatternStatisticsPage />)} />
          <Route path="/patterns/:patternId/:instrument/statistics" element={withSuspense(<InstrumentPatternStatsPage />)} />
          <Route path="/patterns/stats" element={withSuspense(<PatternStatsIndexPage />)} />
          <Route path="/patterns/stats/:patternSlug/:assetClass/:timeframe" element={withSuspense(<ProgrammaticPatternStatsPage />)} />
          <Route path="/instruments/:symbol" element={withSuspense(<InstrumentPage />)} />
          <Route path="/copilot" element={withSuspense(<Copilot />)} />
          <Route path="/features/trading-copilot" element={withSuspense(<TradingCopilotFeature />)} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={withSuspense(<NotFound />)} />
        </Routes>
      </Layout>
      </TradingCopilotProvider>
    </CommandPaletteProvider>
  </TooltipProvider>
);

export default App;
