import { useEffect, useState, Suspense, lazy, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Tag, Target, Shield, TrendingUp, AlertTriangle, Users, BarChart3, Lightbulb, CheckCircle, XCircle, LineChart, Activity, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackPageLeave } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageMeta } from "@/components/PageMeta";
import { ArticleJsonLd } from "@/components/JsonLd";
import { getStrategyCharts, hasStrategyCharts } from "@/utils/strategyChartMapping";
import { getStrategyIndicators, hasStrategyIndicators, StrategyIndicatorConfig } from "@/utils/strategyIndicatorMapping";
import { injectPatternLinks } from "@/utils/patternAutoLinker";
import { getOptionsStrategyConfig, hasOptionsPayoffChart } from "@/utils/optionsStrategyMapping";
import { getStrategyPrimer, hasStrategyPrimer } from "@/utils/strategyPrimerMapping";
import { CompressedBar } from "@/types/VisualSpec";

// Lazy load heavy chart components and primers
const DynamicPatternChart = lazy(() => 
  import('@/components/DynamicPatternChart').then(mod => ({ default: mod.DynamicPatternChart }))
);

const StrategyIndicatorChart = lazy(() => 
  import('@/components/charts/StrategyIndicatorChart')
);

const OptionsPayoffChart = lazy(() => 
  import('@/components/charts/OptionsPayoffChart')
);

const OptionsGreeksTable = lazy(() => 
  import('@/components/charts/OptionsGreeksTable')
);

const OptionsStrategyPrimer = lazy(() => 
  import('@/components/blog/OptionsStrategyPrimer')
);

const StrategyPrimer = lazy(() => 
  import('@/components/blog/StrategyPrimer')
);

// Candlestick Pattern Visualizers
const DojiPatternVisualizer = lazy(() => 
  import('@/components/blog/DojiPatternVisualizer')
);
const EngulfingPatternVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/EngulfingPatternVisualizer')
);
const HammerPatternVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/HammerPatternVisualizer')
);
const ShootingStarVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/ShootingStarVisualizer')
);
const HaramiPatternVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/HaramiPatternVisualizer')
);
const MorningEveningStarVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/MorningEveningStarVisualizer')
);
const ThreeSoldiersAndCrowsVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/ThreeSoldiersAndCrowsVisualizer').then(mod => ({ default: mod.ThreeWhiteSoldiersVisualizer }))
);
const ThreeBlackCrowsVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/ThreeSoldiersAndCrowsVisualizer').then(mod => ({ default: mod.ThreeBlackCrowsVisualizer }))
);
const PiercingLineVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/PiercingDarkCloudVisualizer').then(mod => ({ default: mod.PiercingLineVisualizer }))
);
const DarkCloudCoverVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/PiercingDarkCloudVisualizer').then(mod => ({ default: mod.DarkCloudCoverVisualizer }))
);
const TweezerPatternVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/TweezerPatternVisualizer')
);
const SpinningTopVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/SpinningTopVisualizer')
);
const MarubozuVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/MarubozuVisualizer')
);
const KickerPatternVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/KickerPatternVisualizer')
);
const AbandonedBabyVisualizer = lazy(() => 
  import('@/components/blog/candlestick-visualizers/AbandonedBabyVisualizer')
);

// Technical Indicator Visualizers
const IchimokuVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/IchimokuVisualizer'));
const StochasticVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/StochasticVisualizer'));
const ATRVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/ATRVisualizer'));
const ADXVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/ADXVisualizer'));
const OBVVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/OBVVisualizer'));
const MFIVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/MFIVisualizer'));
const WilliamsRVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/WilliamsRVisualizer'));
const CCIVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/CCIVisualizer'));
const ROCVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/ROCVisualizer'));
const ParabolicSARVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/ParabolicSARVisualizer'));
const DonchianVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/DonchianVisualizer'));
const EMAVisualizer = lazy(() => import('@/components/blog/indicator-visualizers/EMAVisualizer'));

// Risk Management Visualizers
const PositionSizingVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/PositionSizingVisualizer'));
const KellyCriterionVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/KellyCriterionVisualizer'));
const StopLossVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/StopLossVisualizer'));
const RiskRewardVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/RiskRewardVisualizer'));
const MartingaleVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/MartingaleVisualizer'));
const DrawdownVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/DrawdownVisualizer'));
const VaRVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/VaRVisualizer'));
const RiskParityVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/RiskParityVisualizer'));
const HedgingVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/HedgingVisualizer'));
const CorrelationVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/CorrelationVisualizer'));
const ScalingVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/ScalingVisualizer'));
const MaxLossVisualizer = lazy(() => import('@/components/blog/risk-management-visualizers/MaxLossVisualizer'));

