import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMandateSubmit } from "@/hooks/useMandateSubmit";
import { useMasterPlan } from "@/hooks/useMasterPlan";
import { TradingPlanBuilder } from "./TradingPlanBuilder";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Sparkles, Send, X, Home, Loader2, TrendingUp, BookOpen, BarChart3,
  PanelLeftOpen, PanelLeftClose, ChevronDown, ThumbsUp, ThumbsDown,
  MessageSquarePlus, Info
} from "lucide-react";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopilotRichMessage } from "./CopilotRichMessage";
import { useLocation, Link } from "react-router-dom";
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

// ── Page context mapping ───────────────────────────────────────

interface PageContext {
  pageName: string;
  greeting: string;
  chips: { label: string; prompt: string; labelKey?: string }[];
}

const PAGE_CONTEXT_MAP: Record<string, PageContext> = {
  '/members/dashboard': {
    pageName: 'Dashboard',
    greeting: "Here's your session so far. What do you need?",
    chips: [
      { label: "What did Copilot do today?", prompt: "What did Copilot do today?" },
      { label: "Show my AI vs Human stats", prompt: "Show my AI vs Human stats" },
      { label: "What's the market doing?", prompt: "What's the market doing?" },
    ],
  },
  '/screener': {
    pageName: 'Active Pattern Screener',
    greeting: "I can see the screener. Want me to find setups matching your mandate?",
    chips: [
      { label: "What's working right now?", prompt: "What's working right now?" },
      { label: "Show A-grade setups only", prompt: "Show A-grade setups only" },
      { label: "Add top setup to Copilot", prompt: "Add top setup to Copilot" },
    ],
  },
  '/patterns/live': {
    pageName: 'Active Pattern Screener',
    greeting: "I can see the screener. Want me to find setups matching your mandate?",
    chips: [
      { label: "What's working right now?", prompt: "What's working right now?" },
      { label: "Show A-grade setups only", prompt: "Show A-grade setups only" },
      { label: "Add top setup to Copilot", prompt: "Add top setup to Copilot" },
    ],
  },
  '/tools/agent-scoring': {
    pageName: 'Agent Scoring',
    greeting: "You're on Agent Scoring. Want to adjust your weights or filters?",
    chips: [
      { label: "Make scoring more conservative", prompt: "Make scoring more conservative" },
      { label: "Increase my take rate", prompt: "Increase my take rate" },
      { label: "Show current scoring weights", prompt: "Show current scoring weights" },
    ],
  },
  '/projects/pattern-lab/new': {
    pageName: 'Pattern Lab',
    greeting: "Pattern Lab is open. Want to run a backtest or send patterns to your Master Plan?",
    chips: [
      { label: "What's my most profitable pattern?", prompt: "What's my most profitable pattern?" },
      { label: "Send winners to my Master Plan", prompt: "Send winners to my Master Plan" },
      { label: "Check my backtest quota", prompt: "Check my backtest quota" },
    ],
  },
  '/alerts': {
    pageName: 'Alerts',
    greeting: "Manage your alerts. Want to create one for your top setup?",
    chips: [
      { label: "Create alert for my top setup", prompt: "Create alert for my top setup" },
      { label: "Send alerts to Copilot paper", prompt: "Send alerts to Copilot paper" },
    ],
  },
  '/members/scripts': {
    pageName: 'Scripts',
    greeting: "Scripts page is open. Want to generate a Pine Script or export a strategy?",
    chips: [
      { label: "Generate Pine Script for my mandate", prompt: "Generate Pine Script for my mandate" },
      { label: "Export as Copilot Strategy", prompt: "Export as Copilot Strategy" },
    ],
  },
  '/scripts': {
    pageName: 'Scripts',
    greeting: "Scripts page is open. Want to generate a Pine Script or export a strategy?",
    chips: [
      { label: "Generate Pine Script for my mandate", prompt: "Generate Pine Script for my mandate" },
      { label: "Export as Copilot Strategy", prompt: "Export as Copilot Strategy" },
    ],
  },
  '/copilot': {
    pageName: 'Copilot ACS',
    greeting: "Your Copilot desk. Set your mandate, review trades, or ask anything.",
    chips: [
      { labelKey: "copilot.panel.chipWhyFlag", label: "Why did Copilot flag that?", prompt: "Why did Copilot flag that?" },
      { labelKey: "copilot.panel.chipShowPaperTrades", label: "Show today's paper trades", prompt: "Show today's paper trades" },
      { labelKey: "copilot.panel.chipWhatWatching", label: "What's Copilot watching?", prompt: "What's Copilot watching?" },
    ],
  },
  '/edge-atlas': {
    pageName: 'Edge Atlas',
    greeting: "Edge Atlas is open. Want to check pattern win rates or plan alignment?",
    chips: [
      { label: "What patterns are in my plan?", prompt: "What patterns are in my plan?" },
      { label: "Best win rate for breakouts", prompt: "Best win rate for breakouts" },
    ],
  },
  '/chart-patterns/library': {
    pageName: 'Pattern Library',
    greeting: "Pattern Library is open. Want to add a pattern to your plan?",
    chips: [
      { label: "Add this pattern to my plan", prompt: "Add this pattern to my plan" },
      { label: "Which patterns suit my mandate?", prompt: "Which patterns suit my mandate?" },
    ],
  },
  '/projects/runs': {
    pageName: 'Backtest Results',
    greeting: "You're viewing backtest results. Want to analyze the performance?",
    chips: [
      { label: "Explain these results", prompt: "Explain these backtest results" },
      { label: "What's my win rate?", prompt: "What's my win rate in this backtest?" },
      { label: "Send winners to my plan", prompt: "Send winning patterns to my trading plan" },
    ],
  },
  '/projects/pattern-lab': {
    pageName: 'Pattern Lab',
    greeting: "Pattern Lab is open. Want to run a backtest or send patterns to your Master Plan?",
    chips: [
      { label: "What's my most profitable pattern?", prompt: "What's my most profitable pattern?" },
      { label: "Send winners to my Master Plan", prompt: "Send winners to my Master Plan" },
      { label: "Check my backtest quota", prompt: "Check my backtest quota" },
    ],
  },
  '/members': {
    pageName: 'Members Area',
    greeting: "How can I help you with your account?",
    chips: [
      { label: "Show my trading plan", prompt: "Open my trading plan" },
      { label: "What's my performance?", prompt: "What's my trading performance?" },
    ],
  },
  '/tools': {
    pageName: 'Tools',
    greeting: "You're in the tools section. What would you like to do?",
    chips: [
      { label: "Open Agent Scoring", prompt: "Open Agent Scoring" },
      { label: "Run a backtest", prompt: "Run a backtest" },
    ],
  },
};

