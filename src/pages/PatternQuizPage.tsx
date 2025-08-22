import { PatternQuiz } from "@/components/PatternQuiz";

const PatternQuizPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Pattern Quiz</h1>
          <p className="text-xl text-muted-foreground">
            Test your knowledge of chart patterns and improve your trading skills with our interactive quiz
          </p>
        </div>
        
        <PatternQuiz />
      </div>
    </div>
  );
};

export default PatternQuizPage;