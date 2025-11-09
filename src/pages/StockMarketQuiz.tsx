import { DatabaseQuiz } from "@/components/DatabaseQuiz";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";

const StockMarketQuiz = () => {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Stock Market Quiz</h1>
          <p className="text-xl text-muted-foreground">
            Test your knowledge of stock market fundamentals, valuation, trading hours, and market analysis
          </p>
        </div>
        
        <DatabaseQuiz 
          title="Stock Market Quiz"
          category="stock_market"
          limit={10}
        />
      </div>
    </div>
  );
};

export default StockMarketQuiz;
