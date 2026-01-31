/**
 * Options Strategy Primer Component
 * 
 * Provides beginner-friendly educational content for options strategies
 * following industry best practices from tastylive, Option Alpha, and Investopedia.
 * 
 * Structure:
 * 1. "What Is This Strategy?" - Clear, jargon-free definition
 * 2. Prerequisites - Required knowledge before attempting
 * 3. When to Use - Market conditions and outlook
 * 4. How It Works - Step-by-step mechanics
 * 5. Key Concepts - Important terms explained
 */

import { ReactNode } from 'react';
import { 
  Lightbulb, GraduationCap, Target, BookOpen, 
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, HelpCircle, DollarSign, Clock, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface OptionsStrategyPrimerData {
  strategyName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Core educational content
  whatIsIt: string;
  whyUseIt: string;
  
  // Market outlook
  outlook: {
    direction: 'bullish' | 'bearish' | 'neutral' | 'volatile';
    description: string;
  };
  
  // Prerequisites that a beginner should understand first
  prerequisites: {
    title: string;
    description: string;
  }[];
  
  // Step-by-step construction
  construction: {
    step: string;
    detail: string;
  }[];
  
  // Key concepts with plain-English explanations
  keyConcepts: {
    term: string;
    definition: string;
    inContext: string; // How it applies to THIS strategy
  }[];
  
  // Profit/Loss scenarios
  scenarios: {
    scenario: string;
    outcome: 'profit' | 'loss' | 'breakeven';
    explanation: string;
  }[];
  
  // Risk profile summary
  riskProfile: {
    maxProfit: string;
    maxLoss: string;
    breakeven: string;
    probability: string;
  };
  
  // Common beginner mistakes
  commonMistakes: string[];
  
  // Real-world analogy
  analogy?: string;
}

interface OptionsStrategyPrimerProps {
  data: OptionsStrategyPrimerData;
}

const difficultyConfig = {
  beginner: {
    color: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
    label: 'Beginner Friendly'
  },
  intermediate: {
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    label: 'Intermediate'
  },
  advanced: {
    color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    label: 'Advanced'
  }
};

const outlookConfig = {
  bullish: { icon: TrendingUp, color: 'text-green-500', label: 'Bullish' },
  bearish: { icon: TrendingDown, color: 'text-red-500', label: 'Bearish' },
  neutral: { icon: Minus, color: 'text-blue-500', label: 'Neutral' },
  volatile: { icon: Activity, color: 'text-amber-500', label: 'High Volatility Expected' }
};

export function OptionsStrategyPrimer({ data }: OptionsStrategyPrimerProps) {
  const difficulty = difficultyConfig[data.difficulty];
  const outlook = outlookConfig[data.outlook.direction];
  const OutlookIcon = outlook.icon;

  return (
    <div className="space-y-6 mb-8">
      {/* Header with difficulty and outlook */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={difficulty.color}>{difficulty.label}</Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <OutlookIcon className={`h-3 w-3 ${outlook.color}`} />
          {outlook.label}
        </Badge>
      </div>

      {/* What Is This Strategy? - The most important section for beginners */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            What Is {data.strategyName}?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">{data.whatIsIt}</p>
          
          {/* Real-world analogy for intuitive understanding */}
          {data.analogy && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-sm font-semibold">Think of it like this...</AlertTitle>
              <AlertDescription className="text-sm mt-1">
                {data.analogy}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="pt-2">
            <h4 className="font-semibold text-sm mb-2">Why Would You Use This?</h4>
            <p className="text-sm text-muted-foreground">{data.whyUseIt}</p>
          </div>
        </CardContent>
      </Card>

      {/* Market Outlook */}
      <Card className={`border-l-4 ${
        data.outlook.direction === 'bullish' ? 'border-l-green-500' :
        data.outlook.direction === 'bearish' ? 'border-l-red-500' :
        data.outlook.direction === 'neutral' ? 'border-l-blue-500' :
        'border-l-amber-500'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            When to Use This Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{data.outlook.description}</p>
        </CardContent>
      </Card>

      {/* Prerequisites - What you need to know first */}
      {data.prerequisites.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              Before You Begin: Prerequisites
            </CardTitle>
            <CardDescription>
              Make sure you understand these concepts first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {data.prerequisites.map((prereq, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <BookOpen className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{prereq.title}</p>
                    <p className="text-sm text-muted-foreground">{prereq.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Profile Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Risk & Reward Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Maximum Profit</p>
              <p className="font-semibold text-green-600 dark:text-green-400">{data.riskProfile.maxProfit}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Maximum Loss</p>
              <p className="font-semibold text-red-600 dark:text-red-400">{data.riskProfile.maxLoss}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Break-even Point</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">{data.riskProfile.breakeven}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Typical Win Probability</p>
              <p className="font-semibold text-purple-600 dark:text-purple-400">{data.riskProfile.probability}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Construct - Step by step */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            How to Set Up This Trade
          </CardTitle>
          <CardDescription>Step-by-step instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {data.construction.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <div className="flex-1 pt-1">
                  <p className="font-medium">{step.step}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Key Concepts Explained */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="concepts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">Key Terms Explained</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {data.keyConcepts.map((concept, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-primary">{concept.term}</h4>
                  <p className="text-sm mt-1">{concept.definition}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>In this strategy:</strong> {concept.inContext}
                  </p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Profit/Loss Scenarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            What Happens In Different Scenarios?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.scenarios.map((scenario, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg border ${
                  scenario.outcome === 'profit' ? 'bg-green-500/5 border-green-500/20' :
                  scenario.outcome === 'loss' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {scenario.outcome === 'profit' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {scenario.outcome === 'loss' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {scenario.outcome === 'breakeven' && <Minus className="h-4 w-4 text-blue-500" />}
                  <span className="font-medium">{scenario.scenario}</span>
                </div>
                <p className="text-sm text-muted-foreground">{scenario.explanation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      {data.commonMistakes.length > 0 && (
        <Alert className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle>Common Beginner Mistakes</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-2">
              {data.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-destructive">•</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default OptionsStrategyPrimer;
