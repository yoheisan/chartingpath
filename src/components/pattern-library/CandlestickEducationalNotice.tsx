import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CANDLESTICK_PATTERNS } from "@/hooks/usePatternDetailStats";

interface Props {
  patternKey: string;
}

export const CandlestickEducationalNotice = ({ patternKey }: Props) => {
  if (!CANDLESTICK_PATTERNS.includes(patternKey)) return null;

  return (
    <Card className="p-4 bg-blue-500/5 border-blue-500/20">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-500">
              Educational reference
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            ChartingPath's live scanner detects classical chart patterns (triangles, flags, wedges, and more). 
            Candlestick patterns are included here as educational background. They are not currently detected in the live scanner.
          </p>
        </div>
      </div>
    </Card>
  );
};
