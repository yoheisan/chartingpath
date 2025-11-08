import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question_code: string;
  category: string;
  difficulty: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  pattern_name: string | null;
  pattern_key: string | null;
  image_url: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  times_shown: number;
  times_correct: number;
  is_active: boolean;
}

export const QuizManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    question_code: "",
    category: "visual_recognition" as const,
    difficulty: "intermediate" as const,
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    explanation: "",
    pattern_name: "",
    pattern_key: "",
    image_url: "",
    tags: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ["admin-quiz-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as QuizQuestion[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const questionData = {
        ...data,
        options: data.options.filter(Boolean),
        tags: data.tags.split(",").map(t => t.trim()).filter(Boolean),
        seo_keywords: data.seo_keywords.split(",").map(k => k.trim()).filter(Boolean),
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("quiz_questions")
          .update(questionData)
          .eq("id", editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quiz_questions")
          .insert([questionData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions"] });
      toast.success(editingQuestion ? "Question updated!" : "Question created!");
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
        .from("quiz_questions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions"] });
      toast.success("Question deleted!");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      question_code: "",
      category: "visual_recognition",
      difficulty: "intermediate",
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      explanation: "",
      pattern_name: "",
      pattern_key: "",
      image_url: "",
      tags: "",
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
    });
    setEditingQuestion(null);
  };

  const handleEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_code: question.question_code,
      category: question.category as any,
      difficulty: question.difficulty as any,
      question_text: question.question_text,
      options: [...question.options, "", "", ""].slice(0, 4),
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      pattern_name: question.pattern_name || "",
      pattern_key: question.pattern_key || "",
      image_url: question.image_url || "",
      tags: question.tags.join(", "),
      seo_title: question.seo_title || "",
      seo_description: question.seo_description || "",
      seo_keywords: question.seo_keywords?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const filteredQuestions = questions?.filter(q =>
    q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.question_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const successRate = (q: QuizQuestion) => 
    q.times_shown > 0 ? Math.round((q.times_correct / q.times_shown) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search quiz questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Quiz Question" : "Create New Quiz Question"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="question_code">Question Code *</Label>
                  <Input
                    id="question_code"
                    value={formData.question_code}
                    onChange={(e) => setFormData({ ...formData, question_code: e.target.value })}
                    placeholder="e.g., v1, c1, r1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual_recognition">Visual Recognition</SelectItem>
                      <SelectItem value="characteristics">Characteristics</SelectItem>
                      <SelectItem value="statistics">Statistics</SelectItem>
                      <SelectItem value="risk_management">Risk Management</SelectItem>
                      <SelectItem value="professional_practices">Professional Practices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pattern_key">Pattern Key (for visual questions)</Label>
                  <Input
                    id="pattern_key"
                    value={formData.pattern_key}
                    onChange={(e) => setFormData({ ...formData, pattern_key: e.target.value })}
                    placeholder="e.g., head-shoulders, double-top"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">Image URL (for visual questions)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/patterns/head-shoulders.png"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="max-w-xs rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="question_text">Question Text *</Label>
                <Textarea
                  id="question_text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the quiz question..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Answer Options * (at least 2 required)</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant={formData.correct_answer === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, correct_answer: index })}
                    >
                      {formData.correct_answer === index ? "✓ Correct" : "Mark Correct"}
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="explanation">Comprehensive Explanation *</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Detailed explanation covering what the concept is, how to recognize it, why it matters, etc."
                  rows={10}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">SEO Metadata</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="SEO optimized title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Meta description (150-160 chars)"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo_keywords">SEO Keywords</Label>
                    <Input
                      id="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingQuestion ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions?.map((question) => (
            <div key={question.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{question.question_code}</Badge>
                    <Badge variant="outline">{question.category}</Badge>
                    <Badge variant="secondary">{question.difficulty}</Badge>
                    {question.pattern_key && (
                      <Badge variant="outline">🖼️ {question.pattern_key}</Badge>
                    )}
                  </div>
                  <p className="font-medium mb-2">{question.question_text}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Options: {question.options.join(" | ")}</div>
                    <div>Correct: Option {question.correct_answer + 1} ({question.options[question.correct_answer]})</div>
                    <div>Stats: {question.times_shown} shown, {successRate(question)}% success rate</div>
                    {question.image_url && (
                      <div className="mt-2">
                        <a href={question.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          📷 {question.image_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(question)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this question?")) {
                        deleteMutation.mutate(question.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};