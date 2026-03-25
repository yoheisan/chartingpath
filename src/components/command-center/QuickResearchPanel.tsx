import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  FlaskConical, 
  Search, 
  TrendingUp, 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface QuickResearchPanelProps {
  onSymbolSelect: (symbol: string) => void;
}

export function QuickResearchPanel({ onSymbolSelect }: QuickResearchPanelProps) {
  const { t } = useTranslation();
  const researchTools = [
    {
      icon: FlaskConical,
      title: t('commandCenter.patternLab'),
      description: t('commandCenter.backtestPerformance'),
      href: '/projects/pattern-lab/new',
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      icon: TrendingUp,
      title: t('commandCenter.liveScreener'),
      description: t('commandCenter.realtimeSignals'),
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
          {t('commandCenter.quickResearch')}
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
                <h4 className="text-sm font-medium mb-0.5 group-hover:text-primary transition-colors">
                  {tool.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-tight">
                  {tool.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-border">
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">{t('commandCenter.quickActions')}</h4>
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-sm" asChild>
              <Link to="/members/scripts">
                <Search className="h-3.5 w-3.5 mr-2" />
                {t('commandCenter.browseScripts')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
