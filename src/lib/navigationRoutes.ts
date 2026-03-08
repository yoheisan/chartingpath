export interface AppRoute {
  label: string;
  path: string;
  aliases: string[];
  description?: string;
}

export const APP_ROUTES: AppRoute[] = [
  { label: "Agent Scoring", path: "/tools/agent-scoring",
    aliases: ["scoring", "agents", "decide", "opportunities"] },
  { label: "Live Patterns", path: "/screener",
    aliases: ["screener", "discover", "scan", "patterns", "live"] },
  { label: "Pattern Lab", path: "/projects/pattern-lab/new",
    aliases: ["lab", "backtest", "validate", "pattern lab"] },
  { label: "Dashboard", path: "/dashboard",
    aliases: ["home", "overview", "main"] },
  { label: "Market Report", path: "/market-report",
    aliases: ["report", "market", "news"] },
  { label: "Portfolio", path: "/portfolio",
    aliases: ["portfolio", "positions", "holdings"] },
  { label: "Settings", path: "/settings",
    aliases: ["settings", "preferences", "account"] },
];

export function fuzzyMatchRoute(input: string): AppRoute | null {
  const normalised = input.toLowerCase().trim();
  const exact = APP_ROUTES.find(r =>
    r.label.toLowerCase() === normalised ||
    r.aliases.includes(normalised)
  );
  if (exact) return exact;
  const partial = APP_ROUTES.find(r =>
    r.aliases.some(a => normalised.includes(a) || a.includes(normalised)) ||
    r.label.toLowerCase().includes(normalised)
  );
  return partial ?? null;
}
