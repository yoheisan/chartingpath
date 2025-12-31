import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { TrendingUp, Bell, Code, BookOpen, ChevronDown, MoreHorizontal, DollarSign, FolderKanban, User, Menu } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { useTranslation } from "react-i18next";
import { wedgeConfig } from "@/config/wedge";
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
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const navLinkClass = (path: string) => 
    `flex items-center gap-1.5 transition-colors ${
      isActive(path) 
        ? 'text-foreground font-medium' 
        : 'text-muted-foreground hover:text-foreground'
    }`;

  // Mobile nav content (shared between wedge and non-wedge)
  const MobileNavContent = () => (
    <div className="flex flex-col gap-4 pt-6">
      <Link to="/projects" className="flex items-center gap-2 text-foreground font-medium py-2">
        <FolderKanban className="h-5 w-5" />
        Projects
      </Link>
      <Link to="/strategy-workspace" className="flex items-center gap-2 text-muted-foreground py-2">
        <TrendingUp className="h-5 w-5" />
        Playbooks
      </Link>
      <Link to="/members/alerts" className="flex items-center gap-2 text-muted-foreground py-2">
        <Bell className="h-5 w-5" />
        Alerts
      </Link>
      <Link to="/members/scripts" className="flex items-center gap-2 text-muted-foreground py-2">
        <Code className="h-5 w-5" />
        Scripts
      </Link>
      <Link to="/learn" className="flex items-center gap-2 text-muted-foreground py-2">
        <BookOpen className="h-5 w-5" />
        Learn
      </Link>
      <Link to="/projects/pricing" className="flex items-center gap-2 text-muted-foreground py-2">
        <DollarSign className="h-5 w-5" />
        Pricing
      </Link>
      <Link to="/members/dashboard" className="flex items-center gap-2 text-muted-foreground py-2">
        <User className="h-5 w-5" />
        Account
      </Link>
      
      <div className="border-t pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Tools</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/forge" className="text-sm text-muted-foreground py-1">MultiScript Converter</Link>
          <Link to="/tools/pip-calculator" className="text-sm text-muted-foreground py-1">Pip Calculator</Link>
          <Link to="/tools/risk-calculator" className="text-sm text-muted-foreground py-1">Risk Calculator</Link>
          <Link to="/tools/market-breadth" className="text-sm text-muted-foreground py-1">Market Breadth Report</Link>
          <Link to="/tools/economic-calendar" className="text-sm text-muted-foreground py-1">Economic Calendar</Link>
          <Link to="/members/trading" className="text-sm text-muted-foreground py-1">Paper Trading</Link>
          <Link to="/chart-patterns/quiz" className="text-sm text-muted-foreground py-1">Quizzes</Link>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Markets</p>
        <div className="flex flex-col gap-2 pl-2">
          <Link to="/markets/stocks" className="text-sm text-muted-foreground py-1">Stock Market</Link>
          <Link to="/markets/forex" className="text-sm text-muted-foreground py-1">Forex (FX)</Link>
          <Link to="/markets/crypto" className="text-sm text-muted-foreground py-1">Cryptocurrency</Link>
          <Link to="/markets/commodities" className="text-sm text-muted-foreground py-1">Commodities</Link>
        </div>
      </div>
    </div>
  );
  
  // Wedge mode: simplified crypto-focused navigation
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
              {/* Primary: Projects */}
              <Link to="/projects" className={navLinkClass('/projects')}>
                <FolderKanban className="h-4 w-4" />
                Projects
              </Link>

              {/* Playbooks */}
              <Link to="/strategy-workspace" className={navLinkClass('/strategy-workspace')}>
                <TrendingUp className="h-4 w-4" />
                Playbooks
              </Link>
              
              {/* Alerts */}
              <Link to="/members/alerts" className={navLinkClass('/members/alerts')}>
                <Bell className="h-4 w-4" />
                Alerts
              </Link>
              
              {/* Scripts */}
              <Link to="/members/scripts" className={navLinkClass('/members/scripts')}>
                <Code className="h-4 w-4" />
                Scripts
              </Link>
              
              {/* Learn */}
              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 ${isActive('/learn') || isActive('/chart-patterns') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}>
                  <BookOpen className="h-4 w-4" />
                  Learn
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/chart-patterns/library">Pattern Library</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/learn">Blog & Articles</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Pricing */}
              <Link to="/projects/pricing" className={navLinkClass('/projects/pricing')}>
                <DollarSign className="h-4 w-4" />
                {t('navigation.pricing', 'Pricing')}
              </Link>
              
              {/* More - Sectioned dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                  {/* Tools Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Tools</DropdownMenuLabel>
                  <DropdownMenuGroup>
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
                    <DropdownMenuItem asChild>
                      <Link to="/members/trading">Paper Trading</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/chart-patterns/quiz">Quizzes</Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Markets Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Markets</DropdownMenuLabel>
                  <DropdownMenuGroup>
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
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Company Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Company</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/faq">FAQ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/about">About</Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Account dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <User className="h-4 w-4" />
                  Account
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/members/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/vault">Results Vault</Link>
                  </DropdownMenuItem>
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
