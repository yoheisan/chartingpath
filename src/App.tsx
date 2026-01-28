import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import { StrategyDetail } from "./pages/StrategyDetail";
import PipCalculator from "./pages/PipCalculator";
import RiskCalculator from "./pages/RiskCalculator";
import MarketBreadthReport from "./pages/MarketBreadthReport";
import ScriptGenerator from "./pages/ScriptGenerator";
import Pricing from "./pages/Pricing";
import MemberScripts from "./pages/MemberScripts";
import MemberDownloads from "./pages/MemberDownloads";
import MemberAlerts from "./pages/MemberAlerts";
import MemberAccount from "./pages/MemberAccount";
import MemberDashboard from "./pages/MemberDashboard";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import AdminContentManagement from "./pages/AdminContentManagement";
import PatternGenerator from "./pages/PatternGenerator";
import PatternLibraryPage from "./pages/PatternLibraryPage";
import TradingStrategiesPage from "./pages/TradingStrategiesPage";
import PatternQuizPage from "./pages/PatternQuizPage";
import PatternIdentificationQuizPage from "./pages/PatternIdentificationQuizPage";
import TradingKnowledgeQuizPage from "./pages/TradingKnowledgeQuizPage";
import StockMarketQuiz from "./pages/StockMarketQuiz";
import ForexQuiz from "./pages/ForexQuiz";
import CryptoQuiz from "./pages/CryptoQuiz";
import CommoditiesQuiz from "./pages/CommoditiesQuiz";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AIBuilder from "./pages/AIBuilder";
import Forge from "./pages/Forge";
import PaperTrading from "./pages/PaperTrading";
import BacktestWorkspace from "./pages/BacktestWorkspace";
import BacktestVault from "./pages/BacktestVault";
import StrategyWorkspace from "./pages/StrategyWorkspace";
import EliteDashboard from "./pages/EliteDashboard";
import SharedBacktest from "./pages/SharedBacktest";
import { TranslationManagement } from "./pages/TranslationManagement";
import Projects from "./pages/Projects";
import ProjectsPricing from "./pages/ProjectsPricing";
import SetupFinderWizard from "./pages/projects/SetupFinderWizard";
import PatternLabWizard from "./pages/projects/PatternLabWizard";
import PortfolioCheckupWizard from "./pages/projects/PortfolioCheckupWizard";
import PortfolioSimulatorWizard from "./pages/projects/PortfolioSimulatorWizard";

import StockMarket from "./pages/markets/StockMarket";
import ForexMarket from "./pages/markets/ForexMarket";
import CryptoMarket from "./pages/markets/CryptoMarket";

import EnergyCommodities from "./pages/markets/commodities/EnergyCommodities";
import PreciousMetals from "./pages/markets/commodities/PreciousMetals";
import AgriculturalCommodities from "./pages/markets/commodities/AgriculturalCommodities";
import MajorCurrencyPairs from "./pages/markets/forex/MajorCurrencyPairs";
import CrossCurrencyPairs from "./pages/markets/forex/CrossCurrencyPairs";
import MajorIndices from "./pages/markets/stocks/MajorIndices";
import StockSectors from "./pages/markets/stocks/StockSectors";
import Bitcoin from "./pages/markets/crypto/Bitcoin";
import Ethereum from "./pages/markets/crypto/Ethereum";
import Altcoins from "./pages/markets/crypto/Altcoins";
import BlogV2 from "./pages/BlogV2";
import EmailPreview from "./pages/EmailPreview";
import EconomicCalendar from "./pages/EconomicCalendar";
import SocialMediaCMS from "./pages/SocialMediaCMS";
import { PageCaptureButton } from "./components/dev/PageCaptureButton";

// Reusable loading fallback
const PageLoader = () => (
  <div className="container mx-auto px-6 py-12 text-muted-foreground">Loading…</div>
);

// Lazy-load blog pages - reduces initial bundle by ~60-80%
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

