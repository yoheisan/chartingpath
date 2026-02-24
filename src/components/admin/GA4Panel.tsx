import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Globe, Monitor, Smartphone, Tablet, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

interface GA4Report {
  rows?: GA4Row[];
}

interface GA4Data {
  pages: GA4Report;
  sources: GA4Report;
  devices: GA4Report;
  dateRange: string;
}

export function GA4Panel() {
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [dateRange, setDateRange] = useState("7d");

  const fetchData = async (range: string) => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ga4-report", {
        body: { dateRange: range },
      });

      if (fnError) throw new Error(fnError.message);
      if (result?.setup_required) {
        setSetupRequired(true);
        return;
      }
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (range: string) => {
    setDateRange(range);
    fetchData(range);
  };

  if (!data && !loading && !error && !setupRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>View traffic, sources, and page performance from GA4</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => fetchData(dateRange)}>Load GA4 Data</Button>
        </CardContent>
      </Card>
    );
  }

  if (setupRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            GA4 Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To connect GA4, you need to add two Supabase secrets:
          </p>
          <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
            <li><strong>GA4_SERVICE_ACCOUNT_JSON</strong> — A Google Cloud service account JSON key with Analytics read access</li>
            <li><strong>GA4_PROPERTY_ID</strong> — Your GA4 property ID (numeric, found in Admin → Property Settings)</li>
          </ol>
          <Button variant="outline" asChild>
            <a href="https://supabase.com/dashboard/project/dgznlsckoamseqcpzfqm/settings/functions" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Add Secrets in Supabase
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchData(dateRange)}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const deviceIcon = (d: string) => {
    if (d === "mobile") return <Smartphone className="h-4 w-4" />;
    if (d === "tablet") return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Google Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchData(dateRange)}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.pages?.rows?.map((row, i) => {
                const path = row.dimensionValues[0].value;
                const sessions = parseInt(row.metricValues[0].value);
                const bounceRate = parseFloat(row.metricValues[2].value);
                const isAuthPage = path === "/auth" || path === "/auth/";
                return (
                  <div key={i} className={`flex items-center justify-between text-sm py-1 ${isAuthPage ? "bg-destructive/10 rounded px-2 -mx-2" : ""}`}>
                    <span className="truncate max-w-[200px] font-mono text-xs">{path}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{sessions} sessions</span>
                      <Badge variant={bounceRate > 0.7 ? "destructive" : "secondary"} className="text-xs">
                        {(bounceRate * 100).toFixed(0)}% bounce
                      </Badge>
                    </div>
                  </div>
                );
              }) || <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.sources?.rows?.map((row, i) => {
                const source = row.dimensionValues[0].value;
                const sessions = parseInt(row.metricValues[0].value);
                return (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate max-w-[200px]">{source}</span>
                    <span className="text-muted-foreground">{sessions}</span>
                  </div>
                );
              }) || <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.devices?.rows?.map((row, i) => {
                const device = row.dimensionValues[0].value;
                const sessions = parseInt(row.metricValues[0].value);
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {deviceIcon(device)}
                    <span className="capitalize">{device}</span>
                    <span className="ml-auto text-muted-foreground">{sessions} sessions</span>
                  </div>
                );
              }) || <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
