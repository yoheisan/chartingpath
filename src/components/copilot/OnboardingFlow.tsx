import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Check, Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";

interface OnboardingMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

const PATTERN_MAP: Record<string, string[]> = {
  reversal: ["double_bottom", "double_top", "head_and_shoulders", "inverse_head_and_shoulders"],
  breakout: ["bull_flag", "bear_flag", "ascending_triangle", "descending_triangle", "symmetrical_triangle"],
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [input, setInput] = useState("");
  const [turn, setTurn] = useState(0); // 0 = not started, 1-4 = turns
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<{ instruments?: string; style?: string; risk?: string }>({});
  const [showComplete, setShowComplete] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const browserLang = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : "en";

  // Scroll to bottom on new messages
  useEffect(() => {
    const vp = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, [messages]);

  const addMessage = useCallback((role: "assistant" | "user", content: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role, content }]);
  }, []);

  // Initialize: check for existing onboarding session or start fresh
  useEffect(() => {
    if (!user?.id || initRef.current) return;
    initRef.current = true;

    const init = async () => {
      // Check for existing onboarding conversation
      const { data: existing } = await (supabase
        .from("copilot_conversations") as any)
        .select("id, title")
        .eq("user_id", user.id)
        .eq("flow_type", "onboarding")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.id);
        // Load existing messages
        const { data: msgs } = await supabase
          .from("copilot_messages")
          .select("role, content")
          .eq("conversation_id", existing.id)
          .order("created_at", { ascending: true });

        if (msgs && msgs.length > 0) {
          const loaded = msgs.map(m => ({
            id: crypto.randomUUID(),
            role: m.role as "assistant" | "user",
            content: m.content,
          }));
          setMessages(loaded);

          // Determine which turn we're on based on user message count
          const userMsgs = msgs.filter(m => m.role === "user");
          const resumeTurn = Math.min(userMsgs.length + 1, 4);

          // Extract previous answers
          const ans: typeof answers = {};
          if (userMsgs[0]) ans.instruments = userMsgs[0].content;
          if (userMsgs[1]) ans.style = userMsgs[1].content;
          if (userMsgs[2]) ans.risk = userMsgs[2].content;
          setAnswers(ans);

          // Resume
          addMessage("assistant", "Welcome back — let's finish setting up your plan.");
          setTurn(resumeTurn);
          return;
        }
      }

      // Start fresh — create conversation
      const { data: newConvo } = await supabase
        .from("copilot_conversations")
        .insert({ user_id: user.id, title: "Onboarding", flow_type: "onboarding" } as any)
        .select("id")
        .single();

      if (newConvo) setConversationId(newConvo.id);

      // Generate localized opening message
      setIsLoading(true);
      try {
        const opening = await generateLocalizedMessage(
          `Generate a friendly 1-sentence opening for a trading assistant onboarding. Ask what instruments they trade (stocks, FX, indices, or crypto — they can say multiple). Language: ${browserLang}. Keep it under 30 words.`
        );
        addMessage("assistant", opening || "Before I start scanning for you — what do you trade? Stocks, FX, indices, or crypto? (You can say multiple)");
      } catch {
        addMessage("assistant", "Before I start scanning for you — what do you trade? Stocks, FX, indices, or crypto? (You can say multiple)");
      }
      setTurn(1);
      setIsLoading(false);
    };

    init();
  }, [user?.id]);

  const generateLocalizedMessage = async (prompt: string): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/trading-copilot`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          viewContext: { pageRoute: "/onboarding" },
        }),
      });

      if (!res.ok || !res.body) return "";

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) result += content;
          } catch { /* partial */ }
        }
      }

      return result.trim();
    } catch {
      return "";
    }
  };

  const persistMessage = async (role: string, content: string) => {
    if (!conversationId) return;
    await supabase.from("copilot_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
  };

  const handleUserResponse = async (response: string) => {
    if (!response.trim() || isLoading) return;
    addMessage("user", response);
    persistMessage("user", response);
    setInput("");
    setIsLoading(true);

    try {
      if (turn === 1) {
        // Save instruments & language
        setAnswers(prev => ({ ...prev, instruments: response }));

        // Save preferred language
        if (user?.id) {
          await supabase.rpc("set_user_language", {
            p_user_id: user.id,
            p_language_code: browserLang,
            p_detected_country: null,
            p_is_manual: false,
          });
        }

        const msg = "Got it. Are you more of a breakout trader (riding momentum) or do you prefer reversals (catching turns)?";
        addMessage("assistant", msg);
        persistMessage("assistant", msg);
        setTurn(2);
      } else if (turn === 2) {
        setAnswers(prev => ({ ...prev, style: response }));
        const msg = "Last one — max risk per trade. Conservative (0.5–1%) or standard (1–2%)?";
        addMessage("assistant", msg);
        persistMessage("assistant", msg);
        setTurn(3);
      } else if (turn === 3) {
        setAnswers(prev => ({ ...prev, risk: response }));
        await handleFinalTurn(response);
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      addMessage("assistant", "Something went wrong. Let me try again...");
    }
    setIsLoading(false);
  };

  const handleFinalTurn = async (riskAnswer: string) => {
    const instruments = answers.instruments || "stocks";
    const style = answers.style || "breakout";
    const risk = riskAnswer;

    // Determine style key
    const styleKey = style.toLowerCase().includes("reversal") ? "reversal" : "breakout";
    const derivedPatterns = PATTERN_MAP[styleKey] || PATTERN_MAP.breakout;
    const defaultTimeframes = styleKey === "reversal" ? ["1d", "4h"] : ["4h", "1h"];

    // Parse risk
    let maxRiskPct = 1.0;
    if (risk.toLowerCase().includes("conservative") || risk.includes("0.5")) {
      maxRiskPct = 0.75;
    } else if (risk.includes("2")) {
      maxRiskPct = 2.0;
    }

    // Parse instruments
    const instrumentList: string[] = [];
    const lowerInst = instruments.toLowerCase();
    if (lowerInst.includes("stock") || lowerInst.includes("equit")) instrumentList.push("stocks");
    if (lowerInst.includes("fx") || lowerInst.includes("forex") || lowerInst.includes("currency")) instrumentList.push("fx");
    if (lowerInst.includes("indic") || lowerInst.includes("index")) instrumentList.push("indices");
    if (lowerInst.includes("crypto") || lowerInst.includes("bitcoin") || lowerInst.includes("btc")) instrumentList.push("crypto");
    if (instrumentList.length === 0) instrumentList.push("stocks"); // fallback

    // Generate confirmation via AI
    const confirmPrompt = `Generate a 2-sentence confirmation of a trading plan setup.
