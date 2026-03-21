import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, TrendingUp, TrendingDown, Minus, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useDashboardSettings } from '@/hooks/useDashboardSettings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const REGIONS = [
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'EU', label: 'Euro Area', flag: '🇪🇺' },
  { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵' },
  { value: 'CN', label: 'China', flag: '🇨🇳' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
];

const IMPACT_LEVELS = [
  { value: 'high', label: 'High Impact', color: 'text-destructive' },
  { value: 'medium', label: 'Medium Impact', color: 'text-amber-500' },
  { value: 'low', label: 'Low Impact', color: 'text-muted-foreground' },
];

export function EconomicCalendarWidget() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useDashboardSettings();
  
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(settings.calendarRegions);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(settings.calendarImpacts);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Persist filter changes
  useEffect(() => {
    updateSettings({ calendarRegions: selectedRegions, calendarImpacts: selectedImpacts });
  }, [selectedRegions, selectedImpacts, updateSettings]);

  const fetchEvents = useCallback(async () => {
    try {
      // Show events from start of today (not just future events)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3); // Next 3 days

      let query = supabase
        .from('economic_events')
        .select('*')
        .gte('scheduled_time', startOfToday.toISOString())
        .lte('scheduled_time', endDate.toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(50);

      if (selectedImpacts.length > 0) {
        query = query.in('impact_level', selectedImpacts);
      }

      if (selectedRegions.length > 0) {
        query = query.in('region', selectedRegions);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('[EconomicCalendarWidget] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedImpacts, selectedRegions]);

  useEffect(() => {
    fetchEvents();
    
    // Realtime subscription for instant updates when events change
    const channel = supabase
      .channel('econ-calendar-widget')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'economic_events'
        },
        () => {
          console.log('[EconomicCalendarWidget] New event inserted, refreshing...');
          fetchEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'economic_events'
        },
        () => {
          console.log('[EconomicCalendarWidget] Event updated, refreshing...');
          fetchEvents();
        }
      )
      .subscribe((status) => {
        console.log('[EconomicCalendarWidget] Realtime status:', status);
      });

    // Polling fallback every 2 minutes in case realtime fails
    const pollInterval = setInterval(() => {
      fetchEvents();
    }, 120_000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const toggleImpact = (impact: string) => {
    setSelectedImpacts(prev => 
      prev.includes(impact) 
        ? prev.filter(i => i !== impact)
        : [...prev, impact]
    );
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
                  ? 'bg-destructive'
                  : level.toLowerCase() === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-muted-foreground'
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
        return { date: t('commandCenter.today', 'Today'), time };
      } else if (isTomorrow(date)) {
        return { date: t('commandCenter.tomorrow', 'Tomorrow'), time };
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
      <TrendingDown className="h-3 w-3 text-destructive" />
    );
  };

  const activeFilterCount = (selectedRegions.length < REGIONS.length ? 1 : 0) + 
    (selectedImpacts.length < IMPACT_LEVELS.length ? 1 : 0);

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
    <div className="h-full flex flex-col">
      {/* Compact Filter Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
              <Filter className="h-3 w-3" />
              {t('commandCenter.filters', 'Filters')}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-sm ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">{t('commandCenter.impactLevel')}</DropdownMenuLabel>
            {IMPACT_LEVELS.map(impact => (
              <DropdownMenuCheckboxItem
                key={impact.value}
                checked={selectedImpacts.includes(impact.value)}
                onCheckedChange={() => toggleImpact(impact.value)}
                className="text-xs"
              >
                <span className={impact.color}>{impact.label}</span>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">{t('commandCenter.regions')}</DropdownMenuLabel>
            {REGIONS.map(region => (
              <DropdownMenuCheckboxItem
                key={region.value}
                checked={selectedRegions.includes(region.value)}
                onCheckedChange={() => toggleRegion(region.value)}
                className="text-xs"
              >
                <span className="mr-1.5">{region.flag}</span>
                {region.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={fetchEvents}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <AlertCircle className="h-5 w-5 mb-2" />
          <p className="text-xs text-center">{t('commandCenter.noEventsMatchFilters')}</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <div className="text-sm font-medium text-muted-foreground mb-1.5 px-1 flex items-center gap-1">
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
                        <div className="text-sm font-mono text-muted-foreground w-10 shrink-0 pt-0.5">
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
                              <span className="text-sm text-muted-foreground">
                                {t('economicCalendar.actual')} <span className="font-medium text-foreground">{event.actual_value}</span>
                              </span>
                              {event.forecast_value && (
                                <span className="text-sm text-muted-foreground">
                                  {t('economicCalendar.forecast')} {event.forecast_value}
                                </span>
                              )}
                            </div>
                          )}
                          {!event.released && event.forecast_value && (
                            <span className="text-sm text-muted-foreground">
                              {t('economicCalendar.forecast')} {event.forecast_value}
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
      )}
    </div>
  );
}
