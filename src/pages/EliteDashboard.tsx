import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, Zap, Users, Layers, ArrowRight, CheckCircle, Infinity,
  BarChart3, Code, BookOpen, Bell, Download, Activity, Settings
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBacktesterV2Usage } from "@/hooks/useBacktesterV2Usage";
import { useTranslation } from "react-i18next";

const EliteDashboard = () => {
  const { profile, getTierDisplayName } = useUserProfile();
  const { currentUsage, hasUnlimited } = useBacktesterV2Usage();
  const { t } = useTranslation();

  const eliteFeatures = [
    {
      icon: Zap,
      title: "Backtester V2 Engine",
      description: "Advanced backtesting with tick-level data",
      status: "Unlimited",
      action: "Run Backtest",
      link: "/backtest",
      color: "text-yellow-500"
    },
    {
      icon: Users,
      title: "Pair Trading Strategies",
      description: "Advanced pair trading and statistical arbitrage",
      status: "Full Access",
      action: "Explore Pairs",
      link: "/backtest",
      color: "text-blue-500"
    },
    {
      icon: Layers,
      title: "Portfolio Backtesting",
      description: "Test complex multi-asset strategies",
      status: "Advanced",
      action: "Build Portfolio",
      link: "/backtest",
      color: "text-purple-500"
    },
    {
      icon: Activity,
      title: "Tick-Level Analysis",
      description: "Microsecond precision market data",
      status: "Premium",
      action: "Analyze",
      link: "/backtest",
      color: "text-green-500"
    },
    {
      icon: Code,
      title: "Script Library",
      description: "Premium trading scripts and algorithms",
      status: "Unlimited Downloads",
      action: "Browse Scripts",
      link: "/members/scripts",
      color: "text-orange-500"
    },
    {
      icon: Bell,
      title: "Advanced Alerts",
      description: "Unlimited pattern detection alerts",
      status: "Unlimited",
      action: "Manage Alerts",
      link: "/members/alerts",
      color: "text-red-500"
    }
  ];

  const usageStats = [
    {
      label: "V2 Backtests Today",
      value: hasUnlimited ? "Unlimited" : `${currentUsage}`,
      max: hasUnlimited ? "∞" : "Unlimited",
      percentage: 0,
      color: "bg-gradient-to-r from-yellow-500 to-orange-500"
    },
    {
      label: "Script Downloads",
      value: "Unlimited",
      max: "∞",
      percentage: 0,
      color: "bg-gradient-to-r from-blue-500 to-purple-500"
    },
    {
      label: "Pattern Alerts",
      value: "Unlimited",
      max: "∞",
      percentage: 0,
      color: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      label: "Course Access",
      value: "Full Access",
      max: "All Courses",
      percentage: 100,
      color: "bg-gradient-to-r from-purple-500 to-pink-500"
    }
  ];

  const quickActions = [
    {
      title: "Run V2 Backtest",
      description: "Test with advanced engine",
      icon: Zap,
      link: "/backtest",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      title: "Download Scripts",
      description: "Premium algorithm library",
      icon: Download,
      link: "/members/scripts",
      gradient: "from-blue-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('eliteDashboard.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('eliteDashboard.welcomeBack')} {profile?.email} • {getTierDisplayName} Member
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 text-lg">
            <Crown className="h-4 w-4 mr-2" />
            {t('eliteDashboard.eliteAccess')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {usageStats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Infinity className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{t('eliteDashboard.limit')}</span>
                    <span>{stat.max}</span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
                <div className={`absolute inset-0 opacity-5 ${stat.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('eliteDashboard.quickActions')}
            </CardTitle>
            <CardDescription>{t('eliteDashboard.quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.link}>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary/20">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {eliteFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {feature.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to={feature.link}>
                  <Button className="w-full group-hover:bg-primary/90 transition-colors">
                    {feature.action}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Crown className="h-6 w-6" />
              {t('eliteDashboard.yourEliteBenefits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">{t('eliteDashboard.advancedAnalytics')}</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Tick-level backtesting precision</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Advanced risk metrics</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Portfolio optimization tools</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">{t('eliteDashboard.unlimitedAccess')}</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Infinity className="h-4 w-4 text-purple-500" />Unlimited V2 backtests</li>
                  <li className="flex items-center gap-2"><Infinity className="h-4 w-4 text-purple-500" />Unlimited script downloads</li>
                  <li className="flex items-center gap-2"><Infinity className="h-4 w-4 text-purple-500" />Unlimited pattern alerts</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-purple-700">{t('eliteDashboard.premiumSupport')}</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Priority customer support</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Exclusive trading insights</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Beta feature access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EliteDashboard;
