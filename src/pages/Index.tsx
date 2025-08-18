import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import { PatternLibrary } from "@/components/PatternLibrary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, BookOpen } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "library">("generator");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <img 
                src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                alt="ChartingPath Logo" 
                className="h-8 w-8 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChartingPath
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            <span className="font-semibold text-foreground">Trading Chart Pattern Made Simple — Learn, Apply, and Trade Smarter</span>
            <br /><br />
            Chart pattern analysis is the foundation of technical trading — a skill that helps traders recognize profitable setups with confidence. At ChartingPath, we specialize in teaching chart pattern analysis through beginner-friendly tutorials, expert strategies, and visual breakdowns. Whether you're just starting or advancing your skills, our resources will help you master chart formations, compare trading strategies, and gain confidence in your trades.
          </p>
          
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-bullish" />
              <span className="text-sm text-muted-foreground">Professional Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Educational Focus</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-bearish" />
              <span className="text-sm text-muted-foreground">TradingView Style</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <Card className="p-2 inline-flex">
            <Button
              variant={activeTab === "generator" ? "default" : "ghost"}
              onClick={() => setActiveTab("generator")}
              className="px-6"
            >
              Pattern Generator
            </Button>
            <Button
              variant={activeTab === "library" ? "default" : "ghost"}
              onClick={() => setActiveTab("library")}
              className="px-6"
            >
              Pattern Library
            </Button>
          </Card>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "generator" && <ChartPatternGenerator />}
          {activeTab === "library" && <PatternLibrary />}
        </div>
      </div>
    </div>
  );
};

export default Index;
