import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { CommandPalette, CommandPaletteTrigger, useCommandPalette } from "./command-palette";
import { TradingCopilot, useTradingCopilotContext } from "./copilot";

interface LayoutProps {
  children: ReactNode;
}

// Routes that use full-screen mode (no footer, no scroll)
const FULLSCREEN_ROUTES = ['/members/dashboard'];

// Routes where command palette should not appear
const COMMAND_EXCLUDED_ROUTES = ['/auth', '/admin'];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isOpen, close } = useCommandPalette();
  const copilot = useTradingCopilotContext();
  
  const isFullscreen = FULLSCREEN_ROUTES.some(route => location.pathname.startsWith(route));
  const showCommandPalette = !COMMAND_EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));
  const showCopilot = !COMMAND_EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));

  if (isFullscreen) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Navigation />
        <main className="flex-1 min-h-0">
          {children}
        </main>
        {showCommandPalette && (
          <>
            <CommandPaletteTrigger />
            <CommandPalette isOpen={isOpen} onClose={close} />
          </>
        )}
        {showCopilot && (
          <TradingCopilot
            isExpanded={copilot.isOpen}
            onToggle={copilot.toggle}
            pendingContext={copilot.pendingContext}
            pendingAnalysis={copilot.pendingAnalysis}
            onContextConsumed={copilot.consumePendingContext}
          />
        )}
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
      {showCommandPalette && (
        <>
          <CommandPaletteTrigger />
          <CommandPalette isOpen={isOpen} onClose={close} />
        </>
      )}
      {showCopilot && (
        <TradingCopilot
          isExpanded={copilot.isOpen}
          onToggle={copilot.toggle}
          pendingContext={copilot.pendingContext}
          pendingAnalysis={copilot.pendingAnalysis}
          onContextConsumed={copilot.consumePendingContext}
        />
      )}
    </div>
  );
};

export default Layout;
