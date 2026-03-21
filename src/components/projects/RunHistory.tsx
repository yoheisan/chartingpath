import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface RunHistoryEntry {
  id: string;
  status: string;
  created_at: string;
  finished_at: string | null;
  credits_used: number;
  name: string | null;
}

interface RunHistoryProps {
  currentRunId: string;
}

const statusIcon: Record<string, React.ReactNode> = {
  succeeded: <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />,
  running: <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />,
  queued: <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
};

const RunHistory = ({ currentRunId }: RunHistoryProps) => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('project_runs')
          .select('id, status, created_at, finished_at, credits_used, name')
          .order('created_at', { ascending: false })
          .limit(30);

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

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (run: RunHistoryEntry, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(run.id);
    setEditValue(run.name ?? `Run #${runs.length - idx}`);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditValue('');
  };

  const saveRename = async (runId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = editValue.trim();
    if (!trimmed) { cancelEditing(); return; }

    const { error } = await supabase
      .from('project_runs')
      .update({ name: trimmed })
      .eq('id', runId);

    if (error) {
      toast.error('Failed to rename run');
    } else {
      setRuns(prev => prev.map(r => r.id === runId ? { ...r, name: trimmed } : r));
      toast.success('Run renamed');
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, runId: string) => {
    if (e.key === 'Enter') saveRename(runId);
    if (e.key === 'Escape') cancelEditing();
  };

  if (loading || runs.length <= 1) return null;

  return (
    <div
      className={`relative flex flex-col border-r border-border bg-card/50 transition-all duration-300 shrink-0 ${
        collapsed ? 'w-10' : 'w-60'
      }`}
      style={{ minHeight: '100%' }}
    >
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-4 z-10 h-7 w-7 rounded-full border border-border bg-card shadow-sm hover:bg-muted"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </Button>

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-3 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
        <History className="h-4 w-4 text-muted-foreground shrink-0" />
        {!collapsed && (
          <>
            <span className="text-sm font-medium text-foreground">Run History</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-auto">{runs.length}</Badge>
          </>
        )}
      </div>

      {/* Run list */}
      {!collapsed && (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {runs.map((run, idx) => {
              const isCurrent = run.id === currentRunId;
              const isEditing = editingId === run.id;
              const displayName = run.name ?? `Run #${runs.length - idx}`;
              const timeAgo = formatDistanceToNow(new Date(run.created_at), { addSuffix: true });

              return (
                <div
                  key={run.id}
                  onClick={() => { if (!isCurrent && !isEditing) navigate(`/projects/runs/${run.id}`); }}
                  className={`group w-full text-left rounded-md px-2.5 py-2 text-sm transition-colors ${
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/60 border border-transparent cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {statusIcon[run.status] ?? <Clock className="h-3.5 w-3.5 shrink-0" />}

                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => handleKeyDown(e, run.id)}
                          className="h-5 px-1 text-xs flex-1 min-w-0"
                        />
                        <button
                          onClick={e => saveRename(run.id, e)}
                          className="text-green-500 hover:text-green-400 shrink-0"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => cancelEditing(e)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 truncate text-xs ${isCurrent ? 'font-semibold text-primary' : 'text-foreground'}`}>
                          {displayName}
                        </span>
                        <button
                          onClick={e => startEditing(run, idx, e)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
                          title="Rename run"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {isCurrent && (
                          <Badge variant="outline" className="text-sm px-1 h-4 shrink-0">now</Badge>
                        )}
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="text-sm text-muted-foreground mt-0.5 pl-5 truncate">
                      {timeAgo}
                      {run.credits_used > 0 && ` · ${run.credits_used}cr`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Collapsed: show only status dots */}
      {collapsed && (
        <ScrollArea className="flex-1">
          <div className="py-2 flex flex-col items-center gap-1.5">
            {runs.map((run) => {
              const isCurrent = run.id === currentRunId;
              return (
                <button
                  key={run.id}
                  onClick={() => { if (!isCurrent) navigate(`/projects/runs/${run.id}`); }}
                  title={run.name ?? run.status}
                  className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                    isCurrent ? 'bg-primary/20 ring-1 ring-primary/40' : 'hover:bg-muted/60'
                  }`}
                >
                  {statusIcon[run.status] ?? <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default RunHistory;
