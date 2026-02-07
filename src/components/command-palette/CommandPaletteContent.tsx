import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

interface CommandItemData {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: "navigate" | "research" | "automate" | "learn" | "suggested";
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteContentProps {
  onClose: () => void;
  onAIQuery: (prompt: string) => void;
  isMobile?: boolean;
}

export function CommandPaletteContent({ onClose, onAIQuery, isMobile }: CommandPaletteContentProps) {
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
      keywords: ["patterns", "signals", "setups", "quality"]
    },
    {
      id: "market-overview",
      label: "What's moving in the markets?",
      description: "Get a quick market pulse with key patterns",
      icon: LineChart,
      category: "suggested",
      action: () => onAIQuery("Give me a quick market overview - what patterns are forming on SPY, QQQ, and BTC?"),
      keywords: ["market", "overview", "moving", "today"]
    },
    {
      id: "generate-script",
      label: "Generate a Pine Script strategy",
      description: "Create TradingView-ready automation code",
      icon: Code,
      category: "suggested",
      action: () => onAIQuery("Help me create a Pine Script strategy. What pattern and instrument should we build it for?"),
      keywords: ["pine", "script", "tradingview", "strategy", "code"]
    },
    {
      id: "learn-pattern",
      label: "Teach me a chart pattern",
      description: "Interactive pattern education with examples",
      icon: BookOpen,
      category: "suggested",
      action: () => onAIQuery("I want to learn about chart patterns. Which pattern would you recommend I start with and why?"),
      keywords: ["learn", "education", "pattern", "teach"]
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
    <Command className="rounded-lg border-0" onKeyDown={handleKeyDown}>
      <div className="flex items-center border-b px-3">
        <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
        <CommandInput 
          placeholder={isMobile ? "Search or ask AI..." : "Search commands or ask AI anything..."} 
          value={search}
          onValueChange={setSearch}
          className="border-0 focus:ring-0"
        />
        {!isMobile && (
          <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
            ⌘K
          </Badge>
        )}
      </div>
      <CommandList className={isMobile ? "max-h-[50vh]" : "max-h-[400px]"}>
        <CommandEmpty className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">No commands found</p>
          <button 
            onClick={() => onAIQuery(search)}
            className="text-sm text-primary hover:underline"
          >
            Ask AI: "{search}"
          </button>
        </CommandEmpty>

        {filteredGroups.suggested.length > 0 && (
          <CommandGroup heading="Suggested">
            {filteredGroups.suggested.map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={() => handleAction(cmd)}
                className={`flex items-center gap-3 ${isMobile ? 'py-4' : 'py-3'}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <cmd.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cmd.label}</p>
                  {cmd.description && (
                    <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                  )}
                </div>
                <Sparkles className="h-3 w-3 text-muted-foreground shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredGroups.navigate.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              {filteredGroups.navigate.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={`flex items-center gap-3 ${isMobile ? 'py-4' : ''}`}
                >
                  <cmd.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p>{cmd.label}</p>
                  </div>
                  {cmd.shortcut && (
                    <span className="text-xs text-muted-foreground">{cmd.shortcut}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredGroups.research.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Research">
              {filteredGroups.research.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={`flex items-center gap-3 ${isMobile ? 'py-4' : ''}`}
                >
                  <cmd.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                    )}
                  </div>
                  <Sparkles className="h-3 w-3 text-muted-foreground shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredGroups.automate.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Automate">
              {filteredGroups.automate.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => handleAction(cmd)}
                  className={`flex items-center gap-3 ${isMobile ? 'py-4' : ''}`}
                >
                  <cmd.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                    )}
                  </div>
                  <Sparkles className="h-3 w-3 text-muted-foreground shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>Type anything to ask AI</span>
        {!isMobile && (
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        )}
      </div>
    </Command>
  );
}
