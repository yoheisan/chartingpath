import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const QUICK_COMMANDS = [
  "Pause entries",
  "Resume entries",
  "Why did you exit last trade?",
  "Show me what Copilot skipped",
];

interface NavCopilotBarProps {
  className?: string;
}

export function NavCopilotBar({ className }: NavCopilotBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [freeText, setFreeText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global ⌘K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
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
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative hidden lg:block", className)}>
      {/* Trigger bar */}
      <div
        className="flex items-center gap-2 h-[34px] max-w-[480px] w-full rounded-md border border-border/60 bg-muted/40 px-3 cursor-text hover:bg-muted/60 transition-colors"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Pulsing blue dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder="Tell Copilot how you want to trade today…"
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          onFocus={() => setIsOpen(true)}
          readOnly
        />

        {/* ⌘K badge */}
        <kbd className="pointer-events-none shrink-0 inline-flex items-center gap-0.5 rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Dropdown command palette */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 max-w-[480px] z-50 rounded-lg border border-border bg-popover shadow-lg animate-fade-in">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Quick commands
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => {
                    setFreeText(cmd);
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border px-3 py-2">
            <input
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Type a command…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
