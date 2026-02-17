import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  ChevronRight,
  ChevronLeft,
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
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from('project_runs')
        .select('id, status, created_at, finished_at, credits_used')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setRuns(data as RunHistoryEntry[]);
      }
      setLoading(false);
    };
    fetchRuns();
  }, [currentRunId]);

  if (loading) return null;
  if (runs.length <= 1) return null;

  const currentIndex = runs.findIndex(r => r.id === currentRunId);

  if (collapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed right-4 top-20 z-40 gap-1.5 shadow-lg bg-card"
        onClick={() => setCollapsed(false)}
      >
        <History className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">History</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">{runs.length}</Badge>
      </Button>
    );
  }

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-72 border-l border-border bg-card shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Run History</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(true)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
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
                className={`w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isCurrent 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50 border border-transparent'
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
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground pl-5">
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

      <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
        {runs.length} runs total
      </div>
    </div>
  );
};

export default RunHistory;
