import { useState, useRef, useEffect } from "react"; // copilot chat
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useCopilotFeedback } from "@/hooks/useCopilotFeedback";
import { useCopilotConversations } from "@/hooks/useCopilotConversations";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";
const CHAT_URL = `${SUPABASE_URL}/functions/v1/trading-copilot`;

interface CommandPaletteChatProps {
  initialPrompt?: string;
  onBack: () => void;
}

export function CommandPaletteChat({ initialPrompt, onBack }: CommandPaletteChatProps) {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const { trackQuestion } = useCopilotFeedback();
  const { createConversation, saveMessage, isAuthenticated } = useCopilotConversations();
  const convoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-send initial prompt
  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true;
      streamChat(initialPrompt);
    }
  }, [initialPrompt]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    const assistantId = crypto.randomUUID();

    // Update UI immediately (prevents "stuck" spinner even if streaming isn't supported)
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    setInput("");

    // Persist: ensure conversation exists
    if (!convoIdRef.current && isAuthenticated) {
      convoIdRef.current = await createConversation(userMessage.slice(0, 60));
    }
    if (convoIdRef.current) {
      saveMessage(convoIdRef.current, "user", userMessage);
    }

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .filter((m) => m.role === "user" || m.content.trim().length > 0)
            .slice(-20)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          language: i18n.language,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
          throw new Error("Rate limited");
        }
        if (resp.status === 402) {
          toast.error("AI credits depleted. Please add credits to continue.");
          throw new Error("Credits depleted");
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      // If streaming isn't available (some mobile browsers/webviews), fall back to parsing the full text.
      if (!resp.body || typeof resp.body.getReader !== "function") {
        const full = await resp.text();
        for (const raw of full.split("\n")) {
          const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            // Handle new streaming protocol
            if (parsed.type === "token") {
              assistantContent += parsed.text;
            } else if (parsed.type === "error") {
              assistantContent = parsed.text;
              break;
            } else if (parsed.type === "done") {
              break;
            } else if (parsed.type === "status") {
              continue; // Skip status in non-streaming fallback
            } else {
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) assistantContent += content;
            }
          } catch {
            // ignore
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
        );
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "status") {
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: `_${parsed.text}_` } : m));
            } else if (parsed.type === "token") {
              assistantContent += parsed.text;
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m));
            } else if (parsed.type === "done") {
              streamDone = true; break;
            } else if (parsed.type === "error") {
              assistantContent = parsed.text || "Something went wrong.";
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m));
              streamDone = true; break;
            } else {
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: assistantContent } : m));
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush in case remaining buffered lines arrived without trailing newline
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
            if (content) assistantContent += content;
          } catch {
            // ignore partial leftovers
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      if (!(error instanceof Error && (error.message === "Rate limited" || error.message === "Credits depleted"))) {
        toast.error("Copilot failed to respond. Please try again.");
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry — I couldn't get a response right now. Please try again.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      trackQuestion(userMessage, assistantContent);
      // Persist assistant response
      if (convoIdRef.current && assistantContent) {
        saveMessage(convoIdRef.current, "assistant", assistantContent);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium text-sm">Trading Copilot</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && !initialPrompt ? (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Try one of these to get started
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {[
                { emoji: "📊", text: "What are the top 3 most profitable chart patterns this month?" },
                { emoji: "🎯", text: "Show me a bull flag setup with entry, stop-loss & target" },
                { emoji: "⚡", text: "Compare head & shoulders vs double top win rates" },
                { emoji: "🧠", text: "Build me a swing trading plan for EURUSD using patterns" },
              ].map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => streamChat(prompt.text)}
                  className="flex items-start gap-2 text-left rounded-lg border border-border/60 bg-muted/40 hover:bg-muted hover:border-primary/30 transition-all px-3 py-2.5 text-sm group"
                >
                  <span className="text-base mt-0.5 shrink-0">{prompt.emoji}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors leading-snug">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80">
                      <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                    </div>
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
      <div className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
