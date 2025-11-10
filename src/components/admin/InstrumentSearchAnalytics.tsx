import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Search, Calendar } from 'lucide-react';

interface SearchStat {
  search_query: string;
  instrument_type: string;
  search_count: number;
  selection_count: number;
  conversion_rate: number;
}

interface RecentSearch {
  id: string;
  search_query: string;
  instrument_type: string;
  selected_instrument: string | null;
  created_at: string;
}

export const InstrumentSearchAnalytics = () => {
  const [topSearches, setTopSearches] = useState<SearchStat[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get top searches (aggregated)
      const { data: searches, error: searchError } = await supabase
        .from('instrument_search_analytics')
        .select('search_query, instrument_type, selected_instrument')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (searchError) throw searchError;

      // Aggregate search data
      const aggregated = new Map<string, SearchStat>();
      searches?.forEach((search) => {
        const key = `${search.search_query}|${search.instrument_type}`;
        const existing = aggregated.get(key) || {
          search_query: search.search_query,
          instrument_type: search.instrument_type,
          search_count: 0,
          selection_count: 0,
          conversion_rate: 0
        };
        
        existing.search_count++;
        if (search.selected_instrument) {
          existing.selection_count++;
        }
        
        aggregated.set(key, existing);
      });

      // Calculate conversion rates and sort
      const stats = Array.from(aggregated.values())
        .map(stat => ({
          ...stat,
          conversion_rate: stat.search_count > 0 ? (stat.selection_count / stat.search_count) * 100 : 0
        }))
        .sort((a, b) => b.search_count - a.search_count)
        .slice(0, 20);

      setTopSearches(stats);

      // Get recent searches
      const { data: recent, error: recentError } = await supabase
        .from('instrument_search_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (recentError) throw recentError;
      setRecentSearches(recent || []);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Instrument Searches (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Most searched instruments by users - use this data to prioritize which instruments to add
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Search Query</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total Searches</TableHead>
                <TableHead className="text-right">Selections</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSearches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No search data available yet
                  </TableCell>
                </TableRow>
              ) : (
                topSearches.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{stat.search_query}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stat.instrument_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{stat.search_count}</TableCell>
                    <TableCell className="text-right">{stat.selection_count}</TableCell>
                    <TableCell className="text-right">
                      <span className={stat.conversion_rate > 50 ? 'text-green-600' : 'text-muted-foreground'}>
                        {stat.conversion_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recent Search Activity
          </CardTitle>
          <CardDescription>
            Live feed of user searches and selections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Search Query</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Selected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSearches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No recent searches
                  </TableCell>
                </TableRow>
              ) : (
                recentSearches.slice(0, 20).map((search) => (
                  <TableRow key={search.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(search.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{search.search_query}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {search.instrument_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {search.selected_instrument ? (
                        <Badge variant="default" className="text-xs">
                          {search.selected_instrument}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No selection</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};