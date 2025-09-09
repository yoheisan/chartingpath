import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, BookOpen, Brain, Calculator, Shield, ChevronDown } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { t } = useTranslation();
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
                  <Link to="/ai-builder" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {t('navigation.aiBuilder', 'AI Builder')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/backtest" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Backtesting
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/forge" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    MultiScript Converter
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools/pip-calculator" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    {t('navigation.pipCalculator', 'Pip Calculator')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tools/risk-calculator" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('navigation.riskCalculator', 'Risk Calculator')}
                  </Link>
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
                  <Link to="/chart-patterns/generator" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('navigation.patternGenerator', 'Pattern Generator')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/library" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t('navigation.patternLibrary', 'Pattern Library')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/strategies" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('navigation.tradingStrategies', 'Trading Strategies')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chart-patterns/quiz" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {t('navigation.patternQuiz', 'Pattern Quiz')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/members/community" className="text-muted-foreground hover:text-foreground transition-colors">
              Community
            </Link>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
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