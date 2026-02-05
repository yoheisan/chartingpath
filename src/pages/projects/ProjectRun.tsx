import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Clock, AlertCircle, FlaskConical, Search, PieChart, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SetupListViewer from '@/components/projects/SetupListViewer';
import PatternLabViewer from '@/components/projects/PatternLabViewer';
import PortfolioCheckupViewer from '@/components/projects/PortfolioCheckupViewer';
import PortfolioSimViewer from '@/components/projects/PortfolioSimViewer';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';

interface ProjectRun {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  creditsEstimated: number;
  creditsUsed: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
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

const ProjectRun = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  
  const [run, setRun] = useState<ProjectRun | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [artifact, setArtifact] = useState<SetupArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch run status
  const fetchRun = async () => {
    if (!runId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Redirect to auth if no session - this endpoint requires authentication
      if (!session?.access_token) {
        navigate('/auth', { state: { returnTo: `/projects/runs/${runId}` } });
        return;
      }
      
      const response = await fetch(
        `https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/result?runId=${runId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle 401 specifically - session might have expired
        if (response.status === 401) {
          navigate('/auth', { state: { returnTo: `/projects/runs/${runId}` } });
          return;
        }
        throw new Error(data.error || 'Failed to fetch run');
      }
      
      setRun(data.run);
      setProject(data.project);
      setArtifact(data.artifact);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch run');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch and polling
  useEffect(() => {
    fetchRun();
    
    // Poll while queued or running
    const interval = setInterval(() => {
      if (run?.status === 'queued' || run?.status === 'running') {
        fetchRun();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [runId, run?.status]);
  
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects/pattern-lab/new')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pattern Lab
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => {
              // Pass artifact inputs to pre-fill the form for easy re-runs
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
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pattern Lab
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                {project?.type === 'pattern_lab' && <FlaskConical className="h-8 w-8 text-primary" />}
                {project?.type === 'setup_finder' && <Search className="h-8 w-8 text-primary" />}
                {project?.type === 'portfolio_checkup' && <PieChart className="h-8 w-8 text-primary" />}
                {project?.type === 'portfolio_sim' && <TrendingUp className="h-8 w-8 text-primary" />}
                <h1 className="text-2xl font-bold text-foreground">
                  {project?.type === 'pattern_lab' ? 'Pattern Lab' : 
                   project?.type === 'setup_finder' ? 'Setup Finder' : 
                   project?.type === 'portfolio_checkup' ? 'Portfolio Checkup' :
                   project?.type === 'portfolio_sim' ? 'Portfolio Simulator' :
                   project?.name || 'Project Run'}
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
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {run.status === 'queued' ? 'Waiting in queue...' : 'Scanning markets...'}
                </h3>
                <p className="text-muted-foreground">
                  This may take a few moments depending on the number of instruments
                </p>
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
        
        {/* Artifact Viewer */}
        {run?.status === 'succeeded' && artifact && (
          <>
            {artifact.projectType === 'pattern_lab' && (
              <PatternLabViewer artifact={artifact as any} runId={runId!} />
            )}
            {artifact.projectType === 'portfolio_checkup' && (
              <PortfolioCheckupViewer artifact={artifact as any} runId={runId!} />
            )}
            {artifact.projectType === 'portfolio_sim' && (
              <PortfolioSimViewer artifact={artifact as any} runId={runId!} />
            )}
            {(artifact.projectType === 'setup_finder' || !artifact.projectType) && (
              <SetupListViewer artifact={artifact} runId={runId!} />
            )}
            
            {/* Compliance: Disclaimer Banner */}
            <DisclaimerBanner className="mt-8" />
          </>
        )}
        
        {/* Empty State - only show for setup_finder with no setups */}
        {run?.status === 'succeeded' && artifact?.projectType === 'setup_finder' && (!artifact.setups || artifact.setups.length === 0) && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Setups Found</h3>
                <p className="text-muted-foreground mb-4">
                  No patterns were detected in the selected universe and timeframe.
                </p>
                <Button onClick={() => navigate('/projects/pattern-lab/new')}>
                  Try Different Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectRun;
