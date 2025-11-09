import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ContentItem {
  id: string;
  content_type: string;
  title: string;
  content: string;
  tags: string[] | null;
  post_count: number;
  last_posted_at: string | null;
  is_active: boolean;
}

interface ContentLibraryListProps {
  content: ContentItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function ContentLibraryList({ content, isLoading, onDelete }: ContentLibraryListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">No content yet</h3>
        <p className="text-muted-foreground">
          Add your first Q&A or educational content to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {content.map((item) => (
        <div
          key={item.id}
          className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{item.title}</h3>
                <Badge variant="outline">{item.content_type}</Badge>
                {!item.is_active && <Badge variant="secondary">Inactive</Badge>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {item.content}
              </p>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Posted {item.post_count} times
                {item.last_posted_at && (
                  <span className="ml-2">
                    · Last: {format(new Date(item.last_posted_at), "PP")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}