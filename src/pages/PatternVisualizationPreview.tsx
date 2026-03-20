import { PrescriptivePatternSVG } from "@/components/PrescriptivePatternSVG";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Patterns currently used in the ChartingPath screener (useScreenerCaps)
const SCREENER_PATTERNS = [
  // Breakout
  "donchian-breakout-long", "donchian-breakout-short",
  // Reversal
  "double-top", "double-bottom",
  "triple-top", "triple-bottom",
  "head-shoulders", "inverted-head-shoulders",
  "rising-wedge", "falling-wedge",
  // Continuation
  "ascending-triangle", "descending-triangle",
  "bull-flag", "bear-flag",
  "cup-handle",
];

const PatternVisualizationPreview = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Prescriptive Pattern Visualization Preview</h1>
          <p className="text-muted-foreground">All {SCREENER_PATTERNS.length} screener patterns rendered in the prescriptive SVG style</p>
        </div>

        <div className="space-y-8">
          {SCREENER_PATTERNS.map(pattern => (
            <div key={pattern} className="rounded-xl overflow-hidden border border-border/50">
              <PrescriptivePatternSVG patternType={pattern} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatternVisualizationPreview;
