import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CommandPaletteContent } from "./CommandPaletteContent";
import { CommandPaletteChat } from "./CommandPaletteChat";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"commands" | "chat">("commands");
  const [chatPrompt, setChatPrompt] = useState<string | undefined>();

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setMode("commands");
      setChatPrompt(undefined);
    }
  }, [isOpen]);

  const handleAIQuery = (prompt: string) => {
    setChatPrompt(prompt);
    setMode("chat");
  };

  const handleBack = () => {
    setMode("commands");
    setChatPrompt(undefined);
  };

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerTitle className="sr-only">Trading Copilot</DrawerTitle>
          <DrawerDescription className="sr-only">
            Search commands or ask AI for help with trading.
          </DrawerDescription>
          
          {mode === "chat" ? (
            <div className="h-[70vh]">
              <CommandPaletteChat initialPrompt={chatPrompt} onBack={handleBack} />
            </div>
          ) : (
            <CommandPaletteContent 
              onClose={onClose} 
              onAIQuery={handleAIQuery}
              isMobile={true}
            />
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog (centered modal)
  if (mode === "chat") {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl h-[600px] p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Trading Copilot</DialogTitle>
          <DialogDescription className="sr-only">
            AI chat for research and automation.
          </DialogDescription>
          <CommandPaletteChat initialPrompt={chatPrompt} onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Trading Copilot</DialogTitle>
        <DialogDescription className="sr-only">
          Search commands or ask AI.
        </DialogDescription>
        <CommandPaletteContent 
          onClose={onClose} 
          onAIQuery={handleAIQuery}
          isMobile={false}
        />
      </DialogContent>
    </Dialog>
  );
}