// Chart Type Demos (live interactive chart examples for chart-types-explained article)
const ChartTypeDemos = lazy(() => import('@/components/blog/ChartTypeDemos'));
const CommandCenterDemo = lazy(() => import('@/components/blog/CommandCenterDemo'));
const TradingStyleCards = lazy(() => import('@/components/blog/TradingStyleCards'));
const TechVsFundamentalComparison = lazy(() => import('@/components/blog/TechVsFundamentalComparison'));

// Algorithmic Trading Visualizers
const SentimentAnalysisVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/SentimentAnalysisVisualizer'));
const MachineLearningVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/MachineLearningVisualizer'));
const PineScriptVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/PineScriptVisualizer'));
const AlgorithmicTradingVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/AlgorithmicTradingVisualizer'));
const StatArbVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/StatArbVisualizer'));
const QuantTradingVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/QuantTradingVisualizer'));
const HFTVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/HFTVisualizer'));
const MarketMakingVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/MarketMakingVisualizer'));
const AIOptimizationVisualizer = lazy(() => import('@/components/blog/algo-trading-visualizers/AIOptimizationVisualizer'));

// Service names that appear in article content and need localization
// Maps English service name → i18n key under "serviceNames" namespace
const SERVICE_NAMES = [
  'Pattern Lab',
  'Command Center', 
  'Pattern Library',
  'Pattern Screener',
  'Pattern Quiz',
  'Script Generator',
  'Trading Education Center',
  'Market Breadth',
];

/** Replace English service names in article content with localized equivalents */
function localizeServiceNames(content: string, t: any, lang: string): string {
  if (lang === 'en') return content;
  let result = content;
  for (const name of SERVICE_NAMES) {
    const localized = t(`serviceNames.${name}`, { defaultValue: name });
    if (localized && localized !== name) {
      result = result.split(name).join(localized);
    }
  }
  return result;
}

// All articles are now served dynamically from the database

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  reading_time_minutes: number;
  difficulty_level: string;
  published_at: string;
  featured_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
  like_count: number;
}

// Shared table components for ReactMarkdown - used across all section renderers
const markdownTableComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="border-b border-border">{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => <tr className="border-b border-border/50">{children}</tr>,
  th: ({ children }: any) => <th className="text-left py-2 px-3 font-semibold text-foreground">{children}</th>,
  td: ({ children }: any) => <td className="py-2 px-3 text-muted-foreground">{children}</td>,
};

