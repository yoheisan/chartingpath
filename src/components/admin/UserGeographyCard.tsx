import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface CountryStat {
  country: string;
  unique_users: number;
  total_logins: number;
  top_cities: string[];
}

export const UserGeographyCard = () => {
  const [stats, setStats] = useState<CountryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadGeoData();
  }, []);

  const loadGeoData = async () => {
    setLoading(true);
    try {
      // Get country-level aggregation from login_attempts (successful logins only)
      const { data, error } = await supabase
        .from('login_attempts')
        .select('country, city, user_id')
        .eq('success', true)
        .not('country', 'is', null)
        .not('user_id', 'is', null);

      if (error) {
        console.error('Geo data error:', error);
        return;
      }

      if (!data || data.length === 0) {
        setStats([]);
        return;
      }

      // Aggregate client-side: unique users per country + top cities
      const countryMap = new Map<string, { users: Set<string>; logins: number; cities: Map<string, number> }>();

      for (const row of data) {
        const country = row.country || 'Unknown';
        if (!countryMap.has(country)) {
          countryMap.set(country, { users: new Set(), logins: 0, cities: new Map() });
        }
        const entry = countryMap.get(country)!;
        if (row.user_id) entry.users.add(row.user_id);
        entry.logins++;
        if (row.city) {
          entry.cities.set(row.city, (entry.cities.get(row.city) || 0) + 1);
        }
      }

      const aggregated: CountryStat[] = Array.from(countryMap.entries())
        .map(([country, info]) => ({
          country,
          unique_users: info.users.size,
          total_logins: info.logins,
          top_cities: Array.from(info.cities.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([city]) => city),
        }))
        .sort((a, b) => b.unique_users - a.unique_users);

      const total = aggregated.reduce((sum, c) => sum + c.unique_users, 0);
      setTotalUsers(total);
      setStats(aggregated);
    } catch (err) {
      console.error('Geo load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const countryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
      'Germany': '🇩🇪', 'France': '🇫🇷', 'India': '🇮🇳', 'Japan': '🇯🇵', 'Brazil': '🇧🇷',
      'Netherlands': '🇳🇱', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Mexico': '🇲🇽', 'Singapore': '🇸🇬',
      'South Korea': '🇰🇷', 'Switzerland': '🇨🇭', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
      'Denmark': '🇩🇰', 'Finland': '🇫🇮', 'Poland': '🇵🇱', 'Turkey': '🇹🇷', 'Russia': '🇷🇺',
      'China': '🇨🇳', 'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Philippines': '🇵🇭',
      'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Argentina': '🇦🇷',
      'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Israel': '🇮🇱', 'UAE': '🇦🇪',
      'United Arab Emirates': '🇦🇪', 'Saudi Arabia': '🇸🇦', 'Portugal': '🇵🇹',
      'Ireland': '🇮🇪', 'Belgium': '🇧🇪', 'Austria': '🇦🇹', 'Czech Republic': '🇨🇿',
      'Romania': '🇷🇴', 'Greece': '🇬🇷', 'Hungary': '🇭🇺', 'Vietnam': '🇻🇳',
      'Malaysia': '🇲🇾', 'Taiwan': '🇹🇼', 'Hong Kong': '🇭🇰', 'New Zealand': '🇳🇿',
      'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Sri Lanka': '🇱🇰', 'Kenya': '🇰🇪',
      'Morocco': '🇲🇦', 'Peru': '🇵🇪', 'Ukraine': '🇺🇦',
    };
    return flags[country] || '🌍';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> User Geography</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted rounded" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> User Geography
        </CardTitle>
        <CardDescription>
          {totalUsers} unique users across {stats.length} countries (based on login IP)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No geo data yet — country is resolved from login IPs.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Top 3 highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {stats.slice(0, 3).map((s, i) => (
                <div key={s.country} className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{countryFlag(s.country)}</span>
                    <span className="font-semibold text-sm">{s.country}</span>
                    {i === 0 && <Badge variant="default" className="text-[10px] px-1.5 py-0">Top</Badge>}
                  </div>
                  <div className="text-2xl font-bold">{s.unique_users}</div>
                  <div className="text-xs text-muted-foreground">{((s.unique_users / totalUsers) * 100).toFixed(1)}% of users</div>
                  <Progress value={(s.unique_users / totalUsers) * 100} className="mt-2 h-1.5" />
                </div>
              ))}
            </div>

            {/* Full table */}
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Logins</TableHead>
                    <TableHead>Top Cities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map(s => (
                    <TableRow key={s.country}>
                      <TableCell className="font-medium">
                        <span className="mr-1.5">{countryFlag(s.country)}</span>
                        {s.country}
                      </TableCell>
                      <TableCell className="text-right font-mono">{s.unique_users}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {((s.unique_users / totalUsers) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{s.total_logins}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {s.top_cities.map(city => (
                            <Badge key={city} variant="outline" className="text-[10px] px-1.5 py-0">
                              <MapPin className="h-2.5 w-2.5 mr-0.5" />{city}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