const DEFAULT_PAGE_CONTEXT: PageContext = {
  pageName: 'Unknown',
  greeting: "How can I help you trade smarter?",
  chips: [
    { label: "Find setups matching my mandate", prompt: "Find setups matching my mandate" },
    { label: "Generate a Pine Script", prompt: "Generate a Pine Script" },
    { label: "What's the market doing?", prompt: "What's the market doing?" },
  ],
};

function getPageContext(pathname: string): PageContext {
  if (PAGE_CONTEXT_MAP[pathname]) return PAGE_CONTEXT_MAP[pathname];
  for (const [route, ctx] of Object.entries(PAGE_CONTEXT_MAP)) {
    if (pathname.startsWith(route)) return ctx;
  }
  return DEFAULT_PAGE_CONTEXT;
}

// ── Route-aware, auth-aware quick actions ──────────────────────

interface QuickAction {
  labelKey: string;
  promptKey: string;
  icon: typeof TrendingUp;
  label?: string;
}

// (Quick action tiers are now inline in the home screen render)

export interface TradingCopilotProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  pendingContext?: string | null;
  pendingAnalysis?: ChartAnalysisResult | null;
  onContextConsumed?: () => void;
  pendingPlanBuilder?: boolean;
  pendingNewPlan?: boolean;
  onPlanBuilderConsumed?: () => void;
}

