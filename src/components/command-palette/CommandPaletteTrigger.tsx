import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useCommandPalette } from "./useCommandPalette";

export function CommandPaletteTrigger() {
  const { open } = useCommandPalette();

  return (
    <Button
      onClick={open}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-primary to-accent hover:opacity-90"
      aria-label="Open command palette (⌘K)"
    >
      <Sparkles className="h-6 w-6" />
    </Button>
  );
}
