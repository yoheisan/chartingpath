import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useCommandPalette } from "./CommandPaletteContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function CommandPaletteTrigger() {
  const { t } = useTranslation();
  const { open } = useCommandPalette();
  const isMobile = useIsMobile();

  return (
    <Button
      onClick={open}
      className={cn(
        "fixed z-50 rounded-full shadow-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all gap-2",
        isMobile 
          ? "bottom-20 right-4 h-14 px-5 text-sm" 
          : "bottom-6 right-6 h-12 px-5 text-sm"
      )}
      aria-label={isMobile ? "Open Trading Copilot" : "Open command palette (⌘K)"}
    >
      <span className="relative flex h-3 w-3 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white/90" />
      </span>
      <Sparkles className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      <span className="font-semibold whitespace-nowrap">{t('copilot.askAI', 'Ask AI')}</span>
    </Button>
  );
}
