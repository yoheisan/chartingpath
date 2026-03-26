import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { TradingCopilot, useTradingCopilotContext } from "./copilot";
import { useAuth } from "@/contexts/AuthContext";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";
import { usePageTracking } from "@/hooks/usePageTracking";
import { GuestSignupNudge } from "./GuestSignupNudge";
import { OnboardingTour } from "./onboarding/OnboardingTour";
import { ActivationChecklist } from "./onboarding/ActivationChecklist";
import { CaptureButton } from "./capture";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

// Routes that use full-screen mode (no footer, no scroll)
const FULLSCREEN_ROUTES = ['/members/dashboard', '/copilot'];

// Routes where copilot floating button should not appear
// On mobile /copilot, we still need it so the Chat tab can open it
const COPILOT_EXCLUDED_ROUTES_DESKTOP = ['/auth', '/admin', '/copilot'];
const COPILOT_EXCLUDED_ROUTES_MOBILE = ['/auth', '/admin'];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const copilot = useTradingCopilotContext();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  // Prefetch member route chunks once authenticated
  usePrefetchRoutes(isAuthenticated);
  
  // Track page views & time-on-page
  usePageTracking();
  
  const isFullscreen = FULLSCREEN_ROUTES.some(route => location.pathname.startsWith(route));
  const excludedRoutes = isMobile ? COPILOT_EXCLUDED_ROUTES_MOBILE : COPILOT_EXCLUDED_ROUTES_DESKTOP;
  const showCopilot = !excludedRoutes.some(route => location.pathname.startsWith(route));

  if (isFullscreen) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Navigation />
        <main className="flex-1 min-h-0">
          {children}
        </main>
        {showCopilot && (
          <TradingCopilot
            isExpanded={copilot.isOpen}
            onToggle={copilot.toggle}
            pendingContext={copilot.pendingContext}
            pendingAnalysis={copilot.pendingAnalysis}
            onContextConsumed={copilot.consumePendingContext}
            pendingPlanBuilder={copilot.pendingPlanBuilder}
            pendingNewPlan={copilot.pendingNewPlan}
            onPlanBuilderConsumed={copilot.consumePendingPlanBuilder}
          />
        )}
        <CaptureButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      {showCopilot && (
        <TradingCopilot
          isExpanded={copilot.isOpen}
          onToggle={copilot.toggle}
          pendingContext={copilot.pendingContext}
          pendingAnalysis={copilot.pendingAnalysis}
          onContextConsumed={copilot.consumePendingContext}
          pendingPlanBuilder={copilot.pendingPlanBuilder}
          pendingNewPlan={copilot.pendingNewPlan}
          onPlanBuilderConsumed={copilot.consumePendingPlanBuilder}
        />
      )}
      <GuestSignupNudge />
      <OnboardingTour />
      <ActivationChecklist />
      <CaptureButton />
    </div>
  );
};

export default Layout;
