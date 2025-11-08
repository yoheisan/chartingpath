import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question_code: string;
  category: 'visual_recognition' | 'characteristics' | 'statistics' | 'risk_management' | 'professional_practices';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  question_text: string;
  options: any; // Json type from Supabase
  correct_answer: number;
  explanation: string;
  pattern_name: string | null;
  pattern_key: string | null;
  image_url: string | null;
  tags: string[];
}

interface ProcessedQuestion extends Omit<QuizQuestion, 'options'> {
  options: string[];
}

interface DatabaseQuizProps {
  category?: 'visual_recognition' | 'characteristics' | 'statistics' | 'risk_management' | 'professional_practices' | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  limit?: number;
  title?: string;
}

export const DatabaseQuiz = ({ 
  category, 
  difficulty, 
  limit = 10,
  title = "Pattern Recognition Quiz"
}: DatabaseQuizProps) => {
  const [questions, setQuestions] = useState<ProcessedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [category, difficulty, limit]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_quiz_questions', {
        p_category: category || null,
        p_difficulty: difficulty || null,
        p_limit: limit
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("No questions found for this category");
        return;
      }

      // Process questions to convert options from Json to string[]
      const processedQuestions: ProcessedQuestion[] = data.map((q: QuizQuestion) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : []
      }));

      setQuestions(processedQuestions);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error("Failed to load quiz questions");
    } finally {
      setLoading(false);
    }
  };

  const saveQuizAttempt = async (questionId: string, isCorrect: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Don't save if not authenticated

      const { error } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: user.id,
          question_id: questionId,
          selected_answer: selectedAnswer ?? 0,
          is_correct: isCorrect
        }]);

      if (error) console.error('Error saving quiz attempt:', error);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const isCorrect = answerIndex === currentQuestion.correct_answer;
    if (isCorrect) {
      setScore(score + 1);
    }

    // Save the attempt
    saveQuizAttempt(currentQuestion.id, isCorrect);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setQuizComplete(false);
    loadQuestions();
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading quiz questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No questions available</p>
          <Button onClick={loadQuestions} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
          <p className="text-5xl font-bold mb-4 text-primary">
            {score} / {questions.length}
          </p>
          <p className="text-xl mb-6 text-muted-foreground">
            {percentage >= 80 ? "Excellent! You're a pattern recognition expert!" :
             percentage >= 60 ? "Good job! Keep practicing to improve." :
             "Keep learning! Practice makes perfect."}
          </p>
          <Button onClick={handleRestart} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium">
              Score: {score} / {currentQuestionIndex + (showExplanation ? 1 : 0)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Display */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{title}</h3>
            <div className="flex gap-2">
              <Badge variant="outline">{currentQuestion.category}</Badge>
              <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
            </div>
          </div>

          <p className="text-lg mb-6">{currentQuestion.question_text}</p>

          {/* Image Display for Visual Questions */}
          {currentQuestion.image_url && (
            <div className="mb-6 bg-muted rounded-lg overflow-hidden">
              <img 
                src={`${currentQuestion.image_url}?v=${Date.now()}`} 
                alt={currentQuestion.pattern_name || "Chart pattern"} 
                className="w-full h-auto"
                onError={(e) => {
                  console.error('Failed to load image:', currentQuestion.image_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correct_answer;
              const showResult = showExplanation;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${!showResult && 'hover:border-primary hover:bg-muted/50'}
                    ${isSelected && !showResult && 'border-primary bg-muted'}
                    ${showResult && isCorrect && 'border-green-500 bg-green-500/10'}
                    ${showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500/10'}
                    ${!isSelected && showResult && !isCorrect && 'opacity-50'}
                    ${showExplanation && 'cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showResult && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`mt-6 p-4 rounded-lg ${
              selectedAnswer === currentQuestion.correct_answer 
                ? 'bg-green-500/10 border border-green-500' 
                : 'bg-red-500/10 border border-red-500'
            }`}>
              <p className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.correct_answer ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <Button onClick={handleNext} className="w-full mt-4" size="lg">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