// Shared checkbox/task-list components
const markdownCheckboxComponents = {
  input: ({ type, checked }: any) => {
    if (type === 'checkbox') {
      return (
        <span className={`inline-flex items-center justify-center w-4 h-4 rounded border ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
          {checked && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </span>
      );
    }
    return null;
  },
};

interface ParsedSection {
  title: string;
  content: string;
  type: 'overview' | 'execution' | 'entry' | 'exit' | 'risk' | 'practitioners' | 'pros-cons' | 'example' | 'chart' | 'default';
}

// Parse markdown content into structured sections
function parseContentSections(content: string, introLabel: string = 'Introduction'): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const h2Regex = /^## (.+)$/gm;
  
  let lastIndex = 0;
  let match;
  const matches: { title: string; start: number; end?: number }[] = [];
  
  while ((match = h2Regex.exec(content)) !== null) {
    if (matches.length > 0) {
      matches[matches.length - 1].end = match.index;
    }
    matches.push({ title: match[1], start: match.index + match[0].length });
  }
  
  if (matches.length > 0) {
    matches[matches.length - 1].end = content.length;
  }
  
  // Add intro content before first h2
  const firstH2Match = content.match(/^## /m);
  if (firstH2Match && firstH2Match.index && firstH2Match.index > 0) {
    const introContent = content.substring(0, firstH2Match.index).trim();
    if (introContent) {
      sections.push({ title: introLabel, content: introContent, type: 'overview' });
    }
  }
  
  for (const m of matches) {
    const sectionContent = content.substring(m.start, m.end).trim();
    const titleLower = m.title.toLowerCase();
    
    let type: ParsedSection['type'] = 'default';
    if (titleLower.includes('overview') || titleLower.includes('definition') || titleLower.includes('what is')) {
      type = 'overview';
    } else if (titleLower.includes('execution') || titleLower.includes('timeframe') || titleLower.includes('frequency')) {
      type = 'execution';
    } else if (titleLower.includes('entry') || titleLower.includes('when to buy') || titleLower.includes('setup')) {
      type = 'entry';
    } else if (titleLower.includes('exit') || titleLower.includes('when to sell') || titleLower.includes('take profit')) {
      type = 'exit';
    } else if (titleLower.includes('risk') || titleLower.includes('stop loss') || titleLower.includes('management')) {
      type = 'risk';
    } else if (titleLower.includes('practitioner') || titleLower.includes('notable') || titleLower.includes('trader')) {
      type = 'practitioners';
    } else if (titleLower.includes('pros') || titleLower.includes('cons') || titleLower.includes('advantage') || titleLower.includes('disadvantage')) {
      type = 'pros-cons';
    } else if (titleLower.includes('example') || titleLower.includes('case study') || titleLower.includes('sample') || titleLower.includes('practice') || titleLower.includes('trade setup')) {
      type = 'example';
    } else if (titleLower.includes('chart') || titleLower.includes('visual') || titleLower.includes('pattern illustration')) {
      type = 'chart';
    }
    
    sections.push({ title: m.title, content: sectionContent, type });
  }
  
  return sections;
}

// Extract bullet points from markdown content
function extractBulletPoints(content: string): string[] {
  const bulletRegex = /^[-*•]\s+(.+)$/gm;
  const points: string[] = [];
  let match;
  while ((match = bulletRegex.exec(content)) !== null) {
    points.push(match[1].replace(/\*\*/g, ''));
  }
  return points;
}

// Render a section based on its type
function renderSection(section: ParsedSection, index: number) {
  const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
  
  switch (section.type) {
    case 'overview':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Alert className="border-primary/50 bg-primary/5">
            <Lightbulb className="h-5 w-5 text-primary" />
            <AlertTitle className="text-lg font-semibold">{section.title}</AlertTitle>
            <AlertDescription className="mt-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mt-2">{children}</ul>,
                  li: ({ children }) => <li className="text-muted-foreground text-sm">{children}</li>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                }}
              >
                {section.content}
              </ReactMarkdown>
            </AlertDescription>
          </Alert>
        </section>
      );
    
    case 'execution':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{children}</span>
                    </li>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    case 'entry':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-2 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{children}</span>
                    </li>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    case 'exit':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-cyan-500/30 bg-cyan-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-2 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{children}</span>
                    </li>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    case 'risk':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{children}</span>
                    </li>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    case 'practitioners':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{children}</span>
                    </li>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    case 'pros-cons':
      const bulletPoints = extractBulletPoints(section.content);
      const pros = bulletPoints.filter(p => 
        p.toLowerCase().includes('pro:') || 
        p.toLowerCase().startsWith('✓') || 
        section.content.toLowerCase().includes('advantages')
      );
      const cons = bulletPoints.filter(p => 
        p.toLowerCase().includes('con:') || 
        p.toLowerCase().startsWith('✗') ||
        section.content.toLowerCase().includes('disadvantages')
      );
      
      return (
        <section key={index} id={sectionId} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Advantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ...markdownTableComponents,
                    p: ({ children }) => <p className="text-muted-foreground text-sm mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-1">{children}</ul>,
                    li: ({ children }) => (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{children}</span>
                      </li>
                    ),
                  }}
                >
                  {section.content.split(/cons|disadvantages/i)[0]}
                </ReactMarkdown>
              </CardContent>
            </Card>
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Disadvantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ...markdownTableComponents,
                    p: ({ children }) => <p className="text-muted-foreground text-sm mb-2">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-1">{children}</ul>,
                    li: ({ children }) => (
                      <li className="flex items-start gap-2">
                        <XCircle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{children}</span>
                      </li>
                    ),
                  }}
                >
                  {section.content.split(/cons|disadvantages/i)[1] || section.content}
                </ReactMarkdown>
              </CardContent>
            </Card>
          </div>
        </section>
      );
    
    case 'example':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-indigo-500/30 bg-indigo-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-2 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-muted-foreground ml-4">{children}</li>,
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    case 'chart':
      return (
        <section key={index} id={sectionId} className="mb-8">
          <Card className="border-violet-500/30 bg-violet-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChart className="h-5 w-5 text-violet-500" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownTableComponents,
                  p: ({ children }) => <p className="text-muted-foreground mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </section>
      );
    
    default:
      return (
        <section key={index} id={sectionId} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>,
              strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>,
              li: ({ children, ...props }) => {
                const className = (props as any).className;
                if (className === 'task-list-item') {
                  return <li className="text-muted-foreground list-none flex items-center gap-2">{children}</li>;
                }
                return <li className="text-muted-foreground">{children}</li>;
              },
              input: ({ type, checked }) => {
                if (type === 'checkbox') {
                  return (
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded border ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
                      {checked && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                  );
                }
                return null;
              },
              h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>,
              a: ({ href, children }) => {
                if (href?.startsWith('/')) {
                  return <Link to={href} className="text-primary hover:underline">{children}</Link>;
                }
                return <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
              },
              table: ({ children }) => (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b border-border/50">{children}</tr>,
              th: ({ children }) => <th className="text-left py-2 px-3 font-semibold text-foreground">{children}</th>,
              td: ({ children }) => <td className="py-2 px-3 text-muted-foreground">{children}</td>,
              img: ({ src, alt }) => {
                if (src?.includes('/src/assets/docs/')) return null;
                return <img src={src} alt={alt || ''} className="rounded-lg max-w-full my-4" loading="lazy" />;
              },
            }}
          >
            {injectPatternLinks(section.content)}
          </ReactMarkdown>
        </section>
      );
  }
}

// Chart visualization component for strategies with associated patterns
function ChartVisualization({ slug }: { slug: string }) {
  const charts = getStrategyCharts(slug);
  
  if (charts.length === 0) return null;
  
  return (
    <Card className="mb-8 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-background">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChart className="h-5 w-5 text-violet-500" />
          Visual Pattern Examples
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {charts.map((chart, idx) => (
            <div key={idx} className="space-y-3">
              {chart.title && (
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{chart.title}</h4>
                  {chart.description && (
                    <span className="text-sm text-muted-foreground">— {chart.description}</span>
                  )}
                </div>
              )}
              <div className="rounded-lg overflow-hidden border border-border bg-card">
                <Suspense fallback={
                  <div className="h-64 flex items-center justify-center bg-muted/20">
                    <Skeleton className="w-full h-64" />
                  </div>
                }>
                  <DynamicPatternChart 
                    patternType={chart.patternType} 
                    width={700} 
                    height={400}
                    showTitle={false}
                  />
                </Suspense>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
          <strong>Practice Tip:</strong> Study these patterns on historical charts before trading live. 
          Look for the key characteristics highlighted and practice identifying entry, stop loss, and target levels.
        </p>
      </CardContent>
    </Card>
  );
}

// Generate synthetic demonstration data when no real data is available
function generateDemoBars(count: number = 200): CompressedBar[] {
  const bars: CompressedBar[] = [];
  let price = 150 + Math.random() * 50; // Start between 150-200
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some trending behavior and volatility
    const trend = Math.sin(i / 30) * 0.5; // Longer-term trend
    const noise = (Math.random() - 0.5) * 3; // Daily noise
    const change = trend + noise;
    
    const open = price;
    price = Math.max(50, price + change); // Ensure price stays positive
    const close = price;
    
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    bars.push({
      t: date.toISOString().split('T')[0],
      o: parseFloat(open.toFixed(2)),
      h: parseFloat(high.toFixed(2)),
      l: parseFloat(low.toFixed(2)),
      c: parseFloat(close.toFixed(2)),
      v: volume,
    });
  }
  
  return bars;
}

// Indicator chart visualization for strategies with MACD, RSI, etc.
function IndicatorChartVisualization({ slug }: { slug: string }) {
  const [barsData, setBarsData] = useState<Record<string, CompressedBar[]>>({});
  const [loading, setLoading] = useState(true);
  const indicatorConfigs = getStrategyIndicators(slug);
  
  useEffect(() => {
    const fetchData = async () => {
      if (indicatorConfigs.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get unique symbols
      const symbols = [...new Set(indicatorConfigs.map(c => c.symbol).filter((s): s is string => !!s))];
      
      if (symbols.length === 0) {
        symbols.push('SPY');
      }
      
      const newBarsData: Record<string, CompressedBar[]> = {};
      
      for (const symbol of symbols) {
        try {
          // Try to fetch from historical_prices cache (5 years for daily)
          const { data, error } = await supabase
            .from('historical_prices')
            .select('date, open, high, low, close, volume')
            .eq('symbol', symbol)
            .eq('timeframe', '1d')
            .order('date', { ascending: true })
            .limit(1260); // ~5 years of trading days
          
          if (error || !data || data.length < 50) {
            // Fallback: try EODHD first, then Yahoo as last resort
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 1825); // 5 years
            
            // EODHD first (primary source for non-crypto)
            const { data: eodhData, error: eodhError } = await supabase.functions.invoke('fetch-eodhd', {
              body: {
                symbol,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                interval: '1d',
                includeOhlc: true,
              }
            });
            
            if (!eodhError && eodhData?.bars && eodhData.bars.length >= 50) {
              newBarsData[symbol] = eodhData.bars.map((b: any) => ({
                t: b.t || b.date,
                o: b.o || b.open,
                h: b.h || b.high,
                l: b.l || b.low,
                c: b.c || b.close,
                v: b.v || b.volume || 0,
              }));
            } else {
              // Yahoo last-resort fallback
              const { data: yfData, error: yfError } = await supabase.functions.invoke('fetch-yahoo-finance', {
                body: {
                  symbol,
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  interval: '1d',
                  includeOhlc: true,
                }
              });
              
              if (yfError || !yfData?.bars || yfData.bars.length < 50) {
                console.info(`Using demo data for ${symbol} (EODHD + Yahoo fallback failed)`);
                newBarsData[symbol] = generateDemoBars(200);
              } else {
                newBarsData[symbol] = yfData.bars.map((b: any) => ({
                  t: b.t || b.date,
                  o: b.o || b.open,
                  h: b.h || b.high,
                  l: b.l || b.low,
                  c: b.c || b.close,
                  v: b.v || b.volume || 0,
                }));
              }
            }
            }
          } else {
            newBarsData[symbol] = data.map(d => ({
              t: d.date,
              o: d.open,
              h: d.high,
              l: d.low,
              c: d.close,
              v: d.volume || 0,
            }));
          }
        } catch (err) {
          console.warn(`Error fetching ${symbol}, using demo data:`, err);
          newBarsData[symbol] = generateDemoBars(200);
        }
      }
      
      setBarsData(newBarsData);
      setLoading(false);
    };
    
    fetchData();
  }, [slug]);
  
  if (indicatorConfigs.length === 0) return null;
  
  if (loading) {
    return (
      <Card className="mb-8 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Technical Indicator Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Filter configs that have data
  const validConfigs = indicatorConfigs.filter(config => {
    const symbol = config.symbol || 'SPY';
    return barsData[symbol] && barsData[symbol].length > 50;
  });
  
  if (validConfigs.length === 0) return null;
  
  return (
    <Card className="mb-8 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Technical Indicator Examples
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive charts demonstrating how these indicators work
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {validConfigs.map((config, idx) => {
            const symbol = config.symbol || 'SPY';
            const bars = barsData[symbol];
            
            return (
              <div key={idx}>
                <Suspense fallback={
                  <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
                    <Skeleton className="w-full h-[400px]" />
                  </div>
                }>
                  <StrategyIndicatorChart
                    bars={bars}
                    indicator={config.indicator}
                    title={config.title}
                    description={config.description || 'Demonstration Chart'}
                    height={400}
                    showVolume={true}
                  />
                </Suspense>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
          <strong>Tip:</strong> The signal badges show the current indicator state based on the most recent price action.
        </p>
      </CardContent>
    </Card>
  );
}

// Options Strategy Primer - Beginner-friendly educational content
function OptionsStrategyPrimerSection({ slug }: { slug: string }) {
  const config = getOptionsStrategyConfig(slug);
  
  if (!config?.primer) return null;
  
  return (
    <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
      <OptionsStrategyPrimer data={config.primer} />
    </Suspense>
  );
}

// Strategy Primer - Beginner-friendly educational content for non-options articles
function StrategyPrimerSection({ slug }: { slug: string }) {
  const primer = getStrategyPrimer(slug);
  
  if (!primer) return null;
  
  return (
    <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
      <StrategyPrimer data={primer} />
    </Suspense>
  );
}

// Options Payoff Diagram visualization for options strategy articles
function OptionsPayoffVisualization({ slug }: { slug: string }) {
  const config = getOptionsStrategyConfig(slug);
  
  if (!config) return null;
  
  return (
    <Card className="mb-8 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-background">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-500" />
          Payoff Diagram & Greeks
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Visual representation of profit/loss at different stock prices
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Payoff Diagrams */}
          {config.configs.map((payoffConfig, idx) => (
            <Suspense 
              key={idx}
              fallback={
                <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <Skeleton className="w-full h-[400px]" />
                </div>
              }
            >
              <OptionsPayoffChart
                config={payoffConfig}
                height={400}
                showMetrics={true}
              />
            </Suspense>
          ))}
          
          {/* Greeks Table */}
          {config.greeksTable && (
            <Suspense 
              fallback={<Skeleton className="w-full h-[200px]" />}
            >
              <OptionsGreeksTable 
                data={config.greeksTable} 
                strategyName={config.configs[0]?.title?.replace(' Payoff Diagram', '') || 'This Strategy'}
              />
            </Suspense>
          )}
          
          {/* Educational Notes */}
          {config.educationalNotes && config.educationalNotes.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Quick Reference
              </h4>
              <ul className="space-y-2">
                {config.educationalNotes.map((note, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
          <strong>Reading the diagram:</strong> The solid line shows P/L at expiration. The dashed line shows current P/L with remaining time value. Vertical markers indicate strike prices and break-even points.
        </p>
      </CardContent>
    </Card>
  );
}

// Generate table of contents from sections
function TableOfContents({ sections }: { sections: ParsedSection[] }) {
  const { t } = useTranslation();
  if (sections.length < 3) return null;
  
  return (
    <Card className="mb-8 bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('learn.inThisArticle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <nav>
          <ul className="space-y-2">
            {sections.map((section, i) => (
              <li key={i}>
                <a 
                  href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
}

const DynamicArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch article data (with translation overlay)
  useEffect(() => {
    setLoading(true);
    setError(null);
    setArticle(null);

    const fetchArticle = async () => {
      if (!slug) {
        setError("Article not found");
        setLoading(false);
        return;
      }

      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 15000)
        );
        
        const fetchPromise = supabase
          .rpc('get_article_by_slug', { p_slug: slug })
          .single();

        const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<typeof fetchPromise>;

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Article not found");
          setLoading(false);
          return;
        }

        let articleData = data as Article;

        // If user language != English, try to load translation
        const currentLang = i18n.language?.split('-')[0];
        if (currentLang && currentLang !== 'en') {
          try {
            const { data: translation } = await supabase
              .from('learning_article_translations')
              .select('title, excerpt, content, seo_title, seo_description')
              .eq('article_id', data.id)
              .eq('language_code', currentLang)
              .single();

            if (translation) {
              articleData = {
                ...articleData,
                title: translation.title || articleData.title,
                excerpt: translation.excerpt || articleData.excerpt,
                content: translation.content || articleData.content,
                seo_title: translation.seo_title || articleData.seo_title,
                seo_description: translation.seo_description || articleData.seo_description,
              };
            }
          } catch {
            // No translation available, use English
          }
        }

        setArticle(articleData);

        // Track view
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('article_views').insert({
              article_id: data.id,
              user_id: user.id,
            }).then(() => {});
          }
        });

      } catch (err) {
        console.error('Error fetching article:', err);
        setError("Failed to load article. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, i18n.language]);

  // Track page view and leave for dwell time measurement
  useEffect(() => {
    if (!slug) return;
    const path = `/blog/${slug}`;
    const start = Date.now();
    trackPageView(path);
    return () => {
      trackPageLeave(path, Date.now() - start);
    };
  }, [slug]);

  // Meta tags are now handled by PageMeta component in the render below

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12 max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-4">{t('learn.articleNotFound')}</h1>
          <p className="text-muted-foreground mb-8">{error || t('learn.articleNotFoundDesc')}</p>
          <Link 
            to="/learn" 
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('learn.backToLearning')}
          </Link>
        </div>
      </div>
    );
  }

  // Localize service names in article content, then parse into structured sections
  let processedContent = localizeServiceNames(article.content, t, i18n.language);
  // Strip broken static image references (e.g., ![alt](/src/assets/docs/...))
  processedContent = processedContent.replace(/!\[[^\]]*\]\([^)]*\/src\/assets\/docs\/[^)]*\)\n*/g, '');
  const sections = parseContentSections(processedContent, t('learn.introduction'));

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={article.seo_title || article.title}
        description={article.seo_description || article.excerpt}
        canonicalPath={`/learn/${article.slug}`}
        ogType="article"
        ogImage={article.featured_image_url || undefined}
      />
      <ArticleJsonLd
        headline={article.seo_title || article.title}
        description={article.seo_description || article.excerpt}
        datePublished={article.published_at}
        slug={article.slug}
        imageUrl={article.featured_image_url || undefined}
      />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Navigation */}
        <Link 
          to="/learn" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('learn.backToLearning')}
        </Link>

        {/* Article Header */}
        <article>
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {t(`learn.categories.${article.category}`, article.category)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.reading_time_minutes} {t('learn.minRead')}
            </span>
            <span>•</span>
            <Badge variant="secondary" className="capitalize">
              {t(`learn.difficulties.${article.difficulty_level}`, article.difficulty_level)}
            </Badge>
          </div>

          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="my-8 rounded-lg overflow-hidden border border-border">
              <img 
                src={article.featured_image_url} 
                alt={article.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <Card className="p-6 mb-8 border-primary/50 bg-primary/5">
              <p className="text-base mb-0">{article.excerpt}</p>
            </Card>
          )}

          {/* Table of Contents */}
          <TableOfContents sections={sections} />

          {/* OPTIONS ARTICLES: Primer First (comprehensive beginner education) */}
          {slug && hasOptionsPayoffChart(slug) && (
            <OptionsStrategyPrimerSection slug={slug} />
          )}

          {/* NON-OPTIONS ARTICLES: Strategy Primer First (comprehensive beginner education) */}
          {slug && !hasOptionsPayoffChart(slug) && hasStrategyPrimer(slug) && (
            <StrategyPrimerSection slug={slug} />
          )}

          {/* Render Overview sections first */}
          <div className="mt-8">
            {sections
              .filter(section => section.type === 'overview')
              .map((section, index) => renderSection(section, index))}
          </div>

          {/* CHART TYPES EXPLAINED: Live interactive chart demos */}
          {slug === 'chart-types-explained' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ChartTypeDemos />
            </Suspense>
          )}

          {/* COMMAND CENTER GUIDE: Visual demo of the Command Center UI */}
          {slug === 'command-center-guide' && (
            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
              <CommandCenterDemo />
            </Suspense>
          )}

          {/* TRADING STYLES: Visual profile cards and comparison matrix */}
          {slug === 'trading-styles-timeframes' && (
            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
              <TradingStyleCards />
            </Suspense>
          )}

          {/* TECH VS FUNDAMENTAL: Visual comparison table */}
          {slug === 'technical-vs-fundamental-analysis' && (
            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
              <TechVsFundamentalComparison />
            </Suspense>
          )}

          {/* OPTIONS ARTICLES: Payoff Visualization after overview */}
          {slug && hasOptionsPayoffChart(slug) && (
            <OptionsPayoffVisualization slug={slug} />
          )}

          {/* NON-OPTIONS ARTICLES: Indicator Chart Visualizations after overview */}
          {slug && hasStrategyIndicators(slug) && !hasOptionsPayoffChart(slug) && (
            <IndicatorChartVisualization slug={slug} />
          )}

          {/* CANDLESTICK PATTERN VISUALIZERS - Matching database slugs */}
          {slug === 'doji-patterns' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <DojiPatternVisualizer />
            </Suspense>
          )}
          {slug === 'engulfing-patterns' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <EngulfingPatternVisualizer />
            </Suspense>
          )}
          {slug === 'hammer-patterns' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <HammerPatternVisualizer />
            </Suspense>
          )}
          {slug === 'shooting-star' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ShootingStarVisualizer />
            </Suspense>
          )}
          {slug === 'harami-patterns' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <HaramiPatternVisualizer />
            </Suspense>
          )}
          {slug === 'morning-evening-star' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MorningEveningStarVisualizer />
            </Suspense>
          )}
          {slug === 'three-white-soldiers' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ThreeSoldiersAndCrowsVisualizer />
            </Suspense>
          )}
          {slug === 'three-black-crows' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ThreeBlackCrowsVisualizer />
            </Suspense>
          )}
          {slug === 'piercing-pattern' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <PiercingLineVisualizer />
            </Suspense>
          )}
          {slug === 'dark-cloud-cover' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <DarkCloudCoverVisualizer />
            </Suspense>
          )}
          {slug === 'tweezer-patterns' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <TweezerPatternVisualizer />
            </Suspense>
          )}
          {slug === 'spinning-top' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <SpinningTopVisualizer />
            </Suspense>
          )}
          {slug === 'marubozu-candles' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MarubozuVisualizer />
            </Suspense>
          )}
          {slug === 'kicker-pattern' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <KickerPatternVisualizer />
            </Suspense>
          )}
          {slug === 'abandoned-baby' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <AbandonedBabyVisualizer />
            </Suspense>
          )}

          {/* TECHNICAL INDICATOR VISUALIZERS */}
          {slug === 'ichimoku-complete' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <IchimokuVisualizer />
            </Suspense>
          )}
          {slug === 'stochastic-oscillator' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <StochasticVisualizer />
            </Suspense>
          )}
          {slug === 'atr-indicator' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ATRVisualizer />
            </Suspense>
          )}
          {slug === 'adx-indicator' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ADXVisualizer />
            </Suspense>
          )}
          {slug === 'obv-indicator' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <OBVVisualizer />
            </Suspense>
          )}
          {slug === 'money-flow-index' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MFIVisualizer />
            </Suspense>
          )}
          {slug === 'williams-r' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <WilliamsRVisualizer />
            </Suspense>
          )}
          {slug === 'cci-indicator' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <CCIVisualizer />
            </Suspense>
          )}
          {slug === 'roc-indicator' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ROCVisualizer />
            </Suspense>
          )}
          {slug === 'parabolic-sar' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ParabolicSARVisualizer />
            </Suspense>
          )}
          {slug === 'donchian-channels' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <DonchianVisualizer />
            </Suspense>
          )}
          {slug === 'sma-vs-ema' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <EMAVisualizer />
            </Suspense>
          )}

          {/* RISK MANAGEMENT VISUALIZERS */}
          {(slug === 'position-sizing-fundamentals' || slug === 'position-sizing-key' || slug === 'position-sizing') && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <PositionSizingVisualizer />
            </Suspense>
          )}
          {slug === 'kelly-criterion' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <KellyCriterionVisualizer />
            </Suspense>
          )}
          {(slug === 'stop-loss-strategies' || slug === 'dynamic-stop-loss' || slug === 'atr-stop-loss') && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <StopLossVisualizer />
            </Suspense>
          )}
          {(slug === 'risk-reward-ratio' || slug === 'risk-reward-optimization') && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <RiskRewardVisualizer />
            </Suspense>
          )}
          {(slug === 'martingale-strategy' || slug === 'anti-martingale') && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MartingaleVisualizer />
            </Suspense>
          )}
          {slug === 'managing-drawdowns' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <DrawdownVisualizer />
            </Suspense>
          )}
          {slug === 'value-at-risk' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <VaRVisualizer />
            </Suspense>
          )}
          {slug === 'risk-parity' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <RiskParityVisualizer />
            </Suspense>
          )}
          {slug === 'hedging-strategies' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <HedgingVisualizer />
            </Suspense>
          )}
          {slug === 'correlation-trading' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <CorrelationVisualizer />
            </Suspense>
          )}
          {slug === 'scaling-positions' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <ScalingVisualizer />
            </Suspense>
          )}
          {slug === 'maximum-loss-rules' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MaxLossVisualizer />
            </Suspense>
          )}

          {/* Algorithmic Trading Visualizers */}
          {slug === 'sentiment-analysis-trading' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <SentimentAnalysisVisualizer />
            </Suspense>
          )}
          {slug === 'machine-learning-trading' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MachineLearningVisualizer />
            </Suspense>
          )}
          {slug === 'pine-script-development' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <PineScriptVisualizer />
            </Suspense>
          )}
          {(slug === 'algorithmic-trading' || slug === 'algorithmic-trading-basics') && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <AlgorithmicTradingVisualizer />
            </Suspense>
          )}
          {slug === 'statistical-arbitrage' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <StatArbVisualizer />
            </Suspense>
          )}
          {slug === 'quantitative-trading' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <QuantTradingVisualizer />
            </Suspense>
          )}
          {slug === 'high-frequency-trading' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <HFTVisualizer />
            </Suspense>
          )}
          {slug === 'market-making-strategies' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <MarketMakingVisualizer />
            </Suspense>
          )}
          {slug === 'ai-signal-optimization' && (
            <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
              <AIOptimizationVisualizer />
            </Suspense>
          )}

          {slug && hasStrategyCharts(slug) && (
            <ChartVisualization slug={slug} />
          )}

          {/* Remaining Sections (non-overview) */}
          <div className="mt-8">
            {sections
              .filter(section => section.type !== 'overview')
              .map((section, index) => renderSection(section, index))}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">{t('learn.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {t(`learn.tagLabels.${tag}`, tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA — contextual links to screener and Pattern Lab */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{t('learn.readyToApply')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('learn.readyToApplyDesc')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link 
                to="/patterns/live"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('learn.findSetups')}
              </Link>
              <Link 
                to="/projects/pattern-lab/new?mode=validate"
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                {t('patternLabWizard.validateSignal', 'Backtest a Pattern')}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default DynamicArticle;
