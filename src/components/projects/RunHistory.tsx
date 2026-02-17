import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RunHistoryEntry {
  id: string;
  status: string;
  created_at: string;
  finished_at: string | null;
  credits_used: number;
}

interface RunHistoryProps {
  currentRunId: string;
}

const statusIcon: Record<string, React.ReactNode> = {
  succeeded: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  failed: <XCircle className="h-3 w-3 text-destructive" />,
  running: <Loader2 className="h-3 w-3 text-primary animate-spin" />,
  queued: <Clock className="h-3 w-3 text-muted-foreground" />,
};

const RunHistory = ({ currentRunId }: RunHistoryProps) => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[RunHistory] No session, skipping');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('project_runs')
          .select('id, status, created_at, finished_at, credits_used')
          .order('created_at', { ascending: false })
          .limit(30);

        console.log('[RunHistory] fetched:', data?.length ?? 0, 'error:', error?.message ?? 'none');
        
        if (!error && data) {
          setRuns(data as RunHistoryEntry[]);
        }
      } catch (e) {
        console.error('[RunHistory] exception:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, [currentRunId]);

  if (loading) return <div className="mb-4 text-xs text-muted-foreground">Loading run history...</div>;
  if (runs.length <= 1) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5" />
            <span>Run History</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{runs.length}</Badge>
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-lg border border-border bg-card/50 overflow-hidden">
          <ScrollArea className="max-h-64">
            <div className="p-2 space-y-0.5">
              {runs.map((run, idx) => {
                const isCurrent = run.id === currentRunId;
                const timeAgo = formatDistanceToNow(new Date(run.created_at), { addSuffix: true });
                
                return (
                  <button
                    key={run.id}
                    onClick={() => {
                      if (!isCurrent) navigate(`/projects/runs/${run.id}`);
                    }}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                      isCurrent 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50 border border-transparent cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {statusIcon[run.status] ?? <Clock className="h-3 w-3" />}
                      <span className={`flex-1 truncate ${isCurrent ? 'font-semibold text-primary' : 'text-foreground'}`}>
                        Run #{runs.length - idx}
                      </span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-[10px] px-1.5 h-4">current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground pl-5">
                      <span>{timeAgo}</span>
                      {run.credits_used > 0 && (
                        <span>· {run.credits_used} credits</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default RunHistory;
