/**
 * Strategy Primer Component
 * 
 * Provides beginner-friendly educational content for trading strategies
 * following industry best practices from Investopedia, BabyPips, and CMT curriculum.
 * 
 * Structure:
 * 1. "What Is This?" - Clear, jargon-free definition
 * 2. Prerequisites - Required knowledge before learning
 * 3. Core Concepts - Fundamental building blocks
 * 4. How It Works - Step-by-step mechanics
 * 5. Market Context - When and where to apply
 * 6. Common Applications - Real trading examples
 */

import { ReactNode } from 'react';
import { 
  Lightbulb, GraduationCap, Target, BookOpen, 
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, HelpCircle, DollarSign, Clock, Activity,
  BarChart3, LineChart, Zap, Shield, ArrowRight
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

export interface StrategyPrimerData {
  strategyName: string;
  category: 'indicator' | 'pattern' | 'trading-style' | 'risk-management' | 'algorithmic' | 'candlestick';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Core educational content
  whatIsIt: string;
  whyItMatters: string;
  
  // Historical context (makes content authoritative)
  history?: {
    origin: string;
    developer?: string;
    yearIntroduced?: string;
  };
  
  // Market context
  marketContext: {
    bestMarkets: string[]; // e.g., ['Stocks', 'Forex', 'Crypto']
    bestTimeframes: string[]; // e.g., ['Daily', '4H', '1H']
    marketConditions: string; // When this strategy works best
  };
  
  // Prerequisites that a beginner should understand first
  prerequisites: {
    title: string;
    description: string;
    importance: 'essential' | 'helpful' | 'advanced';
  }[];
  
  // Core concepts with plain-English explanations
  coreConcepts: {
    concept: string;
    explanation: string;
    example?: string;
  }[];
  
  // How it works - step by step
  howItWorks: {
    step: string;
    detail: string;
  }[];
  
  // Signals to look for
  signals?: {
    signal: string;
    meaning: string;
    action: 'buy' | 'sell' | 'hold' | 'caution';
  }[];
  
  // Strengths and limitations
  strengths: string[];
  limitations: string[];
  
  // Practical application
  practicalTips: string[];
  
  // Common mistakes beginners make
  commonMistakes: string[];
  
  // Real-world analogy for intuitive understanding
  analogy?: string;
  
  // Related strategies to explore next
  relatedStrategies?: {
    name: string;
    relationship: string;
  }[];
}

interface StrategyPrimerProps {
  data: StrategyPrimerData;
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

const categoryConfig = {
  indicator: { icon: LineChart, label: 'Technical Indicator', color: 'text-blue-500' },
  pattern: { icon: BarChart3, label: 'Chart Pattern', color: 'text-purple-500' },
  'trading-style': { icon: Target, label: 'Trading Style', color: 'text-green-500' },
  'risk-management': { icon: Shield, label: 'Risk Management', color: 'text-amber-500' },
  algorithmic: { icon: Zap, label: 'Algorithmic Trading', color: 'text-cyan-500' },
  candlestick: { icon: Activity, label: 'Candlestick Pattern', color: 'text-orange-500' }
};

const importanceConfig = {
  essential: { color: 'text-red-500', badge: 'Must Know' },
  helpful: { color: 'text-amber-500', badge: 'Recommended' },
  advanced: { color: 'text-blue-500', badge: 'For Depth' }
};

const actionConfig = {
  buy: { color: 'bg-green-500/20 text-green-600 dark:text-green-400', label: 'Bullish Signal' },
  sell: { color: 'bg-red-500/20 text-red-600 dark:text-red-400', label: 'Bearish Signal' },
  hold: { color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', label: 'Wait' },
  caution: { color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', label: 'Use Caution' }
};

export function StrategyPrimer({ data }: StrategyPrimerProps) {
  const difficulty = difficultyConfig[data.difficulty];
  const category = categoryConfig[data.category];
  const CategoryIcon = category.icon;

  return (
    <div className="space-y-6 mb-8">
      {/* Header with difficulty and category */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={difficulty.color}>{difficulty.label}</Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <CategoryIcon className={`h-3 w-3 ${category.color}`} />
          {category.label}
        </Badge>
      </div>

      {/* What Is This? - The most important section for beginners */}
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
            <h4 className="font-semibold text-sm mb-2">Why Does This Matter?</h4>
            <p className="text-sm text-muted-foreground">{data.whyItMatters}</p>
          </div>

          {/* Historical context */}
          {data.history && (
            <div className="pt-2 text-sm text-muted-foreground border-t mt-4">
              <p className="italic">{data.history.origin}</p>
              {data.history.developer && (
                <p className="mt-1">
                  Developed by <strong className="text-foreground">{data.history.developer}</strong>
                  {data.history.yearIntroduced && ` in ${data.history.yearIntroduced}`}.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            When & Where to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Best Markets</p>
              <div className="flex flex-wrap gap-1">
                {data.marketContext.bestMarkets.map((market, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{market}</Badge>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Best Timeframes</p>
              <div className="flex flex-wrap gap-1">
                {data.marketContext.bestTimeframes.map((tf, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tf}</Badge>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 sm:col-span-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Market Conditions</p>
              <p className="text-sm">{data.marketContext.marketConditions}</p>
            </div>
          </div>
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
              {data.prerequisites.map((prereq, i) => {
                const importance = importanceConfig[prereq.importance];
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <BookOpen className={`h-4 w-4 mt-0.5 flex-shrink-0 ${importance.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{prereq.title}</p>
                        <Badge variant="outline" className="text-xs">{importance.badge}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{prereq.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Concepts */}
      {data.coreConcepts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Core Concepts to Understand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.coreConcepts.map((concept, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-primary mb-2">{concept.concept}</h4>
                  <p className="text-sm">{concept.explanation}</p>
                  {concept.example && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      <strong>Example:</strong> {concept.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works - Step by step */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            How It Works
          </CardTitle>
          <CardDescription>Step-by-step breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {data.howItWorks.map((step, i) => (
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

      {/* Trading Signals (if applicable) */}
      {data.signals && data.signals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Trading Signals to Watch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.signals.map((signal, i) => {
                const action = actionConfig[signal.action];
                return (
                  <div key={i} className={`p-4 rounded-lg ${action.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{signal.signal}</span>
                      <Badge variant="outline" className="text-xs">{action.label}</Badge>
                    </div>
                    <p className="text-sm opacity-90">{signal.meaning}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Limitations */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Limitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.limitations.map((limitation, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-1 flex-shrink-0" />
                  {limitation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Practical Tips */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tips" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <span className="font-semibold">Practical Tips for Traders</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-3 pt-2">
              {data.practicalTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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

      {/* Related Strategies */}
      {data.relatedStrategies && data.relatedStrategies.length > 0 && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Related Topics to Explore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.relatedStrategies.map((related, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {related.name} – {related.relationship}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StrategyPrimer;
