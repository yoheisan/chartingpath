import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Clock, AlertCircle, FlaskConical, Zap, Code2, Bell, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PatternLabViewer from '@/components/projects/PatternLabViewer';
import RunHistory from '@/components/projects/RunHistory';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { GradeBadge, extractGrade } from '@/components/ui/GradeBadge';
import { savePlaybookContextStatic } from '@/hooks/usePlaybookContext';
import { trackEvent } from '@/lib/analytics';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface ExecutionMetadata {
  progress?: number;
  currentStep?: string;
  instrumentsProcessed?: number;
  instrumentsTotal?: number;
  patternsTotal?: number;
}

interface ProjectRun {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  creditsEstimated: number;
  creditsUsed: number | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  executionMetadata: ExecutionMetadata | null;
}

interface Project {
  id: string;
  name: string;
  type: string;
}

interface SetupArtifact {
  projectType: string;
  timeframe: string;
  lookbackYears?: number;
  riskPerTrade?: number;
  generatedAt: string;
  inputs?: {
    instruments: string[];
    patterns: string[];
    gradeFilter: string[];
    riskPerTrade?: number;
  };
  executionAssumptions: {
    bracketLevelsVersion: string;
    priceRounding: { priceDecimals: number; rrDecimals: number };
    riskPerTrade?: number;
  };
  setups: Array<{
    instrument: string;
    patternId: string;
    patternName: string;
    direction: 'long' | 'short';
    signalTs: string;
    quality: { score: string; reasons: string[] };
    tradePlan: {
      entryType: string;
      entry: number;
      stopLoss: number;
      takeProfit: number;
      rr: number;
      stopDistance: number;
      tpDistance: number;
      timeStopBars: number;
      bracketLevelsVersion: string;
      priceRounding: { priceDecimals: number; rrDecimals: number };
    };
    visualSpec: null;
  }>;
}

const TERMINAL_STATUSES = new Set(['succeeded', 'failed']);

