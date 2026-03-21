import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopilotConversation } from "@/hooks/useCopilotConversations";
import { formatDistanceToNow } from "date-fns";

interface CopilotHistorySidebarProps {
  conversations: CopilotConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function CopilotHistorySidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: CopilotHistorySidebarProps) {
  return (
    <div className="flex flex-col h-full border-r w-[180px] shrink-0">
      <div className="p-2 border-b">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={onNew}>
          <Plus className="h-3 w-3" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer text-xs hover:bg-muted transition-colors",
                activeId === c.id && "bg-muted font-medium"
              )}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{c.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
