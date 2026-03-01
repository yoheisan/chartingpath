import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, TrendingUp, Server, DollarSign, Clock, Shield, Activity, Cpu, GitBranch, BarChart3, Wallet, Share2 } from "lucide-react";

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
          Audit-ready overview of the Global Operations pipeline. Last updated: 2026-03-01.
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
[check-alert-matches] ──► alerts_log + send-pattern-alert (Email + Push)
        │
        ├─► [auto-paper-trade] ──► paper_trades (if enabled)
        └─► [fire-signal-webhook] ──► External platforms (if configured)`}</CodeBlock>
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

// ─── Tab: Copilot AI ───────────────────────────────────────────────────────────

const CopilotAITab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Copilot Full Integration & Self-Improvement Architecture</CardTitle>
        <CardDescription>15 active tools across 6 data domains. Combined analysis strategy. Last updated: 2026-02-26.</CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Database} title="Tool Inventory — 15 Active Tools" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Tool", "Data Source", "Auth Required", "Domain"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["search_patterns", "live_pattern_detections", "No", "Market"],
                ["query_edge_atlas", "historical_pattern_occurrences", "No", "Market"],
                ["get_market_breadth", "fetch-market-breadth fn", "No", "Market"],
                ["get_economic_events", "economic_events table", "No", "Macro"],
                ["get_market_report", "cached_market_reports", "No", "Macro"],
                ["get_price_data", "fetch-eodhd / yahoo fallback", "No", "Market"],
                ["analyze_chart_context", "Passed from UI", "No", "Context"],
                ["explain_pattern", "Hardcoded + articles", "No", "Education"],
                ["find_article", "learning_articles", "No", "Education"],
                ["generate_pine_script", "AI-generated", "No", "Automation"],
                ["manage_watchlist", "User watchlist", "Yes", "Personal"],
                ["get_user_backtests", "backtest_result_cache", "Yes", "Personal"],
                ["get_user_alerts", "alerts table", "Yes", "Personal"],
                ["get_paper_portfolio", "paper_portfolios + paper_trades", "Yes", "Personal"],
                ["get_user_watchlist", "User watchlist read", "Yes", "Personal"],
              ].map(([tool, source, auth, domain]) => (
                <tr key={tool}>
                  <td className="px-3 py-2 border-b font-mono text-xs text-primary">{tool}</td>
                  <td className="px-3 py-2 border-b text-xs">{source}</td>
                  <td className="px-3 py-2 border-b text-xs">{auth}</td>
                  <td className="px-3 py-2 border-b text-xs">
                    <Badge variant="outline" className="text-[10px]">{domain}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Activity} title="Combined Analysis Strategy" />
        <p className="text-sm text-muted-foreground mb-3">
          The system prompt instructs the copilot to proactively chain multiple tools for compound questions.
          This is the primary differentiator vs. generic AI — multimodal analysis across proprietary data.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Query Type", "Tools Chained", "Example"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Broad market overview", "get_market_report + get_market_breadth + get_economic_events", '"What does the market look like today?"'],
                ["Instrument analysis", "search_patterns + get_price_data + get_economic_events + query_edge_atlas", '"Is it a good time to go long EURUSD?"'],
                ["Trade ideas", "query_edge_atlas + search_patterns + get_economic_events", '"What should I trade this week?"'],
                ["Portfolio review", "get_paper_portfolio + search_patterns + get_user_alerts", '"How is my portfolio positioned?"'],
                ["Backtest comparison", "get_user_backtests + query_edge_atlas", '"How does my AAPL backtest compare to the Edge Atlas?"'],
              ].map(([type, tools, example]) => (
                <tr key={type}>
                  <td className="px-3 py-2 border-b text-xs font-medium">{type}</td>
                  <td className="px-3 py-2 border-b font-mono text-[10px]">{tools}</td>
                  <td className="px-3 py-2 border-b text-xs text-muted-foreground italic">{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Cpu} title="Phase 1 — Dynamic Prompt Patching (ACTIVE)" />
        <p className="text-sm text-muted-foreground mb-3">
          Corrective rules are stored in <code className="text-xs bg-muted px-1 rounded">copilot_learned_rules</code> and injected into the system prompt at runtime.
          This allows the copilot to autonomously fix known failure patterns without code deploys.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Rule Type", "Purpose", "Example"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["translation", "Convert user language to system units", '"30% return" → 1-3R in Edge Atlas'],
                ["fallback", "Auto-retry strategy when 0 results", "Remove min_annualized_pct → remove timeframe → show all"],
                ["correction", "Fix ambiguous intent parsing", '"best pattern" → sort by annualized return'],
                ["guardrail", "Silently relax unrealistic filters", "min_win_rate > 80% → cap at 65%"],
                ["few_shot", "Example Q&A pairs for in-context learning", "Full prompt-response exemplars"],
              ].map(([type, purpose, example]) => (
                <tr key={type}>
                  <td className="px-4 py-2 border-b font-mono text-xs text-primary">{type}</td>
                  <td className="px-4 py-2 border-b text-xs">{purpose}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={TrendingUp} title="Phase 2 — RLVR Reward Pipeline (ACTIVE)" />
        <p className="text-sm text-muted-foreground mb-3">
          Every copilot interaction is auto-scored and logged to <code className="text-xs bg-muted px-1 rounded">copilot_training_pairs</code>.
          Reward signals are computed from objective technical outcomes, not subjective user ratings.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Signal", "Weight", "Condition"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Tool returned data", "+0.5", "Tool result contains count > 0 or non-empty results"],
                ["No results", "-0.5", "All tool calls returned empty datasets"],
                ["Substantial response", "+0.3", "Response length > 200 chars"],
                ["Contains links", "+0.2", "Response includes relative links ([text](/path))"],
              ].map(([signal, weight, condition]) => (
                <tr key={signal}>
                  <td className="px-4 py-2 border-b text-xs font-medium">{signal}</td>
                  <td className="px-4 py-2 border-b text-xs font-mono text-primary">{weight}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={GitBranch} title="Phase 3 — DPO Fine-Tuning (PLANNED)" />
        <p className="text-sm text-muted-foreground mb-3">
          Once ~5,000 preference pairs are collected (dpo_eligible = true), the dataset can be used for Direct Preference Optimization
          on an open-weight model (Llama 3, Gemma 2). This creates a model uniquely trained on ChartingPath's proprietary data structures.
        </p>
        <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
          <p><strong>Pairs collected:</strong> Check <code className="text-xs">SELECT COUNT(*) FROM copilot_training_pairs WHERE dpo_eligible = true</code></p>
          <p><strong>Target:</strong> 5,000 eligible pairs</p>
          <p><strong>Model candidates:</strong> Llama 3.3 70B, Gemma 2 27B</p>
          <p><strong>Training method:</strong> DPO with (prompt, preferred_response, rejected_response) triplets</p>
        </div>

        <SectionHeader icon={GitBranch} title="Data Flow Architecture" />
        <CodeBlock>{`User Question
  │
  ▼
