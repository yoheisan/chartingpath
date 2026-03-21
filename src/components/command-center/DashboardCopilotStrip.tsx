export function DashboardCopilotBar() {
  return (
    <div className="w-full px-4 py-2 flex items-center gap-3 bg-blue-500/5 border-b border-blue-500/20">
      {/* Avatar */}
      <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-blue-400">C</span>
      </div>
      {/* Status text */}
      <p className="text-xs text-muted-foreground flex-1 truncate">
        Scanning 94 candidates. 3 setups shortlisted — waiting for breakout confirmation on NVDA.
      </p>
      {/* Paper running label */}
      <span className="text-[10px] text-muted-foreground shrink-0">Paper running</span>
    </div>
  );
}

export function DashboardAIStrip() {
  return (
    <div className="w-full bg-card border-b border-border/40">
      <div className="flex items-center">
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4">
          <span className="text-xs text-muted-foreground">Copilot today</span>
          <span className="text-sm font-bold font-mono text-green-500">+3.5R</span>
          <span className="text-[10px] font-mono text-muted-foreground">· 68% · 3 trades</span>
        </div>
        <div className="w-px h-8 bg-border/40" />
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4">
          <span className="text-xs text-muted-foreground">Your overrides</span>
          <span className="text-sm font-bold font-mono text-red-500">−2.0R</span>
          <span className="text-[10px] font-mono text-muted-foreground">· 33% · 1 trade</span>
        </div>
      </div>
      <div className="px-4 pb-1.5 -mt-1">
        <p className="text-[10px] text-muted-foreground/70 text-center">
          Momentum overrides are down 2.4R this week vs Copilot +6.1R
        </p>
      </div>
    </div>
  );
}
