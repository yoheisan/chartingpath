import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Tag, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { DynamicPatternChart } from "@/components/DynamicPatternChart";

// Slugs that have comprehensive static pages - redirect to them
const STATIC_ARTICLE_REDIRECTS: Record<string, string> = {
  'head-and-shoulders': '/learn/head-and-shoulders',
  'double-top-bottom': '/learn/double-top-bottom',
  'triangle-patterns': '/learn/triangle-patterns',
  'wedge-patterns': '/learn/wedge-patterns',
  'flag-pennant': '/learn/flag-pennant',
  'flag-pennant-patterns': '/learn/flag-pennant',
  'cup-and-handle': '/learn/cup-and-handle',
  'rectangle-pattern': '/learn/rectangle-pattern',
  'support-resistance': '/learn/support-resistance',
  'trend-analysis': '/learn/trend-analysis',
  'volume-analysis': '/learn/volume-analysis',
  'moving-averages': '/learn/moving-averages',
  'rsi-indicator': '/learn/rsi-indicator',
  'macd-indicator': '/learn/macd-indicator',
  'fibonacci-retracements': '/learn/fibonacci-retracements',
  'candlestick-patterns': '/learn/candlestick-patterns',
  'price-action-basics': '/learn/price-action-basics',
  'breakout-trading': '/learn/breakout-trading',
  'pin-bar-strategy': '/learn/pin-bar-strategy',
  'risk-management': '/learn/risk-management',
  'position-sizing': '/learn/position-sizing',
  'money-management': '/learn/money-management',
  'trading-psychology': '/learn/trading-psychology',
  'trading-discipline': '/learn/trading-discipline',
  'fear-and-greed': '/learn/fear-and-greed',
  'trading-journal': '/learn/trading-journal',
};

// Pattern types that can be rendered with DynamicPatternChart
const RENDERABLE_PATTERNS = [
  'double-top', 'double-bottom', 'head-and-shoulders', 'inverse-head-and-shoulders',
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle',
  'bull-flag', 'bear-flag', 'rising-wedge', 'falling-wedge',
  'cup-and-handle', 'doji', 'hammer', 'shooting-star', 'bullish-engulfing',
  'bearish-engulfing', 'morning-star', 'evening-star', 'spinning-top'
];

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

const DynamicArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to static page if it exists
  useEffect(() => {
    if (slug && STATIC_ARTICLE_REDIRECTS[slug]) {
      navigate(STATIC_ARTICLE_REDIRECTS[slug], { replace: true });
    }
  }, [slug, navigate]);

  // Fetch article data
  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setError("Article not found");
        setLoading(false);
        return;
      }

      // Skip fetch if redirecting to static page
      if (STATIC_ARTICLE_REDIRECTS[slug]) {
        return;
      }

      try {
        // Fetch article using RPC function
        const { data, error: fetchError } = await supabase
          .rpc('get_article_by_slug', { p_slug: slug })
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Article not found");
          setLoading(false);
          return;
        }

        setArticle(data as Article);

        // Track view (insert into article_views)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('article_views').insert({
            article_id: data.id,
            user_id: user.id,
          });
        }

      } catch (err) {
        console.error('Error fetching article:', err);
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  // Update page metadata
  useEffect(() => {
    if (article) {
      document.title = article.seo_title || article.title;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', article.seo_description || article.excerpt);
      }
    }
  }, [article]);

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
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">{error || "The article you're looking for doesn't exist."}</p>
          <Link 
            to="/learn" 
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Navigation */}
        <Link 
          to="/learn" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        {/* Article Header */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {article.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.reading_time_minutes} min read
            </span>
            <span>•</span>
            <Badge variant="secondary" className="capitalize">
              {article.difficulty_level}
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

          {/* Article Content */}
          <div className="mt-8">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold mt-12 mb-4">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold mt-8 mb-3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-relaxed mb-6">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-6">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-6">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-muted-foreground">{children}</li>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-2 py-1 rounded text-sm">{children}</code>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default DynamicArticle;