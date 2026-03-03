import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  LayoutDashboard,
  Search,
  FlaskConical,
  Bell,
  Code,
  GraduationCap,
  TrendingUp,
  BarChart3,
  BookOpen,
  Zap,
  Target,
  LineChart,
  Compass,
  Command as CommandIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItemData {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: "navigate" | "research" | "automate" | "learn" | "suggested";
  action: () => void;
  shortcut?: string;
  keywords?: string[];
  color?: string;
}

interface CommandPaletteContentProps {
  onClose: () => void;
  onAIQuery: (prompt: string) => void;
  isMobile?: boolean;
}

export function CommandPaletteContent({ onClose, onAIQuery, isMobile }: CommandPaletteContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleAction = (cmd: CommandItemData) => {
    cmd.action();
    if (cmd.category === "navigate") onClose();
  };

  const suggestedCommands: CommandItemData[] = useMemo(() => [
    {
      id: "find-patterns",
      label: "Find A-quality patterns forming now",
      description: "Search live detections across 8,500+ instruments",
      icon: Target,
      category: "suggested",
      action: () => onAIQuery("Show me the best A-quality patterns forming right now across major stocks and crypto"),
      keywords: ["patterns", "signals", "setups", "quality"],
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "market-overview",
      label: "What's moving in the markets?",
      description: "Get a quick market pulse with key patterns",
      icon: LineChart,
      category: "suggested",
      action: () => onAIQuery("Give me a quick market overview - what patterns are forming on SPY, QQQ, and BTC?"),
      keywords: ["market", "overview", "moving", "today"],
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: "generate-script",
      label: "Generate a Pine Script strategy",
      description: "Create TradingView-ready automation code",
      icon: Code,
      category: "suggested",
      action: () => onAIQuery("Help me create a Pine Script strategy. What pattern and instrument should we build it for?"),
      keywords: ["pine", "script", "tradingview", "strategy", "code"],
      color: "from-orange-500 to-red-600"
    },
    {
      id: "learn-pattern",
      label: "Teach me a chart pattern",
      description: "Interactive pattern education with examples",
      icon: BookOpen,
      category: "suggested",
      action: () => onAIQuery("I want to learn about chart patterns. Which pattern would you recommend I start with and why?"),
      keywords: ["learn", "education", "pattern", "teach"],
      color: "from-purple-500 to-pink-600"
    },
  ], [onAIQuery]);

  const navigationCommands: CommandItemData[] = useMemo(() => [
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "Command center with live charts",
      icon: LayoutDashboard,
      category: "navigate",
      action: () => navigate("/members/dashboard"),
      shortcut: isMobile ? undefined : "G D",
      keywords: ["home", "main", "chart"]
    },
    {
      id: "nav-screener",
      label: "Pattern Screener",
      description: "Scan live patterns across markets",
      icon: Search,
      category: "navigate",
      action: () => navigate("/patterns/live"),
      shortcut: isMobile ? undefined : "G S",
      keywords: ["scan", "filter", "find"]
    },
    {
      id: "nav-lab",
      label: "Pattern Lab",
      description: "Research & backtest patterns",
      icon: FlaskConical,
      category: "navigate",
      action: () => navigate("/projects/pattern-lab/new"),
      shortcut: isMobile ? undefined : "G L",
      keywords: ["backtest", "research", "analyze"]
    },
    {
      id: "nav-alerts",
      label: "My Alerts",
      description: "Manage pattern notifications",
      icon: Bell,
      category: "navigate",
      action: () => navigate("/members/alerts"),
      shortcut: isMobile ? undefined : "G A",
      keywords: ["notifications", "monitor"]
    },
    {
      id: "nav-scripts",
      label: "My Scripts",
      description: "Pine Script library",
      icon: Code,
      category: "navigate",
      action: () => navigate("/members/scripts"),
      shortcut: isMobile ? undefined : "G C",
      keywords: ["pine", "code", "automation"]
    },
    {
      id: "nav-learning",
      label: "Learning Center",
      description: "Pattern education & guides",
      icon: GraduationCap,
      category: "navigate",
      action: () => navigate("/learn"),
      shortcut: isMobile ? undefined : "G E",
      keywords: ["education", "tutorials", "guides"]
    },
  ], [navigate, isMobile]);

  const researchCommands: CommandItemData[] = useMemo(() => [
    {
      id: "research-bull-patterns",
      label: "Find bullish patterns",
      description: "Search for bull flags, ascending triangles, etc.",
      icon: TrendingUp,
      category: "research",
      action: () => onAIQuery("Show me the best bullish patterns forming right now - focus on bull flags and ascending triangles with A quality"),
      keywords: ["bullish", "long", "buy"]
    },
    {
      id: "research-stats",
      label: "Get pattern statistics",
      description: "Win rates, R:R performance data",
      icon: BarChart3,
      category: "research",
      action: () => onAIQuery("Show me the historical performance statistics for different chart patterns - which ones have the best win rates?"),
      keywords: ["statistics", "performance", "winrate"]
    },
    {
      id: "research-crypto",
      label: "Scan crypto patterns",
      description: "BTC, ETH, and major altcoins",
      icon: Compass,
      category: "research",
      action: () => onAIQuery("What chart patterns are forming on major cryptocurrencies right now? Focus on BTC, ETH, SOL, and other top coins"),
      keywords: ["bitcoin", "ethereum", "crypto", "altcoins"]
    },
  ], [onAIQuery]);

  const automateCommands: CommandItemData[] = useMemo(() => [
    {
      id: "automate-alert",
      label: "Create a pattern alert",
      description: "Get notified when patterns form",
      icon: Bell,
      category: "automate",
      action: () => onAIQuery("I want to set up a pattern alert. Help me choose what symbol and pattern to monitor."),
      keywords: ["alert", "notification", "monitor"]
    },
    {
      id: "automate-script",
      label: "Build custom Pine Script",
      description: "Generate TradingView strategy code",
      icon: Zap,
      category: "automate",
      action: () => onAIQuery("Generate a Pine Script strategy for me. Let's start with what pattern and instrument you want to trade."),
      keywords: ["pine", "script", "automate", "strategy"]
    },
  ], [onAIQuery]);

  // Filter commands based on search
  const filteredGroups = useMemo(() => {
    if (!search) {
      return {
        suggested: suggestedCommands,
        navigate: navigationCommands,
        research: researchCommands,
        automate: automateCommands,
      };
    }

    const lowerSearch = search.toLowerCase();
    const filterCommands = (commands: CommandItemData[]) =>
      commands.filter(cmd =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.description?.toLowerCase().includes(lowerSearch) ||
        cmd.keywords?.some(k => k.includes(lowerSearch))
      );

    return {
      suggested: filterCommands(suggestedCommands),
      navigate: filterCommands(navigationCommands),
      research: filterCommands(researchCommands),
      automate: filterCommands(automateCommands),
    };
  }, [search, suggestedCommands, navigationCommands, researchCommands, automateCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) {
      const hasMatches = Object.values(filteredGroups).some(g => g.length > 0);
      if (!hasMatches) {
        onAIQuery(search);
      }
    }
  };

  return (
    <Command className="rounded-lg border-0 bg-background" onKeyDown={handleKeyDown}>
      {/* Enhanced Header */}
      <div className={cn(
        "flex items-center gap-3 border-b bg-muted/30",
        isMobile ? "px-4 py-3" : "px-5 py-4"
      )}>
        <div className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg",
          isMobile ? "h-9 w-9" : "h-10 w-10"
        )}>
          <CommandIcon className={cn("text-white", isMobile ? "h-5 w-5" : "h-5 w-5")} />
        </div>
        <div className="flex-1">
          <CommandInput 
            placeholder={isMobile ? t('commandPalette.searchMobile', 'Search or ask AI...') : t('commandPalette.searchDesktop', 'Search commands or ask AI anything...')} 
            value={search}
            onValueChange={setSearch}
            className={cn(
              "border-0 bg-transparent focus:ring-0 placeholder:text-muted-foreground/60",
              isMobile ? "text-base h-10" : "text-lg h-12"
            )}
          />
        </div>
        {!isMobile && (
          <Badge variant="outline" className="shrink-0 text-xs font-mono px-2 py-1 bg-muted">
            ⌘K
          </Badge>
        )}
      </div>

      <CommandList className={cn(
        "scrollbar-thin",
        isMobile ? "max-h-[55vh]" : "max-h-[500px]"
      )}>
        <CommandEmpty className="py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('commandPalette.noCommandsFound', 'No commands found')}</p>
              <button 
                onClick={() => onAIQuery(search)}
                className="text-sm text-primary hover:underline font-medium"
              >
                {t('commandPalette.askAIWith', 'Ask AI: "{{query}}"', { query: search })}
              </button>
            </div>
          </div>
        </CommandEmpty>

        {/* Suggested Commands - Enhanced Cards */}
        {filteredGroups.suggested.length > 0 && (
          <CommandGroup heading={
            <span className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
              Quick Actions
            </span>
          } className={isMobile ? "px-3 py-2" : "px-4 py-3"}>
            <div className={cn(
              "grid gap-2",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              {filteredGroups.suggested.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 cursor-pointer transition-all",
                    isMobile ? "p-4" : "p-5"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-xl bg-gradient-to-br shadow-md",
                    cmd.color || "from-primary to-accent",
                    isMobile ? "h-11 w-11" : "h-12 w-12"
                  )}>
                    <cmd.icon className={cn("text-white", isMobile ? "h-5 w-5" : "h-6 w-6")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold truncate", isMobile ? "text-sm" : "text-base")}>
                      {cmd.label}
                    </p>
                    {cmd.description && (
                      <p className={cn(
                        "text-muted-foreground truncate",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        {cmd.description}
                      </p>
                    )}
                  </div>
                  <Sparkles className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        )}

        {/* Navigation Commands */}
        {filteredGroups.navigate.length > 0 && (
          <>
            <CommandSeparator className="my-2" />
            <CommandGroup heading={
              <span className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
                Navigate
              </span>
            } className={isMobile ? "px-3" : "px-4"}>
              {filteredGroups.navigate.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={cn(
                    "flex items-center gap-4 rounded-lg cursor-pointer",
                    isMobile ? "py-4 px-3" : "py-3 px-4"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <cmd.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-medium", isMobile ? "text-sm" : "text-base")}>{cmd.label}</p>
                  </div>
                  {cmd.shortcut && (
                    <Badge variant="outline" className="text-xs font-mono shrink-0">
                      {cmd.shortcut}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Research Commands */}
        {filteredGroups.research.length > 0 && (
          <>
            <CommandSeparator className="my-2" />
            <CommandGroup heading={
              <span className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
                Research
              </span>
            } className={isMobile ? "px-3" : "px-4"}>
              {filteredGroups.research.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={cn(
                    "flex items-center gap-4 rounded-lg cursor-pointer",
                    isMobile ? "py-4 px-3" : "py-3 px-4"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <cmd.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", isMobile ? "text-sm" : "text-base")}>{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                    )}
                  </div>
                  <Sparkles className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Automate Commands */}
        {filteredGroups.automate.length > 0 && (
          <>
            <CommandSeparator className="my-2" />
            <CommandGroup heading={
              <span className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
                Automate
              </span>
            } className={isMobile ? "px-3" : "px-4"}>
              {filteredGroups.automate.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={cn(
                    "flex items-center gap-4 rounded-lg cursor-pointer",
                    isMobile ? "py-4 px-3" : "py-3 px-4"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <cmd.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", isMobile ? "text-sm" : "text-base")}>{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                    )}
                  </div>
                  <Sparkles className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Enhanced Footer */}
      <div className={cn(
        "border-t bg-muted/20 text-muted-foreground flex items-center justify-between",
        isMobile ? "p-3 text-xs" : "px-5 py-3 text-sm"
      )}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{t('commandPalette.typeToAsk', 'Type anything to ask AI')}</span>
        </div>
        {!isMobile && (
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">↑↓</kbd>
              {t('commandPalette.navigate', 'Navigate')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">↵</kbd>
              {t('commandPalette.select', 'Select')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">Esc</kbd>
              {t('commandPalette.close', 'Close')}
            </span>
          </div>
        )}
      </div>
    </Command>
  );
}
