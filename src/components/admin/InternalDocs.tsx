import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, TrendingUp, Server, DollarSign } from "lucide-react";

export const InternalDocs = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>EODHD Data Provider Scaling Milestones</CardTitle>
          </div>
          <CardDescription>
            Internal documentation for infrastructure scaling decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Current Status
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Plan</th>
                    <th className="px-4 py-2 text-left border-b">Cost</th>
                    <th className="px-4 py-2 text-left border-b">Daily API Calls</th>
                    <th className="px-4 py-2 text-left border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b font-medium">All-World</td>
                    <td className="px-4 py-2 border-b">$79/mo</td>
                    <td className="px-4 py-2 border-b">100,000</td>
                    <td className="px-4 py-2 border-b">
                      <Badge className="bg-green-500">Active</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Resolution by Tier */}
          <div>
            <h3 className="font-semibold mb-3">Data Resolution by Tier</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Universe</th>
                    <th className="px-4 py-2 text-left border-b">Timeframe</th>
                    <th className="px-4 py-2 text-left border-b">Refresh Rate</th>
                    <th className="px-4 py-2 text-left border-b">API Calls/Day</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b">Premium 300</td>
                    <td className="px-4 py-2 border-b">15m</td>
                    <td className="px-4 py-2 border-b">Every 15 min</td>
                    <td className="px-4 py-2 border-b">~29,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b">Core 1,100</td>
                    <td className="px-4 py-2 border-b">1H</td>
                    <td className="px-4 py-2 border-b">Every hour</td>
                    <td className="px-4 py-2 border-b">~26,400</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b">Full 8,500+</td>
                    <td className="px-4 py-2 border-b">4H/1D/1W</td>
                    <td className="px-4 py-2 border-b">Every 4 hours</td>
                    <td className="px-4 py-2 border-b">~51,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Total:</strong> ~106,000 calls/day (at capacity)
            </p>
          </div>

          {/* Upgrade Milestones */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Upgrade Milestones
            </h3>
            
            {/* Milestone 1 */}
            <Card className="mb-4 border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Milestone 1: Extended Plan ($249/mo)</CardTitle>
                <CardDescription>Trigger: 10+ paying users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">21</p>
                    <p className="text-xs text-muted-foreground">LITE users</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">9</p>
                    <p className="text-xs text-muted-foreground">PLUS users</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">4</p>
                    <p className="text-xs text-muted-foreground">PRO users</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">2</p>
                    <p className="text-xs text-muted-foreground">TEAM users</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Enables:</strong> 500,000 API calls/day, full 1-hour resolution for 8,500+ instruments
                </p>
              </CardContent>
            </Card>

            {/* Milestone 2 */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Milestone 2: Enterprise Plan (~$2,499/mo)</CardTitle>
                <CardDescription>Trigger: 100+ paying users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">208</p>
                    <p className="text-xs text-muted-foreground">LITE users</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">86</p>
                    <p className="text-xs text-muted-foreground">PLUS users</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">32</p>
                    <p className="text-xs text-muted-foreground">PRO users</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <p className="text-lg font-bold">13</p>
                    <p className="text-xs text-muted-foreground">TEAM users</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Enables:</strong> Unlimited API calls, full 15-minute resolution for 8,500+ instruments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technical Requirements */}
          <div>
            <h3 className="font-semibold mb-3">Technical Requirements for 15m Full Universe</h3>
            <div className="p-4 bg-muted rounded-lg font-mono text-sm">
              8,500 instruments × 96 intervals/day = 816,000 API calls/day
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Only achievable with Enterprise tier or custom negotiated plan.
            </p>
          </div>

          {/* Alternative Providers */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Alternative Providers Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Provider</th>
                    <th className="px-4 py-2 text-left border-b">Plan</th>
                    <th className="px-4 py-2 text-left border-b">Cost</th>
                    <th className="px-4 py-2 text-left border-b">Calls/Day</th>
                    <th className="px-4 py-2 text-left border-b">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b font-medium">EODHD Enterprise</td>
                    <td className="px-4 py-2 border-b">Enterprise</td>
                    <td className="px-4 py-2 border-b">~$2,499/mo</td>
                    <td className="px-4 py-2 border-b">Unlimited</td>
                    <td className="px-4 py-2 border-b text-green-600">No code changes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b">Twelve Data</td>
                    <td className="px-4 py-2 border-b">Growth</td>
                    <td className="px-4 py-2 border-b">$1,999/mo</td>
                    <td className="px-4 py-2 border-b">565,000</td>
                    <td className="px-4 py-2 border-b text-amber-600">Insufficient</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b">Polygon</td>
                    <td className="px-4 py-2 border-b">Starter</td>
                    <td className="px-4 py-2 border-b">$99/mo</td>
                    <td className="px-4 py-2 border-b">500M/mo</td>
                    <td className="px-4 py-2 border-b text-amber-600">Complex integration</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b">Alpha Vantage</td>
                    <td className="px-4 py-2 border-b">Premium</td>
                    <td className="px-4 py-2 border-b">$249/mo</td>
                    <td className="px-4 py-2 border-b">Unlimited</td>
                    <td className="px-4 py-2 border-b text-amber-600">Rate limited</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Recommendation:</strong> EODHD Enterprise remains best option for full 15m coverage.
            </p>
          </div>

          {/* Revenue Formula */}
          <div>
            <h3 className="font-semibold mb-3">Revenue Tracking Formula</h3>
            <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-1">
              <p>Paying Users = SUM(LITE + PLUS + PRO + TEAM)</p>
              <p>Monthly Revenue = (LITE×12) + (PLUS×29) + (PRO×79) + (TEAM×199)</p>
              <p className="pt-2 border-t mt-2">Upgrade to Extended when: Monthly Revenue &gt; $249</p>
              <p>Upgrade to Enterprise when: Monthly Revenue &gt; $2,499</p>
            </div>
          </div>

          {/* Custom Plan */}
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Custom Plan Negotiation</h3>
            <p className="text-sm text-muted-foreground">
              Contact EODHD for custom pricing: <strong>support@eodhd.com</strong><br />
              Target: ~1M calls/day | Estimated: €399-€999/mo (negotiable)
            </p>
          </div>

          <p className="text-xs text-muted-foreground pt-4 border-t">
            Last updated: 2026-02-01
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
