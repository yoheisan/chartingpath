import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Layout from "@/components/Layout";
import Auth from "@/pages/Auth";
import AdminLogin from "@/pages/AdminLogin";
import { PageCaptureButton } from "@/components/dev/PageCaptureButton";
import { CommandPaletteProvider } from "@/components/command-palette";
import { TradingCopilotProvider } from "@/components/copilot";

export default function AuthShell() {
  return (
    <TooltipProvider>
      <CommandPaletteProvider>
        <TradingCopilotProvider>
          <Toaster />
          <Sonner />
          <ScrollToTop />
          <PageCaptureButton />
          <Layout>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/" element={<Auth />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/login/" element={<AdminLogin />} />
              <Route path="/admin/login/*" element={<AdminLogin />} />
            </Routes>
          </Layout>
        </TradingCopilotProvider>
      </CommandPaletteProvider>
    </TooltipProvider>
  );
}
