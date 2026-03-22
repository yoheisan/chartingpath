import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMandateSubmit } from "@/hooks/useMandateSubmit";
import { useTradingCopilotContext } from "@/components/copilot/TradingCopilotContext";
import { Loader2 } from "lucide-react";

const QUICK_COMMANDS = [
  "Create new plan",
  "Pause entries",
  "Resume entries",
  "Why did you exit last trade?",
  "Show me what Copilot skipped",
];

interface NavCopilotBarProps {
  className?: string;
  onMandateSaved?: () => void;
}

export function NavCopilotBar({ className, onMandateSaved }: NavCopilotBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [freeText, setFreeText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const copilot = useTradingCopilotContext();

  const { state, submit, confirmSave, reset } = useMandateSubmit({
    onSaved: () => {
      setIsOpen(false);
      setFreeText("");
      onMandateSaved?.();
      window.dispatchEvent(new CustomEvent("mandate-saved"));
    },
    onQuestion: (question: string) => {
      setIsOpen(false);
      setFreeText("");
      // Dispatch event for Copilot page to open debrief with question
      window.dispatchEvent(new CustomEvent("copilot-question", { detail: question }));
    },
  });

  // Global ⌘K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => dropdownInputRef.current?.focus(), 50);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        reset();
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, reset]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        reset();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, reset]);

  const handleSubmit = useCallback(() => {
    if (freeText.trim()) {
      submit(freeText.trim());
    }
  }, [freeText, submit]);

  const isProcessing = state.step === "parsing" || state.step === "saving";

  return (
    <div ref={containerRef} className={cn("relative hidden lg:block", className)}>
      {/* Trigger bar */}
      <div
        className="flex items-center gap-2 h-[34px] max-w-[480px] w-full rounded-md border border-border/60 bg-muted/40 px-3 cursor-text hover:bg-muted/60 transition-colors"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => dropdownInputRef.current?.focus(), 50);
        }}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder="Tell Copilot how you want to trade today…"
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          onFocus={() => {
            setIsOpen(true);
            setTimeout(() => dropdownInputRef.current?.focus(), 50);
          }}
          readOnly
        />

        <kbd className="pointer-events-none shrink-0 inline-flex items-center gap-0.5 rounded border border-border/80 bg-muted px-1.5 py-0.5 text-sm font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Dropdown command palette */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 max-w-[480px] z-50 rounded-lg border border-border bg-popover shadow-lg animate-fade-in">
          {/* Quick commands - hide during confirm/error */}
          {state.step !== "confirming" && state.step !== "error" && (
            <div className="px-3 pt-3 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Quick commands
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      setFreeText(cmd);
                      submit(cmd);
                    }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation view */}
          {state.step === "confirming" && (
            <div className="px-3 pt-3 pb-2 space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Confirm your Master Plan
              </p>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {state.confirmation}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmSave}
                  className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  Looks good — save it
                </button>
                <button
                  onClick={() => {
                    reset();
                    setFreeText("");
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Let me adjust
                </button>
              </div>
            </div>
          )}

          {/* Error view */}
          {state.step === "error" && (
            <div className="px-3 pt-3 pb-2 space-y-2">
              <p className="text-xs text-red-400 whitespace-pre-wrap">
                {state.message}
              </p>
              <button
                onClick={() => {
                  reset();
                  setTimeout(() => dropdownInputRef.current?.focus(), 50);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-border px-3 py-2 flex items-center gap-2">
            <input
              ref={dropdownInputRef}
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProcessing) {
                  handleSubmit();
                }
              }}
              placeholder="Type a command…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
              disabled={isProcessing}
            />
            {isProcessing && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
