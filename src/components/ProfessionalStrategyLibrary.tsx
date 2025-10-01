import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Users,
  Crown,
  Activity,
  Info,
  Target,
  Zap,
  Search,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  BarChart3,
  DollarSign,
  ArrowUpAZ,
  ArrowDownZA
} from 'lucide-react';
import { chartPatternTemplates, ChartPatternTemplate } from '@/utils/ChartPatternTemplates';

interface ProfessionalStrategyLibraryProps {
  onPatternSelect: (pattern: ChartPatternTemplate) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name-asc' | 'name-desc' | 'category-reversal' | 'category-continuation' | 'category-candlestick' | 'category-harmonic' | 'category-breakout';

export const ProfessionalStrategyLibrary: React.FC<ProfessionalStrategyLibraryProps> = ({
  onPatternSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name-asc');

  // Get unique values for filters
  const categories = useMemo(() => 
    [...new Set(chartPatternTemplates.map(s => s.category))], 
    []
  );

  // Determine selected category from sortBy
  const selectedCategory = sortBy.startsWith('category-') 
    ? sortBy.replace('category-', '').charAt(0).toUpperCase() + sortBy.replace('category-', '').slice(1)
    : 'all';

  // Filter and sort patterns
  const filteredPatterns = useMemo(() => {
    let filtered = chartPatternTemplates.filter(pattern => {
      const matchesSearch = pattern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pattern.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || pattern.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort patterns
    filtered.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      // For category filters, sort by name within category
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return '';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Reversal': return 'bg-red-500';
      case 'Continuation': return 'bg-blue-500';
      case 'Candlestick': return 'bg-green-500';
      case 'Harmonic': return 'bg-purple-500';
      case 'Breakout': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Reversal': return TrendingUp;
      case 'Continuation': return BarChart3;
      case 'Candlestick': return Activity;
      case 'Harmonic': return Target;
      case 'Breakout': return Zap;
      default: return TrendingUp;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('name-asc');
  };

  const GridView = () => (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {filteredPatterns.map(pattern => {
        const IconComponent = pattern.icon;
        
        return (
          <Card key={pattern.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            {/* Pattern Header */}
            <div className={`h-2 ${getCategoryColor(pattern.category)}`} />
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${pattern.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pattern.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pattern.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Category and Accuracy */}
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {pattern.category}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {pattern.accuracy} Accuracy
                </Badge>
              </div>

              {/* Default Targets */}
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-green-600 font-medium">Target: {pattern.defaultTarget}%</span>
                <span className="text-red-600 font-medium">Stop: {pattern.defaultStopLoss}%</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Timeframes */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Optimal: {pattern.timeframes.optimal}
                </h4>
                <p className="text-xs text-muted-foreground">{pattern.timeframes.description}</p>
              </div>

              <Separator />

              {/* Professional Usage */}
              <div>
                <div className="flex gap-2 mb-2">
                  {pattern.professionalUse.hedgeFunds && (
                    <Badge variant="outline" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Hedge Funds
                    </Badge>
                  )}
                  {pattern.professionalUse.institutionalTraders && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      Institutions
                    </Badge>
                  )}
                  {pattern.professionalUse.retailTraders && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Retail
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button 
                  size="sm" 
                  onClick={() => onPatternSelect(pattern)}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Build Strategy with This Pattern
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const ListView = () => (
    <div className="space-y-3">
      {filteredPatterns.map(pattern => {
        const IconComponent = pattern.icon;
        const CategoryIcon = getCategoryIcon(pattern.category);
        
        return (
          <Card key={pattern.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${pattern.color} text-white shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-base truncate">{pattern.name}</h3>
                      <div className="flex gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {pattern.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {pattern.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pattern.timeframes.optimal}
                      </span>
                      <span className="text-green-600 font-medium">+{pattern.defaultTarget}%</span>
                      <span className="text-red-600 font-medium">-{pattern.defaultStopLoss}%</span>
                      {pattern.professionalUse.hedgeFunds && (
                        <Badge variant="outline" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Institutional
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => onPatternSelect(pattern)}
                  className="shrink-0"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Build
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Professional Chart Pattern Library
            <Badge variant="outline" className="ml-2">
              {filteredPatterns.length} patterns
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Universal chart patterns that work across all asset classes (Forex, Stocks, Crypto, Commodities). 
            Select a pattern to build a complete trading strategy with customizable targets and stop losses.
          </p>
        </CardHeader>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and View Mode */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search patterns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-4">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort & Filter" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    SORT
                  </div>
                  <SelectItem value="name-asc">
                    <div className="flex items-center gap-2">
                      <ArrowUpAZ className="w-4 h-4" />
                      A-Z
                    </div>
                  </SelectItem>
                  <SelectItem value="name-desc">
                    <div className="flex items-center gap-2">
                      <ArrowDownZA className="w-4 h-4" />
                      Z-A
                    </div>
                  </SelectItem>
                  
                  <div className="h-px bg-border my-1" />
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    FILTER BY CATEGORY
                  </div>
                  {categories.map(category => (
                    <SelectItem key={category} value={`category-${category.toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters & Clear */}
            {(searchTerm || selectedCategory !== 'all') && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && <Badge variant="secondary">Search: {searchTerm}</Badge>}
                {selectedCategory !== 'all' && <Badge variant="secondary">Category: {selectedCategory}</Badge>}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pattern List/Grid */}
      {filteredPatterns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No patterns found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? <GridView /> : <ListView />}
        </>
      )}

      {/* Professional Usage Disclaimer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-sm">Universal Chart Patterns</p>
              <p className="text-sm text-muted-foreground">
                These patterns are universal across all asset classes and timeframes, representing market psychology and price action. 
                They work equally well on Forex, Stocks, Crypto, and Commodities. Select any pattern to build a complete strategy with customizable targets and stops,
                choose specific assets, and run comprehensive backtests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};