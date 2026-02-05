import { Suspense, lazy, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { PageCaptureButton } from "./components/dev/PageCaptureButton";

// Reusable loading fallback
const PageLoader = () => (
  <div className="container mx-auto px-6 py-12 text-muted-foreground">Loading…</div>
);

const withSuspense = (node: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{node}</Suspense>
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
const ScriptGenerator = lazy(() => import("./pages/ScriptGenerator"));
const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar"));
const EmailPreview = lazy(() => import("./pages/EmailPreview"));

const PatternGenerator = lazy(() => import("./pages/PatternGenerator"));
const PatternLibraryPage = lazy(() => import("./pages/PatternLibraryPage"));
const TradingStrategiesPage = lazy(() => import("./pages/TradingStrategiesPage"));

// Strategy articles
const ScalpingStrategy = lazy(() => import("./pages/strategies/ScalpingStrategy"));
const DayTradingStrategy = lazy(() => import("./pages/strategies/DayTradingStrategy"));
const TrendFollowingStrategy = lazy(() => import("./pages/strategies/TrendFollowingStrategy"));
const BreakoutStrategy = lazy(() => import("./pages/strategies/BreakoutStrategy"));
const MeanReversionStrategy = lazy(() => import("./pages/strategies/MeanReversionStrategy"));
const MomentumStrategy = lazy(() => import("./pages/strategies/MomentumStrategy"));
const SwingTradingStrategy = lazy(() => import("./pages/strategies/SwingTradingStrategy"));
const PositionTradingStrategy = lazy(() => import("./pages/strategies/PositionTradingStrategy"));
const MACDStrategy = lazy(() => import("./pages/strategies/MACDStrategy"));
const BollingerBandsStrategy = lazy(() => import("./pages/strategies/BollingerBandsStrategy"));
const RSIDivergenceStrategy = lazy(() => import("./pages/strategies/RSIDivergenceStrategy"));
const VWAPStrategy = lazy(() => import("./pages/strategies/VWAPStrategy"));
const FibonacciStrategy = lazy(() => import("./pages/strategies/FibonacciStrategy"));
const SupportResistanceStrategy = lazy(() => import("./pages/strategies/SupportResistanceStrategy"));
const GapTradingStrategy = lazy(() => import("./pages/strategies/GapTradingStrategy"));
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
const PortfolioSimulatorWizard = lazy(() => import("./pages/projects/PortfolioSimulatorWizard"));

const StrategyWorkspace = lazy(() => import("./pages/StrategyWorkspace"));
const EliteDashboard = lazy(() => import("./pages/EliteDashboard"));
const SharedBacktest = lazy(() => import("./pages/SharedBacktest"));

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
const Privacy = lazy(() => import("./pages/Privacy"));

// Lazy-load blog pages - reduces initial bundle by ~60-80%
const BlogV2 = lazy(() => import("./pages/BlogV2"));
const DynamicArticle = lazy(() => import("./pages/blog/DynamicArticle"));
const HeadAndShoulders = lazy(() => import("./pages/blog/HeadAndShoulders"));
const DoubleTopBottom = lazy(() => import("./pages/blog/DoubleTopBottom"));
const TrianglePatterns = lazy(() => import("./pages/blog/TrianglePatterns"));
const WedgePatterns = lazy(() => import("./pages/blog/WedgePatterns"));
const FlagPennant = lazy(() => import("./pages/blog/FlagPennant"));
const CupAndHandle = lazy(() => import("./pages/blog/CupAndHandle"));
const SupportResistance = lazy(() => import("./pages/blog/SupportResistance"));
const TrendAnalysis = lazy(() => import("./pages/blog/TrendAnalysis"));
const VolumeAnalysis = lazy(() => import("./pages/blog/VolumeAnalysis"));
const CandlestickPatterns = lazy(() => import("./pages/blog/CandlestickPatterns"));
const TradingDiscipline = lazy(() => import("./pages/blog/TradingDiscipline"));
const FearAndGreed = lazy(() => import("./pages/blog/FearAndGreed"));
const MovingAverages = lazy(() => import("./pages/blog/MovingAverages"));
const RSIIndicator = lazy(() => import("./pages/blog/RSIIndicator"));
const MACDIndicator = lazy(() => import("./pages/blog/MACDIndicator"));
const FibonacciRetracements = lazy(() => import("./pages/blog/FibonacciRetracements"));
const PriceActionBasics = lazy(() => import("./pages/blog/PriceActionBasics"));
const BreakoutTrading = lazy(() => import("./pages/blog/BreakoutTrading"));
const PinBarStrategy = lazy(() => import("./pages/blog/PinBarStrategy"));
const PositionSizing = lazy(() => import("./pages/blog/PositionSizing"));
const MoneyManagement = lazy(() => import("./pages/blog/MoneyManagement"));
const TradingJournal = lazy(() => import("./pages/blog/TradingJournal"));
const RectanglePattern = lazy(() => import("./pages/blog/RectanglePattern"));
const TradingPsychology = lazy(() => import("./pages/blog/TradingPsychology"));
const RiskManagement = lazy(() => import("./pages/blog/RiskManagement"));
const TradingStrategiesGuide = lazy(() => import("./pages/blog/TradingStrategiesGuide"));

// Lazy-load other heavy pages
const FAQ = lazy(() => import("./pages/FAQ"));

const IndustrialMetals = lazy(() => import("./pages/markets/commodities/IndustrialMetals"));
const ProjectRun = lazy(() => import("./pages/projects/ProjectRun"));
const CommodityMarket = lazy(() => import("./pages/markets/CommodityMarket"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LivePatternsPage = lazy(() => import("./pages/LivePatternsPage"));
const TickerStudy = lazy(() => import("./pages/TickerStudy"));
const AdminKPIDashboard = lazy(() => import("./pages/admin/AdminKPIDashboard"));
const AIJourneyAnalytics = lazy(() => import("./pages/admin/AIJourneyAnalytics"));

// Markets
const StockMarket = lazy(() => import("./pages/markets/StockMarket"));
const ForexMarket = lazy(() => import("./pages/markets/ForexMarket"));
const CryptoMarket = lazy(() => import("./pages/markets/CryptoMarket"));
const EnergyCommodities = lazy(() => import("./pages/markets/commodities/EnergyCommodities"));
const PreciousMetals = lazy(() => import("./pages/markets/commodities/PreciousMetals"));
const AgriculturalCommodities = lazy(() => import("./pages/markets/commodities/AgriculturalCommodities"));
const MajorCurrencyPairs = lazy(() => import("./pages/markets/forex/MajorCurrencyPairs"));
const CrossCurrencyPairs = lazy(() => import("./pages/markets/forex/CrossCurrencyPairs"));
const MajorIndices = lazy(() => import("./pages/markets/stocks/MajorIndices"));
const StockSectors = lazy(() => import("./pages/markets/stocks/StockSectors"));
const Bitcoin = lazy(() => import("./pages/markets/crypto/Bitcoin"));
const Ethereum = lazy(() => import("./pages/markets/crypto/Ethereum"));
const Altcoins = lazy(() => import("./pages/markets/crypto/Altcoins"));

const App = () => (
  <TooltipProvider>
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
          <Route path="/tools/script-generator" element={withSuspense(<ScriptGenerator />)} />
          <Route path="/tools/economic-calendar" element={withSuspense(<EconomicCalendar />)} />
          <Route path="/email-preview" element={withSuspense(<EmailPreview />)} />
          <Route path="/chart-patterns/generator" element={withSuspense(<PatternGenerator />)} />
          <Route path="/chart-patterns/library" element={withSuspense(<PatternLibraryPage />)} />
          <Route path="/patterns/live" element={withSuspense(<LivePatternsPage />)} />
          <Route path="/study" element={withSuspense(<TickerStudy />)} />
          <Route path="/study/:symbol" element={withSuspense(<TickerStudy />)} />
          <Route path="/chart-patterns/strategies" element={withSuspense(<TradingStrategiesPage />)} />
          <Route path="/chart-patterns/quiz" element={withSuspense(<PatternQuizPage />)} />
          <Route path="/quiz/pattern-identification" element={withSuspense(<PatternIdentificationQuizPage />)} />
          <Route path="/quiz/trading-knowledge" element={withSuspense(<TradingKnowledgeQuizPage />)} />
          <Route path="/quiz/stock-market" element={withSuspense(<StockMarketQuiz />)} />
          <Route path="/quiz/forex" element={withSuspense(<ForexQuiz />)} />
          <Route path="/quiz/crypto" element={withSuspense(<CryptoQuiz />)} />
          <Route path="/quiz/commodities" element={withSuspense(<CommoditiesQuiz />)} />
          <Route path="/learn" element={withSuspense(<BlogV2 />)} />
          <Route path="/blog/:slug" element={withSuspense(<DynamicArticle />)} />
          <Route path="/learn/head-and-shoulders" element={withSuspense(<HeadAndShoulders />)} />
          <Route path="/learn/double-top-bottom" element={withSuspense(<DoubleTopBottom />)} />
          <Route path="/learn/triangle-patterns" element={withSuspense(<TrianglePatterns />)} />
          <Route path="/learn/wedge-patterns" element={withSuspense(<WedgePatterns />)} />
          <Route path="/learn/flag-pennant" element={withSuspense(<FlagPennant />)} />
          <Route path="/learn/cup-and-handle" element={withSuspense(<CupAndHandle />)} />
          <Route path="/learn/rectangle-pattern" element={withSuspense(<RectanglePattern />)} />
          <Route path="/learn/support-resistance" element={withSuspense(<SupportResistance />)} />
          <Route path="/learn/trend-analysis" element={withSuspense(<TrendAnalysis />)} />
          <Route path="/learn/volume-analysis" element={withSuspense(<VolumeAnalysis />)} />
          <Route path="/learn/moving-averages" element={withSuspense(<MovingAverages />)} />
          <Route path="/learn/rsi-indicator" element={withSuspense(<RSIIndicator />)} />
          <Route path="/learn/macd-indicator" element={withSuspense(<MACDIndicator />)} />
          <Route path="/learn/fibonacci-retracements" element={withSuspense(<FibonacciRetracements />)} />
          <Route path="/learn/candlestick-patterns" element={withSuspense(<CandlestickPatterns />)} />
          <Route path="/learn/price-action-basics" element={withSuspense(<PriceActionBasics />)} />
          <Route path="/learn/breakout-trading" element={withSuspense(<BreakoutTrading />)} />
          <Route path="/learn/pin-bar-strategy" element={withSuspense(<PinBarStrategy />)} />
          <Route path="/learn/risk-management" element={withSuspense(<RiskManagement />)} />
          <Route path="/learn/position-sizing" element={withSuspense(<PositionSizing />)} />
          <Route path="/learn/money-management" element={withSuspense(<MoneyManagement />)} />
          <Route path="/learn/trading-psychology" element={withSuspense(<TradingPsychology />)} />
          <Route path="/learn/trading-discipline" element={withSuspense(<TradingDiscipline />)} />
          <Route path="/learn/fear-and-greed" element={withSuspense(<FearAndGreed />)} />
          <Route path="/learn/trading-journal" element={withSuspense(<TradingJournal />)} />
          <Route path="/learn/trading-strategies-guide" element={withSuspense(<TradingStrategiesGuide />)} />
          <Route path="/learn/strategies/scalping" element={withSuspense(<ScalpingStrategy />)} />
          <Route path="/learn/strategies/day-trading" element={withSuspense(<DayTradingStrategy />)} />
          <Route path="/learn/strategies/trend-following" element={withSuspense(<TrendFollowingStrategy />)} />
          <Route path="/learn/strategies/breakout" element={withSuspense(<BreakoutStrategy />)} />
          <Route path="/learn/strategies/mean-reversion" element={withSuspense(<MeanReversionStrategy />)} />
          <Route path="/learn/strategies/momentum" element={withSuspense(<MomentumStrategy />)} />
          <Route path="/learn/strategies/swing-trading" element={withSuspense(<SwingTradingStrategy />)} />
          <Route path="/learn/strategies/position-trading" element={withSuspense(<PositionTradingStrategy />)} />
          <Route path="/learn/strategies/macd-strategy" element={withSuspense(<MACDStrategy />)} />
          <Route path="/learn/strategies/bollinger-bands" element={withSuspense(<BollingerBandsStrategy />)} />
          <Route path="/learn/strategies/rsi-divergence" element={withSuspense(<RSIDivergenceStrategy />)} />
          <Route path="/learn/strategies/vwap" element={withSuspense(<VWAPStrategy />)} />
          <Route path="/learn/strategies/fibonacci" element={withSuspense(<FibonacciStrategy />)} />
          <Route path="/learn/strategies/support-resistance" element={withSuspense(<SupportResistanceStrategy />)} />
          <Route path="/learn/strategies/gap-trading" element={withSuspense(<GapTradingStrategy />)} />
          <Route path="/markets/stocks" element={withSuspense(<StockMarket />)} />
          <Route path="/markets/stocks/indices" element={withSuspense(<MajorIndices />)} />
          <Route path="/markets/stocks/sectors" element={withSuspense(<StockSectors />)} />
          <Route path="/markets/forex" element={withSuspense(<ForexMarket />)} />
          <Route path="/markets/forex/major-pairs" element={withSuspense(<MajorCurrencyPairs />)} />
          <Route path="/markets/forex/cross-pairs" element={withSuspense(<CrossCurrencyPairs />)} />
          <Route path="/markets/crypto" element={withSuspense(<CryptoMarket />)} />
          <Route path="/markets/crypto/bitcoin" element={withSuspense(<Bitcoin />)} />
          <Route path="/markets/crypto/ethereum" element={withSuspense(<Ethereum />)} />
          <Route path="/markets/crypto/altcoins" element={withSuspense(<Altcoins />)} />
          <Route path="/markets/commodities" element={withSuspense(<CommodityMarket />)} />
          <Route path="/markets/commodities/energy" element={withSuspense(<EnergyCommodities />)} />
          <Route path="/markets/commodities/precious-metals" element={withSuspense(<PreciousMetals />)} />
          <Route path="/markets/commodities/agricultural" element={withSuspense(<AgriculturalCommodities />)} />
          <Route path="/markets/commodities/industrial-metals" element={withSuspense(<IndustrialMetals />)} />
          <Route path="/strategy-workspace" element={withSuspense(<StrategyWorkspace />)} />
          <Route path="/ai-builder" element={<Navigate to="/strategy-workspace" replace />} />
          <Route path="/backtest" element={<Navigate to="/strategy-workspace" replace />} />
          <Route path="/projects" element={withSuspense(<Projects />)} />
          <Route path="/projects/pricing" element={withSuspense(<ProjectsPricing />)} />
          <Route path="/projects/setup-finder/new" element={<Navigate to="/projects/pattern-lab/new" replace />} />
          <Route path="/projects/pattern-lab/new" element={withSuspense(<PatternLabWizard />)} />
          <Route path="/projects/pattern-lab/audit" element={withSuspense(<PatternAuditPage />)} />
          <Route path="/projects/portfolio-sim/new" element={withSuspense(<PortfolioSimulatorWizard />)} />
          <Route path="/projects/runs/:runId" element={withSuspense(<ProjectRun />)} />
          
          <Route path="/pricing" element={<Navigate to="/projects/pricing" replace />} />
          <Route path="/members/dashboard" element={withSuspense(<MemberDashboard />)} />
          <Route path="/elite" element={withSuspense(<EliteDashboard />)} />
          <Route path="/share/:token" element={withSuspense(<SharedBacktest />)} />
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
          <Route path="/admin/journey-analytics" element={withSuspense(<AIJourneyAnalytics />)} />
          <Route path="/admin/social-cms" element={withSuspense(<SocialMediaCMS />)} />
          <Route path="/strategy/:strategyId" element={withSuspense(<StrategyDetail />)} />
          <Route path="/terms" element={withSuspense(<Terms />)} />
          <Route path="/privacy" element={withSuspense(<Privacy />)} />
          <Route path="/faq" element={withSuspense(<FAQ />)} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={withSuspense(<NotFound />)} />
        </Routes>
      </Layout>
    </TooltipProvider>
);

export default App;
