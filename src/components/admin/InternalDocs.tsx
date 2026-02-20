import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, TrendingUp, Server, DollarSign, Clock, Shield, Activity, Cpu, GitBranch } from "lucide-react";

// ─── Sub-sections ──────────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <h3 className="font-semibold mb-3 flex items-center gap-2 text-base border-b pb-2 mt-6 first:mt-0">
    <Icon className="h-4 w-4 text-primary" />
    {title}
  </h3>
);

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 bg-muted rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed">
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: "active" | "pending" | "gated" | "stalled" }) => {
  const map: Record<string, string> = {
    active: "bg-green-600 text-white",
    pending: "bg-yellow-600 text-white",
    gated: "bg-blue-600 text-white",
    stalled: "bg-destructive text-destructive-foreground",
  };
  return <Badge className={map[status] ?? ""}>{status.toUpperCase()}</Badge>;
};

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

const OverviewTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Architecture — Executive Summary</CardTitle>
        <CardDescription>
          Audit-ready overview of the Global Operations pipeline. Last updated: 2026-02-20.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The platform operates a fully automated, multi-stage data pipeline responsible for detecting,
          seeding, validating and surfacing institutional-grade chart patterns across 8,500+ global
          instruments (stocks, ETFs, forex, crypto, indices, commodities).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Instruments covered", value: "8,500+" },
            { label: "Validation throughput", value: "150k / hr" },
            { label: "Daily seeding jobs", value: "40 cron jobs" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={GitBranch} title="Three-Layer Validation Pipeline" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left border-b">Layer</th>
                <th className="px-4 py-2 text-left border-b">Name</th>
                <th className="px-4 py-2 text-left border-b">Logic</th>
                <th className="px-4 py-2 text-left border-b">Where Applied</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                ["1", "Structural (Bulkowski)", "Pattern geometry: symmetry, touchpoints, tolerance", "Seeder + live scanner"],
                ["2", "Contextual", "Trend alignment, volume, ADX, quality grade (A–F)", "backfill-validation worker"],
                ["3", "MTF Confluence", "Multi-timeframe momentum agreement", "validate-mtf-confluence"],
              ].map(([l, n, lg, w]) => (
                <tr key={l}>
                  <td className="px-4 py-2 border-b font-bold text-primary">{l}</td>
                  <td className="px-4 py-2 border-b font-medium">{n}</td>
                  <td className="px-4 py-2 border-b text-muted-foreground">{lg}</td>
                  <td className="px-4 py-2 border-b">{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Activity} title="Pipeline Flow" />
        <CodeBlock>{`EODHD API / Yahoo Finance
        │
        ▼
[seed-historical-patterns] ──► historical_pattern_occurrences (status: pending)
        │
        ▼  (12:00 UTC gate opens)
[backfill-validation] ─── 5 parallel shards ──► validate-pattern-context (Layer 2)
        │                                               └──► validate-mtf-confluence (Layer 3)
        ▼
historical_pattern_occurrences (status: validated / rejected)
        │
        ▼
[scan-live-patterns] ──► live_pattern_detections (active signals shown to users)
        │
        ▼
[send-pattern-alert] ──► Email (Resend) + Web Push (VAPID)`}</CodeBlock>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Cron Schedule ────────────────────────────────────────────────────────

const CronTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Automation Schedule (UTC)</CardTitle>
        <CardDescription>All times UTC. Managed via pg_cron in Supabase SQL Editor.</CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Clock} title="Daily Timeline" />
        <CodeBlock>{`UTC  00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23
     ──────────────────────────────────────────────────────────────────────────
     [  APAC session          ]
                    [  EU session              ]
                                        [  US session                    ]
     ──────────────────────────────────────────────────────────────────────────
     ^04:00 purge
                  ^05:00──────────────11:30 SEEDING WINDOW────────────────^
                                                           ^12:00 VALIDATION GATE OPENS
     [─────────────────────── scan-live-patterns (every 15 min) ─────────────]
                                                                (12:00–04:45)`}</CodeBlock>

        <SectionHeader icon={Clock} title="Registered pg_cron Jobs (46 total)" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                {["Time (UTC)", "Job Name", "Edge Function", "Status"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["04:00 daily", "purge-stale-patterns", "purge-stale-patterns", "active"],
                ["05:00 daily", "seed-fx-1h", "seed-historical-patterns", "active"],
                ["05:10 daily", "seed-fx-4h", "seed-historical-patterns", "active"],
                ["05:20 daily", "seed-fx-8h", "seed-historical-patterns", "active"],
                ["05:30 daily", "seed-fx-1d", "seed-historical-patterns", "active"],
                ["05:40 daily", "seed-fx-1wk", "seed-historical-patterns", "active"],
                ["05:50 daily", "seed-crypto-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["06:40 daily", "seed-commodities-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["07:30 daily", "seed-indices-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["08:10 daily", "seed-etf-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["09:10 daily", "seed-stocks-ag-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["10:00 daily", "seed-stocks-ho-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["10:50 daily", "seed-stocks-pz-1h … 1wk (×5)", "seed-historical-patterns", "active"],
                ["every min, 12:00–04:45", "backfill-validation-stocks", "backfill-validation", "active"],
                ["every min, 12:00–04:45", "backfill-validation-etf", "backfill-validation", "active"],
                ["every min, 12:00–04:45", "backfill-validation-crypto", "backfill-validation", "active"],
                ["every min, 12:00–04:45", "backfill-validation-forex", "backfill-validation", "active"],
                ["every min, 12:00–04:45", "backfill-validation-indices", "backfill-validation", "active"],
                ["every 15 min, 12:00–04:45", "scan-live-patterns-scheduled (ID: 134)", "scan-live-patterns", "active"],
              ].map(([time, job, fn, status]) => (
                <tr key={job}>
                  <td className="px-3 py-2 border-b text-muted-foreground">{time}</td>
                  <td className="px-3 py-2 border-b font-mono">{job}</td>
                  <td className="px-3 py-2 border-b font-mono text-primary">{fn}</td>
                  <td className="px-3 py-2 border-b">
                    <StatusBadge status={status as "active" | "pending" | "gated" | "stalled"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ✅ <strong>scan-live-patterns-scheduled</strong> is ACTIVE — registered 2026-02-20, pg_cron ID: 134. Runs every 15 min outside the seeding window (05:00–11:59 UTC).
        </p>

        <SectionHeader icon={Database} title="Registered Cron SQL (Reference)" />
        <CodeBlock>{`-- Registered 2026-02-20 via Supabase SQL Editor (pg_cron job ID: 134)
-- Runs every 15 min during non-seeding window: hours 0–4 and 12–23 UTC
-- Seeding window (05:00–11:59 UTC) is excluded to prevent OOM on Medium instance

SELECT cron.schedule(
  'scan-live-patterns-scheduled',
  '*/15 0-4,12-23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/scan-live-patterns',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body    := concat('{"time":"', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- To verify: SELECT * FROM cron.job WHERE jobname = 'scan-live-patterns-scheduled';
-- To remove: SELECT cron.unschedule('scan-live-patterns-scheduled');`}</CodeBlock>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Validation Shards ────────────────────────────────────────────────────

const ValidationTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">5-Shard Parallel Validation Architecture</CardTitle>
        <CardDescription>Replaces single-worker (3,000 rec/hr) with 150,000 rec/hr across 5 shards.</CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Cpu} title="Shard Registry" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Shard", "Asset Types", "Cron Job", "Throughput", "Advisory Lock"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["stocks", "stocks, stock, equity", "backfill-validation-stocks", "30,000/hr", "lock:stocks"],
                ["etf", "etf, ETF", "backfill-validation-etf", "30,000/hr", "lock:etf"],
                ["crypto", "crypto, cryptocurrency", "backfill-validation-crypto", "30,000/hr", "lock:crypto"],
                ["forex", "forex, fx, currency", "backfill-validation-forex", "30,000/hr", "lock:forex"],
                ["indices", "indices, index, indice", "backfill-validation-indices", "30,000/hr", "lock:indices"],
              ].map(([shard, types, job, throughput, lock]) => (
                <tr key={shard}>
                  <td className="px-4 py-2 border-b font-bold">{shard}</td>
                  <td className="px-4 py-2 border-b text-muted-foreground text-xs">{types}</td>
                  <td className="px-4 py-2 border-b font-mono text-xs">{job}</td>
                  <td className="px-4 py-2 border-b text-green-600 font-medium">{throughput}</td>
                  <td className="px-4 py-2 border-b font-mono text-xs">{lock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Shield} title="Fault-Tolerance Mechanisms" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Advisory Locks",
              desc: "pg_try_advisory_lock per shard prevents duplicate concurrent execution. If a shard is still running when the next cron tick fires, it skips silently.",
            },
            {
              title: "Watermarks",
              desc: "Each shard persists last_watermark in worker_runs. Resumable, gap-free processing — a crash mid-batch does not lose progress.",
            },
            {
              title: "Circuit Breaker",
              desc: "Opens for 30 min after 3 consecutive failures. One shard failing never blocks the other four. Breaker state is stored in worker_runs.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="p-3 border rounded-lg bg-card">
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={Activity} title="Shard Coordination Diagram" />
        <CodeBlock>{`pg_cron (every minute, 12:00–04:45 UTC)
  │
  ├─► backfill-validation-stocks  ──► pg_try_advisory_lock(stocks)
  │                                        └──► watermark: worker_runs.last_watermark[stocks]
  ├─► backfill-validation-etf     ──► pg_try_advisory_lock(etf)
  ├─► backfill-validation-crypto  ──► pg_try_advisory_lock(crypto)
  ├─► backfill-validation-forex   ──► pg_try_advisory_lock(forex)
  └─► backfill-validation-indices ──► pg_try_advisory_lock(indices)
         │
         └─► validate-pattern-context  (Layer 2, batch 500)
               └─► validate-mtf-confluence  (Layer 3)
                     └─► historical_pattern_occurrences.validation_status = 'validated'`}</CodeBlock>

        <SectionHeader icon={Clock} title="Backlog Clearance Estimate" />
        <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
          <p><strong>Daily seeded patterns:</strong> ~300,000</p>
          <p><strong>Validation throughput:</strong> 150,000 / hr (5 shards × 30k)</p>
          <p><strong>Gate opens:</strong> 12:00 UTC daily</p>
          <p><strong>Expected clearance:</strong> ~2 hours (prior: 96+ hours single-worker)</p>
          <p className="text-muted-foreground text-xs pt-2 border-t mt-2">
            Rejection rate is stable at ~4.6% — within normal range for quality filtering.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Infrastructure ───────────────────────────────────────────────────────

const InfraTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Infrastructure & Resource Constraints</CardTitle>
        <CardDescription>Supabase compute, data provider, and scaling thresholds.</CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Server} title="Compute Instance" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Parameter", "Value", "Notes"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Plan", "Supabase Medium", "Upgraded from Nano to handle seeding load"],
                ["RAM", "4 GB", "~93% utilised during peak seeding (3.74 GB)"],
                ["IOPS", "8,192", "Sufficient for current write volume"],
                ["Peak load window", "05:00–11:30 UTC", "40 concurrent seeding jobs"],
                ["Next upgrade trigger", "8 GB (Large)", "If OOM errors recur during seeding bursts"],
              ].map(([p, v, n]) => (
                <tr key={p}>
                  <td className="px-4 py-2 border-b font-medium">{p}</td>
                  <td className="px-4 py-2 border-b text-primary">{v}</td>
                  <td className="px-4 py-2 border-b text-muted-foreground text-xs">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Database} title="Data Provider — EODHD" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Plan", "Cost", "Daily API Calls", "Status"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border-b font-medium">All-World</td>
                <td className="px-4 py-2 border-b">$79/mo</td>
                <td className="px-4 py-2 border-b">100,000</td>
                <td className="px-4 py-2 border-b"><Badge className="bg-green-600 text-white">Active</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        <SectionHeader icon={TrendingUp} title="Data Resolution by Tier" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Universe", "Timeframe", "Refresh Rate", "API Calls/Day"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Premium 300", "15m", "Every 15 min", "~29,000"],
                ["Core 1,100", "1H", "Every hour", "~26,400"],
                ["Full 8,500+", "4H / 1D / 1W", "Every 4 hours", "~51,000"],
              ].map(([u, tf, rr, calls]) => (
                <tr key={u}>
                  <td className="px-4 py-2 border-b">{u}</td>
                  <td className="px-4 py-2 border-b">{tf}</td>
                  <td className="px-4 py-2 border-b">{rr}</td>
                  <td className="px-4 py-2 border-b font-mono">{calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-muted-foreground mt-2"><strong>Total:</strong> ~106,000 calls/day (at capacity)</p>
        </div>

        <SectionHeader icon={TrendingUp} title="Upgrade Milestones" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Milestone 1 — Extended Plan ($249/mo)</CardTitle>
              <CardDescription className="text-xs">Trigger: 10+ paying users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[["21","LITE"],["9","PLUS"],["4","PRO"],["2","TEAM"]].map(([n,l]) => (
                  <div key={l} className="text-center p-1 bg-background rounded">
                    <p className="text-sm font-bold">{n}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">500,000 API calls/day — full 1H for 8,500+ instruments</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Milestone 2 — Enterprise (~$2,499/mo)</CardTitle>
              <CardDescription className="text-xs">Trigger: 100+ paying users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[["208","LITE"],["86","PLUS"],["32","PRO"],["13","TEAM"]].map(([n,l]) => (
                  <div key={l} className="text-center p-1 bg-background rounded">
                    <p className="text-sm font-bold">{n}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Unlimited API calls — full 15m for 8,500+ instruments</p>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 bg-muted rounded-lg text-sm mt-4 space-y-1">
          <p className="font-mono">Paying Users = SUM(LITE + PLUS + PRO + TEAM)</p>
          <p className="font-mono">Monthly Revenue = (LITE×12) + (PLUS×29) + (PRO×79) + (TEAM×199)</p>
          <p className="font-mono pt-2 border-t mt-2">Upgrade to Extended when: Monthly Revenue &gt; $249</p>
          <p className="font-mono">Upgrade to Enterprise when: Monthly Revenue &gt; $2,499</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Notification System ──────────────────────────────────────────────────

const NotificationTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification System Architecture</CardTitle>
        <CardDescription>Email + Web Push dual-channel alert pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Activity} title="Implementation Status" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Phase", "Description", "Status"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1 — VAPID Keys", "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY secrets configured", "active"],
                ["2 — DB Preferences", "email_notifications_enabled + push_notifications_enabled on profiles", "pending"],
                ["3 — send-pattern-alert", "Parallel dispatch: Email (Resend) + Web Push (npm:web-push@3.6.6)", "pending"],
                ["4 — NotificationSettings UI", "Load/save preferences from profiles table", "pending"],
                ["5 — user_id passthrough", "pattern-detector → send-pattern-alert user_id chain", "pending"],
              ].map(([phase, desc, status]) => (
                <tr key={phase}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{phase}</td>
                  <td className="px-4 py-2 border-b text-muted-foreground text-xs">{desc}</td>
                  <td className="px-4 py-2 border-b">
                    <StatusBadge status={status as "active" | "pending"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Activity} title="Push Payload Schema" />
        <CodeBlock>{`{
  "title": "Pattern Alert: Hammer on AAPL",
  "body": "Bullish reversal detected (80% confidence) — $185.42",
  "tag": "pattern-alert-{alertId}",
  "url": "/members/alerts",
  "requireInteraction": true
}`}</CodeBlock>

        <SectionHeader icon={Activity} title="Dispatch Architecture" />
        <CodeBlock>{`send-pattern-alert (edge function)
  │
  ├─► Promise.allSettled([
  │     Resend.send({ to, subject, html })   // Email channel
  │     webpush.sendNotification(sub, payload, vapidDetails)  // Push channel
  │   ])
  │
  └─► partial success tolerated — one channel failure does not block the other`}</CodeBlock>

        <SectionHeader icon={Database} title="Files to Modify" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["File", "Action"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["supabase/functions/send-pattern-alert/index.ts", "Add push dispatch via web-push"],
                ["src/components/settings/NotificationSettings.tsx", "Connect to DB (load/save from profiles)"],
                ["src/hooks/usePushNotifications.ts", "Update VAPID public key"],
              ].map(([file, action]) => (
                <tr key={file}>
                  <td className="px-4 py-2 border-b font-mono text-xs">{file}</td>
                  <td className="px-4 py-2 border-b text-muted-foreground text-xs">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Main Export ───────────────────────────────────────────────────────────────

export const InternalDocs = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold">System Architecture — Audit Document</h2>
          <p className="text-sm text-muted-foreground">
            Internal technical reference. Confidential — for engineering & audit use only.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cron">Cron Schedule</TabsTrigger>
          <TabsTrigger value="validation">Validation Shards</TabsTrigger>
          <TabsTrigger value="infra">Infrastructure</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="cron" className="mt-4"><CronTab /></TabsContent>
        <TabsContent value="validation" className="mt-4"><ValidationTab /></TabsContent>
        <TabsContent value="infra" className="mt-4"><InfraTab /></TabsContent>
        <TabsContent value="notifications" className="mt-4"><NotificationTab /></TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground pt-2 border-t">
        Last updated: 2026-02-20 · Version 2.0
      </p>
    </div>
  );
};
