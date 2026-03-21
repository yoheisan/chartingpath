import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { CopilotStatusIndicator } from "@/components/nav/CopilotStatusIndicator";
import { Link, useLocation } from "react-router-dom";
import { 
  TrendingUp, 
  BookOpen, 
  ChevronDown, 
  MoreHorizontal, 
  DollarSign, 
  FolderKanban, 
  User, 
  Menu,
  Search,
  FlaskConical,
  Database,
  Calculator,
  BarChart3,
  Calendar,
  GraduationCap,
  Globe,
  HelpCircle,
  Info,
  Activity,
  FileCode,
  Bell,
  Star,
  Bot,
  Trophy
} from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTranslation } from "react-i18next";
import { wedgeConfig } from "@/config/wedge";
import { usePrefetchArticles } from "@/hooks/usePrefetchArticles";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadAlerts } from "@/hooks/useUnreadAlerts";
import { WithNotificationBadge } from "@/components/ui/notification-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { prefetchArticles } = usePrefetchArticles();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get user for notification badges
  const { user } = useAuth();
  const { count: alertCount, watchlistCount } = useUnreadAlerts(user?.id);
  
  // Check if on dashboard route - use full width layout
  const isDashboard = location.pathname === '/members/dashboard';
  
  // Compact header for dashboard on mobile
  const dashboardMobileCompact = isDashboard;
  
  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const navLinkClass = (path: string) => 
    `flex items-center gap-1 text-[13px] whitespace-nowrap transition-colors ${
      isActive(path) 
        ? 'text-foreground font-medium' 
        : 'text-muted-foreground hover:text-foreground'
    }`;

  // Close mobile menu helper
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Mobile nav content - journey-aligned structure (Discover → Research → Execute → Automate)
  const MobileNavContent = () => (
    <div className="flex flex-col gap-4 pt-6">
      {/* 0. Dashboard - Command Center */}
      <Link to="/members/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2 text-foreground font-medium py-2">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        {t('navigation.dashboard', 'Dashboard')}
      </Link>
      
      {/* 1. Screener - Discover signals */}
      <Link to="/patterns/live" onClick={closeMobileMenu} className="flex items-center gap-2 text-foreground font-medium py-2 border-t pt-4 mt-2">
        <Activity className="h-5 w-5 text-amber-500" />
        {t('navigation.screener', 'Screener')}
      </Link>
      
      {/* 1b. Agent Scoring - Score signals */}
      <Link to="/tools/agent-scoring" onClick={closeMobileMenu} className="flex items-center gap-2 text-muted-foreground py-2">
        <Bot className="h-5 w-5 text-amber-500" />
        {t('navigation.agentScoring', 'Agent Scoring')}
      </Link>
      
      {/* 2. Pattern Lab */}
      <Link to="/projects/pattern-lab/new" onClick={closeMobileMenu} className="flex items-center gap-2 text-muted-foreground py-2 border-t pt-4 mt-2">
        <FlaskConical className="h-5 w-5 text-violet-500" />
        {t('navigation.patternLab', 'Pattern Lab')}
      </Link>
      
      {/* 3. Alerts - Execute */}
      <Link to="/members/alerts" onClick={closeMobileMenu} className="flex items-center gap-2 text-muted-foreground py-2 border-t pt-4 mt-2">
        <WithNotificationBadge count={alertCount} size="sm">
          <Bell className="h-5 w-5 text-emerald-500" />
        </WithNotificationBadge>
        {t('navigation.alerts', 'Alerts')}
      </Link>
      
      {/* 4. Scripts - Automate */}
      <Link to="/members/scripts" onClick={closeMobileMenu} className="flex items-center gap-2 text-muted-foreground py-2 border-t pt-4 mt-2">
        <FileCode className="h-5 w-5 text-cyan-500" />
        {t('navigation.scripts', 'Scripts')}
      </Link>
      
      {/* 5. Learning */}
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">{t('navigation.learning', 'Learning')}</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/edge-atlas" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.edgeAtlas', 'Edge Atlas')}</Link>
          <Link to="/chart-patterns/library" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.patternLibrary', 'Pattern Library')}</Link>
          <Link to="/learn" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.blogArticles', 'Blog & Articles')}</Link>
          <Link to="/chart-patterns/quiz" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.patternQuiz', 'Pattern Quizzes')}</Link>
        </div>
      </div>
      
      {/* 4. Pricing */}
      <Link to="/projects/pricing" onClick={closeMobileMenu} className="flex items-center gap-2 text-muted-foreground py-2">
        <DollarSign className="h-5 w-5" />
        {t('navigation.pricing', 'Pricing')}
      </Link>
      
      {/* Account section */}
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">{t('navigation.account', 'Account')}</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/members/account" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.settings', 'Settings')}</Link>
        </div>
      </div>
      
      {/* Language & Theme - always visible */}
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">{t('navigation.preferences', 'Preferences')}</p>
        <div className="flex items-center justify-between pl-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">{t('navigation.tools', 'Tools')}</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/tools/pip-calculator" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.pipCalculator', 'Pip Calculator')}</Link>
          <Link to="/tools/risk-calculator" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.riskCalculator', 'Risk Calculator')}</Link>
          <Link to="/tools/economic-calendar" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.economicCalendar', 'Economic Calendar')}</Link>
          <Link to="/chart-patterns/quiz" onClick={closeMobileMenu} className="text-sm text-muted-foreground py-1">{t('navigation.patternQuiz', 'Pattern Quizzes')}</Link>
        </div>
      </div>
    </div>
  );
  
  // Wedge mode: outcome-centric navigation
  if (wedgeConfig.wedgeEnabled) {
    return (
      <header className={`sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b ${dashboardMobileCompact ? 'pt-safe' : ''}`}>
        <div className={`mx-auto px-3 sm:px-6 ${dashboardMobileCompact ? 'py-1.5' : 'py-3 sm:py-4'} w-full`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`${dashboardMobileCompact ? 'p-1.5' : 'p-1.5 sm:p-2'} rounded-lg bg-gradient-to-r from-primary to-accent`}>
                <img 
                  src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                  alt="ChartingPath Logo" 
                  className={`${dashboardMobileCompact ? 'h-5 w-5' : 'h-5 w-5 sm:h-6 sm:w-6'} object-contain brightness-0 invert`}
                />
              </div>
              <Link to="/" className={`${dashboardMobileCompact ? 'text-base' : 'text-lg sm:text-xl'} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
                ChartingPath
              </Link>
              <span className="ml-1.5 px-1.5 py-0.5 text-sm font-semibold uppercase tracking-wider rounded bg-primary/15 text-primary border border-primary/20 leading-none">
                Beta
              </span>
            </div>
            
            
            
            <nav className="hidden md:flex items-center gap-4 ml-4">
            {/* 0. Dashboard - Command Center */}
            <Link to="/members/dashboard" className={navLinkClass('/members/dashboard')}>
              <BarChart3 className="h-4 w-4 text-blue-500" />
              {t('navigation.dashboard', 'Dashboard')}
            </Link>
            
            {/* 1. Screener - Discover signals */}
            <Link to="/patterns/live" className={navLinkClass('/patterns/live')}>
              <Activity className="h-4 w-4 text-amber-500" />
              {t('navigation.screener', 'Screener')}
            </Link>
            
            {/* 1b. Agent Scoring - Score signals */}
            <Link to="/tools/agent-scoring" className={navLinkClass('/tools/agent-scoring')}>
              <Bot className="h-4 w-4 text-amber-500" />
              {t('navigation.agentScoring', 'Agent Scoring')}
            </Link>
            
            {/* 2. Pattern Lab - Backtest historically */}
            <Link to="/projects/pattern-lab/new" className={navLinkClass('/projects/pattern-lab')}>
              <FlaskConical className="h-4 w-4 text-violet-500" />
              {t('navigation.patternLab', 'Pattern Lab')}
            </Link>
            
            {/* 3. Alerts - Get notified */}
            <Link to="/members/alerts" className={navLinkClass('/members/alerts')}>
              <WithNotificationBadge count={alertCount} size="sm">
                <Bell className="h-4 w-4 text-emerald-500" />
              </WithNotificationBadge>
              {t('navigation.alerts', 'Alerts')}
            </Link>
            
            {/* 4. Scripts - Automate trading */}
            <Link to="/members/scripts" className={navLinkClass('/members/scripts')}>
              <FileCode className="h-4 w-4 text-cyan-500" />
              {t('navigation.scripts', 'Scripts')}
            </Link>
            
            {/* 5. Learning - Pattern Library, Blog & Articles */}
            <DropdownMenu>
              <DropdownMenuTrigger 
                className={`flex items-center gap-1 text-[13px] whitespace-nowrap ${isActive('/learn') || isActive('/chart-patterns') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                onMouseEnter={prefetchArticles}
              >
                <div className="p-1 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                {t('navigation.learning', 'Learning')}
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover z-50">
                <DropdownMenuItem asChild>
                  <Link to="/edge-atlas" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    {t('navigation.edgeAtlas', 'Edge Atlas')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/library" className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    {t('navigation.patternLibrary', 'Pattern Library')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/learn" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    {t('navigation.blogArticles', 'Blog & Articles')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/quiz" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    {t('navigation.patternQuiz', 'Pattern Quizzes')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 6. Pricing */}
            <Link to="/projects/pricing" className={navLinkClass('/projects/pricing')}>
              <DollarSign className="h-4 w-4" />
              {t('navigation.pricing', 'Pricing')}
            </Link>
              
              {/* 6. More - Tools & Company */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-[13px] whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                  {t('navigation.more', 'More')}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
                  {/* Tools Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{t('navigation.tools', 'Tools')}</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/pip-calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        {t('navigation.pipCalculator', 'Pip Calculator')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/risk-calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        {t('navigation.riskCalculator', 'Risk Calculator')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/economic-calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('navigation.economicCalendar', 'Economic Calendar')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/market-breadth" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {t('navigation.marketBreadth', 'Market Breadth')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />

                  {/* Company Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{t('navigation.company', 'Company')}</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/faq" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        {t('navigation.faq', 'FAQ')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {t('navigation.about', 'About')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Copilot nav link */}
              <Link to="/copilot" className={`flex items-center gap-1 text-[13px] whitespace-nowrap transition-colors ${isActive('/copilot') ? 'text-blue-400 font-medium' : 'text-blue-400/70 hover:text-blue-400 hover:underline hover:underline-offset-4 hover:decoration-blue-400/50'}`}>
                <Bot className="h-4 w-4" />
                Copilot ✦
              </Link>
              
              <CopilotStatusIndicator />
              <AuthButton />
            </nav>

            {/* Mobile menu */}
            <div className="md:hidden flex items-center gap-2">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={dashboardMobileCompact ? 'h-8 w-8' : ''}>
                    <Menu className={dashboardMobileCompact ? 'h-4 w-4' : 'h-5 w-5'} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 flex flex-col p-0">
                  <ScrollArea className="flex-1 px-6">
                    <MobileNavContent />
                    <div className="mt-6 pb-6">
                      <AuthButton />
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    );
  }
  
  // Original full navigation (when wedge mode is disabled)
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className={`mx-auto px-4 md:px-6 lg:px-8 py-4 ${isDashboard ? 'w-full' : 'container'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent">
              <img 
                src="/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png" 
                alt="ChartingPath Logo" 
                className="h-6 w-6 object-contain brightness-0 invert"
              />
            </div>
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ChartingPath
            </Link>
            <span className="ml-1.5 px-1.5 py-0.5 text-sm font-semibold uppercase tracking-wider rounded bg-primary/15 text-primary border border-primary/20 leading-none">
              Beta
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 ml-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                Tools
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/projects" className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4" />
                    Projects
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/projects/pattern-lab/new">Pattern Lab</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools/pip-calculator">Pip Calculator</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools/risk-calculator">Risk Calculator</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools/market-breadth">Market Breadth Report</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools/economic-calendar">Economic Calendar</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <div className="p-1 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                Learning
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/learn">Learning Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/generator">Pattern Generator</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/library">Pattern Library</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/strategies">Trading Strategies</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/quiz">Pattern Quiz</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t('navigation.pricing', 'Pricing')}
            </Link>
            <AuthButton />
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
