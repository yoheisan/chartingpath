import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, TrendingUp, TrendingDown, Target, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AlertLog {
  id: string;
  alert_id: string;
  pattern_data: any;
  price_data: any;
  triggered_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
}

interface AlertOutcome {
  id: string;
  alert_log_id: string;
  outcome_type: 'hit' | 'missed' | 'false_positive' | 'manual_close';
  entry_price: number | null;
  exit_price: number | null;
  pnl_percentage: number | null;
  trade_duration_hours: number | null;
  notes: string | null;
  created_at: string;
}

interface Alert {
  id: string;
  symbol: string;
  pattern: string;
  timeframe: string;
  status: 'active' | 'paused' | 'deleted';
  created_at: string;
  user_id: string;
}

const EnhancedAlertsLibrary = () => {
  const { t } = useTranslation();
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [outcomes, setOutcomes] = useState<AlertOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertLog | null>(null);
  const [outcomeForm, setOutcomeForm] = useState({
    outcome_type: 'hit' as AlertOutcome['outcome_type'],
    entry_price: '',
    exit_price: '',
    pnl_percentage: '',
    trade_duration_hours: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const fetchAlertsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;
      setAlerts(alertsData || []);

      // Fetch alert logs
      const alertIds = alertsData?.map(a => a.id) || [];
      if (alertIds.length > 0) {
        const { data: logsData, error: logsError } = await supabase
          .from('alerts_log')
          .select('*')
          .in('alert_id', alertIds)
          .order('triggered_at', { ascending: false });

        if (logsError) throw logsError;
        setAlertLogs(logsData || []);
      }

      // Fetch alert outcomes
      const { data: outcomesData, error: outcomesError } = await supabase
        .from('alert_outcomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (outcomesError) throw outcomesError;
      setOutcomes((outcomesData || []) as AlertOutcome[]);

    } catch (error) {
      console.error('Error fetching alerts data:', error);
      toast({
        title: t('alertsLibrary.error'),
        description: t('alertsLibrary.errorLoadingAlerts'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOutcome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedAlert) return;

      const outcomeData = {
        alert_log_id: selectedAlert.id,
        user_id: user.id,
        outcome_type: outcomeForm.outcome_type,
        entry_price: outcomeForm.entry_price ? parseFloat(outcomeForm.entry_price) : null,
        exit_price: outcomeForm.exit_price ? parseFloat(outcomeForm.exit_price) : null,
        pnl_percentage: outcomeForm.pnl_percentage ? parseFloat(outcomeForm.pnl_percentage) : null,
        trade_duration_hours: outcomeForm.trade_duration_hours ? parseInt(outcomeForm.trade_duration_hours) : null,
        notes: outcomeForm.notes || null
      };

      const { error } = await supabase
        .from('alert_outcomes')
        .insert(outcomeData);

      if (error) throw error;

      toast({
        title: t('alertsLibrary.success'),
        description: t('alertsLibrary.outcomeRecorded')
      });

      setShowOutcomeDialog(false);
      setSelectedAlert(null);
      setOutcomeForm({
        outcome_type: 'hit',
        entry_price: '',
        exit_price: '',
        pnl_percentage: '',
        trade_duration_hours: '',
        notes: ''
      });
      fetchAlertsData();
    } catch (error) {
      console.error('Error adding outcome:', error);
      toast({
        title: t('alertsLibrary.error'),
        description: t('alertsLibrary.failedToRecord'),
        variant: "destructive"
      });
    }
  };

  const getOutcomeForAlert = (alertLogId: string) => {
    return outcomes.find(outcome => outcome.alert_log_id === alertLogId);
  };

  const getOutcomeIcon = (outcomeType: AlertOutcome['outcome_type']) => {
    switch (outcomeType) {
      case 'hit': return <Target className="h-4 w-4 text-green-500" />;
      case 'missed': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'false_positive': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'manual_close': return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getOutcomeColor = (outcomeType: AlertOutcome['outcome_type']) => {
    switch (outcomeType) {
      case 'hit': return 'bg-green-500';
      case 'missed': return 'bg-red-500';
      case 'false_positive': return 'bg-yellow-500';
      case 'manual_close': return 'bg-blue-500';
    }
  };

  // Calculate performance stats
  const totalAlerts = alertLogs.length;
  const alertsWithOutcomes = outcomes.length;
  const hitRate = alertsWithOutcomes > 0 ? 
    (outcomes.filter(o => o.outcome_type === 'hit').length / alertsWithOutcomes * 100).toFixed(1) : '0';
  const avgPnL = outcomes.filter(o => o.pnl_percentage !== null).length > 0 ?
    (outcomes.filter(o => o.pnl_percentage !== null).reduce((sum, o) => sum + (o.pnl_percentage || 0), 0) / 
     outcomes.filter(o => o.pnl_percentage !== null).length).toFixed(2) : '0';

  if (loading) {
    return <div className="flex items-center justify-center p-8">{t('alertsLibrary.loadingAlertsLibrary')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalAlerts}</p>
                <p className="text-sm text-muted-foreground">{t('alertsLibrary.totalAlerts')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{hitRate}%</p>
                <p className="text-sm text-muted-foreground">{t('alertsLibrary.hitRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{avgPnL}%</p>
                <p className="text-sm text-muted-foreground">{t('alertsLibrary.avgPnl')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{alertsWithOutcomes}</p>
                <p className="text-sm text-muted-foreground">{t('alertsLibrary.tracked')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">{t('alertsLibrary.recentAlerts')}</TabsTrigger>
          <TabsTrigger value="outcomes">{t('alertsLibrary.alertOutcomes')}</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <div className="space-y-4">
            {alertLogs.map((alertLog) => {
              const alert = alerts.find(a => a.id === alertLog.alert_id);
              const outcome = getOutcomeForAlert(alertLog.id);
              
              return (
                <Card key={alertLog.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{alert?.symbol} - {alert?.pattern}</h3>
                          <Badge variant="outline">{alert?.timeframe}</Badge>
                          {outcome && (
                            <Badge className={getOutcomeColor(outcome.outcome_type)}>
                              {getOutcomeIcon(outcome.outcome_type)}
                              <span className="ml-2 capitalize">{outcome.outcome_type.replace('_', ' ')}</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>Triggered: {new Date(alertLog.triggered_at).toLocaleString()}</span>
                          {alertLog.price_data?.price && (
                            <span>Price: ${alertLog.price_data.price}</span>
                          )}
                          {outcome?.pnl_percentage && (
                            <span className={outcome.pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                              P&L: {outcome.pnl_percentage > 0 ? '+' : ''}{outcome.pnl_percentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      {!outcome && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alertLog);
                            setShowOutcomeDialog(true);
                          }}
                        >
                          {t('alertsLibrary.recordOutcome')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <div className="space-y-4">
            {outcomes.map((outcome) => {
              const alertLog = alertLogs.find(log => log.id === outcome.alert_log_id);
              const alert = alerts.find(a => a.id === alertLog?.alert_id);
              
              return (
                <Card key={outcome.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{alert?.symbol} - {alert?.pattern}</h3>
                          <Badge className={getOutcomeColor(outcome.outcome_type)}>
                            {getOutcomeIcon(outcome.outcome_type)}
                            <span className="ml-2 capitalize">{outcome.outcome_type.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {outcome.entry_price && (
                            <div>
                              <span className="text-muted-foreground">Entry: </span>
                              ${outcome.entry_price}
                            </div>
                          )}
                          {outcome.exit_price && (
                            <div>
                              <span className="text-muted-foreground">Exit: </span>
                              ${outcome.exit_price}
                            </div>
                          )}
                          {outcome.pnl_percentage !== null && (
                            <div className={outcome.pnl_percentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                              <span className="text-muted-foreground">P&L: </span>
                              {outcome.pnl_percentage > 0 ? '+' : ''}{outcome.pnl_percentage}%
                            </div>
                          )}
                          {outcome.trade_duration_hours && (
                            <div>
                              <span className="text-muted-foreground">Duration: </span>
                              {outcome.trade_duration_hours}h
                            </div>
                          )}
                        </div>
                        
                        {outcome.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">{outcome.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('alertsLibrary.recordAlertOutcome')}</DialogTitle>
            <DialogDescription>
              {t('alertsLibrary.trackResultDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('alertsLibrary.outcomeType')}</label>
              <select 
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={outcomeForm.outcome_type}
                onChange={(e) => setOutcomeForm(prev => ({ 
                  ...prev, 
                  outcome_type: e.target.value as AlertOutcome['outcome_type']
                }))}
              >
                <option value="hit">{t('alertsLibrary.hitCorrect')}</option>
                <option value="missed">{t('alertsLibrary.missedNoPlay')}</option>
                <option value="false_positive">{t('alertsLibrary.falsePositive')}</option>
                <option value="manual_close">{t('alertsLibrary.manualClose')}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('alertsLibrary.entryPrice')}</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={outcomeForm.entry_price}
                  onChange={(e) => setOutcomeForm(prev => ({ ...prev, entry_price: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('alertsLibrary.exitPrice')}</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={outcomeForm.exit_price}
                  onChange={(e) => setOutcomeForm(prev => ({ ...prev, exit_price: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('alertsLibrary.pnlPercent')}</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={outcomeForm.pnl_percentage}
                  onChange={(e) => setOutcomeForm(prev => ({ ...prev, pnl_percentage: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('alertsLibrary.durationHours')}</label>
                <Input
                  type="number"
                  placeholder="24"
                  value={outcomeForm.trade_duration_hours}
                  onChange={(e) => setOutcomeForm(prev => ({ ...prev, trade_duration_hours: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t('alertsLibrary.notes')}</label>
              <Textarea
                placeholder={t('alertsLibrary.additionalNotes')}
                value={outcomeForm.notes}
                onChange={(e) => setOutcomeForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddOutcome} className="flex-1">
                {t('alertsLibrary.recordOutcome')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowOutcomeDialog(false)}
              >
                {t('alertsLibrary.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAlertsLibrary;