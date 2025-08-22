import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import Navigation from "@/components/Navigation";

const PatternGenerator = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-7xl">
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