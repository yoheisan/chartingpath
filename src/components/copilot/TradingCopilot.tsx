import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  Send, 
  X, 
  Home,
  Loader2, 
  TrendingUp,
  Bell,
  Code,
  BookOpen,
  BarChart3,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  MessageSquarePlus
} from "lucide-react";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopilotRichMessage } from "./CopilotRichMessage";
import { useLocation } from "react-router-dom";
import { ChartAnalysisSummary } from "./ChartAnalysisSummary";
import { ChartAnalysisResult } from "@/hooks/useChartAnalysis";
import { CopilotHistorySidebar } from "./CopilotHistorySidebar";
import { CopilotAuthGate } from "./CopilotAuthGate";
import { useCopilotConversations } from "@/hooks/useCopilotConversations";
import { useCopilotFeedback } from "@/hooks/useCopilotFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { prewarmedContext as prewarmedCtx } from "@/hooks/useDashboardPrefetch";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  analysisData?: ChartAnalysisResult;
}

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

const SUPABASE_URL = "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";
const CHAT_URL = `${SUPABASE_URL}/functions/v1/trading-copilot`;

const GUEST_MSG_KEY = "copilot_guest_msgs";
const GUEST_MSG_LIMIT = 3;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getGuestMsgCount(): number {
  try {
    const raw = localStorage.getItem(GUEST_MSG_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return 0; // reset for new day
    return parsed.count || 0;
  } catch { return 0; }
}
function incrementGuestMsgCount(): number {
  const next = getGuestMsgCount() + 1;
  try { localStorage.setItem(GUEST_MSG_KEY, JSON.stringify({ date: getTodayKey(), count: next })); } catch {}
  return next;
}

// ── Route-aware, auth-aware quick actions ──────────────────────

interface QuickAction {
  labelKey: string;
  promptKey: string;
  icon: typeof TrendingUp;
  label?: string; // fallback when i18n key missing in active locale
}

const GUEST_ACTIONS: QuickAction[] = [
  { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp },
  { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen },
  { labelKey: "copilot.marketBreadth", promptKey: "copilot.marketBreadthPrompt", icon: BarChart3 },
];

const AUTH_DEFAULT_ACTIONS: QuickAction[] = [
  { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp },
  { labelKey: "copilot.createAlert", promptKey: "copilot.createAlertPrompt", icon: Bell },
  { labelKey: "copilot.generateScript", promptKey: "copilot.generateScriptPrompt", icon: Code },
  { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen },
  { labelKey: "copilot.marketBreadth", promptKey: "copilot.marketBreadthPrompt", icon: BarChart3 },
  { labelKey: "copilot.agentScoring", promptKey: "copilot.agentScoringPrompt", icon: Sparkles },
];

/** Route-specific overrides for authenticated users */
const ROUTE_ACTIONS: Record<string, QuickAction[]> = {
  '/tools/agent-scoring': [
    { labelKey: "copilot.agentScoring", promptKey: "copilot.agentScoringPrompt", icon: Sparkles, label: "Score trades" },
    { labelKey: "copilot.ctx.adjustWeights", promptKey: "copilot.ctx.adjustWeightsPrompt", icon: TrendingUp, label: "Adjust weights" },
    { labelKey: "copilot.ctx.comparePresets", promptKey: "copilot.ctx.comparePresetsPrompt", icon: BarChart3, label: "Compare presets" },
    { labelKey: "copilot.createAlert", promptKey: "copilot.createAlertPrompt", icon: Bell, label: "Create alert" },
  ],
  '/patterns/live': [
    { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp, label: "Find patterns" },
    { labelKey: "copilot.ctx.bestSetups", promptKey: "copilot.ctx.bestSetupsPrompt", icon: Sparkles, label: "Best setups now" },
    { labelKey: "copilot.createAlert", promptKey: "copilot.createAlertPrompt", icon: Bell, label: "Create alert" },
    { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen, label: "Learn patterns" },
  ],
  '/members/dashboard': [
    { labelKey: "copilot.ctx.portfolioReview", promptKey: "copilot.ctx.portfolioReviewPrompt", icon: BarChart3, label: "Portfolio review" },
    { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp, label: "Find patterns" },
    { labelKey: "copilot.createAlert", promptKey: "copilot.createAlertPrompt", icon: Bell, label: "Create alert" },
    { labelKey: "copilot.agentScoring", promptKey: "copilot.agentScoringPrompt", icon: Sparkles, label: "Score trades" },
  ],
  '/tools/market-breadth': [
    { labelKey: "copilot.marketBreadth", promptKey: "copilot.marketBreadthPrompt", icon: BarChart3, label: "Market breadth" },
    { labelKey: "copilot.ctx.sectorAnalysis", promptKey: "copilot.ctx.sectorAnalysisPrompt", icon: TrendingUp, label: "Sector analysis" },
    { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: Sparkles, label: "Find patterns" },
  ],
  '/chart-patterns/library': [
    { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen, label: "Learn patterns" },
    { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp, label: "Find patterns" },
    { labelKey: "copilot.ctx.bestSetups", promptKey: "copilot.ctx.bestSetupsPrompt", icon: Sparkles, label: "Best setups now" },
  ],
};

/** Route-specific overrides for guests (lighter set — no locked features) */
const GUEST_ROUTE_ACTIONS: Record<string, QuickAction[]> = {
  '/patterns/live': [
    { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp, label: "Find patterns" },
    { labelKey: "copilot.ctx.bestSetups", promptKey: "copilot.ctx.bestSetupsPrompt", icon: Sparkles, label: "Best setups now" },
    { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen, label: "Learn patterns" },
  ],
  '/tools/agent-scoring': [
    { labelKey: "copilot.agentScoring", promptKey: "copilot.agentScoringPrompt", icon: Sparkles, label: "Score trades" },
    { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen, label: "Learn patterns" },
    { labelKey: "copilot.marketBreadth", promptKey: "copilot.marketBreadthPrompt", icon: BarChart3, label: "Market breadth" },
  ],
  '/chart-patterns/library': [
    { labelKey: "copilot.learnPatterns", promptKey: "copilot.learnPatternsPrompt", icon: BookOpen, label: "Learn patterns" },
    { labelKey: "copilot.findPatterns", promptKey: "copilot.findPatternsPrompt", icon: TrendingUp, label: "Find patterns" },
  ],
};

function getQuickActions(pathname: string, authenticated: boolean): QuickAction[] {
  if (authenticated) {
    return ROUTE_ACTIONS[pathname] || AUTH_DEFAULT_ACTIONS;
  }
  return GUEST_ROUTE_ACTIONS[pathname] || GUEST_ACTIONS;
}

const SUPPORT_ACTION = { labelKey: "copilot.contactSupport", icon: MessageSquarePlus };

export interface TradingCopilotProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  pendingContext?: string | null;
  pendingAnalysis?: ChartAnalysisResult | null;
  onContextConsumed?: () => void;
}

