import { useState } from 'react';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const SUGGESTED_QUESTIONS = [
  'Why did you skip AMD?',
  'What if you held MSFT longer?',
  "Why didn't you take more trades?",
];

interface SessionDebriefPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SessionDebriefPanel({ open, onClose }: SessionDebriefPanelProps) {
  const [input, setInput] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[480px] bg-card border-l border-border/40 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <span className="text-sm font-semibold text-foreground">Session recap</span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Here's what happened today:
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            I scanned 94 candidates and took 3 trades.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✅</span>
              <p className="text-sm text-foreground/90">
                <span className="font-mono font-bold">NVDA</span> — Breakout above VWAP at 9:47am.{' '}
                <span className="font-mono text-green-500 font-semibold">+2.1R</span>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✅</span>
              <p className="text-sm text-foreground/90">
                <span className="font-mono font-bold">MSFT</span> — Mean reversion off morning lows.{' '}
                <span className="font-mono text-green-500 font-semibold">+1.4R</span>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">❌</span>
              <p className="text-sm text-foreground/90">
                <span className="font-mono font-bold">TSLA</span> — You added despite conflict flag.{' '}
                <span className="font-mono text-red-500 font-semibold">−2.0R</span>.
              </p>
            </div>
          </div>

          <div className="rounded-md bg-secondary/50 p-3 space-y-1">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Copilot:</span>
              <span className="font-mono font-bold text-green-500">+3.5R</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="text-muted-foreground">Your overrides:</span>
              <span className="font-mono font-bold text-red-500">−2.0R</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">This week:</span>
              <span className="font-mono font-semibold text-green-500">Copilot +8.2R</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="font-mono font-semibold text-red-500">Overrides −2.5R</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* NL Input + Chips */}
      <div className="border-t border-border/40 px-4 py-3 space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot about today…"
          className="w-full rounded-md border border-border/40 bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="rounded-md border border-border/40 bg-secondary/50 px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
