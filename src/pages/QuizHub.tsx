import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, Eye, Award, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KnowledgeAssessment } from "@/components/KnowledgeAssessment";

interface QuizScore {
  patternVisual: { score: number; total: number };
  patternCharacteristics: { score: number; total: number };
  riskManagement: { score: number; total: number };
}

const QuizHub = () => {
  const [scores, setScores] = useState<QuizScore | null>(null);

  useEffect(() => {
    // Load scores from localStorage
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
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trading Knowledge Center</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Test your knowledge, identify areas for improvement, and become a better trader
          </p>
        </div>

        {/* Knowledge Assessment */}
        {scores && knowledgeAreas.length > 0 && (
          <div className="mb-12">
            <KnowledgeAssessment areas={knowledgeAreas} />
          </div>
        )}

        {/* Quiz Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Pattern Identification Quiz */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-8 w-8 text-primary" />
                <Badge variant="outline">Visual Recognition</Badge>
              </div>
              <CardTitle className="text-2xl">Pattern Identification Quiz</CardTitle>
              <CardDescription>
                Learn to recognize chart patterns by sight. Practice identifying patterns without labels to master visual pattern recognition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">15 patterns</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Focus:</span>
                  <span className="font-medium">Chart pattern visuals</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <Badge variant="secondary">Beginner to Intermediate</Badge>
                </div>
                <Link to="/quiz/pattern-identification" className="block">
                  <Button className="w-full" size="lg">
                    Start Pattern Quiz
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Trading Knowledge Quiz */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <Badge variant="outline">Comprehensive</Badge>
              </div>
              <CardTitle className="text-2xl">Trading Knowledge Quiz</CardTitle>
              <CardDescription>
                Test your understanding of pattern characteristics, risk management, and professional trading practices. 100 questions covering all aspects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">100 questions</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium">Visual, Characteristics, Risk</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <Badge variant="secondary">All Levels</Badge>
                </div>
                <Link to="/quiz/trading-knowledge" className="block">
                  <Button className="w-full" size="lg">
                    Start Knowledge Quiz
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Why Take These Quizzes?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Identify Knowledge Gaps</h4>
                <p className="text-sm text-muted-foreground">
                  Discover which areas need more study and focus your learning efforts effectively
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Track Your Progress</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor your improvement over time and see your knowledge grow with each attempt
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Build Confidence</h4>
                <p className="text-sm text-muted-foreground">
                  Gain confidence in pattern recognition and trading decisions through practice
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizHub;
