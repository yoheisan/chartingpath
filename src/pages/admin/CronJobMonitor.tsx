import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Play, Pause, Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, Timer, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  edge_function: string | null;
  partition: string | null;
  timeframes: string | null;
  command: string;
}

interface CronRun {
  jobid: number;
  jobname: string;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
}

// Categorize jobs by their function
function categorizeJob(job: CronJob): string {
  const fn = job.edge_function || job.jobname;
  if (fn.includes('seed')) return 'Seeding';
  if (fn.includes('scan-live') || fn.includes('check-alert')) return 'Live Scanning';
  if (fn.includes('backfill') || fn.includes('validate')) return 'Validation';
  if (fn.includes('social') || fn.includes('post-patterns') || fn.includes('educational') || fn.includes('pre-generate')) return 'Social & Content';
  if (fn.includes('cleanup') || fn.includes('purge')) return 'Maintenance';
  if (fn.includes('translation') || fn.includes('sync')) return 'Sync';
  return 'Other';
}

function getStatusColor(status: string): string {
  if (status === 'succeeded') return 'text-green-500';
  if (status === 'failed') return 'text-red-500';
  if (status === 'running') return 'text-yellow-500';
  return 'text-muted-foreground';
}

function formatSchedule(schedule: string): string {
  // Simple human-readable cron interpretation
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, dom, mon, dow] = parts;

  if (min.startsWith('*/') && hour === '*') return `Every ${min.slice(2)} min`;
  if (min.startsWith('*/')) return `Every ${min.slice(2)} min (${hour} UTC)`;
  if (hour.includes(',') || hour.includes('-')) return `${min}m @ ${hour} UTC`;
  if (hour === '*') return `At :${min.padStart(2, '0')} every hour`;
  return `${hour}:${min.padStart(2, '0')} UTC daily`;
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CronJobMonitor() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleDialog, setRescheduleDialog] = useState<{ job: CronJob; newSchedule: string } | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: jobsData } = await supabase.rpc('get_cron_jobs');
      const { data: runsData } = await supabase.rpc('get_cron_run_details');
      if (jobsData) setJobs(jobsData as any);
      if (runsData) setRuns(runsData as any);
    } catch (err: any) {
      toast({ title: 'Error loading cron data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build per-job last run info
  const lastRunByJob = new Map<number, CronRun>();
  const failCountByJob = new Map<number, number>();
  for (const run of runs) {
    if (!lastRunByJob.has(run.jobid)) lastRunByJob.set(run.jobid, run);
    if (run.status === 'failed') {
      failCountByJob.set(run.jobid, (failCountByJob.get(run.jobid) || 0) + 1);
    }
  }

  const handleToggle = async (job: CronJob) => {
    const newActive = !job.active;
    try {
      if (newActive) {
        await supabase.rpc('activate_cron_job', { p_jobid: job.jobid });
      } else {
        await supabase.rpc('deactivate_cron_job', { p_jobid: job.jobid });
      }
      setJobs(prev => prev.map(j => j.jobid === job.jobid ? { ...j, active: newActive } : j));
      toast({ title: `Job ${newActive ? 'activated' : 'deactivated'}`, description: job.jobname });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog) return;
    try {
      await supabase.rpc('reschedule_cron_job', { 
        p_jobid: rescheduleDialog.job.jobid, 
        p_schedule: rescheduleDialog.newSchedule 
      });
      setJobs(prev => prev.map(j => 
        j.jobid === rescheduleDialog.job.jobid ? { ...j, schedule: rescheduleDialog.newSchedule } : j
      ));
      toast({ title: 'Job rescheduled', description: `${rescheduleDialog.job.jobname} → ${rescheduleDialog.newSchedule}` });
      setRescheduleDialog(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRunNow = async (job: CronJob) => {
    try {
      await supabase.rpc('run_cron_job_now', { p_jobid: job.jobid });
      toast({ title: 'Job triggered', description: job.jobname });
    } catch (err: any) {
      toast({ title: 'Error triggering job', description: err.message, variant: 'destructive' });
    }
  };

  // Summary stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.active).length;
  const inactiveJobs = totalJobs - activeJobs;
  const recentFailures = runs.filter(r => r.status === 'failed').length;

  // Group by category
  const categories = new Map<string, CronJob[]>();
  for (const job of jobs) {
    const cat = categorizeJob(job);
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(job);
  }

  // Flagged jobs: inactive or recent failures
  const flaggedJobs = jobs.filter(j => {
    if (!j.active) return true;
    const fails = failCountByJob.get(j.jobid) || 0;
    return fails >= 3;
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Admin Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cron Job Monitor</h1>
            <p className="text-muted-foreground mt-1">Monitor, manage, and recover scheduled jobs</p>
          </div>
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-500">{activeJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Inactive</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-500">{inactiveJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Recent Failures</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-500">{recentFailures}</p>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Jobs Alert */}
      {flaggedJobs.length > 0 && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {flaggedJobs.length} Flagged Job{flaggedJobs.length > 1 ? 's' : ''} — Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flaggedJobs.map(job => {
                const fails = failCountByJob.get(job.jobid) || 0;
                return (
                  <div key={job.jobid} className="flex items-center justify-between py-2 px-3 rounded-md bg-background/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={job.active ? 'default' : 'destructive'} className="text-xs">
                        {job.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="font-mono text-sm">{job.jobname}</span>
                      {fails >= 3 && (
                        <Badge variant="destructive" className="text-xs">{fails} failures</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleToggle(job)}>
                        {job.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRunNow(job)}>
                        <Zap className="h-3 w-3 mr-1" /> Run Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Jobs ({totalJobs})</TabsTrigger>
          {[...categories.entries()].map(([cat, catJobs]) => (
            <TabsTrigger key={cat} value={cat}>{cat} ({catJobs.length})</TabsTrigger>
          ))}
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        {/* All Jobs + Category Tabs */}
        {['all', ...categories.keys()].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Active</TableHead>
                      <TableHead>Job Name</TableHead>
                      <TableHead>Edge Function</TableHead>
                      <TableHead>Partition</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tab === 'all' ? jobs : categories.get(tab) || []).map(job => {
                      const lastRun = lastRunByJob.get(job.jobid);
                      const fails = failCountByJob.get(job.jobid) || 0;
                      return (
                        <TableRow 
                          key={job.jobid} 
                          className={cn(
                            !job.active && 'opacity-50',
                            fails >= 3 && 'bg-red-500/5'
                          )}
                        >
                          <TableCell>
                            <Switch 
                              checked={job.active} 
                              onCheckedChange={() => handleToggle(job)}
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{job.jobname}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {job.edge_function || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {job.partition && (
                                <Badge variant="outline" className="text-xs">{job.partition}</Badge>
                              )}
                              {job.timeframes && (
                                <Badge variant="secondary" className="text-xs">{job.timeframes.replace(/"/g, '')}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-mono">{job.schedule}</span>
                              <span className="text-xs text-muted-foreground">{formatSchedule(job.schedule)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lastRun ? (
                              <span className="text-xs text-muted-foreground">{timeSince(lastRun.start_time)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lastRun ? (
                              <div className="flex items-center gap-1">
                                {lastRun.status === 'succeeded' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                ) : lastRun.status === 'failed' ? (
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <Timer className="h-3.5 w-3.5 text-yellow-500" />
                                )}
                                <span className={cn("text-xs", getStatusColor(lastRun.status))}>
                                  {lastRun.status}
                                </span>
                                {fails >= 3 && (
                                  <Badge variant="destructive" className="text-sm ml-1">{fails}×</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs"
                                onClick={() => setRescheduleDialog({ job, newSchedule: job.schedule })}
                              >
                                <Clock className="h-3 w-3 mr-1" /> Reschedule
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs"
                                onClick={() => handleRunNow(job)}
                              >
                                <Zap className="h-3 w-3 mr-1" /> Run
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Run History Tab */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.slice(0, 50).map((run, i) => {
                    const duration = run.end_time && run.start_time 
                      ? Math.round((new Date(run.end_time).getTime() - new Date(run.start_time).getTime())) 
                      : null;
                    return (
                      <TableRow key={`${run.jobid}-${i}`}>
                        <TableCell>
                          <span className="font-mono text-sm">{run.jobname}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {run.status === 'succeeded' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : run.status === 'failed' ? (
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Timer className="h-3.5 w-3.5 text-yellow-500" />
                            )}
                            <span className={cn("text-xs", getStatusColor(run.status))}>
                              {run.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {timeSince(run.start_time)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {duration != null ? `${duration}ms` : '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                            {run.return_message || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule: {rescheduleDialog?.job.jobname}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Current Schedule</label>
              <p className="text-sm text-muted-foreground font-mono">{rescheduleDialog?.job.schedule}</p>
              <p className="text-xs text-muted-foreground">{rescheduleDialog ? formatSchedule(rescheduleDialog.job.schedule) : ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium">New Schedule (cron expression)</label>
              <Input 
                value={rescheduleDialog?.newSchedule || ''} 
                onChange={e => setRescheduleDialog(prev => prev ? { ...prev, newSchedule: e.target.value } : null)}
                placeholder="*/15 * * * *"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog(null)}>Cancel</Button>
            <Button onClick={handleReschedule}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
