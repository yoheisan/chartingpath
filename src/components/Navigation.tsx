import { Button } from "@/components/ui/button";
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
  Wrench,
  Calculator,
  BarChart3,
  Calendar,
  GraduationCap,
  Globe,
  HelpCircle,
  Info,
  Activity
} from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { useTranslation } from "react-i18next";
import { wedgeConfig } from "@/config/wedge";
import { usePrefetchArticles } from "@/hooks/usePrefetchArticles";
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

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { prefetchArticles } = usePrefetchArticles();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const navLinkClass = (path: string) => 
    `flex items-center gap-1.5 transition-colors ${
      isActive(path) 
        ? 'text-foreground font-medium' 
        : 'text-muted-foreground hover:text-foreground'
    }`;

  // Mobile nav content - discovery-first structure (lite → heavy users)
  const MobileNavContent = () => (
    <div className="flex flex-col gap-4 pt-6">
      {/* 1. Screener - Instant value */}
      <Link to="/patterns/live" className="flex items-center gap-2 text-foreground font-medium py-2">
        <Activity className="h-5 w-5 text-amber-500" />
        Screener
      </Link>
      
      {/* 2. Learn - Education for discovery */}
      <Link 
        to="/learn" 
        className="flex items-center gap-2 text-muted-foreground py-2"
        onMouseEnter={prefetchArticles}
      >
        <BookOpen className="h-5 w-5" />
        Learn
      </Link>
      
      {/* 3. Projects - For engaged users */}
      <Link to="/projects" className="flex items-center gap-2 text-muted-foreground py-2">
        <FolderKanban className="h-5 w-5" />
        Projects
      </Link>
      
      {/* 4. Pricing */}
      <Link to="/projects/pricing" className="flex items-center gap-2 text-muted-foreground py-2">
        <DollarSign className="h-5 w-5" />
        Pricing
      </Link>
      
      {/* Account section with My Results nested */}
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Account</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/members/dashboard" className="text-sm text-muted-foreground py-1">Dashboard</Link>
          <Link to="/vault" className="text-sm text-muted-foreground py-1">My Results</Link>
          <Link to="/members/courses" className="text-sm text-muted-foreground py-1">Courses</Link>
          <Link to="/members/downloads" className="text-sm text-muted-foreground py-1">Downloads</Link>
          <Link to="/members/account" className="text-sm text-muted-foreground py-1">Settings</Link>
        </div>
      </div>
      
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Advanced</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/strategy-workspace" className="text-sm text-muted-foreground py-1">Playbook Builder</Link>
          <Link to="/forge" className="text-sm text-muted-foreground py-1">MultiScript Converter</Link>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Tools</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/tools/pip-calculator" className="text-sm text-muted-foreground py-1">Pip Calculator</Link>
          <Link to="/tools/risk-calculator" className="text-sm text-muted-foreground py-1">Risk Calculator</Link>
          <Link to="/tools/economic-calendar" className="text-sm text-muted-foreground py-1">Economic Calendar</Link>
          <Link to="/chart-patterns/quiz" className="text-sm text-muted-foreground py-1">Pattern Quizzes</Link>
        </div>
      </div>
    </div>
  );
  
  // Wedge mode: outcome-centric navigation
  if (wedgeConfig.wedgeEnabled) {
    return (
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
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
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              {/* 1. Screener - Instant value for lite users */}
              <Link to="/patterns/live" className={navLinkClass('/patterns/live')}>
                <Activity className="h-4 w-4 text-amber-500" />
                Screener
              </Link>
              
              {/* 2. Learn - Education for discovery users */}
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className={`flex items-center gap-1 ${isActive('/learn') || isActive('/chart-patterns') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                  onMouseEnter={prefetchArticles}
                >
                  <BookOpen className="h-4 w-4" />
                  Learn
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/chart-patterns/library">Pattern Library</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/chart-patterns/quiz">Pattern Quizzes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/learn">Blog & Articles</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* 3. Projects - For engaged/heavy users */}
              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 ${isActive('/projects') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>
                  <FolderKanban className="h-4 w-4" />
                  Projects
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover z-50">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Run Analysis</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/projects/setup-finder/new" className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-emerald-500" />
                        Weekly Setup Finder
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/projects/pattern-lab/new" className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-violet-500" />
                        Pattern Lab
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/projects" className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      All Projects
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Advanced</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/strategy-workspace" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Playbook Builder
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* 4. Pricing */}
              <Link to="/projects/pricing" className={navLinkClass('/projects/pricing')}>
                <DollarSign className="h-4 w-4" />
                {t('navigation.pricing', 'Pricing')}
              </Link>
              
              {/* 6. More - Tools & Company */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
                  {/* Tools Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Tools</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/forge" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        MultiScript Converter
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/pip-calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Pip Calculator
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/risk-calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Risk Calculator
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/tools/economic-calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Economic Calendar
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Company Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Company</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/faq" className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        FAQ
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        About
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Account dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 ${isActive('/members') || isActive('/vault') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>
                  <User className="h-4 w-4" />
                  Account
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/members/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/vault" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      My Results
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/members/courses">Courses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/members/downloads">Downloads</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/members/account">Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <AuthButton />
            </nav>

            {/* Mobile menu */}
            <div className="md:hidden flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <MobileNavContent />
                  <div className="mt-6">
                    <AuthButton />
                  </div>
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
      <div className="container mx-auto px-6 py-4 max-w-6xl">
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
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
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
                  <Link to="/strategy-workspace">Strategy Workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/forge">MultiScript Converter</Link>
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
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
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
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                Markets
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background z-50">
                <DropdownMenuItem asChild>
                  <Link to="/markets/stocks">Stock Market</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/markets/forex">Forex (FX)</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/markets/crypto">Cryptocurrency</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/markets/commodities">Commodities</Link>
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
