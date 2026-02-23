import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { PatternCalculator } from "@/utils/PatternCalculator";
import { chartPatternTemplates } from "@/utils/ChartPatternTemplates";
import { useTranslation } from "react-i18next";
import { translatePatternName } from "@/utils/translatePatternName";

interface QuizQuestion {
  patternId: string;
  patternName: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const generateQuizQuestions = (): QuizQuestion[] => {
  const selectedPatterns = chartPatternTemplates.filter(p => 
    ['head-shoulders', 'double-top', 'double-bottom', 'ascending-triangle', 
     'bull-flag', 'bear-flag', 'cup-handle', 'symmetrical-triangle',
     'rising-wedge', 'falling-wedge', 'bullish-engulfing', 'bearish-engulfing',
     'hammer', 'doji', 'inverse-head-shoulders'].includes(p.id)
  );

  return selectedPatterns.map(pattern => {
    const similarPatterns = chartPatternTemplates
      .filter(p => p.category === pattern.category && p.id !== pattern.id)
      .slice(0, 2)
      .map(p => p.name);
    
    while (similarPatterns.length < 2) {
      const randomPattern = chartPatternTemplates[Math.floor(Math.random() * chartPatternTemplates.length)];
      if (!similarPatterns.includes(randomPattern.name) && randomPattern.id !== pattern.id) {
        similarPatterns.push(randomPattern.name);
      }
    }

    const options = [pattern.name, ...similarPatterns];
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    return {
      patternId: pattern.id,
      patternName: pattern.name,
      options: shuffledOptions,
      correctAnswer: shuffledOptions.indexOf(pattern.name),
      explanation: `${pattern.name} is a ${pattern.category.toLowerCase()} pattern. ${pattern.description} Accuracy: ${pattern.accuracy}`,
      category: pattern.category
    };
  });
};

export const PatternIdentificationQuiz = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [questions] = useState<QuizQuestion[]>(generateQuizQuestions());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const drawPattern = (patternId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const patternData = PatternCalculator.getPatternData(patternId);
    const { candles, annotations } = patternData;

    canvas.width = 800;
    canvas.height = 500;

    ctx.fillStyle = "hsl(223, 39%, 4%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2 - 80;
    const chartLeft = padding;
    const chartTop = padding;

    ctx.strokeStyle = "hsl(215, 15%, 20%)";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 10; i++) {
      const x = chartLeft + (i * chartWidth) / 10;
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartTop + chartHeight);
      ctx.stroke();
    }

    for (let i = 0; i <= 8; i++) {
      const y = chartTop + (i * chartHeight) / 8;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }

    const prices = candles.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding_price = priceRange * 0.1;
    const adjustedMinPrice = minPrice - padding_price;
    const adjustedMaxPrice = maxPrice + padding_price;
    const adjustedRange = adjustedMaxPrice - adjustedMinPrice;

    const priceToY = (price: number) => {
      return chartTop + chartHeight - ((price - adjustedMinPrice) / adjustedRange) * chartHeight;
    };

    const indexToX = (index: number) => {
      return chartLeft + (index + 0.5) * (chartWidth / candles.length);
    };

    const candleWidth = Math.max(8, chartWidth / (candles.length * 1.5));
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      
      const yOpen = priceToY(candle.open);
      const yClose = priceToY(candle.close);
      const yHigh = priceToY(candle.high);
      const yLow = priceToY(candle.low);

      const isBullish = candle.close > candle.open;
      
      ctx.strokeStyle = isBullish ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      ctx.fillStyle = isBullish ? "#22c55e" : "#ef4444";
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yClose - yOpen);
      
      if (bodyHeight < 3) {
        ctx.strokeStyle = "hsl(210, 40%, 98%)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth/2 * 0.8, yOpen);
        ctx.lineTo(x + candleWidth/2 * 0.8, yOpen);
        ctx.stroke();
      } else {
        ctx.fillRect(x - candleWidth/2 * 0.8, bodyTop, candleWidth * 0.8, bodyHeight);
      }
    });

    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(annotation.style === 'dashed' ? [5, 5] : []);
      
      if (annotation.type === 'peak') {
        const point = annotation.points[0];
        const x = indexToX(point.x);
        const y = priceToY(point.y);
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      } else if (annotation.points.length >= 2) {
        ctx.beginPath();
        const firstPoint = annotation.points[0];
        ctx.moveTo(indexToX(firstPoint.x), priceToY(firstPoint.y));
        
        for (let i = 1; i < annotation.points.length; i++) {
          const point = annotation.points[i];
          ctx.lineTo(indexToX(point.x), priceToY(point.y));
        }
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    });

    const volumeTop = chartTop + chartHeight + 20;
    const volumeHeight = 60;
    const maxVolume = Math.max(...candles.map(c => c.volume));
    
    candles.forEach((candle, index) => {
      const x = indexToX(index);
      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      const isBullish = candle.close > candle.open;
      
      ctx.fillStyle = isBullish ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
      ctx.fillRect(x - candleWidth/2 * 0.6, volumeTop + volumeHeight - volumeBarHeight, 
                   candleWidth * 0.6, volumeBarHeight);
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.font = "bold 80px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", canvas.width / 2, canvas.height / 2);
  };

  useEffect(() => {
    if (currentQuestion && !quizComplete) {
      drawPattern(currentQuestion.patternId);
    }
  }, [currentQuestion, quizComplete]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      const savedScores = JSON.parse(localStorage.getItem('quizScores') || '{"patternVisual":{"score":0,"total":0},"patternCharacteristics":{"score":0,"total":0},"riskManagement":{"score":0,"total":0}}');
      savedScores.patternVisual = {
        score: savedScores.patternVisual.score + score,
        total: savedScores.patternVisual.total + questions.length
      };
      localStorage.setItem('quizScores', JSON.stringify(savedScores));
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">{t('patternIdQuiz.quizComplete')}</h2>
          <p className="text-5xl font-bold mb-4 text-primary">
            {score} / {questions.length}
          </p>
          <p className="text-xl mb-6 text-muted-foreground">
            {percentage >= 80 ? t('patternIdQuiz.excellentResult') :
             percentage >= 60 ? t('patternIdQuiz.goodResult') :
             t('patternIdQuiz.keepLearning')}
          </p>
          <Button onClick={handleRestart} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('patternIdQuiz.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              {t('patternIdQuiz.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}
            </span>
            <span className="text-sm font-medium">
              {t('patternIdQuiz.score', { score, total: currentQuestionIndex + (showExplanation ? 1 : 0) })}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{t('patternIdQuiz.identifyPattern')}</h3>
            <Badge variant="outline" className="text-sm">
              {currentQuestion.category}
            </Badge>
          </div>
          <div className="bg-[hsl(223,39%,4%)] rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4">{t('patternIdQuiz.selectCorrect')}</h4>
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
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
                    <span className="font-medium">{translatePatternName(option)}</span>
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

          {showExplanation && (
            <div className={`mt-6 p-4 rounded-lg ${
              selectedAnswer === currentQuestion.correctAnswer 
                ? 'bg-green-500/10 border border-green-500' 
                : 'bg-red-500/10 border border-red-500'
            }`}>
              <p className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.correctAnswer ? t('patternIdQuiz.correct') : t('patternIdQuiz.incorrect')}
              </p>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          )}

          {showExplanation && (
            <Button onClick={handleNext} className="w-full mt-4" size="lg">
              {currentQuestionIndex < questions.length - 1 ? t('patternIdQuiz.nextQuestion') : t('patternIdQuiz.finishQuiz')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
