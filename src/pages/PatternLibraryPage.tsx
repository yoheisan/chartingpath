import { PatternLibrary } from "@/components/PatternLibrary";
import Navigation from "@/components/Navigation";

const PatternLibraryPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Pattern Library</h1>
          <p className="text-xl text-muted-foreground">
            Explore our comprehensive collection of chart patterns with detailed descriptions and analysis
          </p>
        </div>
        
        <PatternLibrary />
      </div>
    </div>
  );
};

export default PatternLibraryPage;