const ProjectRun = () => {
  const { t } = useTranslation();
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const previousMetrics = (location.state as any)?.previousMetrics ?? null;
  const locationMode = (location.state as any)?.mode as 'validate' | 'automate' | null;
  const fromAgentScoring = (location.state as any)?.fromAgentScoring === true;
  const [mode] = useState<'validate' | 'automate' | null>(locationMode);
  const isValidate = mode === 'validate';
  const [showFullAnalysis, setShowFullAnalysis] = useState(true);
  
  const [run, setRun] = useState<ProjectRun | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [artifact, setArtifact] = useState<SetupArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  
  // Refs to avoid stale closures and track polling state
  const runRef = useRef<ProjectRun | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pollIntervalMs = useRef(2000);
  const isMountedRef = useRef(true);
  const fetchCountRef = useRef(0);
  
  // Keep ref in sync (backup for external state changes)
  useEffect(() => { runRef.current = run; }, [run]);
  
  // Core fetch function — always reads latest runId from params
  const fetchRun = useCallback(async (isInitial = false) => {
    if (!runId || !isMountedRef.current) return;
    
    // Safety timeout: ensure loading never hangs forever
    const safetyTimeout = isInitial ? setTimeout(() => {
      if (isMountedRef.current) {
        console.warn('[ProjectRun] Safety timeout — fetch took too long');
        setLoading(false);
        setError('Loading took too long. Please refresh or click Retry.');
      }
    }, 20_000) : undefined;
    
    try {
      console.debug('[ProjectRun] fetchRun start', { isInitial, runId });
      
      // Wrap getSession in a timeout to prevent auth hangs
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth session timeout')), 8000)
      );
      const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]);
      
      if (!session?.access_token) {
        navigate('/auth', { state: { returnTo: `/projects/runs/${runId}` } });
        return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(
        `https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/result?runId=${runId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!isMountedRef.current) return;
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/auth', { state: { returnTo: `/projects/runs/${runId}` } });
          return;
        }
        throw new Error(data.error || 'Failed to fetch run');
      }
      
      fetchCountRef.current += 1;
      
      // Always update state and ref with latest data
      runRef.current = data.run; // Update ref immediately so scheduleNextPoll sees terminal status
      setRun(data.run);
      setProject(data.project);
      setArtifact(data.artifact);
      setError(null);
      
      // Reset poll interval on successful fetch
      pollIntervalMs.current = 2000;
      
      console.log(`[ProjectRun] fetch #${fetchCountRef.current}: status=${data.run?.status}, progress=${data.run?.executionMetadata?.progress ?? '-'}`);
      
      // Client-side stale detection: fail fast if run is stuck in queued/running.
      if (data.run?.status === 'queued' && data.run?.createdAt) {
        const queuedAge = Date.now() - new Date(data.run.createdAt).getTime();
        if (queuedAge > 45_000) {
          console.warn(`[ProjectRun] Queued run stale (${Math.round(queuedAge / 1000)}s old).`);
          setRun({
            ...data.run,
            status: 'failed',
            errorMessage: 'Run did not start in time. Please retry with fewer instruments/patterns or try again shortly.',
          });
          runRef.current = { ...data.run, status: 'failed' };
          return;
        }
      }

      if (data.run?.status === 'running' && data.run?.executionMetadata?.heartbeatAt) {
        const heartbeatAge = Date.now() - new Date(data.run.executionMetadata.heartbeatAt).getTime();
        if (heartbeatAge > 60_000) {
          console.warn(`[ProjectRun] Stale heartbeat detected (${Math.round(heartbeatAge / 1000)}s old). Run likely timed out.`);
          setRun({
            ...data.run,
            status: 'failed',
            errorMessage: 'Run timed out — the server stopped responding. Try fewer instruments or a shorter lookback period.',
          });
          runRef.current = { ...data.run, status: 'failed' };
          return;
        }
      }
      
    } catch (err) {
      console.error('[ProjectRun] Fetch error:', err);
      if (!isMountedRef.current) return;
      
      if (err instanceof DOMException && err.name === 'AbortError') {
        // On timeout, back off but don't show error for background polls
        if (isInitial) {
          setError('Request timed out. The server may be busy — click Retry.');
        }
        // Exponential backoff on timeout
        pollIntervalMs.current = Math.min(pollIntervalMs.current * 1.5, 15000);
      } else if (isInitial) {
        setError(err instanceof Error ? err.message : 'Failed to fetch run');
      }
    } finally {
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [runId, navigate]);
  
  // Schedule next poll (only if not in terminal state)
  const scheduleNextPoll = useCallback(() => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    
    const currentRun = runRef.current;
    if (currentRun && TERMINAL_STATUSES.has(currentRun.status)) {
      console.log(`[ProjectRun] Terminal status "${currentRun.status}" — stopping polls`);
      return;
    }
    
    pollTimeoutRef.current = setTimeout(async () => {
      await fetchRun(false);
      if (isMountedRef.current) {
        scheduleNextPoll();
      }
    }, pollIntervalMs.current);
  }, [fetchRun]);
  
  // Primary: Supabase Realtime subscription + fallback polling
  useEffect(() => {
    if (!runId) return;
    
    isMountedRef.current = true;
    fetchCountRef.current = 0;
    pollIntervalMs.current = 2000;
    
    // Initial fetch
    fetchRun(true).then(() => {
      if (isMountedRef.current) {
        scheduleNextPoll();
      }
    });
    
    // Realtime subscription for instant updates
    const channel = supabase
      .channel(`project_run:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_runs',
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          console.log('[ProjectRun] Realtime update received:', payload.new?.status);
          // On realtime update, immediately fetch full data (includes artifact)
          fetchRun(false);
          pollIntervalMs.current = 2000; // Reset backoff
        }
      )
      .subscribe((status) => {
        console.log('[ProjectRun] Realtime channel status:', status);
      });
    
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [runId, fetchRun, scheduleNextPoll]);
  
  // Live-ticking elapsed timer
  useEffect(() => {
    if (!run?.startedAt || (run.status !== 'queued' && run.status !== 'running')) return;
    const start = new Date(run.startedAt).getTime();
    const tick = () => setElapsed(Math.round((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [run?.startedAt, run?.status]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'queued':
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <Clock className="h-3 w-3 mr-1" />
            Queued
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(fromAgentScoring ? '/tools/agent-scoring' : '/projects/pattern-lab/new')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromAgentScoring ? 'Back to Agent Scoring' : 'Back to Pattern Lab'}
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); setError(null); fetchRun(true); }} className="ml-4 shrink-0">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Run History Sidebar */}
      <RunHistory currentRunId={runId!} />

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (fromAgentScoring) {
                navigate('/tools/agent-scoring');
              } else {
                const inputs = artifact?.inputs;
                navigate('/projects/pattern-lab/new', {
                  state: inputs ? {
                    instruments: inputs.instruments,
                    patterns: inputs.patterns,
                    gradeFilter: inputs.gradeFilter,
                    timeframe: artifact?.timeframe,
                    lookbackYears: artifact?.lookbackYears,
                    riskPerTrade: inputs.riskPerTrade ?? artifact?.riskPerTrade ?? 1,
                  } : undefined
                });
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromAgentScoring ? 'Back to Agent Scoring' : 'Back to Pattern Lab'}
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <FlaskConical className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  {project?.type === 'pattern_lab' ? 'Pattern Lab' : project?.name || 'Project Run'}
                </h1>
              </div>
            </div>
            {run && getStatusBadge(run.status)}
          </div>
        </div>
        
        {/* Status Card */}
        {(run?.status === 'queued' || run?.status === 'running') && (
          <Card className="border-primary/20 bg-primary/5 mb-8">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  {run.status === 'queued' ? 'Waiting in queue...' : 'Scanning markets...'}
                </h3>

                {run.status === 'running' && run.executionMetadata ? (
                  <div className="w-full max-w-lg mt-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-foreground">{run.executionMetadata.currentStep || 'Processing...'}</span>
                        <span className="text-primary">{run.executionMetadata.progress ?? 0}%</span>
                      </div>
                      <Progress value={Math.max(run.executionMetadata.progress ?? 0, 2)} className="h-2.5" />
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                      {run.executionMetadata.instrumentsTotal && (
                        <span>
                          <span className="font-medium text-foreground">{run.executionMetadata.instrumentsProcessed ?? 0}</span>
                          /{run.executionMetadata.instrumentsTotal} instruments
                          {run.executionMetadata.patternsTotal ? ` × ${run.executionMetadata.patternsTotal} patterns` : ''}
                        </span>
                      )}
                      {run.startedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm mt-1">
                    This may take a few moments depending on the number of instruments
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Failed State */}
        {run?.status === 'failed' && (
          <Alert variant="destructive" className="mb-8">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Run Failed</AlertTitle>
            <AlertDescription>
              {run.errorMessage || 'An unexpected error occurred during execution.'}
            </AlertDescription>
          </Alert>
        )}
        {/* Run Stats */}
        {run && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Run Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{run.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Estimated</p>
                  <p className="font-medium">{run.creditsEstimated}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Used</p>
                  <p className="font-medium">{run.creditsUsed ?? '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {run.startedAt && run.finishedAt
                      ? `${Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Verdict Card — Validate mode only */}
        {run?.status === 'succeeded' && artifact && isValidate && (() => {
          // Compute verdict from first setup's aggregate stats
          const setups = artifact.setups || [];
          const firstSetup = setups[0];
          const grade = firstSetup ? extractGrade(firstSetup.quality) : 'C';
          // We don't have win rate directly here — it's computed in the viewer
          // Show a prominent signal context card as verdict
          return (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Signal Validated</h3>
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      {firstSetup && (
                        <>
                          <span className="font-medium">{firstSetup.instrument?.replace('=X', '').replace('=F', '').replace('-USD', '')}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{firstSetup.patternName}</span>
                          <GradeBadge grade={grade} size="sm" />
                        </>
                      )}
                    </div>
                    {firstSetup?.tradePlan && (
                      <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-background/50 border border-border/50 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Entry</p>
                          <p className="font-mono font-medium">{firstSetup.tradePlan.entry}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Stop Loss</p>
                          <p className="font-mono font-medium text-destructive">{firstSetup.tradePlan.stopLoss}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Take Profit</p>
                          <p className="font-mono font-medium text-green-500">{firstSetup.tradePlan.takeProfit}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 mt-4 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => {
                          trackEvent('pattern_lab.validate_verdict', { grade, instrument: firstSetup?.instrument });
                          // Save playbook context for pre-filling alerts
                          if (firstSetup) {
                            savePlaybookContextStatic({
                              symbol: firstSetup.instrument,
                              pattern: firstSetup.patternId,
                              timeframe: artifact.timeframe || '',
                              instrumentCategory: '',
                              autoPaperTrade: true,
                              source: 'pattern-lab',
                            });
                          }
                          navigate('/alerts');
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {t('alerts.deployAsAlert', 'Deploy as Alert')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          trackEvent('pattern_lab.promote_to_automate', {
                            instrument: firstSetup?.instrument,
                            pattern: firstSetup?.patternId,
                          });
                          // Navigate back to Pattern Lab with automate mode + all context preserved
                          const inputs = artifact.inputs;
                          navigate('/projects/pattern-lab/new?mode=automate', {
                            state: inputs ? {
                              instruments: inputs.instruments,
                              patterns: inputs.patterns,
                              gradeFilter: inputs.gradeFilter,
                              timeframe: artifact.timeframe,
                              lookbackYears: artifact.lookbackYears,
                              riskPerTrade: inputs.riskPerTrade ?? artifact.riskPerTrade ?? 1,
                            } : undefined,
                          });
                        }}
                      >
                        <Code2 className="h-4 w-4 mr-2" />
                        Promote to Automation
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Artifact Viewer */}
        {run?.status === 'succeeded' && artifact && (
          <>
            {isValidate ? (
              <Collapsible open={showFullAnalysis} onOpenChange={setShowFullAnalysis}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="mb-4 w-full justify-between text-muted-foreground">
                    {showFullAnalysis ? 'Hide' : 'See'} Full Analysis
                    {showFullAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <PatternLabViewer artifact={artifact as any} runId={runId!} previousMetrics={previousMetrics} />
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <PatternLabViewer artifact={artifact as any} runId={runId!} previousMetrics={previousMetrics} />
            )}

            {/* Add winners to Trading Plan */}
            {(() => {
              const winners = (artifact.patterns || []).filter(
                (p: any) => p.expectancy > 0 && p.totalTrades >= 10
              );
              if (winners.length === 0) return null;
              const winnerNames = winners.map((p: any) => p.patternName);
              const winnerIds = winners.map((p: any) => p.patternId);
              return (
                <Card className="mt-6 border-primary/20 bg-primary/5">
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Patterns with a proven edge</h3>
                        <p className="text-xs text-muted-foreground">
                          {winnerNames.join(', ')} — positive expectancy with ≥10 trades
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const { data: { session: freshSession } } = await supabase.auth.getSession();
                            if (!freshSession?.user) {
                              toast.error('Please sign in first');
                              return;
                            }
                            // Fetch existing plan
                            const { data: existingPlan } = await supabase
                              .from('master_plans')
                              .select('id, preferred_patterns')
                              .eq('user_id', freshSession.user.id)
                              .eq('is_active', true)
                              .maybeSingle();

                            const currentPatterns: string[] = (existingPlan?.preferred_patterns as string[]) || [];
                            const merged = [...new Set([...currentPatterns, ...winnerIds])];

                            if (existingPlan) {
                              await supabase
                                .from('master_plans')
                                .update({ preferred_patterns: merged })
                                .eq('id', existingPlan.id);
                            } else {
                              await supabase
                                .from('master_plans')
                                .insert({
                                  user_id: freshSession.user.id,
                                  preferred_patterns: merged,
                                  is_active: true,
                                });
                            }

                            trackEvent('pattern_lab.send_winners_to_plan', {
                              patterns: winnerIds.join(','),
                              count: winnerIds.length,
                            });
                            toast.success(`Added ${winnerNames.join(', ')} to your Trading Plan`);
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to update Trading Plan');
                          }
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Add to Trading Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <DisclaimerBanner className="mt-8" />
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default ProjectRun;

