import { LucideIcon } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  category: CommandCategory;
  keywords?: string[];
  action: () => void;
  shortcut?: string;
}

export type CommandCategory = "navigate" | "research" | "automate" | "learn";

export interface CommandGroup {
  category: CommandCategory;
  label: string;
  commands: Command[];
}

export interface ContextSuggestion {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
  priority: number;
}