export function TradingCopilot({ 
  isExpanded = false, 
  onToggle,
  pendingContext,
  pendingAnalysis,
  onContextConsumed
}: TradingCopilotProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ChartAnalysisResult | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [guestMsgCount, setGuestMsgCount] = useState(getGuestMsgCount);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const contextProcessedRef = useRef(false);
  const isMobile = useIsMobile();

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoadingHistory,
    createConversation,
    loadMessages,
    saveMessage,
    deleteConversation,
    startNewChat,
    isAuthenticated,
  } = useCopilotConversations();

  const { trackQuestion } = useCopilotFeedback();

  const guestLimitReached = !isAuthenticated && guestMsgCount >= GUEST_MSG_LIMIT;

  const logFeedback = useCallback(async (responseContent: string, helpful: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('copilot_feedback').insert({
        question: messages.find(m => m.role === 'user')?.content || '',
        response: responseContent.slice(0, 1000),
        response_helpful: helpful,
        session_id: null,
        user_id: user?.id || null,
      });
    } catch (err) {
      console.error('[CopilotFeedback] logFeedback error:', err);
    }
  }, [messages]);

  // Track which conversation the current in-memory messages belong to
  const activeConvoRef = useRef<string | null>(null);

  // Check scroll position for scroll-down indicator
  const checkScrollPosition = useCallback(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 60);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
        // Attach scroll listener
        viewport.addEventListener('scroll', checkScrollPosition);
        // Initial check
        setTimeout(checkScrollPosition, 100);
        return () => viewport.removeEventListener('scroll', checkScrollPosition);
      }
    }
  }, [messages, checkScrollPosition]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId && activeConversationId !== activeConvoRef.current) {
      activeConvoRef.current = activeConversationId;
      loadMessages(activeConversationId).then((msgs) => {
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.created_at),
          }))
        );
      });
    }
    if (!activeConversationId && activeConvoRef.current) {
      activeConvoRef.current = null;
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  // Handle pending context from chart analysis
  useEffect(() => {
    if (pendingContext && isExpanded && !contextProcessedRef.current && !isLoading) {
      contextProcessedRef.current = true;
      if (pendingAnalysis) {
        setCurrentAnalysis(pendingAnalysis);
      }
      streamChat(pendingContext, pendingAnalysis);
      onContextConsumed?.();
    }
    if (!isExpanded) {
      contextProcessedRef.current = false;
    }
  }, [pendingContext, pendingAnalysis, isExpanded, isLoading, onContextConsumed]);

  const streamChat = async (userMessage: string, analysisData?: ChartAnalysisResult | null) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
      analysisData: analysisData || undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");

    // Ensure we have a conversation to persist to
    let convoId = activeConvoRef.current;
    if (!convoId && isAuthenticated) {
      convoId = await createConversation(userMessage.slice(0, 60));
      activeConvoRef.current = convoId;
    }

    // Persist user message
    if (convoId) {
      saveMessage(convoId, "user", userMessage);
    }

    let assistantContent = "";
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .filter(m => m.role === "user" || m.content.trim().length > 0)
            .slice(-20) // Cap context window to last 20 messages for speed
            .map(m => ({ role: m.role, content: m.content })),
          language: i18n.language,
          // Include pre-warmed dashboard context for faster first response
          ...(prewarmedCtx.ready && {
            prewarmed: {
              watchlist: prewarmedCtx.watchlistSymbols,
              activePatterns: prewarmedCtx.activePatternCount,
            },
          }),
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error(t('copilot.rateLimited'), { duration: 5000 });
          throw new Error("Rate limited");
        }
        if (resp.status === 402) {
          toast.error(t('copilot.creditsDepleted'));
          throw new Error("Credits depleted");
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
            }
          } catch { /* ignore */ }
        }
      }

      // Persist assistant message and track for intent analysis
      if (convoId && assistantContent) {
        saveMessage(convoId, "assistant", assistantContent);
      }
      // Fire-and-forget intent classification
      if (assistantContent) {
        trackQuestion(userMessage, assistantContent);
      }

    } catch (error) {
      console.error("Chat error:", error);
      const isKnownError = error instanceof Error && (error.message === "Rate limited" || error.message === "Credits depleted");
      if (!isKnownError) {
        toast.error(t('copilot.errorResponse'));
      }
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "user") {
          return [...prev, {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: isKnownError ? t('copilot.rateLimitedMsg') : t('copilot.errorMsg'),
            timestamp: new Date()
          }];
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || guestLimitReached) return;
    if (!isAuthenticated) setGuestMsgCount(incrementGuestMsgCount());
    streamChat(input.trim());
  };

  const handleQuickAction = (prompt: string) => {
    if (guestLimitReached) return;
    if (!isAuthenticated) setGuestMsgCount(incrementGuestMsgCount());
    streamChat(prompt);
  };

  const handleNewChat = useCallback(() => {
    startNewChat();
    activeConvoRef.current = null;
    setMessages([]);
  }, [startNewChat]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, [setActiveConversationId]);

  if (!isExpanded) {
    return (
      <div className={cn("fixed z-50 flex flex-col items-end gap-2", isMobile ? "bottom-20 right-4" : "bottom-6 right-6")}>
        {/* First-visit tooltip — disappears after first open */}
        {typeof window !== 'undefined' && !sessionStorage.getItem('copilot_opened') && (
          <div className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg animate-bounce max-w-[220px] text-center leading-snug">
            {t('copilot.tooltip', 'Ask anything about markets, patterns & trade setups ✨')}
          </div>
        )}
        <Button
          onClick={() => {
            try { sessionStorage.setItem('copilot_opened', '1'); } catch {}
            onToggle?.();
          }}
          className={cn(
            "rounded-full shadow-xl transition-all group",
            "bg-gradient-to-r from-primary to-accent hover:opacity-90",
            isMobile ? "h-14 px-5 gap-2 text-sm" : "h-12 px-5 gap-2 text-sm"
          )}
          aria-label="Open AI Trading Copilot"
        >
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white/90" />
          </span>
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="font-semibold whitespace-nowrap">{t('copilot.askAI', 'Ask AI')}</span>
        </Button>
      </div>
    );
  }

  const copilotBody = (
    <>
      {/* History sidebar — hidden on mobile */}
      {!isMobile && showHistory && isAuthenticated && (
        <CopilotHistorySidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={deleteConversation}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-accent text-white">
          <div className="flex items-center gap-2">
            {!isMobile && isAuthenticated && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setShowHistory(v => !v)}>
                {showHistory ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
            )}
            <Sparkles className="h-5 w-5 text-white/90" />
            <div>
              <h3 className="font-semibold text-sm text-white">{t('copilot.title')}</h3>
              <p className="text-xs text-white/70">{t('copilot.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={handleNewChat} title={t('copilot.home', 'Home')}>
                <Home className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 relative min-h-0">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mx-auto flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1">{t('copilot.welcome')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('copilot.welcomeDesc')}
                  </p>
                  {!isAuthenticated && (
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {t('copilot.guestLimit', 'Try {{count}} free messages — sign in for unlimited access', { count: GUEST_MSG_LIMIT })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium px-1">{t('copilot.quickActions')}</p>
                  <div className={cn("grid gap-2", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                    {getQuickActions(location.pathname, isAuthenticated).map((action) => (
                      <Button key={action.labelKey} variant="outline" size="sm" className="justify-start h-auto py-2 px-3 text-left" onClick={() => handleQuickAction(t(action.promptKey))} disabled={isLoading}>
                        <action.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
                        <span className="text-xs">{t(action.labelKey, action.label || action.labelKey)}</span>
                      </Button>
                    ))}
                    </div>
                    <ContactSupportDialog
                      trigger={
                        <Button variant="outline" size="sm" className="justify-start h-auto py-2 px-3 text-left w-full">
                          <SUPPORT_ACTION.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
                          <span className="text-xs">{t(SUPPORT_ACTION.labelKey, 'Contact Support')}</span>
                        </Button>
                      }
                      defaultCategory="other"
                      defaultSubject=""
                      defaultDescription=""
                      source="copilot_quick_action"
                    />
                  </div>
                </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, idx) => {
                  const isLastAssistant = message.role === "assistant" && idx === messages.length - 1;
                  return (
                  <div key={message.id} className={cn("flex flex-col gap-2", message.role === "user" ? "items-end" : "items-start")}>
                    {message.role === "user" && message.analysisData && (
                      <Card className="w-full p-3 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>{t('copilot.chartAnalysis')}</span>
                          </div>
                        </div>
                        <ChartAnalysisSummary analysis={message.analysisData} />
                      </Card>
                    )}
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground max-w-[85%]"
                        : "bg-muted w-full"
                    )}>
                      {message.role === "assistant" ? (
                        <CopilotRichMessage content={message.content || "..."} onQuickReply={isLastAssistant ? (text) => { if (!isLoading) streamChat(text); } : undefined} />
                      ) : message.analysisData ? (
                        <span className="text-xs opacity-80">{t('chartAnalysisDialog.analyzeSymbol', { symbol: message.analysisData.symbol, timeframe: message.analysisData.timeframe })}</span>
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.role === "assistant" && message.content && message.content !== "..." && (
                      <div className="flex items-center gap-1 mt-1 ml-1">
                        <button
                          onClick={() => {
                            logFeedback(message.content || '', true);
                            toast.success(t('copilot.feedbackThanks', 'Thanks for your feedback!'));
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors"
                          aria-label="Helpful"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            logFeedback(message.content || '', false);
                            toast.info(t('copilot.feedbackNoted', 'Feedback noted. We\'ll improve!'));
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Not helpful"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        <ContactSupportDialog
                          trigger={
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Report issue">
                              <MessageSquarePlus className="h-3 w-3" />
                            </button>
                          }
                          defaultCategory="bug"
                          defaultSubject="Copilot Response Issue"
                          defaultDescription={`Issue with copilot response:\n\n"${(message.content || '').slice(0, 200)}..."\n\nPlease describe the problem:\n`}
                          source="copilot_feedback"
                        />
                      </div>
                    )}
                  </div>
                )})}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Scroll down indicator */}
          {showScrollDown && (
            <button
              onClick={() => {
                const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
                if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
              }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-0.5 p-2 rounded-lg bg-background/80 border border-border/50 text-muted-foreground shadow-lg backdrop-blur-sm hover:text-foreground hover:border-border transition-all cursor-pointer"
              aria-label="Scroll down for more"
            >
              <ChevronDown className="h-5 w-5 animate-bounce" />
              <span className="text-[10px] font-medium">{t('copilot.moreBelow')}</span>
            </button>
          )}
        </div>

        {/* Input or Auth Gate */}
        {guestLimitReached ? (
          <CopilotAuthGate messagesUsed={guestMsgCount} maxMessages={GUEST_MSG_LIMIT} />
        ) : (
          <div className="p-4 border-t bg-background">
            {!isAuthenticated && guestMsgCount > 0 && (
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {t('activation.freeMessagesRemaining', '{{count}} of {{total}} free messages remaining', { count: GUEST_MSG_LIMIT - guestMsgCount, total: GUEST_MSG_LIMIT })}
                </Badge>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea ref={inputRef as any} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} placeholder={t('copilot.placeholder')} disabled={isLoading} className="flex-1 min-h-[4rem] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows={2} />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {t('copilot.disclaimer')}
            </p>
          </div>
        )}
      </div>
    </>
  );

  // Mobile: bottom-sheet Drawer
  if (isMobile) {
    return (
      <Drawer open={isExpanded} onOpenChange={(open) => !open && onToggle?.()}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          <DrawerTitle className="sr-only">{t('copilot.title')}</DrawerTitle>
          <DrawerDescription className="sr-only">{t('copilot.subtitle')}</DrawerDescription>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {copilotBody}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: near-fullscreen centered modal
  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onToggle} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <Card className={cn(
          "w-full h-full max-w-[90vw] max-h-[88vh] flex shadow-2xl border-primary/20 overflow-hidden animate-in fade-in-0 zoom-in-95",
          showHistory && isAuthenticated ? "max-w-[92vw]" : "max-w-[90vw]"
        )}>
          {copilotBody}
        </Card>
      </div>
    </>
  );
}
