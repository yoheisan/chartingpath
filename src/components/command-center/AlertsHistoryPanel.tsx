import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MasterPlan } from '@/hooks/useMasterPlan';

interface AlertsHistoryPanelProps {
  userId?: string;
  onSymbolSelect?: (symbol: string) => void;
  activePlan?: MasterPlan | null;
  plans?: MasterPlan[];
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
    master_plan_id: string | null;
  } | null;
  alert_outcomes: {
    outcome_type: string;
    pnl_percentage: number | null;
  }[] | null;
}

interface ConfiguredAlert {
  id: string;
  symbol: string;
  pattern: string;
  timeframe: string;
  status: string;
  created_at: string | null;
  master_plan_id: string | null;
}

export function AlertsHistoryPanel({ userId, onSymbolSelect, activePlan, plans }: AlertsHistoryPanelProps) {
  const { t } = useTranslation();
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [configuredAlerts, setConfiguredAlerts] = useState<ConfiguredAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>('all');

  useEffect(() => {
    if (userId) {
      fetchAlertLogs();
      fetchConfiguredAlerts();
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
          alerts!inner(symbol, pattern, timeframe, status, user_id, master_plan_id),
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

  const fetchConfiguredAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, symbol, pattern, timeframe, status, created_at, master_plan_id')
        .eq('user_id', userId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setConfiguredAlerts((data as ConfiguredAlert[]) || []);
    } catch (err) {
      console.error('[AlertsHistoryPanel] configured alerts fetch error:', err);
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

  const getPlanName = (planId: string | null) => {
    if (!planId || !plans?.length) return null;
    const plan = plans.find(p => p.id === planId);
    return plan?.name || null;
  };

  // Filter alerts by selected plan
  const filteredLogs = planFilter === 'all'
    ? alertLogs
    : alertLogs.filter(log => log.alerts?.master_plan_id === planFilter);

  const filteredConfigured = planFilter === 'all'
    ? configuredAlerts
    : configuredAlerts.filter(a => a.master_plan_id === planFilter);

  return (
    <div className="h-full flex flex-col border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Bell className="h-4 w-4" />
          {t('commandCenter.alertsHistory')}
        </h3>
        <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
          <Link to="/members/alerts">
            {t('commandCenter.viewAll')}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Plan filter */}
      {plans && plans.length > 1 && (
        <div className="px-3 py-1.5 border-b border-border/60">
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="All plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {plans.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!userId ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('commandCenter.signInToView')}</p>
            </div>
          ) : loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {t('commandCenter.loadingAlerts')}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              <Bell className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
              <p>{t('commandCenter.noTriggeredAlerts')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => {
                const outcome = log.alert_outcomes?.[0];
                const alert = log.alerts;
                const planName = getPlanName(alert?.master_plan_id || null);
                
                return (
                  <button
                    key={log.id}
                    onClick={() => alert?.symbol && onSymbolSelect?.(alert.symbol)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer text-left"
                  >
                    {getOutcomeIcon(outcome?.outcome_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{alert?.symbol}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {alert?.timeframe}
                        </Badge>
                        {planName && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 bg-primary/10 text-primary border-0 truncate max-w-[80px]">
                            {planName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatPatternName(alert?.pattern || '')}
                      </div>
                    </div>
                    <div className="text-right">
                      {outcome?.pnl_percentage !== null && outcome?.pnl_percentage !== undefined ? (
                        <span
                          className={cn(
                            'text-sm font-medium',
                            outcome.pnl_percentage >= 0 ? 'text-emerald-500' : 'text-red-500'
                          )}
                        >
                          {outcome.pnl_percentage >= 0 ? '+' : ''}
                          {outcome.pnl_percentage.toFixed(1)}%
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t('commandCenter.pending')}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {log.triggered_at
                          ? formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true })
                          : 'N/A'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Configured (Pending) Alerts */}
          {userId && filteredConfigured.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-3 mb-1.5 px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('commandCenter.activeMonitors', { count: filteredConfigured.length })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-0.5">
                {filteredConfigured.map((a) => {
                  const planName = getPlanName(a.master_plan_id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSymbolSelect?.(a.symbol)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer text-left"
                    >
                      <Bell className="h-3 w-3 text-primary/60" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{a.symbol}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {a.timeframe}
                          </Badge>
                          {planName && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 bg-primary/10 text-primary border-0 truncate max-w-[80px]">
                              {planName}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatPatternName(a.pattern)}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                        {t('commandCenter.watching')}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