[trading-copilot] ──► Fetch copilot_learned_rules (active rules)
  │                       └──► Inject into system prompt dynamically
  │
  ├──► 15 Tools: patterns, edge atlas, breadth, economic events,
  │    market reports, price data, backtests, alerts, portfolio,
  │    chart context, watchlist, articles, pine script, explain
  │
  ▼
[Gemini 2.0 Flash] ──► Tool Calls ──► Tool Results
  │                       └──► Combined Analysis (multi-tool chaining)
  │
  ▼
Response to User
  │
  └──► [RLVR Logger] ──► copilot_training_pairs
                              ├── prompt, response, tool_calls
                              ├── outcome_signals (auto-computed)
                              ├── reward_score (-1 to +1)
                              └── dpo_eligible (|reward| > 0.5)

Periodic Analysis (Future):
  copilot_training_pairs ──► Lesson Extractor
       └──► copilot_learned_rules (new correction rules)
            └──► Auto-injected into next copilot session`}</CodeBlock>

        <SectionHeader icon={Shield} title="Competitive Moat Properties" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Proprietary Dataset",
              desc: "Training pairs are generated from ChartingPath's unique pattern database (320k+ trades). Competitors cannot replicate without the same underlying data.",
            },
            {
              title: "Compound Learning",
              desc: "Each learned rule improves future interactions, which generate better training pairs, which produce better rules. Positive feedback loop.",
            },
            {
              title: "No Model Lock-In",
              desc: "Prompt patching works with any LLM (Gemini, GPT, Claude). DPO fine-tuning targets open-weight models. No vendor dependency.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="p-3 border rounded-lg bg-card">
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: APAC Market Expansion ────────────────────────────────────────────────

const APACTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">APAC Market Expansion</CardTitle>
        <CardDescription>
          Ticker universe, seeding coverage, and API usage for Hong Kong, Singapore, and Thailand markets. Completed 2026-02-21.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Activity} title="Expansion Summary" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "New tickers added", value: "~58" },
            { label: "Markets", value: "HKEX · SGX · SET" },
            { label: "Additional API calls/day", value: "~8,000" },
            { label: "New cron jobs", value: "0" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 bg-muted rounded-lg">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={Database} title="APAC Ticker Universe" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Market", "Count", "Examples", "Symbol Format", "EODHD Exchange"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Hong Kong (HKEX)", "20", "Tencent, Alibaba HK, HSBC HK, AIA", ".HK", ".HK"],
                ["Singapore (SGX)", "15", "DBS, OCBC, UOB, SingTel", ".SI (Yahoo) → .SG (EODHD)", ".SG"],
                ["Thailand (SET)", "10", "PTT, SCB, ADVANC, CPALL", ".BK", ".BK"],
                ["China ADRs (US)", "10", "BABA, JD, PDD, BIDU, NIO", "Standard US", "US"],
                ["APAC Indices", "3+", "^HSI, 000001.SS, ^STI", ".SS → .SHG", ".SHG / .SHE"],
              ].map(([market, count, examples, format, eodhd]) => (
                <tr key={market}>
                  <td className="px-3 py-2 border-b font-medium text-xs">{market}</td>
                  <td className="px-3 py-2 border-b text-xs">{count}</td>
                  <td className="px-3 py-2 border-b text-xs text-muted-foreground">{examples}</td>
                  <td className="px-3 py-2 border-b font-mono text-xs">{format}</td>
                  <td className="px-3 py-2 border-b font-mono text-xs text-primary">{eodhd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Server} title="Symbol Resolution Logic" />
        <CodeBlock>{`// fetch-eodhd & seed-historical-patterns-mtf
