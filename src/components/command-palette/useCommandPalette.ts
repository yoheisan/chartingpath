import { useState, useCallback, useEffect } from "react";

export function useCommandPalette() {
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

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle, close, isOpen]);

  return {
    isOpen,
    mode,
    open,
    close,
    toggle,
    switchToChat,
    switchToCommands
  };
}
