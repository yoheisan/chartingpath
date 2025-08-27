import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, BookOpen, Target, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LearningProgress {
  id: string;
  pattern_type: string;
  quiz_attempts: number;
  correct_answers: number;
  accuracy_percentage: number;
  last_practiced_at: string | null;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at: string;
}

interface Achievement {
  id: string;
  achievement_name: string;
  description: string;
  achievement_type: string;
  metadata: any;
  earned_at: string;
}

const patterns = [
  { name: 'Head and Shoulders', type: 'head_shoulders', difficulty: 'intermediate' },
  { name: 'Double Top/Bottom', type: 'double_top_bottom', difficulty: 'beginner' },
  { name: 'Triangle Patterns', type: 'triangles', difficulty: 'intermediate' },
  { name: 'Flag & Pennant', type: 'flag_pennant', difficulty: 'advanced' },
  { name: 'Cup and Handle', type: 'cup_handle', difficulty: 'intermediate' },
  { name: 'Wedge Patterns', type: 'wedges', difficulty: 'advanced' },
  { name: 'Rectangle', type: 'rectangle', difficulty: 'beginner' },
  { name: 'Inverse Head & Shoulders', type: 'inverse_head_shoulders', difficulty: 'intermediate' }
];

const masteryLevels = [
  { level: 'beginner', color: 'bg-gray-500', minAccuracy: 0 },
  { level: 'intermediate', color: 'bg-blue-500', minAccuracy: 60 },
  { level: 'advanced', color: 'bg-purple-500', minAccuracy: 75 },
  { level: 'expert', color: 'bg-gold-500', minAccuracy: 90 }
];

const LearningProgress = () => {
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch learning progress
      const { data: progressData, error: progressError } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;
      setProgress((progressData || []) as LearningProgress[]);

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('trading_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast({
        title: "Error",
        description: "Failed to load learning progress",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateQuizAttempt = async (patternType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simulate quiz result (in real app this would come from actual quiz)
      const correct = Math.random() > 0.3; // 70% chance of being correct
      
      const existingProgress = progress.find(p => p.pattern_type === patternType);
      
      if (existingProgress) {
        const newAttempts = existingProgress.quiz_attempts + 1;
        const newCorrect = existingProgress.correct_answers + (correct ? 1 : 0);
        const newAccuracy = (newCorrect / newAttempts) * 100;
        
        let newMasteryLevel = existingProgress.mastery_level;
        if (newAccuracy >= 90) newMasteryLevel = 'expert';
        else if (newAccuracy >= 75) newMasteryLevel = 'advanced';
        else if (newAccuracy >= 60) newMasteryLevel = 'intermediate';
        
        const { error } = await supabase
          .from('learning_progress')
          .update({
            quiz_attempts: newAttempts,
            correct_answers: newCorrect,
            accuracy_percentage: newAccuracy,
            mastery_level: newMasteryLevel,
            last_practiced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('learning_progress')
          .insert({
            user_id: user.id,
            pattern_type: patternType,
            quiz_attempts: 1,
            correct_answers: correct ? 1 : 0,
            accuracy_percentage: correct ? 100 : 0,
            mastery_level: 'beginner',
            last_practiced_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: correct ? "Correct!" : "Incorrect",
        description: correct ? "Great job! Keep practicing to improve." : "Keep studying and try again!",
        variant: correct ? "default" : "destructive"
      });

      // Check for achievements
      await checkForAchievements(user.id);
      
      fetchLearningData();
    } catch (error) {
      console.error('Error updating quiz progress:', error);
      toast({
        title: "Error",
        description: "Failed to record quiz attempt",
        variant: "destructive"
      });
    }
  };

  const checkForAchievements = async (userId: string) => {
    try {
      // Check for first quiz achievement
      const totalAttempts = progress.reduce((sum, p) => sum + p.quiz_attempts, 0) + 1;
      if (totalAttempts === 1) {
        await supabase.from('trading_achievements').insert({
          user_id: userId,
          achievement_name: "First Quiz",
          description: "Completed your first pattern quiz",
          achievement_type: "quiz_milestone",
          metadata: { attempts: 1 }
        });
      }

      // Check for mastery achievements
      const expertPatterns = progress.filter(p => p.mastery_level === 'expert').length;
      if (expertPatterns >= 3) {
        const existingAchievement = achievements.find(a => a.achievement_name === "Pattern Master");
        if (!existingAchievement) {
          await supabase.from('trading_achievements').insert({
            user_id: userId,
            achievement_name: "Pattern Master",
            description: "Achieved expert level in 3+ patterns",
            achievement_type: "mastery",
            metadata: { expert_patterns: expertPatterns }
          });
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getPatternProgress = (patternType: string) => {
    return progress.find(p => p.pattern_type === patternType);
  };

  const getMasteryColor = (level: string) => {
    const masteryLevel = masteryLevels.find(m => m.level === level);
    return masteryLevel?.color || 'bg-gray-500';
  };

  const getOverallProgress = () => {
    if (progress.length === 0) return 0;
    const totalAccuracy = progress.reduce((sum, p) => sum + p.accuracy_percentage, 0);
    return Math.round(totalAccuracy / progress.length);
  };

  const getCompletedPatterns = () => {
    return progress.filter(p => p.mastery_level === 'expert').length;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading learning progress...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{getOverallProgress()}%</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{progress.length}</p>
                <p className="text-sm text-muted-foreground">Patterns Studied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{getCompletedPatterns()}</p>
                <p className="text-sm text-muted-foreground">Expert Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{achievements.length}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pattern Learning Progress
          </CardTitle>
          <CardDescription>
            Track your mastery of different chart patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.map((pattern) => {
              const patternProgress = getPatternProgress(pattern.type);
              const accuracy = patternProgress?.accuracy_percentage || 0;
              const attempts = patternProgress?.quiz_attempts || 0;
              const masteryLevel = patternProgress?.mastery_level || 'beginner';
              
              return (
                <Card key={pattern.type} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{pattern.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pattern.difficulty}
                        </Badge>
                        <Badge className={`text-xs ${getMasteryColor(masteryLevel)}`}>
                          {masteryLevel}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => simulateQuizAttempt(pattern.type)}
                    >
                      Practice
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{attempts} attempts</span>
                      {patternProgress?.last_practiced_at && (
                        <span>
                          Last: {new Date(patternProgress.last_practiced_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {achievements.slice(0, 6).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Award className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold">{achievement.achievement_name}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LearningProgress;