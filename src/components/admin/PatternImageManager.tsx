import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface PatternImage {
  id: string;
  pattern_key: string;
  pattern_name: string;
  image_path: string;
  image_url: string | null;
  thumbnail_url: string | null;
  alt_text: string;
  description: string | null;
  pattern_type: string | null;
  is_bullish: boolean | null;
  tags: string[];
  is_active: boolean;
}

export const PatternImageManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<PatternImage | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    pattern_key: "",
    pattern_name: "",
    image_path: "",
    image_url: "",
    thumbnail_url: "",
    alt_text: "",
    description: "",
    pattern_type: "",
    is_bullish: false,
    tags: "",
  });

  const { data: images, isLoading } = useQuery({
    queryKey: ["admin-pattern-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pattern_images")
        .select("*")
        .order("pattern_name");
      
      if (error) throw error;
      return data as PatternImage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const imageData = {
        ...data,
        tags: data.tags.split(",").map(t => t.trim()).filter(Boolean),
      };

      if (editingImage) {
        const { error } = await supabase
          .from("pattern_images")
          .update(imageData)
          .eq("id", editingImage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pattern_images")
          .insert([imageData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pattern-images"] });
      toast.success(editingImage ? "Image updated!" : "Image created!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pattern_images")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pattern-images"] });
      toast.success("Image deleted!");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      pattern_key: "",
      pattern_name: "",
      image_path: "",
      image_url: "",
      thumbnail_url: "",
      alt_text: "",
      description: "",
      pattern_type: "",
      is_bullish: false,
      tags: "",
    });
    setEditingImage(null);
  };

  const handleEdit = (image: PatternImage) => {
    setEditingImage(image);
    setFormData({
      pattern_key: image.pattern_key,
      pattern_name: image.pattern_name,
      image_path: image.image_path,
      image_url: image.image_url || "",
      thumbnail_url: image.thumbnail_url || "",
      alt_text: image.alt_text,
      description: image.description || "",
      pattern_type: image.pattern_type || "",
      is_bullish: image.is_bullish || false,
      tags: image.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage pattern images used across quiz questions and learning articles
        </p>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Pattern Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "Edit Pattern Image" : "Add New Pattern Image"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pattern_key">Pattern Key * (unique identifier)</Label>
                  <Input
                    id="pattern_key"
                    value={formData.pattern_key}
                    onChange={(e) => setFormData({ ...formData, pattern_key: e.target.value })}
                    placeholder="e.g., head-shoulders, double-top"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to reference this image in quiz questions
                  </p>
                </div>

                <div>
                  <Label htmlFor="pattern_name">Pattern Name *</Label>
                  <Input
                    id="pattern_name"
                    value={formData.pattern_name}
                    onChange={(e) => setFormData({ ...formData, pattern_name: e.target.value })}
                    placeholder="e.g., Head and Shoulders"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_path">Image Path *</Label>
                <Input
                  id="image_path"
                  value={formData.image_path}
                  onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
                  placeholder="/assets/patterns/head-shoulders.png"
                />
              </div>

              <div>
                <Label htmlFor="image_url">Full Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="alt_text">Alt Text * (for accessibility)</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  placeholder="Descriptive text for screen readers"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the pattern shown"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pattern_type">Pattern Type</Label>
                  <Input
                    id="pattern_type"
                    value={formData.pattern_type}
                    onChange={(e) => setFormData({ ...formData, pattern_type: e.target.value })}
                    placeholder="e.g., reversal, continuation"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="is_bullish"
                    checked={formData.is_bullish}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_bullish: checked as boolean })}
                  />
                  <label
                    htmlFor="is_bullish"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bullish Pattern
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="bullish, reversal, intermediate"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingImage ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading pattern images...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images?.map((image) => (
            <div key={image.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{image.pattern_name}</h3>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {image.pattern_key}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {image.pattern_type && (
                      <Badge variant="outline" className="text-xs">
                        {image.pattern_type}
                      </Badge>
                    )}
                    {image.is_bullish !== null && (
                      <Badge variant={image.is_bullish ? "default" : "destructive"} className="text-xs">
                        {image.is_bullish ? "Bullish" : "Bearish"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(image)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this pattern image? This may affect quiz questions using it.")) {
                      deleteMutation.mutate(image.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};