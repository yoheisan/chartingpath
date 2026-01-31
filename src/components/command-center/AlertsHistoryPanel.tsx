import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface AlertsHistoryPanelProps {
  userId?: string;
}

interface AlertLog {
  id: string;
  alert_id: string;
  triggered_at: string | null;
  pattern_data: any;
  price_data: any;
  alerts: {
    symbol: string;
    pattern: string;
    timeframe: string;
    status: string;
  } | null;
  alert_outcomes: {
    outcome_type: string;
    pnl_percentage: number | null;
  }[] | null;
}

export function AlertsHistoryPanel({ userId }: AlertsHistoryPanelProps) {
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAlertLogs();
    }
  }, [userId]);

  const fetchAlertLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts_log')
        .select(`
          id,
          alert_id,
          triggered_at,
          pattern_data,
          price_data,
          alerts!inner(symbol, pattern, timeframe, status, user_id),
          alert_outcomes(outcome_type, pnl_percentage)
        `)
        .eq('alerts.user_id', userId)
        .order('triggered_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setAlertLogs((data as unknown as AlertLog[]) || []);
    } catch (err) {
      console.error('[AlertsHistoryPanel] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeIcon = (outcome?: string) => {
    if (!outcome) return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    if (outcome === 'win') return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    if (outcome === 'loss') return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const formatPatternName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="h-full flex flex-col border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Bell className="h-4 w-4" />
          Alerts History
        </h3>
        <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
          <Link to="/members/alerts">
            View All
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!userId ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Sign in to view your alerts</p>
            </div>
          ) : loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Loading alerts...
            </div>
          ) : alertLogs.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No triggered alerts yet</p>
              <Button variant="link" size="sm" className="text-xs mt-1" asChild>
                <Link to="/members/alerts">Set up alerts</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {alertLogs.map((log) => {
                const outcome = log.alert_outcomes?.[0];
                const alert = log.alerts;
                
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {getOutcomeIcon(outcome?.outcome_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{alert?.symbol}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {alert?.timeframe}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {formatPatternName(alert?.pattern || '')}
                      </div>
                    </div>
                    <div className="text-right">
                      {outcome?.pnl_percentage !== null && outcome?.pnl_percentage !== undefined ? (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            outcome.pnl_percentage >= 0 ? 'text-emerald-500' : 'text-red-500'
                          )}
                        >
                          {outcome.pnl_percentage >= 0 ? '+' : ''}
                          {outcome.pnl_percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">
                          Pending
                        </Badge>
                      )}
                      <div className="text-[9px] text-muted-foreground">
                        {log.triggered_at
                          ? formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
