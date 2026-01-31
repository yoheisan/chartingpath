import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  FlaskConical, 
  Search, 
  TrendingUp, 
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickResearchPanelProps {
  onSymbolSelect: (symbol: string) => void;
}

export function QuickResearchPanel({ onSymbolSelect }: QuickResearchPanelProps) {
  const researchTools = [
    {
      icon: FlaskConical,
      title: 'Pattern Lab',
      description: 'Backtest pattern performance',
      href: '/projects/pattern-lab/new',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      icon: Search,
      title: 'Setup Finder',
      description: 'Scan any ticker for setups',
      href: '/projects/setup-finder/new',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: BarChart3,
      title: 'Portfolio Checkup',
      description: 'Analyze your holdings',
      href: '/projects/portfolio-checkup/new',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Live Screener',
      description: 'Real-time pattern signals',
      href: '/patterns/live',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="h-full flex flex-col border-t border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <FlaskConical className="h-4 w-4" />
          Quick Research
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 overflow-auto">
        <div className="grid grid-cols-2 gap-2">
          {researchTools.map((tool) => (
            <Link key={tool.title} to={tool.href}>
              <Card className="p-3 h-full hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className={`w-8 h-8 rounded-lg ${tool.bgColor} flex items-center justify-center mb-2`}>
                  <tool.icon className={`h-4 w-4 ${tool.color}`} />
                </div>
                <h4 className="text-xs font-medium mb-0.5 group-hover:text-primary transition-colors">
                  {tool.title}
                </h4>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {tool.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-border">
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">Quick Actions</h4>
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" asChild>
              <Link to="/vault">
                <BarChart3 className="h-3.5 w-3.5 mr-2" />
                View Results Vault
                <ArrowRight className="h-3 w-3 ml-auto" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" asChild>
              <Link to="/members/scripts">
                <Search className="h-3.5 w-3.5 mr-2" />
                Browse Scripts
                <ArrowRight className="h-3 w-3 ml-auto" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
