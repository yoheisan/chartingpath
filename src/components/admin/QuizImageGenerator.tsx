import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Image, Loader2, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuestionWithoutImage {
  id: string;
  question_code: string;
  category: string;
  question_text: string;
  image_url: string | null;
}

export function QuizImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [results, setResults] = useState<Array<{
    questionId: string;
    questionCode: string;
    status: 'success' | 'error';
    message: string;
  }>>([]);

  // Fetch questions without images
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ["questions-without-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id, question_code, category, question_text, image_url")
        .is("image_url", null)
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) throw error;
      return data as QuestionWithoutImage[];
    },
  });

  const generateImages = async () => {
    if (!questions || questions.length === 0) {
      toast.error("No questions need images");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults([]);

    const total = questions.length;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      setCurrentQuestion(question.question_text);

      try {
        const { data, error } = await supabase.functions.invoke('generate-quiz-image', {
          body: {
            questionId: question.id,
            questionText: question.question_text,
            category: question.category
          }
        });

        if (error) throw error;

        setResults(prev => [...prev, {
          questionId: question.id,
          questionCode: question.question_code,
          status: 'success',
          message: 'Image generated successfully'
        }]);

        console.log(`Generated image for ${question.question_code}`);

      } catch (error: any) {
        console.error(`Failed to generate image for ${question.question_code}:`, error);
        setResults(prev => [...prev, {
          questionId: question.id,
          questionCode: question.question_code,
          status: 'error',
          message: error.message || 'Failed to generate'
        }]);
      }

      setProgress(((i + 1) / total) * 100);
      
      // Small delay to avoid rate limits
      if (i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    setCurrentQuestion("");
    
    const successCount = results.filter(r => r.status === 'success').length;
    toast.success(`Generated ${successCount} out of ${total} images`);
    
    // Refetch to update the list
    refetch();
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6" />
            Quiz Image Generator
          </h2>
          <p className="text-muted-foreground mt-1">
            Generate AI images for quiz questions that don't have visuals
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="text-2xl font-bold">{questions?.length || 0}</div>
                <div className="text-sm text-muted-foreground">
                  Questions without images
                </div>
              </div>
              <Button 
                onClick={generateImages}
                disabled={isGenerating || !questions || questions.length === 0}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    Generate All Images
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-3">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Processing: {currentQuestion}
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Generation Results</h3>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-2">
                    {results.map((result, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-mono">{result.questionCode}</span>
                        <span className="text-muted-foreground flex-1">
                          {result.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {questions && questions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Preview: Questions Needing Images</h3>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-3">
                    {questions.slice(0, 10).map((q) => (
                      <div key={q.id} className="text-sm">
                        <span className="font-mono text-primary">{q.question_code}</span>
                        <span className="text-muted-foreground ml-2">({q.category})</span>
                        <p className="text-xs mt-1">{q.question_text}</p>
                      </div>
                    ))}
                    {questions.length > 10 && (
                      <p className="text-xs text-muted-foreground italic">
                        ...and {questions.length - 10} more
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
