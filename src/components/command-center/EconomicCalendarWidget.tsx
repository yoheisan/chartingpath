import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

interface EconomicEvent {
  id: string;
  event_name: string;
  country_code: string;
  region: string;
  indicator_type: string;
  impact_level: string;
  scheduled_time: string;
  actual_value?: string;
  forecast_value?: string;
  previous_value?: string;
  released: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  UK: '🇬🇧',
  JP: '🇯🇵',
  CN: '🇨🇳',
  AU: '🇦🇺',
  CA: '🇨🇦',
  CH: '🇨🇭',
  DE: '🇩🇪',
  FR: '🇫🇷',
  NZ: '🇳🇿',
  KR: '🇰🇷',
  IN: '🇮🇳',
  BR: '🇧🇷',
  MX: '🇲🇽',
};

export function EconomicCalendarWidget() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    fetchEvents();
    
    // Realtime subscription for instant updates
    const channel = supabase
      .channel('econ-calendar-widget')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'economic_events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3); // Next 3 days

      const { data, error } = await supabase
        .from('economic_events')
        .select('*')
        .gte('scheduled_time', now.toISOString())
        .lte('scheduled_time', endDate.toISOString())
        .in('impact_level', ['high', 'medium'])
        .order('scheduled_time', { ascending: true })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('[EconomicCalendarWidget] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactDots = (level: string) => {
    const count = level.toLowerCase() === 'high' ? 3 : level.toLowerCase() === 'medium' ? 2 : 1;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              i < count
                ? level.toLowerCase() === 'high'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
                : 'bg-muted'
            )}
          />
        ))}
      </div>
    );
  };

  const formatEventTime = (scheduledTime: string) => {
    try {
      const date = parseISO(scheduledTime);
      const time = formatInTimeZone(date, timezone, 'HH:mm');
      
      if (isToday(date)) {
        return { date: 'Today', time };
      } else if (isTomorrow(date)) {
        return { date: 'Tomorrow', time };
      } else {
        return { date: format(date, 'EEE, MMM d'), time };
      }
    } catch {
      return { date: '--', time: '--' };
    }
  };

  const getResultIndicator = (event: EconomicEvent) => {
    if (!event.released || !event.actual_value || !event.forecast_value) {
      return null;
    }
    
    const actual = parseFloat(event.actual_value);
    const forecast = parseFloat(event.forecast_value);
    
    if (isNaN(actual) || isNaN(forecast)) return null;
    
    const diff = actual - forecast;
    const threshold = Math.abs(forecast) * 0.01; // 1% threshold
    
    if (Math.abs(diff) < threshold) {
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    
    return diff > 0 ? (
      <TrendingUp className="h-3 w-3 text-emerald-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
        <AlertCircle className="h-5 w-5 mb-2" />
        <p className="text-xs text-center">No upcoming high-impact events</p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents: Record<string, EconomicEvent[]> = {};
  events.forEach(event => {
    const { date } = formatEventTime(event.scheduled_time);
    if (!groupedEvents[date]) {
      groupedEvents[date] = [];
    }
    groupedEvents[date].push(event);
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date}>
            <div className="text-[10px] font-medium text-muted-foreground mb-1.5 px-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date}
            </div>
            <div className="space-y-1">
              {dateEvents.map(event => {
                const { time } = formatEventTime(event.scheduled_time);
                const flag = COUNTRY_FLAGS[event.region] || '🌐';
                
                return (
                  <div
                    key={event.id}
                    className={cn(
                      'flex items-start gap-2 px-2 py-1.5 rounded-md border',
                      event.released ? 'bg-muted/30' : 'bg-background',
                      'border-border/50'
                    )}
                  >
                    <div className="text-[10px] font-mono text-muted-foreground w-10 shrink-0 pt-0.5">
                      {time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs">{flag}</span>
                        {getImpactDots(event.impact_level)}
                        {getResultIndicator(event)}
                      </div>
                      <div className="text-xs font-medium truncate" title={event.event_name}>
                        {event.event_name}
                      </div>
                      {event.released && event.actual_value && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            Actual: <span className="font-medium text-foreground">{event.actual_value}</span>
                          </span>
                          {event.forecast_value && (
                            <span className="text-[10px] text-muted-foreground">
                              Forecast: {event.forecast_value}
                            </span>
                          )}
                        </div>
                      )}
                      {!event.released && event.forecast_value && (
                        <span className="text-[10px] text-muted-foreground">
                          Forecast: {event.forecast_value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