export function TradingCopilot({ 
  isExpanded = false, 
  onToggle,
  pendingContext,
  pendingAnalysis,
  onContextConsumed,
  pendingPlanBuilder,
  pendingNewPlan,
  onPlanBuilderConsumed
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
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderIsNewPlan, setBuilderIsNewPlan] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const contextProcessedRef = useRef(false);
  const { plan, plans, hasPlan, refreshPlan, selectedPlanId, selectPlan } = useMasterPlan();
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

  const [todayTradeCount, setTodayTradeCount] = useState<number | null>(null);
  const [activePatternCount, setActivePatternCount] = useState<number | null>(null);

  // Fetch today's paper trade count for the greeting
  useEffect(() => {
    if (!isAuthenticated || !hasPlan) return;
    const fetchTodayTrades = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date().toISOString().slice(0, 10);
        const { count } = await supabase
          .from('paper_trades' as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('entry_time', today);
        setTodayTradeCount(count ?? 0);
      } catch { setTodayTradeCount(0); }
    };
    fetchTodayTrades();
  }, [isAuthenticated, hasPlan]);

  // Fetch active pattern count for anonymous banner (public RPC)
  useEffect(() => {
    if (isAuthenticated) return;
    const fetchCount = async () => {
      try {
        const { data } = await supabase.rpc('get_active_pattern_count');
        setActivePatternCount(typeof data === 'number' ? data : 0);
      } catch { setActivePatternCount(0); }
    };
    fetchCount();
  }, [isAuthenticated]);

  const { trackQuestion } = useCopilotFeedback();

  // Track auth transition — preserve chat, show welcome toast
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current) {
      // User just logged in mid-session
      toast.success("Welcome — your mandate is ready to set up.");
      setGuestMsgCount(0); // reset paywall
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Mandate handling — integrated into chat UI
  const { state: mandateState, submit: mandateSubmit, confirmSave: mandateConfirm, reset: mandateReset } = useMandateSubmit({
    onSaved: () => {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "✅ Master Plan saved. Your mandate is now active across all Copilot surfaces.",
        timestamp: new Date(),
      }]);
      window.dispatchEvent(new CustomEvent("mandate-saved"));
    },
    onQuestion: (question: string) => {
      // Route question to debrief
      window.dispatchEvent(new CustomEvent("copilot-question", { detail: question }));
    },
  });

  // Show mandate confirmation in chat
  useEffect(() => {
    if (mandateState.step === 'confirming') {
      setMessages(prev => {
        // Remove any previous confirmation message
        const filtered = prev.filter(m => !(m.role === 'assistant' && m.content.startsWith('📋')));
        return [...filtered, {
          id: 'mandate-confirm',
          role: "assistant",
          content: `📋 **Confirm your Master Plan:**\n\n${mandateState.confirmation}\n\n_Reply "yes" or "save" to confirm, or type adjustments._`,
          timestamp: new Date(),
        }];
      });
    }
    if (mandateState.step === 'error') {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${mandateState.message}`,
        timestamp: new Date(),
      }]);
    }
  }, [mandateState.step]);

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

  // Handle pending plan builder from context
  useEffect(() => {
    if (pendingPlanBuilder && isExpanded) {
      setShowBuilder(true);
      setBuilderIsNewPlan(!!pendingNewPlan);
      setMessages([]);
      onPlanBuilderConsumed?.();
    }
  }, [pendingPlanBuilder, pendingNewPlan, isExpanded, onPlanBuilderConsumed]);

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
      const pageCtx = getPageContext(location.pathname);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .filter(m => m.role === "user" || m.content.trim().length > 0)
            .slice(-20)
            .map(m => ({ role: m.role, content: m.content })),
          language: i18n.language,
          viewContext: {
            pageName: pageCtx.pageName,
            pageRoute: location.pathname,
          },
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
      const updateAssistantMsg = (content: string) => {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content } : m));
      };

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

            // Current streaming protocol
            if (parsed.type === "status") {
              updateAssistantMsg(`_${parsed.text}_`);
              continue;
            }
            if (parsed.type === "token") {
              assistantContent += parsed.text;
              updateAssistantMsg(assistantContent);
              continue;
            }
            if (parsed.type === "done") {
              streamDone = true;
              break;
            }
            if (parsed.type === "error") {
              assistantContent = parsed.text || t('copilot.errorMsg');
              updateAssistantMsg(assistantContent);
              streamDone = true;
              break;
            }

            // Legacy OpenAI delta fallback
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateAssistantMsg(assistantContent);
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
            if (parsed.type === "token") {
              assistantContent += parsed.text;
            } else if (parsed.type === "error") {
              assistantContent = parsed.text || t('copilot.errorMsg');
            } else {
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
              }
            }
          } catch { /* ignore */ }
        }
        updateAssistantMsg(assistantContent);
      }

      if (!assistantContent.trim()) {
        assistantContent = t('copilot.emptyResponse', 'Sorry — no response was returned. Please try again.');
        updateAssistantMsg(assistantContent);
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

  // Detect intent to edit/update trading plan
  const isEditPlanIntent = (text: string): boolean => {
    const lower = text.toLowerCase();
    const editKeywords = ['edit my trading', 'update my trading', 'change my trading', 'edit my plan', 'update my plan', 'change my plan', 'edit trading setting', 'edit trading plan', 'modify my plan', 'modify my trading'];
    return editKeywords.some(k => lower.includes(k));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || guestLimitReached) return;
    const trimmed = input.trim();

    // If mandate is awaiting confirmation, check for "yes"/"save"
    if (mandateState.step === 'confirming') {
      const lower = trimmed.toLowerCase();
      if (lower === 'yes' || lower === 'save' || lower === 'looks good' || lower === 'confirm') {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date() }]);
        setInput("");
        mandateConfirm();
        return;
      } else {
        mandateReset();
      }
    }

    if (!isAuthenticated) setGuestMsgCount(incrementGuestMsgCount());

    // Check if user wants to edit their trading plan — open builder instead
    if (isEditPlanIntent(trimmed) && isAuthenticated) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date() }]);
      setInput("");
      setShowBuilder(true);
      return;
    }

    setInput("");

    // Send to copilot (streamChat adds the user message to state)
    streamChat(trimmed);
  };

  const handleQuickAction = (prompt: string) => {
    if (isLoading || guestLimitReached) return;
    if (!isAuthenticated) setGuestMsgCount(incrementGuestMsgCount());
    streamChat(prompt);
  };

  const handleNewChat = useCallback(() => {
    startNewChat();
    activeConvoRef.current = null;
    setMessages([]);
    setShowBuilder(false);
  }, [startNewChat]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, [setActiveConversationId]);

  if (!isExpanded) {
    return (
      <div className={cn("fixed z-50 flex flex-col items-end gap-2", isMobile ? "bottom-20 right-4" : "bottom-[72px] right-6")}>
        {/* First-visit tooltip — disappears after first open */}
        {typeof window !== 'undefined' && !localStorage.getItem('copilot_tooltip_dismissed') && !sessionStorage.getItem('copilot_opened') && (
          <div className="relative bg-foreground text-background text-xs font-medium pl-3 pr-7 py-1.5 rounded-lg shadow-lg animate-bounce max-w-[220px] text-center leading-snug">
            {t('copilot.tooltip', 'Ask anything about markets, patterns & trade setups ✨')}
            <button
              onClick={(e) => {
                e.stopPropagation();
                try { localStorage.setItem('copilot_tooltip_dismissed', '1'); } catch {}
                // Force re-render by also setting sessionStorage
                try { sessionStorage.setItem('copilot_opened', '1'); } catch {}
                // Trigger re-render
                (e.target as HTMLElement).closest('.flex.flex-col')?.querySelector('.animate-bounce')?.remove();
              }}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full hover:bg-background/20 transition-colors"
              aria-label="Dismiss tooltip"
            >
              <X className="h-3 w-3" />
            </button>
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
              <p className="text-sm text-white/70">
                {isAuthenticated && hasPlan ? t('copilot.panel.yourDesk', 'Your trading desk') : isAuthenticated ? t('copilot.panel.setupPlan', 'Set up your trading plan') : t('copilot.panel.seeAiTrading', 'See what AI-native trading looks like.')}
              </p>
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
            ) : messages.length === 0 && !showBuilder ? (
              (() => {
                const pageCtx = getPageContext(location.pathname);
                const tier2Chips = isAuthenticated ? pageCtx.chips : [];
                const redirectPath = typeof window !== 'undefined'
                  ? encodeURIComponent(window.location.pathname + window.location.search)
                  : '/';
                return (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mx-auto flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  {!isAuthenticated ? (
                    <>
                      <h4 className="font-semibold text-base mb-1">{t('copilot.panel.setFirstPlan', 'Set your first trading plan and see how it performs')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('copilot.panel.likeBacktesting', 'Like backtesting in MT4 or Pine Script — but running live, automatically, on paper. No risk. See results first.')}
                      </p>
                    </>
                  ) : hasPlan ? (
                    <>
                      <h4 className="font-semibold text-base mb-1">{t('copilot.panel.planRunning', 'Your trading plan is running')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('copilot.panel.paperTesting', 'Copilot is paper-testing your plan live.')} {todayTradeCount !== null ? `${todayTradeCount} ${t('copilot.panel.tradesTakenToday', 'trade(s) taken today.')} ${t('copilot.panel.reviewBeforeLive', 'Review results before going live.')}` : t('copilot.panel.reviewBeforeLive', 'Review results before going live.')}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-base mb-1">{t('copilot.panel.whatsYourPlan', "What's your trading plan?")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('copilot.panel.describeTrading', 'Describe how you like to trade — patterns, risk, timing. Copilot runs it as a live paper simulation so you can see how it performs before risking real money.')}
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  {/* ── LOGGED-OUT: 3 demo chips ── */}
                  {!isAuthenticated && (
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: t('copilot.panel.chipPatterns', 'What patterns are active right now?'), prompt: "What patterns are active right now?" },
                        { label: t('copilot.panel.chipScore', 'Score a trade for me'), prompt: "Score a trade for me" },
                        { label: t('copilot.panel.chipGate', 'How does the AI Gate work?'), prompt: "How does the AI Gate work?" },
                      ].map((chip) => (
                        <Button key={chip.label} variant="outline" size="sm" className="h-auto py-1.5 px-3 text-left" onClick={() => handleQuickAction(chip.prompt)} disabled={isLoading}>
                          <span className="text-sm">{chip.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* ── LOGGED-OUT: Active setups banner ── */}
                  {!isAuthenticated && (
                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                       <p className="text-sm text-foreground/80 mb-2">
                        {(t as any)('copilot.panel.activeSetups', { count: String(activePatternCount ?? '…'), defaultValue: 'Copilot found {{count}} active setups right now — sign up free to see them scored against your mandate.' })}
                      </p>
                      <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm">
                        <Link to={`/auth?redirect=${redirectPath}&mode=register`}>
                          {t('copilot.panel.createFirstPlan', 'Create your first trading plan →')}
                        </Link>
                      </Button>
                      <p className="text-sm text-muted-foreground/60 text-center mt-1">{t('copilot.panel.freeToTry', 'Free to try · No real money · You decide when to go live')}</p>
                    </div>
                  )}

                  {/* ── LOGGED-IN: Tier 1 — Mandate & Session ── */}
                  {isAuthenticated && hasPlan && (
                    <div className="flex flex-wrap gap-2">
                     <Button variant="outline" size="sm" className="h-auto py-1.5 px-3 text-left" onClick={() => handleQuickAction("Review today's paper results")} disabled={isLoading}>
                       <span className="text-sm">{t('copilot.panel.reviewResults', "Review today's paper results")}</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-auto py-1.5 px-3 text-left" onClick={() => setShowBuilder(true)} disabled={isLoading}>
                        <span className="text-sm">{t('copilot.panel.updatePlan', 'Update your trading plan')}</span>
                       </Button>
                       <Button variant="outline" size="sm" className="h-auto py-1.5 px-3 text-left" onClick={() => { setBuilderIsNewPlan(true); setShowBuilder(true); }} disabled={isLoading}>
                        <span className="text-sm">{t('copilot.panel.addNewPlan', 'Add new trading plan')}</span>
                       </Button>
                     </div>
                  )}

                  {/* ── LOGGED-IN: Tier 1 — Getting started (no mandate) ── */}
                   {isAuthenticated && !hasPlan && (
                     <Button
                       className="w-full h-auto py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                       onClick={() => setShowBuilder(true)}
                       disabled={isLoading}
                     >
                       {t('copilot.panel.setPlan', 'Set your trading plan →')}
                     </Button>
                   )}

                  {/* ── LOGGED-IN: Tier 2 — Page-aware chips ── */}
                  {tier2Chips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tier2Chips.map((chip) => (
                        <Button key={chip.label} variant="outline" size="sm" className="h-auto py-1.5 px-3 text-left" onClick={() => handleQuickAction(chip.prompt)} disabled={isLoading}>
                          <span className="text-sm">{chip.labelKey ? t(chip.labelKey, chip.label) : chip.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Tier 3 — Utility row (small text links) */}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2">
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleQuickAction("Generate a Pine Script")} disabled={isLoading}>{t('copilot.generateScript', 'Generate script')}</button>
                    <span className="text-muted-foreground/40 text-sm">·</span>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleQuickAction("Create an alert for my top setup")} disabled={isLoading}>{t('copilot.createAlert', 'Create alert')}</button>
                    <span className="text-muted-foreground/40 text-sm">·</span>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleQuickAction("Teach me about chart patterns")} disabled={isLoading}>{t('copilot.learnPatterns', 'Learn patterns')}</button>
                    <span className="text-muted-foreground/40 text-sm">·</span>
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleQuickAction("What's the market doing right now?")} disabled={isLoading}>{t('copilot.marketBreadth', 'Market breadth')}</button>
                    <span className="text-muted-foreground/40 text-sm">·</span>
                    <ContactSupportDialog
                      trigger={
                        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('copilot.contactSupport', 'Contact Support')}</button>
                      }
                      defaultCategory="other"
                      defaultSubject=""
                      defaultDescription=""
                      source="copilot_quick_action"
                    />
                  </div>
                </div>
              </div>
                );
              })()
            ) : showBuilder ? (
              <TradingPlanBuilder
                existingPlan={builderIsNewPlan ? null : plan}
                isNewPlan={builderIsNewPlan}
                plans={plans}
                onSelectPlan={selectPlan}
                onSaved={() => {
                  setShowBuilder(false);
                  setBuilderIsNewPlan(false);
                  refreshPlan();
                  setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    role: "assistant" as const,
                    content: builderIsNewPlan
                      ? `✅ New trading plan created! Copilot is now paper-testing it live.\n\nSwitch between plans from the Master Plan card on your desk.`
                      : `✅ Your trading plan is updated. Copilot is now paper-testing it live.\n\nI'll scan for matching setups and log every trade.\nCheck back here or visit your Copilot desk to see results.`,
                    timestamp: new Date(),
                  }]);
                }}
                onCancel={() => { setShowBuilder(false); setBuilderIsNewPlan(false); }}
                onSwitchToNL={() => {
                  setShowBuilder(false);
                  setBuilderIsNewPlan(false);
                  setInput(hasPlan ? "Update my trading plan: " : "");
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              />
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
              <span className="text-sm font-medium">{t('copilot.moreBelow')}</span>
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
                <Badge variant="secondary" className="text-sm font-normal">
                  {t('activation.freeMessagesRemaining', '{{count}} of {{total}} free messages remaining', { count: GUEST_MSG_LIMIT - guestMsgCount, total: GUEST_MSG_LIMIT })}
                </Badge>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea ref={inputRef as any} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} placeholder={isAuthenticated && hasPlan ? t('copilot.panel.placeholderWithPlan', 'Ask Copilot anything, or give a command...') : isAuthenticated ? t('copilot.panel.placeholderNoPlan', 'e.g. Only take breakouts, max 3% risk, mornings only...') : t('copilot.panel.placeholderGuest', 'Ask Copilot anything — no sign up needed to try')} disabled={isLoading || mandateState.step === 'parsing' || mandateState.step === 'saving'} className="flex-1 min-h-[4rem] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows={2} />
              <div className="flex flex-col gap-1 items-center justify-end">
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">
                      {t('copilot.disclaimer', 'For educational purposes only. Not financial advice.')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </form>
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
