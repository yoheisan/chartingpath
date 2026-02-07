import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { TradingCopilot, useTradingCopilot } from "./copilot";

interface LayoutProps {
  children: ReactNode;
}

// Routes that use full-screen mode (no footer, no scroll)
const FULLSCREEN_ROUTES = ['/members/dashboard'];

// Routes where copilot should not appear
const COPILOT_EXCLUDED_ROUTES = ['/auth', '/admin'];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isOpen, toggle } = useTradingCopilot();
  
  const isFullscreen = FULLSCREEN_ROUTES.some(route => location.pathname.startsWith(route));
  const showCopilot = !COPILOT_EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));

  if (isFullscreen) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Navigation />
        <main className="flex-1 min-h-0">
          {children}
        </main>
        {showCopilot && <TradingCopilot isExpanded={isOpen} onToggle={toggle} />}
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
      {showCopilot && <TradingCopilot isExpanded={isOpen} onToggle={toggle} />}
    </div>
  );
};

export default Layout;