toEODHDSymbol(symbol):
  .HK  → .HK   (direct passthrough)
  .SI  → .SG   (Yahoo SGX → EODHD SG exchange)
  .BK  → .BK   (direct passthrough)
  .SS  → .SHG  (Shanghai Stock Exchange)
  .SZ  → .SHE  (Shenzhen Stock Exchange)

// symbolResolver.ts — detectAssetType()
  .HK, .SI, .BK, .SS, .SZ → 'stock'
  ^HSI, ^STI, ^N225        → 'index'`}</CodeBlock>

        <SectionHeader icon={TrendingUp} title="API Usage Impact" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Resource", "Before", "After", "Headroom"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["EODHD API calls/day", "~85,000", "~93,000", "7,000 remaining"],
                ["Universe size", "~1,000", "~1,060", "+60 instruments"],
                ["Seeding cron jobs", "42", "42 (unchanged)", "N/A"],
                ["RAM usage (peak)", "3.74 GB / 4 GB", "~3.8 GB / 4 GB", "~200 MB"],
                ["Market reports/day", "5", "6 (+Shanghai/HK Open)", "—"],
              ].map(([resource, before, after, headroom]) => (
                <tr key={resource}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{resource}</td>
                  <td className="px-4 py-2 border-b text-xs">{before}</td>
                  <td className="px-4 py-2 border-b text-xs text-primary">{after}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{headroom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Clock} title="Scheduling Impact" />
        <p className="text-sm text-muted-foreground">
          <strong>Zero impact.</strong> New APAC tickers are automatically picked up by existing Stocks A–G / H–O / P–Z seeding windows 
          based on alphabetical sorting. The Shanghai/HK Open market report runs at 01:30 UTC — well outside the 05:00–12:00 seeding window.
          SGX tickers that return 404 from EODHD correctly trigger the Yahoo Finance fallback path.
        </p>

        <SectionHeader icon={Shield} title="Data Attribution & Compliance" />
        <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
          <p>• APAC market data sourced from <strong>EODHD</strong> (primary) and <strong>Yahoo Finance</strong> (fallback)</p>
          <p>• All APAC data is <strong>delayed</strong> (not real-time) — consistent with existing data policy</p>
          <p>• Terms & Conditions updated with APAC data attribution and regional disclaimers</p>
          <p>• Platform monetizes derived insights (patterns, analytics) — not raw data redistribution</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Automation (Auto Paper Trading + Webhooks) ──────────────────────────

const AutomationTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Automation Layer — Auto Paper Trading & Signal Webhooks</CardTitle>
        <CardDescription>
          Two-layer execution system closing the loop between detection and action. Added 2026-03-01.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Activity} title="Architecture Overview" />
        <CodeBlock>{`scan-live-patterns (every 15 min)
  │
  ▼
