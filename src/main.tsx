import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MarketReportProvider } from "@/contexts/MarketReportContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScanNotificationListener } from "@/components/instruments/ScanNotificationListener";
import HreflangTags from "@/components/HreflangTags";
import Bootstrap from "./Bootstrap";
import "./index.css";
import "./i18n/config";

const METAMASK_EXTENSION_ID = "nkbihfbeogaeaoehlefnkodbefgpgknn";

const getUnhandledRejectionText = (reason: unknown) => {
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return `${reason.message}\n${reason.stack ?? ""}`;
  if (reason && typeof reason === "object") {
    const candidate = reason as { message?: unknown; stack?: unknown };
    return [candidate.message, candidate.stack]
      .filter((value): value is string => typeof value === "string")
      .join("\n");
  }
  return "";
};

const isIgnoredExtensionRejection = (reason: unknown) => {
  const text = getUnhandledRejectionText(reason);
  return (
    text.includes("Failed to connect to MetaMask") ||
    text.includes(`chrome-extension://${METAMASK_EXTENSION_ID}`)
  );
};

window.addEventListener("unhandledrejection", (event) => {
  if (isIgnoredExtensionRejection(event.reason)) {
    event.preventDefault();
  }
});

// Some environments incorrectly resolve auth callback URLs without the trailing slash
// (e.g. "/auth?code=..."), which can cause React Router to treat the query as part of the path.
// Normalize early before the router mounts.
const normalizeAuthCallbackPath = () => {
  const { pathname, search, hash } = window.location;

  // Support static hosts that don't rewrite deep links to index.html.
  // Our fallback HTML pages (e.g. /auth/index.html) redirect to "/?__lovable_path=<encoded>".
  // We translate that back into the intended SPA route without triggering a network navigation.
  if (search) {
    const params = new URLSearchParams(search);
    const forwarded = params.get("__lovable_path");
    if (forwarded) {
      try {
        const decoded = decodeURIComponent(forwarded);
        if (decoded.startsWith("/") && !decoded.startsWith("//")) {
          window.history.replaceState(null, "", decoded);
          // Re-run normalization on the new URL (e.g. /auth?code=... -> /auth/?code=...)
          normalizeAuthCallbackPath();
          return;
        }
      } catch {
        // Ignore invalid encoding
      }
    }
  }

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,    // 1 min — prevent refetch on every mount
      gcTime: 300_000,      // 5 min — keep cache alive across navigations
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MarketReportProvider>
              <ErrorBoundary>
                <ScanNotificationListener />
                <HreflangTags />
                <Bootstrap />
              </ErrorBoundary>
            </MarketReportProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
