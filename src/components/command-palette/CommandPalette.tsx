import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { CommandPaletteChat } from "./CommandPaletteChat";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: "navigate" | "research" | "automate" | "learn" | "suggested";
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"commands" | "chat">("commands");
  const [chatPrompt, setChatPrompt] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setMode("commands");
      setChatPrompt(undefined);
      setSearch("");
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const handleAIQuery = (prompt: string) => {
    setChatPrompt(prompt);
    setMode("chat");
  };

  const suggestedCommands: CommandItem[] = useMemo(() => [
    {
      id: "find-patterns",
      label: "Find A-quality patterns forming now",
      description: "Search live detections across 8,500+ instruments",
      icon: Target,
      category: "suggested",
      action: () => handleAIQuery("Show me the best A-quality patterns forming right now across major stocks and crypto"),
      keywords: ["patterns", "signals", "setups", "quality"]
    },
    {
      id: "market-overview",
      label: "What's moving in the markets?",
      description: "Get a quick market pulse with key patterns",
      icon: LineChart,
      category: "suggested",
      action: () => handleAIQuery("Give me a quick market overview - what patterns are forming on SPY, QQQ, and BTC?"),
      keywords: ["market", "overview", "moving", "today"]
    },
    {
      id: "generate-script",
      label: "Generate a Pine Script strategy",
      description: "Create TradingView-ready automation code",
      icon: Code,
      category: "suggested",
      action: () => handleAIQuery("Help me create a Pine Script strategy. What pattern and instrument should we build it for?"),
      keywords: ["pine", "script", "tradingview", "strategy", "code"]
    },
    {
      id: "learn-pattern",
      label: "Teach me a chart pattern",
      description: "Interactive pattern education with examples",
      icon: BookOpen,
      category: "suggested",
      action: () => handleAIQuery("I want to learn about chart patterns. Which pattern would you recommend I start with and why?"),
      keywords: ["learn", "education", "pattern", "teach"]
    },
  ], []);

  const navigationCommands: CommandItem[] = useMemo(() => [
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "Command center with live charts",
      icon: LayoutDashboard,
      category: "navigate",
      action: () => navigate("/members/dashboard"),
      shortcut: "G D",
      keywords: ["home", "main", "chart"]
    },
    {
      id: "nav-screener",
      label: "Pattern Screener",
      description: "Scan live patterns across markets",
      icon: Search,
      category: "navigate",
      action: () => navigate("/patterns/live"),
      shortcut: "G S",
      keywords: ["scan", "filter", "find"]
    },
    {
      id: "nav-lab",
      label: "Pattern Lab",
      description: "Research & backtest patterns",
      icon: FlaskConical,
      category: "navigate",
      action: () => navigate("/members/pattern-lab"),
      shortcut: "G L",
      keywords: ["backtest", "research", "analyze"]
    },
    {
      id: "nav-alerts",
      label: "My Alerts",
      description: "Manage pattern notifications",
      icon: Bell,
      category: "navigate",
      action: () => navigate("/members/alerts"),
      shortcut: "G A",
      keywords: ["notifications", "monitor"]
    },
    {
      id: "nav-scripts",
      label: "My Scripts",
      description: "Pine Script library",
      icon: Code,
      category: "navigate",
      action: () => navigate("/members/scripts"),
      shortcut: "G C",
      keywords: ["pine", "code", "automation"]
    },
    {
      id: "nav-learning",
      label: "Learning Center",
      description: "Pattern education & guides",
      icon: GraduationCap,
      category: "navigate",
      action: () => navigate("/learn"),
      shortcut: "G E",
      keywords: ["education", "tutorials", "guides"]
    },
  ], [navigate]);

  const researchCommands: CommandItem[] = useMemo(() => [
    {
      id: "research-bull-patterns",
      label: "Find bullish patterns",
      description: "Search for bull flags, ascending triangles, etc.",
      icon: TrendingUp,
      category: "research",
      action: () => handleAIQuery("Show me the best bullish patterns forming right now - focus on bull flags and ascending triangles with A quality"),
      keywords: ["bullish", "long", "buy"]
    },
    {
      id: "research-stats",
      label: "Get pattern statistics",
      description: "Win rates, R:R performance data",
      icon: BarChart3,
      category: "research",
      action: () => handleAIQuery("Show me the historical performance statistics for different chart patterns - which ones have the best win rates?"),
      keywords: ["statistics", "performance", "winrate"]
    },
    {
      id: "research-crypto",
      label: "Scan crypto patterns",
      description: "BTC, ETH, and major altcoins",
      icon: Compass,
      category: "research",
      action: () => handleAIQuery("What chart patterns are forming on major cryptocurrencies right now? Focus on BTC, ETH, SOL, and other top coins"),
      keywords: ["bitcoin", "ethereum", "crypto", "altcoins"]
    },
  ], []);

  const automateCommands: CommandItem[] = useMemo(() => [
    {
      id: "automate-alert",
      label: "Create a pattern alert",
      description: "Get notified when patterns form",
      icon: Bell,
      category: "automate",
      action: () => handleAIQuery("I want to set up a pattern alert. Help me choose what symbol and pattern to monitor."),
      keywords: ["alert", "notification", "monitor"]
    },
    {
      id: "automate-script",
      label: "Build custom Pine Script",
      description: "Generate TradingView strategy code",
      icon: Zap,
      category: "automate",
      action: () => handleAIQuery("Generate a Pine Script strategy for me. Let's start with what pattern and instrument you want to trade."),
      keywords: ["pine", "script", "automate", "strategy"]
    },
  ], []);

  const allCommands = useMemo(() => [
    ...suggestedCommands,
    ...navigationCommands,
    ...researchCommands,
    ...automateCommands,
  ], [suggestedCommands, navigationCommands, researchCommands, automateCommands]);

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
    const filterCommands = (commands: CommandItem[]) =>
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
    // If user types something not matching commands, offer AI query
    if (e.key === "Enter" && search.trim()) {
      const hasMatches = Object.values(filteredGroups).some(g => g.length > 0);
      if (!hasMatches) {
        handleAIQuery(search);
      }
    }
  };

  if (mode === "chat") {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl h-[600px] p-0 gap-0 overflow-hidden">
          <CommandPaletteChat 
            initialPrompt={chatPrompt} 
            onBack={() => setMode("commands")} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <Command className="rounded-lg border-0" onKeyDown={handleKeyDown}>
          <div className="flex items-center border-b px-3">
            <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
            <CommandInput 
              placeholder="Search commands or ask AI anything..." 
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
            <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
              ⌘K
            </Badge>
          </div>
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">No commands found</p>
              <button 
                onClick={() => handleAIQuery(search)}
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
                    onSelect={() => handleAction(cmd.action)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <cmd.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{cmd.label}</p>
                      {cmd.description && (
                        <p className="text-xs text-muted-foreground">{cmd.description}</p>
                      )}
                    </div>
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
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
                      onSelect={() => handleAction(cmd.action)}
                      className="flex items-center gap-3"
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
                      onSelect={() => handleAction(cmd.action)}
                      className="flex items-center gap-3"
                    >
                      <cmd.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p>{cmd.label}</p>
                        {cmd.description && (
                          <p className="text-xs text-muted-foreground">{cmd.description}</p>
                        )}
                      </div>
                      <Sparkles className="h-3 w-3 text-muted-foreground" />
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
                      onSelect={() => handleAction(cmd.action)}
                      className="flex items-center gap-3"
                    >
                      <cmd.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p>{cmd.label}</p>
                        {cmd.description && (
                          <p className="text-xs text-muted-foreground">{cmd.description}</p>
                        )}
                      </div>
                      <Sparkles className="h-3 w-3 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>

          <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>Type anything to ask AI</span>
            <div className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