Instruments: ${instrumentList.join(", ")}
Style: ${styleKey}
Max risk: ${maxRiskPct}%
Pattern focus: ${derivedPatterns.join(", ")}
Language: ${browserLang}
End with: "I'm scanning markets now — I'll ping you when something matches."`;

    let confirmation = await generateLocalizedMessage(confirmPrompt);
    if (!confirmation) {
      confirmation = `Great — I've set you up for ${styleKey} patterns on ${instrumentList.join(", ")} with ${maxRiskPct}% max risk. I'm scanning markets now — I'll ping you when something matches.`;
    }

    addMessage("assistant", confirmation);
    persistMessage("assistant", confirmation);

    // Save structured plan to profiles
    const structuredPlan = {
      instruments: instrumentList,
      style: styleKey,
      patterns: derivedPatterns,
      timeframes: defaultTimeframes,
      max_risk_pct: maxRiskPct,
      auto_trade: false,
      override_constraints: {
        require_written_reason: false,
        cooldown_seconds: 0,
      },
    };

    if (user?.id) {
      await supabase
        .from("profiles")
        .update({
          trading_plan_structured: structuredPlan,
          onboarding_completed: true,
        } as any)
        .eq("user_id", user.id);
    }

    setTurn(4);

    // Show completion animation
    setTimeout(() => {
      setShowComplete(true);
    }, 500);

    // Trigger scan and transition after delay
    setTimeout(async () => {
      try {
        await supabase.functions.invoke("scan-setups", {
          body: { user_id: user?.id, triggered_by: "onboarding" },
        });
      } catch {
        // Non-blocking
      }

      // Mark localStorage for existing onboarding state hook
      try {
        localStorage.setItem("chartingpath_onboarding_completed", "true");
      } catch {}

      onComplete();
    }, 2500);
  };

  const handleButtonChoice = (value: string) => {
    handleUserResponse(value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-gradient-to-r from-accent/5 to-transparent">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">Setting up your trading plan</span>
        <div className="ml-auto flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                s <= turn ? "bg-accent" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Turn 2 buttons: Breakouts / Reversals */}
          {turn === 2 && !isLoading && (
            <div className="flex gap-2 justify-center pt-1">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 text-sm font-medium border-accent/30 hover:bg-accent/10"
                onClick={() => handleButtonChoice("Breakouts")}
              >
                🚀 Breakouts
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 text-sm font-medium border-accent/30 hover:bg-accent/10"
                onClick={() => handleButtonChoice("Reversals")}
              >
                🔄 Reversals
              </Button>
            </div>
          )}

          {/* Turn 3 buttons: Conservative / Standard */}
          {turn === 3 && !isLoading && (
            <div className="flex gap-2 justify-center pt-1">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 text-sm font-medium border-accent/30 hover:bg-accent/10"
                onClick={() => handleButtonChoice("Conservative 0.5–1%")}
              >
                🛡️ Conservative 0.5–1%
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-12 text-sm font-medium border-accent/30 hover:bg-accent/10"
                onClick={() => handleButtonChoice("Standard 1–2%")}
              >
                ⚡ Standard 1–2%
              </Button>
            </div>
          )}

          {/* Completion animation */}
          {showComplete && (
            <div className="flex flex-col items-center gap-2 py-4 animate-in fade-in-0 zoom-in-95 duration-500">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-medium">Your plan is live.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area — only show for turns 1-3 when not loading */}
      {turn >= 1 && turn <= 3 && (
        <div className="px-4 py-3 border-t border-border/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserResponse(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-9 w-9 bg-accent hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
