import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PatternGenerator = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Chart Pattern Generator</h1>
          <p className="text-xl text-muted-foreground">
            Generate and visualize various financial chart patterns with our interactive tool
          </p>
        </div>
        
        <ChartPatternGenerator />
      </div>
    </div>
  );
};

export default PatternGenerator;