import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CommandPaletteContextValue {
  isOpen: boolean;
  mode: "commands" | "chat";
  open: () => void;
  close: () => void;
  toggle: () => void;
  switchToChat: (initialPrompt?: string) => string | undefined;
  switchToCommands: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"commands" | "chat">("commands");

  const open = useCallback(() => {
    setIsOpen(true);
    setMode("commands");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMode("commands");
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setMode("commands");
    }
  }, [isOpen]);

  const switchToChat = useCallback((initialPrompt?: string) => {
    setMode("chat");
    return initialPrompt;
  }, []);

  const switchToCommands = useCallback(() => {
    setMode("commands");
  }, []);

  // Keyboard shortcut moved to TradingCopilotContext

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        mode,
        open,
        close,
        toggle,
        switchToChat,
        switchToCommands
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return context;
}
