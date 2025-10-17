import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, BookOpen } from "lucide-react";

interface KnowledgeArea {
  id: string;
  name: string;
  score: number;
  total: number;
  category: string;
}

interface KnowledgeAssessmentProps {
  areas: KnowledgeArea[];
}

export const KnowledgeAssessment = ({ areas }: KnowledgeAssessmentProps) => {
  const getScorePercentage = (area: KnowledgeArea) => {
    return area.total > 0 ? Math.round((area.score / area.total) * 100) : 0;
  };

  const getScoreLevel = (percentage: number) => {
    if (percentage >= 80) return { label: "Expert", color: "bg-green-500", icon: TrendingUp };
    if (percentage >= 60) return { label: "Proficient", color: "bg-blue-500", icon: Target };
    if (percentage >= 40) return { label: "Developing", color: "bg-yellow-500", icon: BookOpen };
    return { label: "Needs Focus", color: "bg-red-500", icon: TrendingDown };
  };

  const sortedAreas = [...areas].sort((a, b) => getScorePercentage(a) - getScorePercentage(b));
  const weakestAreas = sortedAreas.slice(0, 3).filter(area => getScorePercentage(area) < 60);
  const strongestAreas = sortedAreas.slice(-3).filter(area => getScorePercentage(area) >= 60);

  const overallScore = areas.reduce((sum, area) => sum + area.score, 0);
  const overallTotal = areas.reduce((sum, area) => sum + area.total, 0);
  const overallPercentage = overallTotal > 0 ? Math.round((overallScore / overallTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Trading Knowledge</span>
            <Badge variant="outline" className="text-lg">
              {overallPercentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Overall: {overallScore} / {overallTotal} questions answered correctly
          </p>
        </CardContent>
      </Card>

      {/* Weak Areas - Focus Here */}
      {weakestAreas.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Focus Areas - Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weakestAreas.map((area) => {
              const percentage = getScorePercentage(area);
              const level = getScoreLevel(percentage);
              const Icon = level.icon;

              return (
                <div key={area.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{area.name}</span>
                    </div>
                    <Badge variant="outline" className={level.color + " text-white"}>
                      {percentage}%
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {area.score} / {area.total} correct - {level.label}
                  </p>
                </div>
              );
            })}
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium mb-2">Recommendations:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review pattern characteristics and trading rules</li>
                <li>• Practice with more visual recognition exercises</li>
                <li>• Study risk management principles</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strong Areas */}
      {strongestAreas.length > 0 && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Strong Areas - Well Done!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strongestAreas.map((area) => {
              const percentage = getScorePercentage(area);
              const level = getScoreLevel(percentage);
              const Icon = level.icon;

              return (
                <div key={area.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{area.name}</span>
                    </div>
                    <Badge variant="outline" className={level.color + " text-white"}>
                      {percentage}%
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {area.score} / {area.total} correct - {level.label}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Knowledge Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Knowledge Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {areas.map((area) => {
            const percentage = getScorePercentage(area);
            const level = getScoreLevel(percentage);
            const Icon = level.icon;

            return (
              <div key={area.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{area.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {area.category}
                    </Badge>
                  </div>
                  <Badge variant="outline">
                    {percentage}%
                  </Badge>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {area.score} / {area.total} correct
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
