import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { StrategyDetail } from "./components/StrategyDetail";
import PipCalculator from "./pages/PipCalculator";
import RiskCalculator from "./pages/RiskCalculator";
import ScriptGenerator from "./pages/ScriptGenerator";
import Pricing from "./pages/Pricing";
import MemberScripts from "./pages/MemberScripts";
import MemberCourses from "./pages/MemberCourses";
import MemberDownloads from "./pages/MemberDownloads";
import MemberCommunity from "./pages/MemberCommunity";
import MemberAlerts from "./pages/MemberAlerts";
import Auth from "./pages/Auth";

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
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/members/scripts" element={<MemberScripts />} />
          <Route path="/members/courses" element={<MemberCourses />} />
          <Route path="/members/downloads" element={<MemberDownloads />} />
          <Route path="/members/community" element={<MemberCommunity />} />
          <Route path="/members/alerts" element={<MemberAlerts />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/strategy/:strategyId" element={<StrategyDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
