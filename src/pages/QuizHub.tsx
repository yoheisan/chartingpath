import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Eye, Award, BookOpen, TrendingUp, DollarSign, Bitcoin, Boxes } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KnowledgeAssessment } from "@/components/KnowledgeAssessment";
import { useTranslation } from "react-i18next";

interface QuizScore {
  patternVisual: { score: number; total: number };
  patternCharacteristics: { score: number; total: number };
  riskManagement: { score: number; total: number };
}

const QuizHub = () => {
  const { t } = useTranslation();
  const [scores, setScores] = useState<QuizScore | null>(null);

  useEffect(() => {
    const savedScores = localStorage.getItem('quizScores');
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, []);

  const knowledgeAreas = scores ? [
    {
      id: 'visual',
      name: t('knowledgeAssessment.patternVisualRecognition'),
      score: scores.patternVisual.score,
      total: scores.patternVisual.total,
      category: t('knowledgeAssessment.patternAnalysis')
    },
    {
      id: 'characteristics',
      name: t('knowledgeAssessment.patternCharacteristics'),
      score: scores.patternCharacteristics.score,
      total: scores.patternCharacteristics.total,
      category: t('knowledgeAssessment.technicalKnowledge')
    },
    {
      id: 'risk',
      name: t('knowledgeAssessment.riskManagement'),
      score: scores.riskManagement.score,
      total: scores.riskManagement.total,
      category: t('knowledgeAssessment.tradingDiscipline')
    }
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToHome')}
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('quizHub.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('quizHub.subtitle')}
          </p>
        </div>

        {/* Knowledge Assessment */}
        {scores && knowledgeAreas.length > 0 && (
          <div className="mb-12">
            <KnowledgeAssessment areas={knowledgeAreas} />
          </div>
        )}

        {/* Main Quiz Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-8 w-8 text-primary" />
                <Badge variant="outline">{t('quizHub.visualRecognition')}</Badge>
              </div>
              <CardTitle className="text-2xl">{t('quizHub.patternQuizTitle')}</CardTitle>
              <CardDescription>{t('quizHub.patternQuizDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                  <span className="font-medium">{t('quizHub.patternsCount')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                  <span className="font-medium">{t('quizHub.visualPatternRecognition')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                  <Badge variant="secondary">{t('quizHub.intermediate')}</Badge>
                </div>
                <Link to="/quiz/pattern-identification" className="block">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                    {t('quizHub.startPatternQuiz')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <Badge variant="outline">{t('quizHub.comprehensive')}</Badge>
              </div>
              <CardTitle className="text-2xl">{t('quizHub.tradingKnowledgeTitle')}</CardTitle>
              <CardDescription>{t('quizHub.tradingKnowledgeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                  <span className="font-medium">{t('quizHub.questionsCount25')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.categories')}</span>
                  <span className="font-medium">{t('quizHub.allCategories')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                  <Badge variant="secondary">{t('quizHub.allLevels')}</Badge>
                </div>
                <Link to="/quiz/trading-knowledge" className="block">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                    {t('quizHub.startKnowledgeQuiz')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market-Specific Quizzes Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-2">{t('quizHub.marketSpecific')}</h2>
          <p className="text-center text-muted-foreground mb-8">{t('quizHub.marketSpecificDesc')}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{t('quizHub.stockMarket')}</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.stockMarketQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.stockMarketDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">{t('quizHub.questionsCount15')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">{t('quizHub.stockFocus')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">{t('quizHub.beginnerToAdvanced')}</Badge>
                  </div>
                  <Link to="/quiz/stock-market" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      {t('quizHub.startStockQuiz')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{t('quizHub.forex')}</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.forexQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.forexDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">{t('quizHub.questionsCount15')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">{t('quizHub.forexFocus')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">{t('quizHub.beginnerToAdvanced')}</Badge>
                  </div>
                  <Link to="/quiz/forex" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      {t('quizHub.startForexQuiz')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Bitcoin className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{t('quizHub.cryptocurrency')}</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.cryptoQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.cryptoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">{t('quizHub.questionsCount15')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">{t('quizHub.cryptoFocus')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">{t('quizHub.beginnerToAdvanced')}</Badge>
                  </div>
                  <Link to="/quiz/crypto" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      {t('quizHub.startCryptoQuiz')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Boxes className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{t('quizHub.commodities')}</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.commoditiesQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.commoditiesDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">{t('quizHub.questionsCount15')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">{t('quizHub.commoditiesFocus')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">{t('quizHub.beginnerToAdvanced')}</Badge>
                  </div>
                  <Link to="/quiz/commodities" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      {t('quizHub.startCommoditiesQuiz')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              {t('quizHub.whyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">{t('quizHub.identifyGaps')}</h4>
                <p className="text-sm text-muted-foreground">{t('quizHub.identifyGapsDesc')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('quizHub.trackProgress')}</h4>
                <p className="text-sm text-muted-foreground">{t('quizHub.trackProgressDesc')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('quizHub.buildConfidence')}</h4>
                <p className="text-sm text-muted-foreground">{t('quizHub.buildConfidenceDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizHub;
