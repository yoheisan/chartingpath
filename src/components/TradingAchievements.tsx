import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, TrendingUp } from 'lucide-react';

const ACHIEVEMENTS = [
  {
    id: 'first_trade',
    name: 'First Trade',
    description: 'Execute your first paper trade',
    icon: Target,
    earned: true,
    progress: 100,
  },
  {
    id: 'profitable_week',
    name: 'Profitable Week',
    description: 'End a week with positive P&L',
    icon: TrendingUp,
    earned: true,
    progress: 100,
  },
  {
    id: 'risk_manager',
    name: 'Risk Manager',
    description: 'Use stop loss on 10 trades',
    icon: Star,
    earned: false,
    progress: 70,
  },
  {
    id: 'pattern_master',
    name: 'Pattern Master',
    description: 'Identify 5 chart patterns correctly',
    icon: Trophy,
    earned: false,
    progress: 40,
  },
];

export const TradingAchievements = () => {
  const earnedCount = ACHIEVEMENTS.filter(a => a.earned).length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
          <Badge variant="secondary" className="ml-auto">
            {earnedCount}/{ACHIEVEMENTS.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ACHIEVEMENTS.map((achievement) => {
            const Icon = achievement.icon;
            
            return (
              <div key={achievement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{achievement.name}</h4>
                    {achievement.earned && (
                      <Badge variant="secondary" className="text-xs">
                        Earned
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  {!achievement.earned && (
                    <Progress value={achievement.progress} className="h-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Complete achievements to unlock trading insights and educational content
          </p>
        </div>
      </CardContent>
    </Card>
  );
};