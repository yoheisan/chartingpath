import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MarketReportProvider } from "@/contexts/MarketReportContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// Some environments incorrectly resolve auth callback URLs without the trailing slash
// (e.g. "/auth?code=..."), which can cause React Router to treat the query as part of the path.
// Normalize early before the router mounts.
const normalizeAuthCallbackPath = () => {
  const { pathname, search, hash } = window.location;
  if (!search.includes("code=")) return;

  if (pathname === "/auth") {
    window.location.replace(`/auth/${search}${hash}`);
    return;
  }

  if (pathname === "/admin/login") {
    window.location.replace(`/admin/login/${search}${hash}`);
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
              <App />
            </ErrorBoundary>
          </MarketReportProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
