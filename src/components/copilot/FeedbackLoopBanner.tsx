import { useState } from 'react';

interface FeedbackLoopBannerProps {
  onFocusNLBar: (prefill?: string) => void;
}

export function FeedbackLoopBanner({ onFocusNLBar }: FeedbackLoopBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
      <p className="text-sm leading-[1.6] text-amber-200/90">
        You've added momentum plays 3 times despite your plan. Update your Master Plan to include them — or keep your rules?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onFocusNLBar('Update my plan to also include momentum setups when...')}
          className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          Update Plan
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md border border-border/40 bg-secondary/50 px-2.5 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Keep My Rules
        </button>
      </div>
    </div>
  );
}
