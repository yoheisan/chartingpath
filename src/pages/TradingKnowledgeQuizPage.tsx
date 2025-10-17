import { PatternQuiz } from "@/components/PatternQuiz";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TradingKnowledgeQuizPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/chart-patterns/quiz" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz Hub
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Trading Knowledge Quiz</h1>
          <p className="text-xl text-muted-foreground">
            Test your comprehensive trading knowledge across patterns, characteristics, and risk management
          </p>
        </div>
        
        <PatternQuiz />
      </div>
    </div>
  );
};

export default TradingKnowledgeQuizPage;
