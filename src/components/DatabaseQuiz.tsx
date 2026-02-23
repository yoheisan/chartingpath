import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DynamicPatternChart } from "@/components/DynamicPatternChart";
import { PATTERN_DETAILS } from "@/utils/PatternDetails";
import { useTranslation } from "react-i18next";

interface QuizQuestion {
  id: string;
  question_code: string;
  category: 'visual_recognition' | 'characteristics' | 'statistics' | 'risk_management' | 'professional_practices' | 'stock_market' | 'forex' | 'cryptocurrency' | 'commodities';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  question_text: string;
  options: any;
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
  category?: 'visual_recognition' | 'characteristics' | 'statistics' | 'risk_management' | 'professional_practices' | 'stock_market' | 'forex' | 'cryptocurrency' | 'commodities' | null;
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
  const { t } = useTranslation();
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
        toast.error(t('databaseQuiz.noQuestions'));
        return;
      }

      const processedQuestions: ProcessedQuestion[] = data.map((q: QuizQuestion) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : []
      }));

      setQuestions(processedQuestions);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error(t('databaseQuiz.noQuestions'));
    } finally {
      setLoading(false);
    }
  };

  const saveQuizAttempt = async (questionId: string, isCorrect: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
          <p className="text-muted-foreground">{t('databaseQuiz.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t('databaseQuiz.noQuestions')}</p>
          <Button onClick={loadQuestions} className="mt-4">
            {t('databaseQuiz.tryAgain')}
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
          <h2 className="text-3xl font-bold mb-4">{t('databaseQuiz.quizComplete')}</h2>
          <p className="text-5xl font-bold mb-4 text-primary">
            {score} / {questions.length}
          </p>
          <p className="text-xl mb-6 text-muted-foreground">
            {percentage >= 80 ? t('databaseQuiz.excellentResult') :
             percentage >= 60 ? t('databaseQuiz.goodResult') :
             t('databaseQuiz.keepLearning')}
          </p>
          <Button onClick={handleRestart} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('databaseQuiz.tryAgain')}
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
              {t('databaseQuiz.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}
            </span>
            <span className="text-sm font-medium">
              {t('databaseQuiz.score', { score, total: currentQuestionIndex + (showExplanation ? 1 : 0) })}
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

          {/* Image Display */}
          {currentQuestion.image_url && !currentQuestion.pattern_key && !currentQuestion.pattern_name && (
            <div className="mb-6 rounded-lg overflow-hidden border">
              <img 
                src={currentQuestion.image_url} 
                alt={currentQuestion.question_text}
                className="w-full h-auto max-h-[400px] object-contain bg-muted"
              />
            </div>
          )}

          {/* Pattern Chart Display */}
          {(currentQuestion.pattern_key || currentQuestion.pattern_name) && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <DynamicPatternChart 
                patternType={currentQuestion.pattern_key || currentQuestion.pattern_name || 'head-shoulders'}
                width={1000}
                height={600}
                showTitle={false}
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
            <div className="mt-6 space-y-4">
              <div className={`p-4 rounded-lg ${
                selectedAnswer === currentQuestion.correct_answer 
                  ? 'bg-green-500/10 border border-green-500' 
                  : 'bg-red-500/10 border border-red-500'
              }`}>
                <p className="font-semibold mb-2">
                  {selectedAnswer === currentQuestion.correct_answer ? t('databaseQuiz.correct') : t('databaseQuiz.incorrect')}
                </p>
                <p className="text-sm">{currentQuestion.explanation}</p>
              </div>

              {/* Pattern Details */}
              {(currentQuestion.pattern_key || currentQuestion.pattern_name) && (() => {
                const patternKey = currentQuestion.pattern_key || currentQuestion.pattern_name?.toLowerCase().replace(/\s+/g, '-');
                const patternDetails = patternKey ? PATTERN_DETAILS[patternKey] : null;
                
                return patternDetails && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <span className="text-primary">📋</span> {t('databaseQuiz.howItForms')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{patternDetails.formation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <span className="text-primary">🔍</span> {t('databaseQuiz.howToIdentify')}
                      </h4>
                      <ul className="space-y-1">
                        {patternDetails.characteristics.map((char, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{char}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {patternDetails.confirmation && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <span className="text-primary">✓</span> {t('databaseQuiz.confirmation')}
                        </h4>
                        <p className="text-sm text-muted-foreground">{patternDetails.confirmation}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Professional Standards Sources */}
              {(currentQuestion.explanation.toLowerCase().includes('professional standard') || 
                currentQuestion.category === 'professional_practices') && (
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-primary">📚</span> {t('databaseQuiz.professionalSources')}
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('databaseQuiz.professionalSourcesInfo')}</p>
                    <ul className="ml-4 space-y-1">
                      <li>• CFA Institute - Standards of Practice Handbook</li>
                      <li>• SEC (Securities and Exchange Commission) - Trading Regulations</li>
                      <li>• FINRA (Financial Industry Regulatory Authority) - Conduct Rules</li>
                      <li>• CME Group - Risk Management Best Practices</li>
                      <li>• Market Technicians Association (MTA) - Technical Analysis Standards</li>
                    </ul>
                  </div>
                </div>
              )}

              {currentQuestion.category === 'risk_management' && (
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-primary">📚</span> {t('databaseQuiz.riskManagementSources')}
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('databaseQuiz.riskManagementSourcesInfo')}</p>
                    <ul className="ml-4 space-y-1">
                      <li>• CFA Institute - Risk Management & Performance Standards</li>
                      <li>• GARP (Global Association of Risk Professionals) - FRM Standards</li>
                      <li>• Basel Committee - Risk Management Principles</li>
                      <li>• CME Group & ICE - Position Sizing Guidelines</li>
                    </ul>
                  </div>
                </div>
              )}

              {currentQuestion.category === 'statistics' && (
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="text-primary">📚</span> {t('databaseQuiz.statisticalSources')}
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('databaseQuiz.statisticalSourcesInfo')}</p>
                    <ul className="ml-4 space-y-1">
                      <li>• CFA Institute - Quantitative Methods Standards</li>
                      <li>• Academic research from Journal of Technical Analysis</li>
                      <li>• Industry standards from Bloomberg & Reuters methodologies</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <Button onClick={handleNext} className="w-full mt-4" size="lg">
              {currentQuestionIndex < questions.length - 1 ? t('databaseQuiz.nextQuestion') : t('databaseQuiz.finishQuiz')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};