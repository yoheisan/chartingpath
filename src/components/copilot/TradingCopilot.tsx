import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  Send, 
  X, 
  Loader2, 
  TrendingUp,
  Bell,
  Code,
  BookOpen,
  BarChart3,
  PanelLeftOpen,
  PanelLeftClose
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopilotRichMessage } from "./CopilotRichMessage";
import { ChartAnalysisSummary } from "./ChartAnalysisSummary";
import { ChartAnalysisResult } from "@/hooks/useChartAnalysis";
import { CopilotHistorySidebar } from "./CopilotHistorySidebar";
import { useCopilotConversations } from "@/hooks/useCopilotConversations";

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

const QUICK_ACTIONS = [
  { label: "Find patterns", prompt: "Show me the best quality patterns forming right now across major tech stocks", icon: TrendingUp },
  { label: "Create alert", prompt: "I want to set up an alert for bull flags on AAPL", icon: Bell },
  { label: "Generate script", prompt: "Generate a Pine Script strategy for trading ascending triangles on BTCUSD", icon: Code },
  { label: "Learn patterns", prompt: "Explain how to identify and trade a head and shoulders pattern", icon: BookOpen },
];

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ChartAnalysisResult | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextProcessedRef = useRef(false);

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

  // Track which conversation the current in-memory messages belong to
  const activeConvoRef = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
            .map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error("AI is processing other requests. Please wait 10 seconds and try again.", { duration: 5000 });
          throw new Error("Rate limited");
        }
        if (resp.status === 402) {
          toast.error("AI credits depleted. Please add credits to continue.");
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

      // Persist assistant message
      if (convoId && assistantContent) {
        saveMessage(convoId, "assistant", assistantContent);
      }

    } catch (error) {
      console.error("Chat error:", error);
      const isKnownError = error instanceof Error && (error.message === "Rate limited" || error.message === "Credits depleted");
      if (!isKnownError) {
        toast.error("Failed to get response. Please try again.");
      }
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "user") {
          return [...prev, {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: isKnownError ? "⚠️ Rate limited — please wait a few seconds and try again." : "⚠️ Something went wrong. Please try again.",
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
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickAction = (prompt: string) => {
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
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-primary to-accent hover:opacity-90 hidden md:flex"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onToggle} />
      
      {/* Full-screen modal (same size as ⌘K) */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
        <Card className={cn(
          "w-full max-w-3xl h-[75vh] flex shadow-2xl border-primary/20 overflow-hidden transition-all animate-in fade-in-0 zoom-in-95",
          showHistory && isAuthenticated ? "max-w-4xl" : "max-w-3xl"
        )}>
      {/* History sidebar */}
      {showHistory && isAuthenticated && (
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
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(v => !v)}>
                {showHistory ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
            )}
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Trading Copilot</h3>
              <p className="text-xs text-muted-foreground">AI-powered research assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                <h4 className="font-semibold mb-1">How can I help you trade smarter?</h4>
                <p className="text-sm text-muted-foreground">
                  Find patterns, analyze statistics, create alerts, or generate scripts.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium px-1">Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button key={action.label} variant="outline" size="sm" className="justify-start h-auto py-2 px-3 text-left" onClick={() => handleQuickAction(action.prompt)} disabled={isLoading}>
                      <action.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex flex-col gap-2", message.role === "user" ? "items-end" : "items-start")}>
                  {message.role === "user" && message.analysisData && (
                    <Card className="w-full p-3 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                      <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Chart Analysis</span>
                        </div>
                      </div>
                      <ChartAnalysisSummary analysis={message.analysisData} />
                    </Card>
                  )}
                  <div className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {message.role === "assistant" ? (
                      <CopilotRichMessage content={message.content || "..."} />
                    ) : message.analysisData ? (
                      <span className="text-xs opacity-80">Analyze {message.analysisData.symbol} ({message.analysisData.timeframe})</span>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
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

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about patterns, alerts, or scripts..." disabled={isLoading} className="flex-1" />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            For educational purposes only. Not financial advice.
          </p>
        </div>
      </div>
        </Card>
      </div>
    </>
  );
}