check-alert-matches
  │
  ├─► alerts_log (notification record)
  │
  ├─► send-pattern-alert (Email + Push)
  │
  ├─► auto-paper-trade (if alert.auto_paper_trade = true)
  │     └──► paper_trades (status: open)
  │           └──► paper_portfolios (balance updated via trigger)
  │
  └─► fire-signal-webhook (if alert.webhook_url set)
        └──► HTTPS POST with HMAC-SHA256 signature
              └──► signal_webhook_log (delivery tracking)`}</CodeBlock>

        <SectionHeader icon={Wallet} title="Auto Paper Trading — Edge Function" />
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
                ["Function", "auto-paper-trade", "Deno edge function"],
                ["Triggered by", "check-alert-matches", "When auto_paper_trade = true"],
                ["Position sizing", "Risk-based", "qty = (balance × risk%) / |entry − SL|"],
                ["Max risk %", "5%", "Capped regardless of user setting"],
                ["Max position", "50% of portfolio", "Prevents over-concentration"],
                ["Duplicate guard", "One open per symbol", "Skips if existing open trade"],
                ["Initial balance", "$100,000", "Default paper portfolio"],
                ["Trade tag", "[auto-trade]", "In notes field for UI badge identification"],
              ].map(([p, v, n]) => (
                <tr key={p}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{p}</td>
                  <td className="px-4 py-2 border-b text-xs text-primary">{v}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Shield} title="Signal Webhook — Edge Function" />
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
                ["Function", "fire-signal-webhook", "Deno edge function"],
                ["Auth", "HMAC-SHA256", "X-Signature header, user-supplied secret"],
                ["Protocol", "HTTPS only", "HTTP endpoints rejected"],
                ["Rate limit", "10 signals/hr/user", "Prevents execution storms"],
                ["Payload", "JSON", "symbol, direction, entry, SL, TP, pattern, grade"],
                ["Logging", "signal_webhook_log", "Status, latency, response body"],
                ["Timeout", "10 seconds", "Delivery timeout per request"],
              ].map(([p, v, n]) => (
                <tr key={p}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{p}</td>
                  <td className="px-4 py-2 border-b text-xs text-primary">{v}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Database} title="Paper Trading UI — Dashboard Integration" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Component", "Location", "Data Source"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["PaperTradingPanel", "Right sidebar → 'Paper' tab", "paper_portfolios + paper_trades"],
                ["Portfolio summary", "Top of panel", "Balance, P&L, Win Rate"],
                ["Open positions", "Middle section", "paper_trades WHERE status='open'"],
                ["Closed trades", "Accordion", "paper_trades WHERE status='closed'"],
                ["[Auto] badge", "On each trade card", "notes LIKE '%[auto-trade]%'"],
                ["Symbol click", "Navigates main chart", "onSymbolSelect callback"],
                ["Real-time sync", "Supabase subscription", "INSERT/UPDATE on paper_trades"],
              ].map(([comp, loc, src]) => (
                <tr key={comp}>
                  <td className="px-4 py-2 border-b font-mono text-xs">{comp}</td>
                  <td className="px-4 py-2 border-b text-xs">{loc}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={TrendingUp} title="Database Tables Involved" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "paper_portfolios",
              desc: "Per-user portfolio with initial_balance ($100k), current_balance, total_pnl. Auto-created via initialize_paper_portfolio trigger on profile insert.",
            },
            {
              title: "paper_trades",
              desc: "Individual trades: symbol, trade_type, entry_price, stop_loss, take_profit, quantity, status, pnl. Balance updated via update_portfolio_balance trigger.",
            },
            {
              title: "signal_webhook_log",
              desc: "Delivery audit trail: user_id, alert_id, webhook_url, status_code, latency_ms, response_body, delivered_at.",
            },
           ].map(({ title, desc }) => (
            <div key={title} className="p-3 border rounded-lg bg-card">
              <p className="font-semibold text-sm mb-1 font-mono">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={Activity} title="Public-Facing Documentation" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Asset", "Location", "Content", "i18n"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["FAQ — Automation tab", "/faq → Automation", "7 Q&As: how auto-trading works, position sizing, webhook setup, security, risk controls", "✅ faq.automation.*"],
                ["FAQ — How to use guide", "/faq → Automation", "Step-by-step: enable auto_paper_trade on alerts, configure webhook URLs", "✅ faq.automation.*"],
                ["Paper Trading Panel", "Dashboard → Right sidebar → Paper tab", "Portfolio summary, open positions, closed trades, [Auto] badge", "Component-level (English)"],
                ["Alert creation form", "Dashboard → Alerts", "auto_paper_trade toggle, webhook_url, webhook_secret, risk_percent fields", "✅ alerts.*"],
              ].map(([asset, loc, content, i18n]) => (
                <tr key={asset}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{asset}</td>
                  <td className="px-4 py-2 border-b text-xs">{loc}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{content}</td>
                  <td className="px-4 py-2 border-b text-xs">{i18n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Shield} title="i18n Translation Keys Added" />
        <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
          <p><strong>Namespace:</strong> <code className="text-xs bg-background px-1 rounded">faq.automation.*</code></p>
          <p><strong>Keys added:</strong> 55+ (questions, answers, tab label)</p>
          <p><strong>Source file:</strong> <code className="text-xs bg-background px-1 rounded">src/i18n/locales/en.json</code></p>
          <p><strong>Coverage:</strong> All FAQ automation content is translatable via react-i18next</p>
          <p className="text-muted-foreground text-xs pt-2 border-t mt-2">
            Non-English translations pending — keys exist in English, awaiting translation pipeline processing.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Social Media CMS & Auto-Posting ──────────────────────────────────────

const SocialCMSTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Social Media CMS — Auto-Posting Pipeline</CardTitle>
        <CardDescription>
          Fully automated content distribution across X (Twitter) and Instagram. Covers pattern alerts, market reports, educational micro-posts, and growth automation. Updated 2026-03-01.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={Activity} title="Pipeline Architecture" />
        <CodeBlock>{`┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT GENERATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [post-patterns-to-social]     ← cron: every 60 min             │
