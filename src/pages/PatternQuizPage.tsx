import { PatternIdentificationQuiz } from "@/components/PatternIdentificationQuiz";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PatternQuizPage = () => {
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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Pattern Identification Quiz</h1>
          <p className="text-xl text-muted-foreground">
            Learn to recognize chart patterns by sight - identify patterns without labels to master pattern recognition
          </p>
        </div>
        
        <PatternIdentificationQuiz />
      </div>
    </div>
  );
};

export default PatternQuizPage;