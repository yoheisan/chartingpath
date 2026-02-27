import { PrescriptivePatternSVG } from "@/components/PrescriptivePatternSVG";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ALL_PATTERNS = [
  // Reversal
  "head-shoulders", "inverted-head-shoulders", "double-top", "double-bottom",
  "triple-top", "triple-bottom", "rising-wedge", "falling-wedge",
  // Continuation
  "ascending-triangle", "descending-triangle", "symmetrical-triangle",
  "bull-flag", "bear-flag", "pennant", "cup-handle", "rectangle",
  // Candlestick
  "hammer", "hanging-man", "shooting-star",
  "doji", "standard-doji", "dragonfly-doji", "gravestone-doji", "long-legged-doji", "four-price-doji",
  "bullish-harami", "bearish-harami",
  "bullish-engulfing", "bearish-engulfing",
  "spinning-top", "morning-star", "evening-star",
  "three-white-soldiers", "three-black-crows",
  "piercing-line", "dark-cloud-cover",
  "tweezer-top", "tweezer-bottom",
  "kicker-bullish", "kicker-bearish",
  "marubozu-bullish", "marubozu-bearish",
  "abandoned-baby-bullish", "abandoned-baby-bearish",
];

const PatternVisualizationPreview = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Prescriptive Pattern Visualization Preview</h1>
          <p className="text-muted-foreground">All {ALL_PATTERNS.length} patterns rendered in the prescriptive SVG style</p>
        </div>

        <div className="space-y-8">
          {ALL_PATTERNS.map(pattern => (
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
