import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SUGGESTED_QUESTIONS = [
  'Why did you skip AMD?',
  'What if you held MSFT longer?',
  "Why didn't you take more trades?",
];

type ChatMsg = { role: 'user' | 'assistant'; content: string };

interface SessionDebriefPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SessionDebriefPanel({ open, onClose }: SessionDebriefPanelProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [tradeData, setTradeData] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generate summary on open
  useEffect(() => {
    if (!open || !user?.id) return;
    if (summary) return; // already loaded this session

    const generate = async () => {
      setSummaryLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (!token) return;

        const res = await supabase.functions.invoke('session-debrief', {
          body: { action: 'generate_summary' },
        });

        if (res.data?.summary) {
          setSummary(res.data.summary);
          setTradeData(res.data.tradeData);
        }
      } catch (e) {
        console.error('Debrief summary error:', e);
        setSummary('Unable to generate session recap at this time.');
      } finally {
        setSummaryLoading(false);
      }
    };

    generate();
  }, [open, user?.id, summary]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Reset state when panel closes
  const handleClose = useCallback(() => {
    setSummary(null);
    setTradeData(null);
    setChatHistory([]);
    setInput('');
    onClose();
  }, [onClose]);

  // Send a chat question
  const sendQuestion = useCallback(async (question: string) => {
    if (!question.trim() || chatLoading || !tradeData) return;

    const userMsg: ChatMsg = { role: 'user', content: question };

    // Build conversation: trade context first, then history
    const contextMsg: ChatMsg = {
      role: 'user',
      content: `Here is my complete trade data for today: ${JSON.stringify(tradeData)}`,
    };
    const contextReply: ChatMsg = {
      role: 'assistant',
      content: "Got it. What would you like to know about today's session?",
    };

    const fullHistory = [contextMsg, contextReply, ...chatHistory, userMsg];

    setChatHistory((prev) => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const res = await supabase.functions.invoke('session-debrief', {
        body: {
          action: 'chat',
          messages: fullHistory.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      const reply = res.data?.reply || "I couldn't process that question.";
      setChatHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.error('Debrief chat error:', e);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatLoading, tradeData, chatHistory]);

  // Handle chip click — pre-fill AND auto-submit
  const handleChipClick = useCallback((q: string) => {
    setInput(q);
    sendQuestion(q);
  }, [sendQuestion]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  }, [input, sendQuestion]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[480px] bg-card border-l border-border/40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <span className="text-sm font-semibold text-foreground">Session recap</span>
        <button
          onClick={handleClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body — Summary + Chat */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          {/* AI-generated summary */}
          {summaryLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-secondary/50 rounded w-3/4" />
              <div className="h-4 bg-secondary/50 rounded w-full" />
              <div className="h-4 bg-secondary/50 rounded w-5/6" />
              <div className="h-4 bg-secondary/50 rounded w-2/3" />
              <div className="h-4 bg-secondary/50 rounded w-full" />
            </div>
          ) : summary ? (
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {summary}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No session data available yet.</p>
          )}

          {/* Chat thread */}
          {chatHistory.length > 0 && (
            <div className="border-t border-border/40 pt-3 space-y-3">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-500/20 text-blue-200'
                        : 'bg-secondary/50 text-foreground/90'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2 bg-secondary/50 text-sm text-muted-foreground animate-pulse">
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* NL Input + Chips */}
      <div className="border-t border-border/40 px-4 py-3 space-y-2">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot about today…"
            disabled={chatLoading || !tradeData}
            className="w-full rounded-md border border-border/40 bg-secondary/30 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <button
            onClick={() => sendQuestion(input)}
            disabled={chatLoading || !input.trim() || !tradeData}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleChipClick(q)}
              disabled={chatLoading || !tradeData}
              className="rounded-md border border-border/40 bg-secondary/50 px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
