import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { StrategyDetail } from "./pages/StrategyDetail";
import PipCalculator from "./pages/PipCalculator";
import RiskCalculator from "./pages/RiskCalculator";
import ScriptGenerator from "./pages/ScriptGenerator";
import Pricing from "./pages/Pricing";
import MemberScripts from "./pages/MemberScripts";
import MemberCourses from "./pages/MemberCourses";
import MemberDownloads from "./pages/MemberDownloads";
import MemberCommunity from "./pages/MemberCommunity";
import MemberAlerts from "./pages/MemberAlerts";
import MemberAccount from "./pages/MemberAccount";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PatternGenerator from "./pages/PatternGenerator";
import PatternLibraryPage from "./pages/PatternLibraryPage";
import TradingStrategiesPage from "./pages/TradingStrategiesPage";
import PatternQuizPage from "./pages/PatternQuizPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AIBuilder from "./pages/AIBuilder";
import Forge from "./pages/Forge";
import PaperTrading from "./pages/PaperTrading";
import BacktestWorkspace from "./pages/BacktestWorkspace";
import BacktestVault from "./pages/BacktestVault";
import { TranslationManagement } from "./pages/TranslationManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/pip-calculator" element={<PipCalculator />} />
          <Route path="/tools/risk-calculator" element={<RiskCalculator />} />
          <Route path="/tools/script-generator" element={<ScriptGenerator />} />
          <Route path="/chart-patterns/generator" element={<PatternGenerator />} />
          <Route path="/chart-patterns/library" element={<PatternLibraryPage />} />
          <Route path="/chart-patterns/strategies" element={<TradingStrategiesPage />} />
          <Route path="/chart-patterns/quiz" element={<PatternQuizPage />} />
          <Route path="/ai-builder" element={<AIBuilder />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/members/trading" element={<PaperTrading />} />
          <Route path="/backtest" element={<BacktestWorkspace />} />
          <Route path="/vault" element={<BacktestVault />} />
          <Route path="/members/scripts" element={<MemberScripts />} />
          <Route path="/members/courses" element={<MemberCourses />} />
          <Route path="/members/downloads" element={<MemberDownloads />} />
          <Route path="/members/community" element={<MemberCommunity />} />
          <Route path="/members/alerts" element={<MemberAlerts />} />
          <Route path="/members/account" element={<MemberAccount />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/translations" element={<TranslationManagement />} />
          <Route path="/strategy/:strategyId" element={<StrategyDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
