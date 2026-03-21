import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Search, Sparkles, Target, BarChart3, Code, BookOpen, 
  ArrowRight, Bell, LayoutDashboard, Zap, MessageSquare, Keyboard
} from 'lucide-react';

/**
 * CommandCenterDemo — Interactive visual representation of the Command Center
 * for the command-center-guide blog article. Shows the actual UI layout so
 * readers can recognise it instantly.
 */
const CommandCenterDemo = memo(function CommandCenterDemo() {
  const { t } = useTranslation();

  const quickActions = [
    { icon: Target, label: t('commandCenterDemo.findPatterns', 'Find A-quality patterns forming now'), color: 'text-emerald-500' },
    { icon: BarChart3, label: t('commandCenterDemo.marketPulse', "What's moving in the markets?"), color: 'text-blue-500' },
    { icon: Code, label: t('commandCenterDemo.generateScript', 'Generate a Pine Script strategy'), color: 'text-violet-500' },
    { icon: BookOpen, label: t('commandCenterDemo.learnPattern', 'Teach me a chart pattern'), color: 'text-amber-500' },
  ];

  const navShortcuts = [
    { key: 'G D', icon: LayoutDashboard, label: 'Dashboard', dest: t('commandCenterDemo.dashboardDesc', 'Command center with live charts') },
    { key: 'G S', icon: Target, label: t('commandCenterDemo.screener', 'Pattern Screener'), dest: t('commandCenterDemo.screenerDesc', 'Live pattern detection') },
    { key: 'G L', icon: BarChart3, label: t('commandCenterDemo.patternLab', 'Pattern Lab'), dest: t('commandCenterDemo.labDesc', 'Research & backtest') },
    { key: 'G A', icon: Bell, label: t('commandCenterDemo.alerts', 'My Alerts'), dest: t('commandCenterDemo.alertsDesc', 'Alert management') },
    { key: 'G C', icon: Code, label: t('commandCenterDemo.scripts', 'My Scripts'), dest: t('commandCenterDemo.scriptsDesc', 'Pine Script library') },
    { key: 'G E', icon: BookOpen, label: t('commandCenterDemo.learning', 'Learning Center'), dest: t('commandCenterDemo.learningDesc', 'Education & tutorials') },
  ];

  return (
    <div className="my-8 space-y-6">
      {/* Command Center Modal Mockup */}
      <Card className="border-primary/30 bg-gradient-to-b from-background to-muted/20 overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm flex-1">
              {t('commandCenterDemo.searchPlaceholder', 'Search commands, instruments, or ask AI...')}
            </span>
            <Badge variant="outline" className="text-xs font-mono px-2 py-0.5 bg-muted">
              ⌘K
            </Badge>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              {t('commandCenterDemo.quickActions', 'Quick Actions')}
            </p>
            <div className="space-y-1">
              {quickActions.map((action, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'} transition-colors cursor-default`}
                >
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                  <span className="text-sm text-foreground">{action.label}</span>
                  {i === 0 && <ArrowRight className="h-3 w-3 text-primary ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div className="p-4 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Keyboard className="h-3 w-3" />
              {t('commandCenterDemo.navigate', 'Navigate')}
            </p>
            <div className="space-y-1">
              {navShortcuts.map((nav, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-md cursor-default">
                  <nav.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1">{nav.label}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{nav.dest}</span>
                  <Badge variant="outline" className="text-sm font-mono px-1.5 py-0 bg-muted ml-2">
                    {nav.key}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat hint */}
          <div className="px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{t('commandCenterDemo.chatHint', 'Type any question to start an AI conversation...')}</span>
            <Sparkles className="h-3 w-3 text-primary ml-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Mobile FAB indicator */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <span>{t('commandCenterDemo.mobileHint', 'On mobile, tap the sparkle button (FAB) in the bottom-right corner')}</span>
      </div>
    </div>
  );
});

export default CommandCenterDemo;