// Lazy-load other heavy pages
const FAQ = lazy(() => import("./pages/FAQ"));
const MemberCourses = lazy(() => import("./pages/MemberCourses"));
const IndustrialMetals = lazy(() => import("./pages/markets/commodities/IndustrialMetals"));
const ProjectRun = lazy(() => import("./pages/projects/ProjectRun"));
const CommodityMarket = lazy(() => import("./pages/markets/CommodityMarket"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LivePatternsPage = lazy(() => import("./pages/LivePatternsPage"));
const TickerStudy = lazy(() => import("./pages/TickerStudy"));
const AdminKPIDashboard = lazy(() => import("./pages/admin/AdminKPIDashboard"));
const AIJourneyAnalytics = lazy(() => import("./pages/admin/AIJourneyAnalytics"));

const App = () => (
  <TooltipProvider>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <PageCaptureButton />
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/tools/pip-calculator" element={<PipCalculator />} />
          <Route path="/tools/risk-calculator" element={<RiskCalculator />} />
          <Route path="/tools/market-breadth" element={<MarketBreadthReport />} />
          <Route path="/tools/script-generator" element={<ScriptGenerator />} />
          <Route path="/tools/economic-calendar" element={<EconomicCalendar />} />
          <Route path="/email-preview" element={<EmailPreview />} />
          <Route path="/chart-patterns/generator" element={<PatternGenerator />} />
          <Route path="/chart-patterns/library" element={<PatternLibraryPage />} />
          <Route path="/patterns/live" element={<Suspense fallback={<PageLoader />}><LivePatternsPage /></Suspense>} />
          <Route path="/study" element={<Suspense fallback={<PageLoader />}><TickerStudy /></Suspense>} />
          <Route path="/study/:symbol" element={<Suspense fallback={<PageLoader />}><TickerStudy /></Suspense>} />
          <Route path="/chart-patterns/strategies" element={<TradingStrategiesPage />} />
          <Route path="/chart-patterns/quiz" element={<PatternQuizPage />} />
          <Route path="/quiz/pattern-identification" element={<PatternIdentificationQuizPage />} />
          <Route path="/quiz/trading-knowledge" element={<TradingKnowledgeQuizPage />} />
          <Route path="/quiz/stock-market" element={<StockMarketQuiz />} />
          <Route path="/quiz/forex" element={<ForexQuiz />} />
          <Route path="/quiz/crypto" element={<CryptoQuiz />} />
          <Route path="/quiz/commodities" element={<CommoditiesQuiz />} />
          <Route path="/learn" element={<BlogV2 />} />
          <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><DynamicArticle /></Suspense>} />
          <Route path="/learn/head-and-shoulders" element={<Suspense fallback={<PageLoader />}><HeadAndShoulders /></Suspense>} />
          <Route path="/learn/double-top-bottom" element={<Suspense fallback={<PageLoader />}><DoubleTopBottom /></Suspense>} />
          <Route path="/learn/triangle-patterns" element={<Suspense fallback={<PageLoader />}><TrianglePatterns /></Suspense>} />
          <Route path="/learn/wedge-patterns" element={<Suspense fallback={<PageLoader />}><WedgePatterns /></Suspense>} />
          <Route path="/learn/flag-pennant" element={<Suspense fallback={<PageLoader />}><FlagPennant /></Suspense>} />
          <Route path="/learn/cup-and-handle" element={<Suspense fallback={<PageLoader />}><CupAndHandle /></Suspense>} />
          <Route path="/learn/rectangle-pattern" element={<Suspense fallback={<PageLoader />}><RectanglePattern /></Suspense>} />
          <Route path="/learn/support-resistance" element={<Suspense fallback={<PageLoader />}><SupportResistance /></Suspense>} />
          <Route path="/learn/trend-analysis" element={<Suspense fallback={<PageLoader />}><TrendAnalysis /></Suspense>} />
          <Route path="/learn/volume-analysis" element={<Suspense fallback={<PageLoader />}><VolumeAnalysis /></Suspense>} />
          <Route path="/learn/moving-averages" element={<Suspense fallback={<PageLoader />}><MovingAverages /></Suspense>} />
          <Route path="/learn/rsi-indicator" element={<Suspense fallback={<PageLoader />}><RSIIndicator /></Suspense>} />
          <Route path="/learn/macd-indicator" element={<Suspense fallback={<PageLoader />}><MACDIndicator /></Suspense>} />
          <Route path="/learn/fibonacci-retracements" element={<Suspense fallback={<PageLoader />}><FibonacciRetracements /></Suspense>} />
          <Route path="/learn/candlestick-patterns" element={<Suspense fallback={<PageLoader />}><CandlestickPatterns /></Suspense>} />
          <Route path="/learn/price-action-basics" element={<Suspense fallback={<PageLoader />}><PriceActionBasics /></Suspense>} />
          <Route path="/learn/breakout-trading" element={<Suspense fallback={<PageLoader />}><BreakoutTrading /></Suspense>} />
          <Route path="/learn/pin-bar-strategy" element={<Suspense fallback={<PageLoader />}><PinBarStrategy /></Suspense>} />
          <Route path="/learn/risk-management" element={<Suspense fallback={<PageLoader />}><RiskManagement /></Suspense>} />
          <Route path="/learn/position-sizing" element={<Suspense fallback={<PageLoader />}><PositionSizing /></Suspense>} />
          <Route path="/learn/money-management" element={<Suspense fallback={<PageLoader />}><MoneyManagement /></Suspense>} />
          <Route path="/learn/trading-psychology" element={<Suspense fallback={<PageLoader />}><TradingPsychology /></Suspense>} />
          <Route path="/learn/trading-discipline" element={<Suspense fallback={<PageLoader />}><TradingDiscipline /></Suspense>} />
          <Route path="/learn/fear-and-greed" element={<Suspense fallback={<PageLoader />}><FearAndGreed /></Suspense>} />
          <Route path="/learn/trading-journal" element={<Suspense fallback={<PageLoader />}><TradingJournal /></Suspense>} />
          <Route path="/markets/stocks" element={<StockMarket />} />
          <Route path="/markets/stocks/indices" element={<MajorIndices />} />
          <Route path="/markets/stocks/sectors" element={<StockSectors />} />
          <Route path="/markets/forex" element={<ForexMarket />} />
          <Route path="/markets/forex/major-pairs" element={<MajorCurrencyPairs />} />
          <Route path="/markets/forex/cross-pairs" element={<CrossCurrencyPairs />} />
          <Route path="/markets/crypto" element={<CryptoMarket />} />
          <Route path="/markets/crypto/bitcoin" element={<Bitcoin />} />
          <Route path="/markets/crypto/ethereum" element={<Ethereum />} />
          <Route path="/markets/crypto/altcoins" element={<Altcoins />} />
          <Route path="/markets/commodities" element={<Suspense fallback={<PageLoader />}><CommodityMarket /></Suspense>} />
          <Route path="/markets/commodities/energy" element={<EnergyCommodities />} />
          <Route path="/markets/commodities/precious-metals" element={<PreciousMetals />} />
          <Route path="/markets/commodities/agricultural" element={<AgriculturalCommodities />} />
          <Route path="/markets/commodities/industrial-metals" element={<Suspense fallback={<PageLoader />}><IndustrialMetals /></Suspense>} />
          <Route path="/strategy-workspace" element={<StrategyWorkspace />} />
          <Route path="/ai-builder" element={<Navigate to="/strategy-workspace" replace />} />
          <Route path="/backtest" element={<Navigate to="/strategy-workspace" replace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/pricing" element={<ProjectsPricing />} />
          <Route path="/projects/setup-finder/new" element={<SetupFinderWizard />} />
          <Route path="/projects/pattern-lab/new" element={<PatternLabWizard />} />
          <Route path="/projects/portfolio-checkup/new" element={<PortfolioCheckupWizard />} />
          <Route path="/projects/portfolio-sim/new" element={<PortfolioSimulatorWizard />} />
          <Route path="/projects/runs/:runId" element={<Suspense fallback={<PageLoader />}><ProjectRun /></Suspense>} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/pricing" element={<Navigate to="/projects/pricing" replace />} />
          <Route path="/members/dashboard" element={<MemberDashboard />} />
          <Route path="/members/trading" element={<PaperTrading />} />
          <Route path="/vault" element={<BacktestVault />} />
          <Route path="/elite" element={<EliteDashboard />} />
          <Route path="/share/:token" element={<SharedBacktest />} />
          <Route path="/members/scripts" element={<MemberScripts />} />
          <Route path="/members/courses" element={<Suspense fallback={<PageLoader />}><MemberCourses /></Suspense>} />
          <Route path="/members/downloads" element={<MemberDownloads />} />
          <Route path="/members/alerts" element={<MemberAlerts />} />
          <Route path="/members/account" element={<MemberAccount />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/*" element={<Auth />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/login/*" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/content" element={<AdminContentManagement />} />
          <Route path="/admin/kpi" element={<Suspense fallback={<PageLoader />}><AdminKPIDashboard /></Suspense>} />
          <Route path="/admin/translation-management" element={<TranslationManagement />} />
          <Route path="/admin/journey-analytics" element={<Suspense fallback={<PageLoader />}><AIJourneyAnalytics /></Suspense>} />
          <Route path="/admin/social-cms" element={<SocialMediaCMS />} />
          <Route path="/strategy/:strategyId" element={<StrategyDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<Suspense fallback={<PageLoader />}><FAQ /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </TooltipProvider>
);

export default App;
