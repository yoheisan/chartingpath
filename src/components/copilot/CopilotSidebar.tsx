import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Home,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopilotRichMessage } from "./CopilotRichMessage";
import { CopilotAuthGate } from "./CopilotAuthGate";
import { useCopilotConversations } from "@/hooks/useCopilotConversations";
import { useCopilotFeedback } from "@/hooks/useCopilotFeedback";
import { prewarmedContext as prewarmedCtx } from "@/hooks/useDashboardPrefetch";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  dispatchScoringUpdate,
  dispatchRunBacktest,
  dispatchNavigate,
  isPanelMounted,
  getViewContext,
} from '@/lib/copilotEvents';
import { fuzzyMatchRoute } from '@/lib/navigationRoutes';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUPABASE_URL = "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";
const DEFAULT_CHAT_URL = `${SUPABASE_URL}/functions/v1/trading-copilot`;
const ROUTER_CHAT_URL = `${SUPABASE_URL}/functions/v1/copilot-router`;
const OUTCOME_URL = `${SUPABASE_URL}/functions/v1/copilot-outcome`;

const GUEST_MSG_KEY = "copilot_guest_msgs";
const GUEST_MSG_LIMIT = 3;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
function getGuestMsgCount(): number {
  try {
    const raw = localStorage.getItem(GUEST_MSG_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return 0;
    return parsed.count || 0;
  } catch { return 0; }
}
function incrementGuestMsgCount(): number {
  const next = getGuestMsgCount() + 1;
  try { localStorage.setItem(GUEST_MSG_KEY, JSON.stringify({ date: getTodayKey(), count: next })); } catch {}
  return next;
}

const GUEST_QUICK_PROMPTS = [
  { label: "What bull flag setups are active right now?", icon: TrendingUp },
  { label: "Which patterns have the highest win rate on forex?", icon: BarChart3 },
  { label: "Show me the best crypto setups today", icon: Sparkles },
];

const AUTH_QUICK_PROMPTS = [
  { label: "Increase take rate by 5%", icon: TrendingUp },
  { label: "Make scoring more conservative", icon: Sparkles },
  { label: "Show current scoring weights", icon: Sparkles },
];

interface CopilotContext {
  domain?: string;
  route?: string;
  quickPrompts?: string[];
}

interface CopilotSidebarProps {
  onClose: () => void;
  context?: CopilotContext;
}

export function CopilotSidebar({ onClose, context }: CopilotSidebarProps) {
  const chatUrl = context ? ROUTER_CHAT_URL : DEFAULT_CHAT_URL;
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [guestMsgCount, setGuestMsgCount] = useState(getGuestMsgCount);
  const [contextTokens, setContextTokens] = useState<{ used: number; budget: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    activeConversationId,
    createConversation,
    saveMessage,
    startNewChat,
    isAuthenticated,
  } = useCopilotConversations();

  const { trackQuestion } = useCopilotFeedback();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeConvoRef = useRef<string | null>(null);
  const lastTrainingPairIdRef = useRef<string | null>(null);
  const guestLimitReached = !isAuthenticated && guestMsgCount >= GUEST_MSG_LIMIT;

  // Fire outcome tracking (background, non-blocking)
  const fireOutcome = useCallback(async (trainingPairId: string, outcome: 'applied' | 'dismissed' | 'clicked_through') => {
    try {
      await fetch(OUTCOME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ training_pair_id: trainingPairId, outcome }),
      });
    } catch (err) {
      console.error('[CopilotOutcome] fire error:', err);
    }
  }, []);

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
      console.error('[CopilotFeedback] error:', err);
    }
  }, [messages]);

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
        viewport.addEventListener('scroll', checkScrollPosition);
        setTimeout(checkScrollPosition, 100);
        return () => viewport.removeEventListener('scroll', checkScrollPosition);
      }
    }
  }, [messages, checkScrollPosition]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");

    let convoId = activeConvoRef.current;
    if (!convoId && isAuthenticated) {
      convoId = await createConversation(userMessage.slice(0, 60));
      activeConvoRef.current = convoId;
    }
    if (convoId) saveMessage(convoId, "user", userMessage);

    let assistantContent = "";
    const requestController = new AbortController();
    const REQUEST_TIMEOUT_MS = 65000; // slightly above 60s server timeout
    let requestTimeoutId: number | undefined;

    try {
      requestTimeoutId = window.setTimeout(() => {
        requestController.abort(new DOMException("Request timed out", "AbortError"));
      }, REQUEST_TIMEOUT_MS);

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const resp = await fetch(chatUrl, {
        method: "POST",
        headers,
        signal: requestController.signal,
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .filter(m => m.role === "user" || m.content.trim().length > 0)
            .slice(-20)
            .map(m => ({ role: m.role, content: m.content })),
          language: i18n.language,
          context: {
            domain: context?.domain,
            route: context?.route,
            panelMounted: isPanelMounted('agentScoring'),
            currentPath: window.location.pathname,
          },
          viewContext: getViewContext(),
          ...(prewarmedCtx.ready && {
            prewarmed: { watchlist: prewarmedCtx.watchlistSymbols, activePatterns: prewarmedCtx.activePatternCount },
          }),
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) { toast.error(t('copilot.rateLimited')); throw new Error("Rate limited"); }
        if (resp.status === 402) { toast.error(t('copilot.creditsDepleted')); throw new Error("Credits depleted"); }
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      const assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

      // Helper to update the assistant message content
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

            // New streaming protocol: type-based events
            if (parsed.type === "meta") {
              if (parsed.contextTokensUsed && parsed.contextTokenBudget) {
                setContextTokens({ used: parsed.contextTokensUsed, budget: parsed.contextTokenBudget });
              }
              continue;
            }
            if (parsed.type === "status") {
              // Show status as italic muted text in the bubble
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
              assistantContent = parsed.text || "Something went wrong. Please try again.";
              updateAssistantMsg(assistantContent);
              streamDone = true;
              break;
            }

            // Legacy format fallback: OpenAI-compatible delta
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

      // Final flush of remaining buffer
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
              assistantContent = parsed.text;
            } else {
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) assistantContent += content;
            }
          } catch { /* ignore */ }
        }
        updateAssistantMsg(assistantContent);
      }

      // ── Client-side navigation intent detection (fast path, no edge function needed)
      const NAV_REGEX = /\b(go to|open|navigate to|take me to|switch to)\s+(.+)/i;
      const navMatch = userMessage.match(NAV_REGEX);
      if (navMatch) {
        const destination = navMatch[2].replace(/[.!?]$/, '').trim();
        const route = fuzzyMatchRoute(destination);
        if (route) {
          navigate(route.path);
          toast.success(`Navigated to ${route.label}`);
        }
      }

      // ── Action marker parsing — scan final assistant message for structured actions
      if (assistantContent) {
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```|(\{[^{}]*"(?:uiSync|runBacktest|navigateTo|saved|undone|loaded)"[^{}]*\})/g;
        let match;
        while ((match = jsonBlockRegex.exec(assistantContent)) !== null) {
          const jsonStr = match[1] || match[2];
          if (!jsonStr) continue;
          try {
            const block = JSON.parse(jsonStr);

            if (block.uiSync) {
              dispatchScoringUpdate({
                ...block.uiSync,
                originatedAt: Date.now(),
                diff: block.diff,
                description: block.changeDescription,
              });
            }

            if (block.navigateTo) {
              const route = fuzzyMatchRoute(block.navigateTo) ?? { path: block.navigateTo, label: block.navigateTo };
              setTimeout(() => {
                navigate(route.path);
                dispatchNavigate({ path: route.path, label: route.label, pendingAction: block.pendingAction ?? false });
                toast.success(`Navigated to ${route.label}`);
              }, 300);
            }

            if (block.runBacktest === true) {
              setTimeout(() => dispatchRunBacktest(), 800);
            }

            if (block.saved && block.presetId) {
              queryClient.invalidateQueries({ queryKey: ['agent-scoring-settings'] });
              toast.success(`Preset "${block.presetName}" saved`);
            }

            if (block.undone && block.uiSync) {
              dispatchScoringUpdate({
                ...block.uiSync,
                originatedAt: Date.now(),
                description: block.message,
              });
            }

            if (block.loaded && block.uiSync) {
              dispatchScoringUpdate({
                ...block.uiSync,
                originatedAt: Date.now(),
                description: `Loaded preset: ${block.uiSync.presetName}`,
              });
              queryClient.invalidateQueries({ queryKey: ['agent-scoring-settings'] });
            }
          } catch {
            // Invalid JSON block — skip
          }
        }
      }

      if (convoId && assistantContent) saveMessage(convoId, "assistant", assistantContent);
      if (assistantContent) {
        trackQuestion(userMessage, assistantContent);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const { data: pairs } = await supabase
              .from('copilot_training_pairs')
              .select('id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);
            if (pairs?.[0]?.id) {
              lastTrainingPairIdRef.current = pairs[0].id;
            }
          }
        } catch { /* non-critical */ }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const isKnownError = error instanceof Error && (error.message === "Rate limited" || error.message === "Credits depleted");
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      if (isTimeout) toast.error(t('copilot.timeout', 'Copilot request timed out. Please try again.'));
      if (!isKnownError && !isTimeout) toast.error(t('copilot.errorResponse'));
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "user") {
          return [...prev, {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: isKnownError
              ? t('copilot.rateLimitedMsg')
              : isTimeout
                ? t('copilot.timeoutMsg', 'The request timed out. Please try again with a shorter prompt.')
                : t('copilot.errorMsg'),
            timestamp: new Date()
          }];
        }
        return prev;
      });
    } finally {
      if (requestTimeoutId !== undefined) window.clearTimeout(requestTimeoutId);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || guestLimitReached) return;
    // Fire clicked_through outcome if user sends a follow-up after an assistant response
    if (lastTrainingPairIdRef.current && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
      fireOutcome(lastTrainingPairIdRef.current, 'clicked_through');
      lastTrainingPairIdRef.current = null;
    }
    if (!isAuthenticated) setGuestMsgCount(incrementGuestMsgCount());
    streamChat(input.trim());
  };

  const handleNewChat = useCallback(() => {
    startNewChat();
    activeConvoRef.current = null;
    setMessages([]);
  }, [startNewChat]);

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-white/90" />
          <div>
            <h3 className="font-semibold text-sm text-white">{t('copilot.title', 'AI Copilot')}</h3>
            <p className="text-xs text-white/70">{t('copilot.agentScoringContext', 'Agent Scoring mode')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={handleNewChat} title="New chat">
              <Home className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10" onClick={onClose}>
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 relative min-h-0">
        <ScrollArea className="h-full p-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4 pt-4">
              <div className="text-center py-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mx-auto flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{t('copilot.agentScoringWelcome', 'Adjust your scoring')}</h4>
                <p className="text-xs text-muted-foreground">
                  {t('copilot.agentScoringDesc', 'Type natural language commands to tweak weights, cutoffs, and filters.')}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium px-1">{t('copilot.trySaying', 'Try saying:')}</p>
                {(isAuthenticated ? AUTH_QUICK_PROMPTS : GUEST_QUICK_PROMPTS).map((p) => (
                  <button
                    key={p.label}
                    className="w-full text-left text-sm px-3 py-2 rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-colors"
                    onClick={() => { if (!guestLimitReached) { if (!isAuthenticated) setGuestMsgCount(incrementGuestMsgCount()); streamChat(p.label); } }}
                    disabled={isLoading}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, idx) => {
                const isLastAssistant = message.role === "assistant" && idx === messages.length - 1;
                return (
                <div key={message.id} className={cn("flex flex-col gap-1", message.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-sm leading-relaxed break-words [overflow-wrap:anywhere]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground max-w-[90%]"
                      : "bg-muted w-full"
                  )}>
                    {message.role === "assistant" ? (
                      <CopilotRichMessage content={message.content || "..."} onQuickReply={isLastAssistant ? (text) => { if (!isLoading) streamChat(text); } : undefined} />
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.role === "assistant" && message.content && message.content !== "..." && (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => { logFeedback(message.content, true); toast.success(t('copilot.feedbackThanks', 'Thanks!')); }}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => { logFeedback(message.content, false); toast.info(t('copilot.feedbackNoted', 'Noted!')); }}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )})}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {showScrollDown && (
          <button
            onClick={() => {
              const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
              if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 p-1.5 rounded-md bg-background/80 border border-border/50 text-muted-foreground shadow-md backdrop-blur-sm hover:text-foreground transition-all"
          >
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        )}
      </div>

      {/* Input */}
      {guestLimitReached ? (
        <CopilotAuthGate messagesUsed={guestMsgCount} maxMessages={GUEST_MSG_LIMIT} />
      ) : (
        <div className="px-4 py-3 border-t bg-background">
          {!isAuthenticated && guestMsgCount > 0 && (
            <div className="flex justify-start mb-1.5">
              <Badge variant="secondary" className="text-xs font-normal">
                {GUEST_MSG_LIMIT - guestMsgCount} of {GUEST_MSG_LIMIT} free left
              </Badge>
            </div>
          )}
          {context?.quickPrompts && context.quickPrompts.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {context.quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="text-xs px-2 py-1 rounded-full border border-border/50 bg-muted/30 hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setInput(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={t('copilot.agentScoringPlaceholder', 'e.g. "increase take rate by 5%"')}
              disabled={isLoading}
              className="flex-1 min-h-[3rem] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              rows={2}
            />
            <Button type="submit" size="icon" className="h-auto self-end" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
