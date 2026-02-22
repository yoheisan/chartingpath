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
      name: 'Pattern Visual Recognition',
      score: scores.patternVisual.score,
      total: scores.patternVisual.total,
      category: 'Pattern Analysis'
    },
    {
      id: 'characteristics',
      name: 'Pattern Characteristics',
      score: scores.patternCharacteristics.score,
      total: scores.patternCharacteristics.total,
      category: 'Technical Knowledge'
    },
    {
      id: 'risk',
      name: 'Risk Management',
      score: scores.riskManagement.score,
      total: scores.riskManagement.total,
      category: 'Trading Discipline'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
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
                <Badge variant="outline">Visual Recognition</Badge>
              </div>
              <CardTitle className="text-2xl">{t('quizHub.patternQuizTitle')}</CardTitle>
              <CardDescription>{t('quizHub.patternQuizDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                  <span className="font-medium">15 patterns</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                  <span className="font-medium">Visual pattern recognition</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                  <Badge variant="secondary">Intermediate</Badge>
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
                <Badge variant="outline">Comprehensive</Badge>
              </div>
              <CardTitle className="text-2xl">{t('quizHub.tradingKnowledgeTitle')}</CardTitle>
              <CardDescription>{t('quizHub.tradingKnowledgeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                  <span className="font-medium">25+ questions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium">All categories</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                  <Badge variant="secondary">All Levels</Badge>
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
                  <Badge variant="outline">Stock Market</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.stockMarketQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.stockMarketDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">15 questions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">P/E ratios, market hours, indices</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">Beginner to Advanced</Badge>
                  </div>
                  <Link to="/quiz/stock-market" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      Start Stock Market Quiz
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <Badge variant="outline">Forex</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.forexQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.forexDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">15 questions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">Currency pairs, NFP, carry trades</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">Beginner to Advanced</Badge>
                  </div>
                  <Link to="/quiz/forex" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      Start Forex Quiz
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Bitcoin className="h-8 w-8 text-primary" />
                  <Badge variant="outline">Cryptocurrency</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.cryptoQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.cryptoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">15 questions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">Bitcoin, DeFi, blockchain, wallets</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">Beginner to Advanced</Badge>
                  </div>
                  <Link to="/quiz/crypto" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      Start Crypto Quiz
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Boxes className="h-8 w-8 text-primary" />
                  <Badge variant="outline">Commodities</Badge>
                </div>
                <CardTitle className="text-2xl">{t('quizHub.commoditiesQuiz')}</CardTitle>
                <CardDescription>{t('quizHub.commoditiesDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.questions')}</span>
                    <span className="font-medium">15 questions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.focus')}</span>
                    <span className="font-medium">Gold, oil, futures, COT reports</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('quizHub.difficulty')}</span>
                    <Badge variant="secondary">Beginner to Advanced</Badge>
                  </div>
                  <Link to="/quiz/commodities" className="block">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                      Start Commodities Quiz
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
