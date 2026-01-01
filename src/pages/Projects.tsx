import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FlaskConical, 
  PieChart, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  Zap,
  Clock,
  Target,
  BarChart3,
  Coins,
  AlertCircle
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface ProjectTemplate {
  id: string;
  type: 'setup_finder' | 'pattern_lab' | 'portfolio_checkup' | 'portfolio_sim';
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  estimatedCredits: string;
  estimatedTime: string;
  features: string[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

const projectTemplates: ProjectTemplate[] = [
  {
    id: 'setup_finder',
    type: 'setup_finder',
    name: 'Weekly Setup Finder',
    description: 'Scan markets for high-probability pattern setups with automated trade plans',
    icon: Search,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    estimatedCredits: '5-15',
    estimatedTime: '30-60s',
    features: ['Pattern scanning', 'Trade plans with SL/TP', 'Alert creation'],
    badge: 'Popular',
    badgeVariant: 'default'
  },
  {
    id: 'pattern_lab',
    type: 'pattern_lab',
    name: 'Pattern Lab',
    description: 'Deep backtest any pattern across markets with regime analysis and edge validation',
    icon: FlaskConical,
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    estimatedCredits: '10-30',
    estimatedTime: '1-3 min',
    features: ['Multi-year backtest', 'Regime breakdown', 'Do-not-trade rules'],
    badge: 'Pro',
    badgeVariant: 'secondary'
  },
  {
    id: 'portfolio_checkup',
    type: 'portfolio_checkup',
    name: 'Portfolio Checkup',
    description: 'Analyze your holdings through a pattern lens with risk concentration insights',
    icon: PieChart,
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    estimatedCredits: '3-10',
    estimatedTime: '20-40s',
    features: ['Pattern state per holding', 'Risk analysis', 'Alert suggestions'],
  },
  {
    id: 'portfolio_sim',
    type: 'portfolio_sim',
    name: 'Portfolio Simulator',
    description: 'What-if scenarios for DCA, rebalancing, and allocation strategies',
    icon: TrendingUp,
    color: 'text-sky-500',
    gradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
    estimatedCredits: '8-20',
    estimatedTime: '1-2 min',
    features: ['DCA simulation', 'Rebalance testing', 'Equity curves'],
  }
];

const ProjectCard = ({ 
  template, 
  onStart,
  disabled 
}: { 
  template: ProjectTemplate; 
  onStart: () => void;
  disabled?: boolean;
}) => {
  const Icon = template.icon;
  
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      {/* Gradient Background */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Badge */}
      {template.badge && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant={template.badgeVariant} className="text-xs font-medium">
            {template.badge}
          </Badge>
        </div>
      )}
      
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-background/80 border border-border/50 ${template.color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1 text-sm line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0 space-y-4">
        {/* Features */}
        <div className="flex flex-wrap gap-1.5">
          {template.features.map((feature, idx) => (
            <span 
              key={idx}
              className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>{template.estimatedCredits} credits</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{template.estimatedTime}</span>
          </div>
        </div>
        
        {/* Action Button */}
        {
          <Button
            onClick={onStart}
            onPointerDown={() => console.log(`[Projects] pointerdown Start Project: ${template.id}`)}
            disabled={disabled}
            data-project-start={template.id}
            className="relative z-20 w-full group/btn overflow-hidden pointer-events-auto"
            variant="outline"
          >
            <span className="pointer-events-none relative z-10 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Start Project
              <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </span>
          </Button>
        }
      </CardContent>
    </Card>
  );
};

const CreditsDisplay = ({ 
  balance, 
  planTier, 
  loading 
}: { 
  balance: number; 
  planTier: string;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-2xl font-bold tabular-nums">{balance}</span>
        <span className="text-sm text-muted-foreground">credits</span>
      </div>
      <Badge variant="outline" className="text-xs capitalize">
        {planTier}
      </Badge>
    </div>
  );
};

const Projects = () => {
  const navigate = useNavigate();
  const { user, loading: profileLoading } = useUserProfile();
  const [creditsBalance, setCreditsBalance] = useState(25);
  const [planTier, setPlanTier] = useState('free');
  const [creditsLoading, setCreditsLoading] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);

  
  // Fetch user credits from usage_credits table + check admin status
  useEffect(() => {
    const fetchCreditsAndAdminStatus = async () => {
      if (!user) {
        setCreditsBalance(25);
        setPlanTier('free');
        setIsAdmin(false);
        setCreditsLoading(false);
        return;
      }
      
      setCreditsLoading(true);
      try {
        // Check admin status first (with error handling)
        let userIsAdmin = false;
        try {
          const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin', { _user_id: user.id });
          if (!adminError) {
            userIsAdmin = adminCheck === true;
          }
        } catch {
          // Admin check failed, treat as non-admin
          console.warn('Admin check failed, treating as non-admin');
        }
        setIsAdmin(userIsAdmin);
        
        // Admins get unlimited credits display
        if (userIsAdmin) {
          setCreditsBalance(999999);
          setPlanTier('admin');
          setCreditsLoading(false);
          return;
        }
        
        // Fetch credits for regular users
        const { data: credits, error } = await supabase
          .from('usage_credits')
          .select('credits_balance, plan_tier')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle to avoid error when no record exists
        
        if (error) {
          console.error('Error fetching credits:', error);
          // Fall back to defaults on error
          setCreditsBalance(25);
          setPlanTier('free');
        } else if (credits) {
          setCreditsBalance(credits.credits_balance ?? 25);
          setPlanTier(credits.plan_tier || 'free');
        } else {
          // No credits record - user gets FREE tier defaults
          setCreditsBalance(25);
          setPlanTier('free');
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err);
        // Always set defaults on any failure
        setCreditsBalance(25);
        setPlanTier('free');
      } finally {
        setCreditsLoading(false);
      }
    };
    
    fetchCreditsAndAdminStatus();
  }, [user]);
  
  const handleStartProject = (templateId: string) => {
    const routes: Record<string, string> = {
      setup_finder: '/projects/setup-finder/new',
      pattern_lab: '/projects/pattern-lab/new',
      portfolio_checkup: '/projects/portfolio-checkup/new',
      portfolio_sim: '/projects/portfolio-sim/new',
    };

    const target = routes[templateId] || '/projects';

    // Keep CTAs clickable; if not signed in, route to auth with a redirect back here.
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(target)}`);
      return;
    }

    navigate(target);
  };
  
  return (
    <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Projects</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Pattern-Powered Analysis
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Run professional-grade analysis on markets, patterns, and portfolios. 
                  Each project generates actionable artifacts with trade plans.
                </p>
              </div>
              
              <CreditsDisplay 
                balance={creditsBalance}
                planTier={planTier}
                loading={profileLoading || creditsLoading}
              />
            </div>
          </div>
        </section>
        
        {/* Projects Grid */}
        <section className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {projectTemplates.map((template) => (
              <ProjectCard
                key={template.id}
                template={template}
                onStart={() => handleStartProject(template.id)}
                disabled={false}
              />
            ))}
          </div>
          
          {/* Not logged in notice */}
          {!user && !profileLoading && (
            <div className="mt-8 max-w-xl mx-auto">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">Sign in required.</span>{' '}
                  <span className="text-muted-foreground">Create a free account to start running projects.</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/auth?redirect=${encodeURIComponent('/projects')}`)}
                  className="ml-auto shrink-0"
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </section>
        
        {/* How It Works */}
        <section className="border-t border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold">How Projects Work</h2>
              <p className="text-muted-foreground mt-1">Three simple steps to actionable insights</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: '1',
                  title: 'Configure',
                  description: 'Choose markets, patterns, and parameters in a simple wizard',
                  icon: Target
                },
                {
                  step: '2',
                  title: 'Run Analysis',
                  description: 'Our engine scans data and generates comprehensive artifacts',
                  icon: BarChart3
                },
                {
                  step: '3',
                  title: 'Take Action',
                  description: 'Review setups, copy trade plans, or create alerts with one click',
                  icon: Zap
                }
              ].map((item, idx) => (
                <div key={idx} className="relative text-center p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
  );
};

export default Projects;
