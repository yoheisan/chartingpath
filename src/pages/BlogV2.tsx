import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BookOpen, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  difficulty_level: string;
  reading_time_minutes: number;
  tags: string[];
  published_at: string;
  view_count: number;
}

const BlogV2 = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_articles')
        .select('id, title, slug, excerpt, category, difficulty_level, reading_time_minutes, tags, published_at, view_count')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      setArticles(data || []);
      setFilteredArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const categories = ["all", ...Array.from(new Set(articles.map(a => a.category)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Trading Education Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive guides and tutorials to master technical analysis, chart patterns, and trading strategies
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search articles by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center mb-6 text-muted-foreground">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== "all" 
                ? "Try adjusting your search or filters" 
                : "No articles have been published yet"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link key={article.id} to={`/blog/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {article.difficulty_level}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-2">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {article.excerpt}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {article.reading_time_minutes} min
                      </span>
                      <span>{article.view_count} views</span>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogV2;