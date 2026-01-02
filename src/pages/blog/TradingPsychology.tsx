import { Link } from "react-router-dom";
import { ArrowLeft, Brain, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TradingPsychology = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Trading Psychology: Mastering Your Mindset</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-8">
            <span>Psychology</span>
            <span>•</span>
            <span>11 min read</span>
          </div>

          <Alert className="mb-8 border-primary/50 bg-primary/5">
            <Brain className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Trading success is 80% psychology and 20% strategy. Master your emotions to become a consistently profitable trader.
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold mt-12 mb-4">Common Psychological Challenges</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fear and Greed</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Fear causes premature exits and missed opportunities. Greed leads to overleveraging and holding losers too long.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenge Trading</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Trying to quickly recover losses by taking impulsive trades. This almost always leads to bigger losses.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overconfidence</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                After winning streaks, traders often increase position sizes and take excessive risks, leading to large drawdowns.
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-4">Building Mental Discipline</h2>
          <div className="bg-accent/50 p-6 rounded-lg mb-8">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Follow your trading plan consistently</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Accept that losses are part of trading</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Keep a trading journal to track emotions</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Take breaks after losses or winning streaks</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
};

export default TradingPsychology;
