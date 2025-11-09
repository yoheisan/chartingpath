import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContentDialog({ open, onOpenChange }: CreateContentDialogProps) {
  const [contentType, setContentType] = useState("qa");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkBackUrl, setLinkBackUrl] = useState("https://yoursite.com");
  const [isActive, setIsActive] = useState(true);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase.from("content_library").insert({
        content_type: contentType,
        title,
        content,
        tags: tagsArray.length > 0 ? tagsArray : null,
        image_url: imageUrl || null,
        link_back_url: linkBackUrl,
        is_active: isActive,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast.success("Content created successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create content");
    },
  });

  const resetForm = () => {
    setContentType("qa");
    setTitle("");
    setContent("");
    setTags("");
    setImageUrl("");
    setLinkBackUrl("https://yoursite.com");
    setIsActive(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Create Q&A or educational content for automated social media posting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qa">Q&A</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="tip">Trading Tip</SelectItem>
                <SelectItem value="pattern">Chart Pattern</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is a Bull Flag pattern?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content here..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="trading, patterns, technical-analysis"
            />
          </div>

          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label>Link Back URL</Label>
            <Input
              value={linkBackUrl}
              onChange={(e) => setLinkBackUrl(e.target.value)}
              placeholder="https://yoursite.com/patterns"
              type="url"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active (available for posting)</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || !content}
          >
            Create Content
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}