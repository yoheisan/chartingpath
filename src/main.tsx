import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MarketReportProvider } from "@/contexts/MarketReportContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Bootstrap from "./Bootstrap";
import "./index.css";
import "./i18n/config";

// Some environments incorrectly resolve auth callback URLs without the trailing slash
// (e.g. "/auth?code=..."), which can cause React Router to treat the query as part of the path.
// Normalize early before the router mounts.
const normalizeAuthCallbackPath = () => {
  const { pathname, search, hash } = window.location;

  // Only normalize when a query string exists (callbacks + redirects).
  if (!search) return;

  // IMPORTANT: do not trigger a network navigation here.
  // Some hosts won't serve SPA deep-links like "/auth/" and could return a raw 404.
  // We only adjust the URL using the History API before React Router mounts.
  if (pathname === "/auth") {
    window.history.replaceState(null, "", `/auth/${search}${hash}`);
    return;
  }

  if (pathname === "/admin/login") {
    window.history.replaceState(null, "", `/admin/login/${search}${hash}`);
  }
};

normalizeAuthCallbackPath();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MarketReportProvider>
            <ErrorBoundary>
              <Bootstrap />
            </ErrorBoundary>
          </MarketReportProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
