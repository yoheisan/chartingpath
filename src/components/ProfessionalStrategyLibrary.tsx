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
  DollarSign
} from 'lucide-react';
import { professionalStrategies, ProfessionalStrategy } from '@/utils/ProfessionalStrategyTemplates';

interface ProfessionalStrategyLibraryProps {
  onStrategySelect: (strategy: any) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'complexity' | 'category';

export const ProfessionalStrategyLibrary: React.FC<ProfessionalStrategyLibraryProps> = ({
  onStrategySelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  // Get unique values for filters
  const categories = useMemo(() => 
    [...new Set(professionalStrategies.map(s => s.category))], 
    []
  );
  
  const complexityLevels = useMemo(() => 
    [...new Set(professionalStrategies.map(s => s.complexity))], 
    []
  );
  
  const assetTypes = useMemo(() => 
    [...new Set(professionalStrategies.flatMap(s => s.assetTypes))], 
    []
  );

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let filtered = professionalStrategies.filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || strategy.category === selectedCategory;
      const matchesComplexity = selectedComplexity === 'all' || strategy.complexity === selectedComplexity;
      const matchesAssetType = selectedAssetType === 'all' || strategy.assetTypes.includes(selectedAssetType);
      
      return matchesSearch && matchesCategory && matchesComplexity && matchesAssetType;
    });

    // Sort strategies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'complexity':
          const complexityOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
          return complexityOrder.indexOf(a.complexity) - complexityOrder.indexOf(b.complexity);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedComplexity, selectedAssetType, sortBy]);

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
      case 'Trend': return 'bg-blue-500';
      case 'Mean Reversion': return 'bg-green-500';
      case 'Momentum': return 'bg-orange-500';
      case 'Arbitrage': return 'bg-purple-500';
      case 'Market Neutral': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Trend': return TrendingUp;
      case 'Mean Reversion': return BarChart3;
      case 'Momentum': return Activity;
      case 'Arbitrage': return DollarSign;
      case 'Market Neutral': return Target;
      default: return TrendingUp;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedComplexity('all');
    setSelectedAssetType('all');
  };

  const GridView = () => (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {filteredStrategies.map(strategy => {
        const IconComponent = strategy.icon;
        
        return (
          <Card key={strategy.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            {/* Strategy Header */}
            <div className={`h-2 ${getCategoryColor(strategy.category)}`} />
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${strategy.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {strategy.description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Category and Complexity */}
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {strategy.category}
                </Badge>
                <Badge className={getComplexityColor(strategy.complexity)}>
                  {strategy.complexity}
                </Badge>
              </div>

              {/* Supported Assets */}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Assets:</span> {strategy.assetTypes.slice(0, 3).join(', ')}
                  {strategy.assetTypes.length > 3 && ` +${strategy.assetTypes.length - 3} more`}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Timeframes */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Optimal: {strategy.timeframes.optimal}
                </h4>
                <p className="text-xs text-muted-foreground">{strategy.timeframes.description}</p>
              </div>

              <Separator />

              {/* Professional Usage */}
              <div>
                <div className="flex gap-2 mb-2">
                  {strategy.professionalUse.hedgeFunds && (
                    <Badge variant="outline" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Hedge Funds
                    </Badge>
                  )}
                  {strategy.professionalUse.institutionalTraders && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      Institutions
                    </Badge>
                  )}
                  {strategy.professionalUse.retailTraders && (
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
                  onClick={() => onStrategySelect(strategy)}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Select Strategy
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
      {filteredStrategies.map(strategy => {
        const IconComponent = strategy.icon;
        const CategoryIcon = getCategoryIcon(strategy.category);
        
        return (
          <Card key={strategy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${strategy.color} text-white shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-base truncate">{strategy.name}</h3>
                      <div className="flex gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {strategy.category}
                        </Badge>
                        <Badge className={`${getComplexityColor(strategy.complexity)} text-xs`}>
                          {strategy.complexity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {strategy.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {strategy.timeframes.optimal}
                      </span>
                      <span>Assets: {strategy.assetTypes.slice(0, 2).join(', ')}</span>
                      {strategy.professionalUse.hedgeFunds && (
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
                  onClick={() => onStrategySelect(strategy)}
                  className="shrink-0"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Select
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
            <Zap className="w-5 h-5" />
            Professional Strategy Library
            <Badge variant="outline" className="ml-2">
              {filteredStrategies.length} strategies
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Industry-standard trading strategies used by professional traders worldwide. 
            Filter, search, and select strategies to customize with your preferred assets.
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
                  placeholder="Search strategies..."
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                <SelectTrigger>
                  <SelectValue placeholder="Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {complexityLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {assetTypes.map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="complexity">Complexity</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters & Clear */}
            {(searchTerm || selectedCategory !== 'all' || selectedComplexity !== 'all' || selectedAssetType !== 'all') && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && <Badge variant="secondary">Search: {searchTerm}</Badge>}
                {selectedCategory !== 'all' && <Badge variant="secondary">Category: {selectedCategory}</Badge>}
                {selectedComplexity !== 'all' && <Badge variant="secondary">Level: {selectedComplexity}</Badge>}
                {selectedAssetType !== 'all' && <Badge variant="secondary">Asset: {selectedAssetType}</Badge>}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategy List/Grid */}
      {filteredStrategies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No strategies found</h3>
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
              <p className="font-medium text-sm">Professional Strategy Templates</p>
              <p className="text-sm text-muted-foreground">
                These strategies represent industry-standard configurations used by institutional traders, 
                hedge funds, and retail professionals. Select any strategy to customize parameters, 
                choose specific assets, and run comprehensive backtests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};