│     └─► A/B grade detections → tweet with chart image            │
│                                                                 │
│  [schedule-market-reports]     ← cron: daily                    │
│     └─► 6 regional market reports → scheduled_posts              │
│                                                                 │
│  [schedule-educational-posts]  ← cron: 21:00 UTC daily          │
│     └─► educational_content_pieces → scheduled_posts             │
│                                                                 │
│  [seed-qa-content]             ← on-demand                      │
│     └─► quiz_questions → content_library                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     DELIVERY ENGINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [social-media-scheduler]      ← cron: every 5 min              │
│     └─► scheduled_posts (status=scheduled, due now)              │
│           └─► [post-to-social-media]                             │
│                 ├─► Twitter (OAuth 1.0a, HMAC-SHA1)              │
│                 └─► Instagram (Graph API v18.0)                  │
│                                                                 │
│  [post-patterns-to-social]     ← direct posting (no scheduler)   │
│     └─► Twitter v2 API + media upload v1.1                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     GROWTH AUTOMATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [discover-x-accounts]         ← cron: every 5 min              │
│     └─► Snowball discovery from seed influencers                 │
│                                                                 │
│  [auto-follow-x]               ← cron: every 5 min              │
│     └─► Drip-follow from follow_queue                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`}</CodeBlock>

        <SectionHeader icon={Share2} title="Edge Functions — Content Generation" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Function", "Trigger", "Input", "Output", "Status"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["post-patterns-to-social", "Cron: every 60 min", "live_pattern_detections (A/B grade, with_trend)", "Tweet + optional chart PNG", "active"],
                ["schedule-market-reports", "Cron: daily", "6 regional configs (US, EU, Tokyo, etc.)", "scheduled_posts rows", "active"],
                ["schedule-regional-reports", "Cron: daily", "Regional report batch configs", "scheduled_posts rows", "active"],
                ["generate-social-market-teaser", "Invoked by scheduler", "cached_market_reports + Gemini 2.0 Flash", "240-char tweet with market data", "active"],
                ["schedule-educational-posts", "Cron: 21:00 UTC daily", "educational_content_pieces (global_order queue)", "scheduled_posts for next day", "active"],
                ["generate-educational-posts", "On-demand (admin)", "learning_articles → AI chunking", "educational_content_pieces", "active"],
                ["seed-qa-content", "On-demand (admin)", "quiz_questions with images", "content_library items", "active"],
                ["pre-generate-pattern-images", "Cron: every 2 hours", "A/B grade live detections", "SVG charts in Supabase storage", "active"],
              ].map(([fn, trigger, input, output, status]) => (
                <tr key={fn}>
                  <td className="px-3 py-2 border-b font-mono text-xs text-primary">{fn}</td>
                  <td className="px-3 py-2 border-b text-xs">{trigger}</td>
                  <td className="px-3 py-2 border-b text-xs text-muted-foreground">{input}</td>
                  <td className="px-3 py-2 border-b text-xs">{output}</td>
                  <td className="px-3 py-2 border-b"><StatusBadge status={status as "active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Share2} title="Edge Functions — Delivery & Growth" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Function", "Trigger", "Key Logic", "Status"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["social-media-scheduler", "Cron: every 5 min", "Batch 5 due posts, 3 retries, 48h stale cleanup, recurrence auto-schedule", "active"],
                ["post-to-social-media", "Invoked by scheduler", "OAuth 1.0a Twitter + Instagram Graph API, self-healing AI teaser fallback", "active"],
                ["discover-x-accounts", "Cron: every 5 min", "Snowball crawl seed influencer 'following' lists, overlap scoring, 100+ follower filter", "active"],
                ["auto-follow-x", "Cron: every 5 min", "Drip-follow from follow_queue, rate limit aware, 429 auto-retry", "active"],
              ].map(([fn, trigger, logic, status]) => (
                <tr key={fn}>
                  <td className="px-3 py-2 border-b font-mono text-xs text-primary">{fn}</td>
                  <td className="px-3 py-2 border-b text-xs">{trigger}</td>
                  <td className="px-3 py-2 border-b text-xs text-muted-foreground">{logic}</td>
                  <td className="px-3 py-2 border-b"><StatusBadge status={status as "active"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Cpu} title="post-patterns-to-social — Deep Dive" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Feature", "Implementation"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Quality filter", "Only A/B grade patterns from live_pattern_detections"],
                ["Trend filter", "Excludes counter_trend — only with_trend, neutral, sideways"],
                ["Budget control", "social_post_budget table: 25 posts/day max (configurable)"],
                ["Session awareness", "Posts tagged by market session (tokyo/london/newyork)"],
                ["Duplicate prevention", "Checks post_history for same pattern_id within session"],
                ["Image pipeline", "SVG → PNG via images.weserv.nl proxy → Twitter v1.1 media upload"],
                ["Share tokens", "Auto-generates share_token for deep-link URLs"],
                ["Tweet format", "Emoji + pattern name + instrument + grade + R:R + entry/SL/TP + CTA link"],
                ["Rate limiting", "Catches 429, breaks loop, retries on next invocation"],
              ].map(([feat, impl]) => (
                <tr key={feat}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{feat}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{impl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Cpu} title="social-media-scheduler — Deep Dive" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Feature", "Implementation"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Batch size", "5 posts per invocation"],
                ["Retry logic", "3 max retries, 2s delay between retries"],
                ["Stale cleanup", "Posts older than 48h auto-marked as 'missed'"],
                ["Content generation", "AI teaser via generate-social-market-teaser for market_report type"],
                ["Q&A content", "Pulls from content_library for qa_content post type"],
                ["Link injection", "Appends link_back_url if not already in content"],
                ["Recurrence", "daily / weekdays / weekly — auto-creates next occurrence after posting"],
                ["Status flow", "scheduled → posting → posted (or failed after 3 retries)"],
                ["Fallback content", "Generates safe fallback tweet if AI teaser fails"],
              ].map(([feat, impl]) => (
                <tr key={feat}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{feat}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{impl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Cpu} title="schedule-educational-posts — Deep Dive" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Feature", "Implementation"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Frequency", "Daily (7 days/week including weekends)"],
                ["Run time", "21:00 UTC — schedules for next day"],
                ["Queue model", "global_order on educational_content_pieces, wraps around"],
                ["Multi-region", "One piece per market region per day (via educational_schedule_state)"],
                ["State management", "Atomic: only advances position AFTER successful DB insert"],
                ["Content validation", "Minimum 10 chars, skips empty pieces"],
                ["Duplicate guard", "Checks existing scheduled/posted for same date, ignores failed"],
                ["Hashtags", "Appends up to 3 hashtags from piece metadata"],
                ["CTA link", "Pre-baked in content from generate-educational-posts"],
              ].map(([feat, impl]) => (
                <tr key={feat}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{feat}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{impl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Database} title="Database Tables" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "scheduled_posts",
              desc: "Central queue for all scheduled content. Fields: account_id, post_type (market_report/qa_content/educational), content, scheduled_time, status (scheduled/posting/posted/failed), retry_count, recurrence_pattern, report_config, content_library_id.",
            },
            {
              title: "post_history",
              desc: "Audit trail for posted content. Fields: scheduled_post_id, account_id, platform, content, platform_post_id, platform_response, pattern_id, session_window, posted_at.",
            },
            {
              title: "social_media_accounts",
              desc: "Platform credentials. Fields: platform (twitter/instagram), account_name, credentials (encrypted JSON), is_active. Currently 1 active Twitter account.",
            },
            {
              title: "content_library",
              desc: "Reusable Q&A content pool. Fields: content_type, title, content, image_url, link_back_url, tags, post_count, last_posted_at.",
            },
            {
              title: "educational_content_pieces",
              desc: "Micro-posts chunked from learning articles. Fields: article_id, content, piece_type, sequence_number, global_order, hashtags, posted_count.",
            },
            {
              title: "educational_schedule_state",
              desc: "Per-region queue cursor. Fields: market_region, current_position, optimal_post_time_utc, timezone, last_scheduled_at.",
            },
            {
              title: "social_post_budget",
              desc: "Daily budget enforcement. Fields: platform, post_date, post_count, max_posts (25). Prevents over-posting.",
            },
            {
              title: "follow_queue",
              desc: "Drip-follow execution queue. Fields: x_user_id, username, source, status (pending/followed/skipped), followed_at.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="p-3 border rounded-lg bg-card">
              <p className="font-semibold text-sm mb-1 font-mono">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={Server} title="Admin CMS UI — /admin/social-cms" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Tab", "Component", "Purpose"].map(h => (
                  <th key={h} className="px-4 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Schedule", "MarketReportScheduler + ScheduledPostsManager", "Configure regional market reports, view/manage scheduled post queue, run scheduler manually"],
                ["Educational", "EducationalContentManager", "Generate educational micro-posts from articles, view piece inventory"],
                ["Follow Queue", "AutoFollowQueueManager", "Monitor drip-follow execution, view queue status and follow rates"],
                ["Discovery", "DiscoveryManager", "Manage seed influencers, review discovered candidates, set overlap thresholds"],
                ["Library", "ContentLibraryManager", "CRUD for reusable Q&A content, seed from quiz questions"],
                ["Accounts", "SocialAccountsManager", "Manage Twitter/Instagram account credentials and active status"],
                ["Analytics", "PostAnalytics", "View post performance, engagement metrics, posting frequency"],
              ].map(([tab, comp, purpose]) => (
                <tr key={tab}>
                  <td className="px-4 py-2 border-b font-medium text-xs">{tab}</td>
                  <td className="px-4 py-2 border-b font-mono text-xs text-primary">{comp}</td>
                  <td className="px-4 py-2 border-b text-xs text-muted-foreground">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Shield} title="Security & Credentials" />
        <div className="p-4 bg-muted rounded-lg text-sm space-y-1">
          <p>• <strong>Twitter OAuth 1.0a:</strong> TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET</p>
          <p>• <strong>Twitter OAuth 2.0 (Discovery):</strong> TWITTER_BEARER_TOKEN (App-Only for read operations)</p>
          <p>• <strong>Tweet posting:</strong> HMAC-SHA1 signature, POST to api.x.com/2/tweets</p>
          <p>• <strong>Media upload:</strong> Twitter v1.1 upload.twitter.com/1.1/media/upload.json (base64 encoding)</p>
          <p>• <strong>Instagram:</strong> Graph API v18.0 with access_token stored in social_media_accounts.credentials</p>
          <p>• <strong>AI content:</strong> GEMINI_API_KEY for market teaser generation (Gemini 2.0 Flash)</p>
          <p>• <strong>Account ID:</strong> X account 1987443987419127809</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ─── Tab: Internal Analytics ───────────────────────────────────────────────────

const AnalyticsTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Internal Analytics Architecture</CardTitle>
        <CardDescription>
          AI-driven user journey analytics, intent analysis, and unmet needs detection. Last updated: 2026-02-21.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeader icon={BarChart3} title="Analytics Data Pipeline" />
        <CodeBlock>{`Browser Events (trackEvent)
  │
  ├─► analytics_events (batched, 3s flush)
  │     ├── event_name: page.view | copilot.open | pattern_lab.run_backtest | ...
  │     ├── properties: { url, referrer, mode, instruments, ... }
  │     ├── session_id (per-tab, sessionStorage)
  │     └── user_id (auth, cached)
  │
  ├─► copilot_feedback (per-interaction, via analyze-copilot-feedback)
  │     ├── intent_category: pattern_discovery | signal_validation | ...
  │     ├── content_gap_identified: bool
  │     ├── topics: string[]
  │     └── quality_score: 1-5
  │
  └─► copilot_messages → [analyze-conversation-intents] (batch, 24h)
        ├── engagementLevel: high | medium | low | abandoned
        ├── dropOffPoint: where user stopped
        ├── contentGaps: unserved topics
        └── userSatisfactionSignal: positive | neutral | negative`}</CodeBlock>

        <SectionHeader icon={Cpu} title="AI Analysis Layer" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                {["Edge Function", "Model", "Input", "Output", "Trigger"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["analyze-copilot-feedback", "Gemini 2.0 Flash", "Single Q&A pair", "Intent, topics, gaps, quality", "Real-time (per interaction)"],
                ["analyze-conversation-intents", "Gemini 2.0 Flash", "Full conversation transcript", "Engagement, drop-offs, satisfaction", "On-demand (batch 50)"],
                ["analyze-journey-insights", "Gemini 2.0 Flash", "Aggregated events + feedback", "Unmet needs, regional insights, journey summary", "On-demand (admin click)"],
              ].map(([fn, model, input, output, trigger]) => (
                <tr key={fn}>
                  <td className="px-3 py-2 border-b font-mono text-xs text-primary">{fn}</td>
                  <td className="px-3 py-2 border-b text-xs">{model}</td>
                  <td className="px-3 py-2 border-b text-xs text-muted-foreground">{input}</td>
                  <td className="px-3 py-2 border-b text-xs">{output}</td>
                  <td className="px-3 py-2 border-b text-xs">{trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeader icon={Activity} title="Dashboard Views (/admin/journey-analytics)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { tab: "Unmet Needs Spotlight", desc: "AI-ranked user needs not being served, with severity, evidence, and actions. Powered by analyze-journey-insights." },
            { tab: "Regional Analysis", desc: "Engagement by Americas/Europe/APAC with region-specific needs and opportunities." },
            { tab: "AI Insights", desc: "Priority matrix of drop-offs, bottlenecks, and opportunities from journey flow data." },
            { tab: "User Flow", desc: "Visual journey graph: Discover → Research → Execute → Automate with conversion rates." },
            { tab: "Broken Paths", desc: "Critical path segments underperforming benchmarks, with estimated revenue loss." },
            { tab: "Segments", desc: "User cohorts: Full Journey, Executors, Researchers, Discoverers, Bounced." },
            { tab: "Copilot Intelligence", desc: "Content gaps, unserved intents, and satisfaction trends from copilot conversations." },
          ].map(({ tab, desc }) => (
            <div key={tab} className="p-3 border rounded-lg bg-card">
              <p className="font-semibold text-sm mb-1">{tab}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={TrendingUp} title="Key Metrics Tracked" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { metric: "Loop Completion Rate", desc: "% completing all 4 stages in 7 days" },
            { metric: "Health Score", desc: "0-100, based on funnel performance" },
            { metric: "Unmet Needs Count", desc: "AI-identified gaps by severity" },
            { metric: "Content Gap Index", desc: "Topics users search but we don't serve" },
            { metric: "Regional Engagement", desc: "High/Medium/Low per continent" },
            { metric: "Copilot Satisfaction", desc: "Improving/Stable/Declining trend" },
            { metric: "Drop-off Rate", desc: "Per critical journey transition" },
            { metric: "Time to Convert", desc: "Hours from first event to paid" },
          ].map(({ metric, desc }) => (
            <div key={metric} className="p-2 bg-muted rounded text-center">
              <p className="text-xs font-semibold">{metric}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <SectionHeader icon={Shield} title="Data Collection Points" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                {["Hook / Utility", "Events Tracked", "Location"].map(h => (
                  <th key={h} className="px-3 py-2 text-left border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["usePageTracking()", "page.view, page.leave (with duration)", "Layout.tsx (global)"],
                ["trackEvent('copilot.open')", "Copilot opens (manual + chart-analysis)", "TradingCopilotContext"],
                ["trackEvent('copilot.action_click')", "Action button clicks in copilot", "CopilotRichMessage"],
                ["trackEvent('pattern_lab.*')", "Mode select, run backtest", "PatternLabWizard"],
                ["trackEvent('script.generate')", "Script generation with platform metadata", "MemberScripts"],
                ["useCopilotFeedback()", "Per-interaction intent analysis", "TradingCopilot + CommandPaletteChat"],
              ].map(([hook, events, location]) => (
                <tr key={hook}>
                  <td className="px-3 py-2 border-b font-mono">{hook}</td>
                  <td className="px-3 py-2 border-b text-muted-foreground">{events}</td>
                  <td className="px-3 py-2 border-b">{location}</td>
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
          <TabsTrigger value="apac">APAC Expansion</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="copilot-ai">Copilot AI</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="social-cms">Social CMS</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="cron" className="mt-4"><CronTab /></TabsContent>
        <TabsContent value="validation" className="mt-4"><ValidationTab /></TabsContent>
        <TabsContent value="infra" className="mt-4"><InfraTab /></TabsContent>
        <TabsContent value="apac" className="mt-4"><APACTab /></TabsContent>
        <TabsContent value="notifications" className="mt-4"><NotificationTab /></TabsContent>
        <TabsContent value="copilot-ai" className="mt-4"><CopilotAITab /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
        <TabsContent value="automation" className="mt-4"><AutomationTab /></TabsContent>
        <TabsContent value="social-cms" className="mt-4"><SocialCMSTab /></TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground pt-2 border-t">
        Last updated: 2026-03-01 · Version 2.7
      </p>
    </div>
  );
};
