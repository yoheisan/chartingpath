import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  BookOpen, GraduationCap, Trophy, AlertTriangle, 
  Target, Shield, TrendingUp, CheckCircle, XCircle,
  Info, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface SkillLevelSectionProps {
  level: 'novice' | 'intermediate' | 'advanced' | 'professional';
  title: string;
  children: ReactNode;
}

const levelConfig = {
  novice: {
    icon: BookOpen,
    color: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
    badge: 'bg-green-500/20 text-green-600 dark:text-green-400',
    label: 'Novice Level'
  },
  intermediate: {
    icon: GraduationCap,
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    label: 'Intermediate Level'
  },
  advanced: {
    icon: TrendingUp,
    color: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    label: 'Advanced Level'
  },
  professional: {
    icon: Trophy,
    color: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    label: 'Professional Level'
  }
};

export function SkillLevelSection({ level, title, children }: SkillLevelSectionProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border-2 p-6 my-8', config.color)}>
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-6 w-6" />
        <h3 className="text-xl font-bold">{title}</h3>
        <Badge className={config.badge}>{config.label}</Badge>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface TradingRuleProps {
  type: 'entry' | 'exit' | 'stop' | 'target' | 'risk';
  title: string;
  children: ReactNode;
}

const ruleConfig = {
  entry: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  exit: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  stop: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' },
  target: { icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
  risk: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' }
};

export function TradingRule({ type, title, children }: TradingRuleProps) {
  const config = ruleConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn('flex gap-4 p-4 rounded-lg', config.bg)}>
      <Icon className={cn('h-6 w-6 flex-shrink-0 mt-0.5', config.color)} />
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <div className="text-muted-foreground text-sm">{children}</div>
      </div>
    </div>
  );
}

interface ChecklistProps {
  items: { text: string; critical?: boolean }[];
  title?: string;
}

export function PatternChecklist({ items, title = 'Pattern Validation Checklist' }: ChecklistProps) {
  return (
    <Card className="my-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className={cn(
                'h-4 w-4 mt-0.5 flex-shrink-0',
                item.critical ? 'text-red-500' : 'text-green-500'
              )} />
              <span className={cn(
                'text-sm',
                item.critical && 'font-medium'
              )}>
                {item.text}
                {item.critical && <Badge variant="destructive" className="ml-2 text-sm">Critical</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface MistakesListProps {
  mistakes: string[];
  title?: string;
}

export function CommonMistakes({ mistakes, title = 'Common Mistakes to Avoid' }: MistakesListProps) {
  return (
    <Alert className="my-6 border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <AlertTitle className="text-destructive">{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-3 space-y-2">
          {mistakes.map((mistake, i) => (
            <li key={i} className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <span className="text-sm">{mistake}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

interface ProTipProps {
  children: ReactNode;
}

export function ProTip({ children }: ProTipProps) {
  return (
    <Alert className="my-6 border-primary/50 bg-primary/5">
      <Lightbulb className="h-5 w-5 text-primary" />
      <AlertTitle>Pro Tip</AlertTitle>
      <AlertDescription className="mt-2">{children}</AlertDescription>
    </Alert>
  );
}

interface RiskManagementBoxProps {
  positionSize: string;
  stopLoss: string;
  riskReward: string;
  maxRisk: string;
}

export function RiskManagementBox({ positionSize, stopLoss, riskReward, maxRisk }: RiskManagementBoxProps) {
  return (
    <Card className="my-6 border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Risk Management Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Position Size</p>
            <p className="font-semibold">{positionSize}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Stop Loss</p>
            <p className="font-semibold">{stopLoss}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk:Reward</p>
            <p className="font-semibold">{riskReward}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Risk Per Trade</p>
            <p className="font-semibold">{maxRisk}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatBoxProps {
  stats: { label: string; value: string; description?: string }[];
  title?: string;
}

export function StatisticsBox({ stats, title = 'Pattern Statistics' }: StatBoxProps) {
  return (
    <Card className="my-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm font-medium">{stat.label}</p>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ArticleSectionProps {
  title: string;
  id?: string;
  children: ReactNode;
}

export function ArticleSection({ title, id, children }: ArticleSectionProps) {
  return (
    <section id={id} className="my-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface TableOfContentsProps {
  sections: { id: string; title: string; level?: 'novice' | 'intermediate' | 'advanced' | 'professional' }[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  return (
    <Card className="my-6 bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">In This Article</CardTitle>
      </CardHeader>
      <CardContent>
        <nav>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a 
                  href={`#${section.id}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {section.title}
                  {section.level && (
                    <Badge variant="outline" className="text-sm ml-auto">
                      {section.level}
                    </Badge>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
}
