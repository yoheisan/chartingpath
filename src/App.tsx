import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import MemberCourses from "./pages/MemberCourses";
import MemberDownloads from "./pages/MemberDownloads";
import MemberAlerts from "./pages/MemberAlerts";
import MemberAccount from "./pages/MemberAccount";
import MemberDashboard from "./pages/MemberDashboard";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PatternGenerator from "./pages/PatternGenerator";
import PatternLibraryPage from "./pages/PatternLibraryPage";
import TradingStrategiesPage from "./pages/TradingStrategiesPage";
import PatternQuizPage from "./pages/PatternQuizPage";
import PatternIdentificationQuizPage from "./pages/PatternIdentificationQuizPage";
import TradingKnowledgeQuizPage from "./pages/TradingKnowledgeQuizPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import AIBuilder from "./pages/AIBuilder";
import Forge from "./pages/Forge";
import PaperTrading from "./pages/PaperTrading";
import BacktestWorkspace from "./pages/BacktestWorkspace";
import BacktestVault from "./pages/BacktestVault";
import StrategyWorkspace from "./pages/StrategyWorkspace";
import EliteDashboard from "./pages/EliteDashboard";
import { TranslationManagement } from "./pages/TranslationManagement";
import StockMarket from "./pages/markets/StockMarket";
import ForexMarket from "./pages/markets/ForexMarket";
import CryptoMarket from "./pages/markets/CryptoMarket";
import CommodityMarket from "./pages/markets/CommodityMarket";
import EnergyCommodities from "./pages/markets/commodities/EnergyCommodities";
import PreciousMetals from "./pages/markets/commodities/PreciousMetals";
import AgriculturalCommodities from "./pages/markets/commodities/AgriculturalCommodities";
import IndustrialMetals from "./pages/markets/commodities/IndustrialMetals";
import MajorCurrencyPairs from "./pages/markets/forex/MajorCurrencyPairs";
import CrossCurrencyPairs from "./pages/markets/forex/CrossCurrencyPairs";
import MajorIndices from "./pages/markets/stocks/MajorIndices";
import StockSectors from "./pages/markets/stocks/StockSectors";
import Bitcoin from "./pages/markets/crypto/Bitcoin";
import Ethereum from "./pages/markets/crypto/Ethereum";
import Altcoins from "./pages/markets/crypto/Altcoins";
import Blog from "./pages/Blog";
import HeadAndShoulders from "./pages/blog/HeadAndShoulders";
import DoubleTopBottom from "./pages/blog/DoubleTopBottom";
import TrianglePatterns from "./pages/blog/TrianglePatterns";
import WedgePatterns from "./pages/blog/WedgePatterns";
import FlagPennant from "./pages/blog/FlagPennant";
import CupAndHandle from "./pages/blog/CupAndHandle";
import SupportResistance from "./pages/blog/SupportResistance";
import TrendAnalysis from "./pages/blog/TrendAnalysis";
import VolumeAnalysis from "./pages/blog/VolumeAnalysis";
import CandlestickPatterns from "./pages/blog/CandlestickPatterns";
import RiskManagement from "./pages/blog/RiskManagement";
import TradingPsychology from "./pages/blog/TradingPsychology";
import RectanglePattern from "./pages/blog/RectanglePattern";
import MovingAverages from "./pages/blog/MovingAverages";
import RSIIndicator from "./pages/blog/RSIIndicator";
import MACDIndicator from "./pages/blog/MACDIndicator";
import FibonacciRetracements from "./pages/blog/FibonacciRetracements";
import PriceActionBasics from "./pages/blog/PriceActionBasics";
import BreakoutTrading from "./pages/blog/BreakoutTrading";
import PinBarStrategy from "./pages/blog/PinBarStrategy";
import PositionSizing from "./pages/blog/PositionSizing";
import MoneyManagement from "./pages/blog/MoneyManagement";
import TradingDiscipline from "./pages/blog/TradingDiscipline";
import FearAndGreed from "./pages/blog/FearAndGreed";
import TradingJournal from "./pages/blog/TradingJournal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/tools/pip-calculator" element={<PipCalculator />} />
          <Route path="/tools/risk-calculator" element={<RiskCalculator />} />
          <Route path="/tools/market-breadth" element={<MarketBreadthReport />} />
          <Route path="/tools/script-generator" element={<ScriptGenerator />} />
          <Route path="/chart-patterns/generator" element={<PatternGenerator />} />
          <Route path="/chart-patterns/library" element={<PatternLibraryPage />} />
          <Route path="/chart-patterns/strategies" element={<TradingStrategiesPage />} />
          <Route path="/chart-patterns/quiz" element={<PatternQuizPage />} />
          <Route path="/quiz/pattern-identification" element={<PatternIdentificationQuizPage />} />
          <Route path="/quiz/trading-knowledge" element={<TradingKnowledgeQuizPage />} />
          <Route path="/learn" element={<Blog />} />
          <Route path="/learn/head-and-shoulders" element={<HeadAndShoulders />} />
          <Route path="/learn/double-top-bottom" element={<DoubleTopBottom />} />
          <Route path="/learn/triangle-patterns" element={<TrianglePatterns />} />
          <Route path="/learn/wedge-patterns" element={<WedgePatterns />} />
          <Route path="/learn/flag-pennant" element={<FlagPennant />} />
          <Route path="/learn/cup-and-handle" element={<CupAndHandle />} />
          <Route path="/learn/rectangle-pattern" element={<RectanglePattern />} />
          <Route path="/learn/support-resistance" element={<SupportResistance />} />
          <Route path="/learn/trend-analysis" element={<TrendAnalysis />} />
          <Route path="/learn/volume-analysis" element={<VolumeAnalysis />} />
          <Route path="/learn/moving-averages" element={<MovingAverages />} />
          <Route path="/learn/rsi-indicator" element={<RSIIndicator />} />
          <Route path="/learn/macd-indicator" element={<MACDIndicator />} />
          <Route path="/learn/fibonacci-retracements" element={<FibonacciRetracements />} />
          <Route path="/learn/candlestick-patterns" element={<CandlestickPatterns />} />
          <Route path="/learn/price-action-basics" element={<PriceActionBasics />} />
          <Route path="/learn/breakout-trading" element={<BreakoutTrading />} />
          <Route path="/learn/pin-bar-strategy" element={<PinBarStrategy />} />
          <Route path="/learn/risk-management" element={<RiskManagement />} />
          <Route path="/learn/position-sizing" element={<PositionSizing />} />
          <Route path="/learn/money-management" element={<MoneyManagement />} />
          <Route path="/learn/trading-psychology" element={<TradingPsychology />} />
          <Route path="/learn/trading-discipline" element={<TradingDiscipline />} />
          <Route path="/learn/fear-and-greed" element={<FearAndGreed />} />
          <Route path="/learn/trading-journal" element={<TradingJournal />} />
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
          <Route path="/markets/commodities" element={<CommodityMarket />} />
          <Route path="/markets/commodities/energy" element={<EnergyCommodities />} />
          <Route path="/markets/commodities/precious-metals" element={<PreciousMetals />} />
          <Route path="/markets/commodities/agricultural" element={<AgriculturalCommodities />} />
          <Route path="/markets/commodities/industrial-metals" element={<IndustrialMetals />} />
          <Route path="/strategy-workspace" element={<StrategyWorkspace />} />
          <Route path="/ai-builder" element={<Navigate to="/strategy-workspace" replace />} />
          <Route path="/backtest" element={<Navigate to="/strategy-workspace" replace />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/members/dashboard" element={<MemberDashboard />} />
          <Route path="/members/trading" element={<PaperTrading />} />
          <Route path="/vault" element={<BacktestVault />} />
          <Route path="/elite" element={<EliteDashboard />} />
          <Route path="/members/scripts" element={<MemberScripts />} />
          <Route path="/members/courses" element={<MemberCourses />} />
          <Route path="/members/downloads" element={<MemberDownloads />} />
          <Route path="/members/alerts" element={<MemberAlerts />} />
          <Route path="/members/account" element={<MemberAccount />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/translation-management" element={<TranslationManagement />} />
          <Route path="/strategy/:strategyId" element={<StrategyDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<FAQ />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
