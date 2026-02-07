import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useCommandPalette } from "./useCommandPalette";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function CommandPaletteTrigger() {
  const { open } = useCommandPalette();
  const isMobile = useIsMobile();

  return (
    <Button
      onClick={open}
      className={cn(
        "fixed z-50 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all",
        // Mobile: larger touch target, safe area aware, more prominent
        isMobile 
          ? "bottom-20 right-4 h-14 w-14 shadow-xl" 
          : "bottom-6 right-6 h-12 w-12"
      )}
      aria-label={isMobile ? "Open Trading Copilot" : "Open command palette (⌘K)"}
    >
      <Sparkles className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
    </Button>
  );
}
