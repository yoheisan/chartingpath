import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Bell, Calendar, Mail, MessageSquare, RefreshCw, Settings } from "lucide-react";
import { format, startOfDay, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, ja, es, fr, de, pt, zhCN, ko, ru, tr, id as idLocale, it, ar, hi } from "date-fns/locale";

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
  market_impact?: string;
  released: boolean;
}

interface UserPreferences {
  regions: string[];
  indicator_types: string[];
  impact_levels: string[];
  email_enabled: boolean;
  telegram_enabled: boolean;
  telegram_chat_id?: string;
}

const DATE_LOCALE_MAP: Record<string, any> = {
  en: enUS, ja, es, fr, de, pt, zh: zhCN, ko, ru, tr, id: idLocale, it, ar, hi,
};

const REGION_KEYS: { value: string; key: string }[] = [
  { value: "US", key: "regionUS" },
  { value: "CA", key: "regionCA" },
  { value: "BR", key: "regionBR" },
  { value: "MX", key: "regionMX" },
  { value: "AR", key: "regionAR" },
  { value: "EU", key: "regionEU" },
  { value: "UK", key: "regionUK" },
  { value: "DE", key: "regionDE" },
  { value: "FR", key: "regionFR" },
  { value: "IT", key: "regionIT" },
  { value: "RU", key: "regionRU" },
  { value: "TR", key: "regionTR" },
  { value: "JP", key: "regionJP" },
  { value: "CN", key: "regionCN" },
  { value: "KR", key: "regionKR" },
  { value: "IN", key: "regionIN" },
  { value: "AU", key: "regionAU" },
  { value: "ID", key: "regionID" },
  { value: "SG", key: "regionSG" },
  { value: "SA", key: "regionSA" },
  { value: "ZA", key: "regionZA" },
];

const INDICATOR_KEYS: { value: string; key: string }[] = [
  { value: "inflation", key: "indicatorInflation" },
  { value: "employment", key: "indicatorEmployment" },
  { value: "gdp", key: "indicatorGdp" },
  { value: "interest_rate", key: "indicatorInterestRate" },
  { value: "manufacturing", key: "indicatorManufacturing" },
  { value: "retail", key: "indicatorRetail" },
  { value: "trade", key: "indicatorTrade" },
];

const EconomicCalendar = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALE_MAP[i18n.language] || enUS;
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedImportance, setSelectedImportance] = useState<string[]>(["high", "medium", "low"]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    regions: ["US", "EU", "UK", "JP", "CN", "AU", "CA", "KR", "IN", "DE", "FR", "BR", "MX"],
    indicator_types: ["inflation", "employment", "gdp", "interest_rate"],
    impact_levels: ["high", "medium", "low"],
    email_enabled: false,
    telegram_enabled: false,
  });
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Immediate initial scrape on page load
    const initialScrape = async () => {
      try {
        await supabase.functions.invoke("scrape-official-sources");
      } catch (error) {
        console.error("Initial scrape failed:", error);
      }
    };
    
    initialScrape();
    fetchEvents();

    // Auto-refresh every 5 minutes by calling official sources scraper
    const autoRefreshInterval = setInterval(async () => {
      try {
        console.log("Auto-refreshing economic calendar...");
        await supabase.functions.invoke("scrape-official-sources");
        fetchEvents();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Realtime subscription for instant updates (zero latency)
    const channel = supabase
      .channel('economic-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'economic_events'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          setIsLive(true);
          // Refresh events on any database change
          fetchEvents();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsLive(false);
        }
      });

    return () => {
      clearInterval(autoRefreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh when timezone changes
  useEffect(() => {
    if (selectedTimezone) {
      fetchEvents();
    }
  }, [selectedTimezone]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      fetchUserPreferences(user.id);
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    const { data, error } = await supabase
      .from("economic_calendar_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setPreferences({
        regions: data.regions || [],
        indicator_types: data.indicator_types || [],
        impact_levels: data.impact_levels || [],
        email_enabled: data.email_enabled,
        telegram_enabled: data.telegram_enabled,
        telegram_chat_id: data.telegram_chat_id,
      });
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      const twoWeeksAhead = new Date(today);
      twoWeeksAhead.setDate(today.getDate() + 14);

      const { data, error } = await supabase
        .from("economic_events")
        .select("*")
        .gte("scheduled_time", oneWeekAgo.toISOString())
        .lte("scheduled_time", twoWeeksAhead.toISOString())
        .order("scheduled_time", { ascending: false });

      if (error) throw error;
      
      // Filter out weekend events (Saturday = 6, Sunday = 0)
      const filteredData = (data || []).filter(event => {
        const eventDate = new Date(event.scheduled_time);
        const dayOfWeek = eventDate.getUTCDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
      });
      
      setEvents(filteredData);
      setIsLive(true);
    } catch (error: any) {
      toast.error("Failed to fetch events: " + error.message);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) {
      toast.error("Please login to save preferences");
      return;
    }

    setSavingPreferences(true);
    try {
      const { error } = await supabase
        .from("economic_calendar_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;
      toast.success("Preferences saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save preferences: " + error.message);
    } finally {
      setSavingPreferences(false);
    }
  };

  const refreshCalendar = async () => {
    setLoading(true);
    try {
      // Use official source scraping instead of commercial APIs
      const { data, error } = await supabase.functions.invoke("scrape-official-sources");

      if (error) throw error;
      toast.success(`🎯 Scraped ${data.events_scraped} events from ${data.sources_checked} official sources`);
      fetchEvents();
    } catch (error: any) {
      toast.error("Failed to refresh calendar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAggressiveScrape = async () => {
    try {
      toast.info("Starting aggressive scraping for imminent releases...");
      const { data, error } = await supabase.functions.invoke("aggressive-scraper");

      if (error) throw error;
      
      if (data.values_detected > 0) {
        toast.success(`🚀 Detected ${data.values_detected} actual values!`);
      } else {
        toast.info(`Checked ${data.events_checked} imminent events - no new data yet`);
      }
      
      fetchEvents();
    } catch (error: any) {
      toast.error("Aggressive scraping failed: " + error.message);
    }
  };

  const getImpactBadge = (level: string) => {
    const variants: Record<string, any> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    const labelMap: Record<string, string> = { high: 'high', medium: 'med', low: 'low' };
    return <Badge variant={variants[level] || "default"}>{t(`economicCalendar.${labelMap[level] || level}`).toUpperCase()}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return formatInTimeZone(
      new Date(dateString),
      selectedTimezone,
      'MMM d, h:mm a zzz'
    );
  };

  const TIMEZONES = [
    { value: "America/New_York", label: "New York (ET)" },
    { value: "America/Chicago", label: "Chicago (CT)" },
    { value: "America/Denver", label: "Denver (MT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
    { value: "America/Toronto", label: "Toronto (ET)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Europe/Berlin", label: "Berlin (CET)" },
    { value: "Europe/Zurich", label: "Zurich (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Australia/Sydney", label: "Sydney (AEDT)" },
    { value: "Pacific/Auckland", label: "Auckland (NZDT)" },
    { value: "UTC", label: "UTC" },
  ];

  const getCountryFlag = (region: string) => {
    // Map regions to ISO country codes for flag images
    const countryCodeMap: Record<string, string> = {
      US: "us", CA: "ca", BR: "br", MX: "mx", AR: "ar",
      EU: "eu", UK: "gb", DE: "de", FR: "fr", IT: "it", RU: "ru", TR: "tr",
      JP: "jp", CN: "cn", KR: "kr", IN: "in", AU: "au", ID: "id", SG: "sg",
      SA: "sa", ZA: "za",
    };
    const code = countryCodeMap[region] || "un";
    return `https://flagcdn.com/w80/${code}.png`;
  };

  const getCountryName = (region: string) => {
    const keyMap: Record<string, string> = {
      US: "regionUS", EU: "regionEU", UK: "regionUK", JP: "regionJP",
      CN: "regionCN", AU: "regionAU", CA: "regionCA", KR: "regionKR",
      IN: "regionIN", SG: "regionSG", DE: "regionDE", FR: "regionFR",
      IT: "regionIT", BR: "regionBR", MX: "regionMX", AR: "regionAR",
      RU: "regionRU", TR: "regionTR", ID: "regionID", SA: "regionSA", ZA: "regionZA",
    };
    return keyMap[region] ? t(`economicCalendar.${keyMap[region]}`) : region;
  };

  // Group events by day of the week in selected timezone
  const groupEventsByDay = (eventsList: EconomicEvent[]) => {
    const grouped: Record<string, EconomicEvent[]> = {};
    
    eventsList.forEach(event => {
      const eventDate = new Date(event.scheduled_time);
      const dayKey = formatInTimeZone(eventDate, selectedTimezone, 'EEEE, MMMM d, yyyy', { locale: dateLocale });
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(event);
    });
    
    // Sort events within each day by time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => 
        new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
      );
    });
    
    return grouped;
  };

  // Get unique countries from events
  const availableCountries = Array.from(new Set(events.map(e => e.region)));

  // Filter events by selected countries and importance
  let filteredEvents = events;
  
  if (selectedCountries.length > 0) {
    filteredEvents = filteredEvents.filter(e => selectedCountries.includes(e.region));
  }
  
  if (selectedImportance.length > 0) {
    filteredEvents = filteredEvents.filter(e => selectedImportance.includes(e.impact_level));
  }

  const now = new Date();
  
  // Calculate week boundaries - "This Week" is always the current Mon-Sun week
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

  // Filter events by week ranges
  const lastWeekEvents = filteredEvents.filter(e => {
    const eventTime = new Date(e.scheduled_time);
    return eventTime >= lastWeekStart && eventTime <= lastWeekEnd;
  }).sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()); // Latest to oldest
  
  const thisWeekEvents = filteredEvents.filter(e => {
    const eventTime = new Date(e.scheduled_time);
    const isInRange = eventTime >= thisWeekStart && eventTime <= thisWeekEnd;
    const isUpcoming = eventTime >= now; // Check if event is in the future
    return isInRange && isUpcoming; // Only show future events in this week
  }).sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()); // Nearest to furthest
  
  const nextWeekEvents = filteredEvents.filter(e => {
    const eventTime = new Date(e.scheduled_time);
    const isUpcoming = eventTime >= now; // Check if event is in the future
    return eventTime >= nextWeekStart && eventTime <= nextWeekEnd && isUpcoming;
  }).sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()); // Closest to furthest
  
  // Only show released events from the last 48 hours (2 days), sorted by most recent first
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const releasedEvents = filteredEvents
    .filter(e => e.released && new Date(e.scheduled_time) >= twoDaysAgo)
    .sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime());

  // Group by day
  const lastWeekByDay = groupEventsByDay(lastWeekEvents);
  const thisWeekByDay = groupEventsByDay(thisWeekEvents);
  const nextWeekByDay = groupEventsByDay(nextWeekEvents);
  const releasedByDay = groupEventsByDay(releasedEvents);

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="container mx-auto space-y-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Badge 
              variant={isLive ? "default" : "destructive"} 
              className={`px-2 py-1 text-xs font-bold ${isLive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 animate-pulse'}`}
            >
              {isLive ? '🟢 LIVE' : '🔴 OFFLINE'}
            </Badge>
            <h1 className="text-2xl font-bold">{t('economicCalendar.title')}</h1>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger className="w-[200px] h-8 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border z-50">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="text-xs">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={refreshCalendar} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
             <Button onClick={triggerAggressiveScrape} variant="outline" size="sm">
               {t('economicCalendar.aggressiveScrape')}
            </Button>
          </div>
        </div>

        {/* Inline Filters */}
        <div className="flex gap-3 items-center flex-wrap border-b pb-2">
          {/* Importance Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium whitespace-nowrap">{t('economicCalendar.importance')}</Label>
            <div className="flex gap-1">
              {[
                { value: "high", labelKey: "high", variant: "destructive" },
                { value: "medium", labelKey: "med", variant: "default" },
                { value: "low", labelKey: "low", variant: "secondary" }
              ].map((importance) => (
                <Button
                  key={importance.value}
                  variant={selectedImportance.includes(importance.value) ? importance.variant as any : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setSelectedImportance(prev =>
                      prev.includes(importance.value)
                        ? prev.filter(i => i !== importance.value)
                        : [...prev, importance.value]
                    );
                  }}
                >
                  {t(`economicCalendar.${importance.labelKey}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Country Filter - All Countries */}
          <div className="flex items-start gap-2">
            <Label className="text-xs font-medium whitespace-nowrap pt-1">{t('economicCalendar.countries')}</Label>
            <div className="flex gap-1 flex-wrap max-w-4xl">
              {REGION_KEYS.map((region) => (
                <Button
                  key={region.value}
                  variant={selectedCountries.includes(region.value) ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => {
                    setSelectedCountries(prev =>
                      prev.includes(region.value)
                        ? prev.filter(c => c !== region.value)
                        : [...prev, region.value]
                    );
                  }}
                >
                  <img 
                    src={getCountryFlag(region.value)} 
                    alt={`${t(`economicCalendar.${region.key}`)} flag`}
                    className="w-4 h-3 object-cover rounded"
                  />
                  {region.value}
                </Button>
              ))}
              {selectedCountries.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSelectedCountries([])}
                >
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </div>
        </div>

          <Tabs defaultValue="calendar" className="w-full">
             <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
               <TabsTrigger value="calendar">
                 <Calendar className="mr-2 h-4 w-4" />
                 {t('economicCalendar.calendar')}
               </TabsTrigger>
               <TabsTrigger value="settings">
                 <Settings className="mr-2 h-4 w-4" />
                 {t('economicCalendar.alertSettings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-3 mt-3">
              {/* Week Navigation Tabs */}
              <Tabs defaultValue="this-week" className="w-full">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2">
                   <TabsTrigger value="this-week">
                     {t('economicCalendar.thisWeek')} ({thisWeekEvents.length})
                  </TabsTrigger>
                   <TabsTrigger value="next-week">
                     {t('economicCalendar.nextWeek')} ({nextWeekEvents.length})
                  </TabsTrigger>
                </TabsList>

                {/* This Week */}
                <TabsContent value="this-week">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                         <Bell className="h-4 w-4" />
                         {t('economicCalendar.thisWeek')} ({thisWeekEvents.length})
                        <Badge variant="outline" className="ml-2 gap-1.5 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                           {t('economicCalendar.realTime')}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {format(thisWeekStart, 'MMM d', { locale: dateLocale })} - {format(thisWeekEnd, 'MMM d, yyyy', { locale: dateLocale })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(thisWeekByDay).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">{t('economicCalendar.noEventsThisWeek')}</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(thisWeekByDay).map(([day, dayEvents]) => (
                            <div key={day} className="space-y-2">
                              <h3 className="font-semibold text-sm border-b pb-1.5">{day}</h3>
                              <div className="space-y-2">
                                {dayEvents.map((event) => (
                                  <div key={event.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <img 
                                          src={getCountryFlag(event.region)} 
                                          alt={`${event.region} flag`}
                                          className="w-5 h-3.5 object-cover rounded flex-shrink-0"
                                        />
                                        <h4 className="font-semibold text-sm truncate">{event.event_name}</h4>
                                        {getImpactBadge(event.impact_level)}
                                      </div>
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatInTimeZone(new Date(event.scheduled_time), selectedTimezone, 'h:mm a')}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs mt-2 ml-7">
                                      {event.actual_value && (
                                        <div>
                                           <span className="text-muted-foreground">{t('economicCalendar.actual')}: </span>
                                          <span className="font-semibold">{event.actual_value}</span>
                                        </div>
                                      )}
                                      {event.forecast_value && (
                                        <div>
                                           <span className="text-muted-foreground">{t('economicCalendar.forecast')}: </span>
                                          <span>{event.forecast_value}</span>
                                        </div>
                                      )}
                                      {event.previous_value && (
                                        <div>
                                           <span className="text-muted-foreground">{t('economicCalendar.previous')}: </span>
                                          <span>{event.previous_value}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Next Week */}
                <TabsContent value="next-week">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                         <Calendar className="h-4 w-4" />
                         {t('economicCalendar.nextWeek')} ({nextWeekEvents.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {format(nextWeekStart, 'MMM d', { locale: dateLocale })} - {format(nextWeekEnd, 'MMM d, yyyy', { locale: dateLocale })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(nextWeekByDay).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">{t('economicCalendar.noEventsNextWeek')}</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(nextWeekByDay).map(([day, dayEvents]) => (
                            <div key={day} className="space-y-2">
                              <h3 className="font-semibold text-sm border-b pb-1.5">{day}</h3>
                              <div className="space-y-2">
                                {dayEvents.map((event) => (
                                  <div key={event.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <img 
                                          src={getCountryFlag(event.region)} 
                                          alt={`${event.region} flag`}
                                          className="w-5 h-3.5 object-cover rounded flex-shrink-0"
                                        />
                                        <h4 className="font-semibold text-sm truncate">{event.event_name}</h4>
                                        {getImpactBadge(event.impact_level)}
                                      </div>
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatInTimeZone(new Date(event.scheduled_time), selectedTimezone, 'h:mm a')}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs mt-2 ml-7">
                                      {event.actual_value && (
                                        <div>
                                          <span className="text-muted-foreground">{t('economicCalendar.actual')} </span>
                                          <span className="font-semibold">{event.actual_value}</span>
                                        </div>
                                      )}
                                      {event.forecast_value && (
                                        <div>
                                          <span className="text-muted-foreground">{t('economicCalendar.forecast')} </span>
                                          <span>{event.forecast_value}</span>
                                        </div>
                                      )}
                                      {event.previous_value && (
                                        <div>
                                          <span className="text-muted-foreground">{t('economicCalendar.previous')} </span>
                                          <span>{event.previous_value}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Released Events */}
              {releasedEvents.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                         <Calendar className="h-4 w-4" />
                         {t('economicCalendar.recentReleases')} ({releasedEvents.length})
                      </CardTitle>
                       <Badge variant="outline" className="gap-1.5 text-xs">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         {t('economicCalendar.past7days')}
                      </Badge>
                    </div>
                     <CardDescription className="text-xs">
                       {t('economicCalendar.releasedDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(releasedByDay).map(([day, dayEvents]) => (
                        <div key={day} className="space-y-2">
                          <h3 className="font-semibold text-sm border-b pb-1.5">{day}</h3>
                          <div className="space-y-2">
                            {dayEvents.map((event) => (
                              <div key={event.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <img 
                                      src={getCountryFlag(event.region)} 
                                      alt={`${event.region} flag`}
                                      className="w-5 h-3.5 object-cover rounded flex-shrink-0"
                                    />
                                    <h4 className="font-semibold text-sm truncate">{event.event_name}</h4>
                                    {getImpactBadge(event.impact_level)}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatInTimeZone(new Date(event.scheduled_time), selectedTimezone, 'h:mm a')}</span>
                                </div>
                                <div className="flex gap-4 text-xs mt-2 ml-7">
                                  {event.actual_value && (
                                    <div>
                                      <span className="text-muted-foreground">{t('economicCalendar.actual')} </span>
                                      <span className="font-semibold">{event.actual_value}</span>
                                    </div>
                                  )}
                                  {event.forecast_value && (
                                    <div>
                                      <span className="text-muted-foreground">{t('economicCalendar.forecast')} </span>
                                      <span>{event.forecast_value}</span>
                                    </div>
                                  )}
                                  {event.previous_value && (
                                    <div>
                                      <span className="text-muted-foreground">{t('economicCalendar.previous')} </span>
                                      <span>{event.previous_value}</span>
                                    </div>
                                  )}
                                </div>
                                {event.market_impact && (
                                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-yellow-500 p-2 rounded text-xs ml-7 mt-2">
                                    <span className="font-medium">{t('economicCalendar.impact')} </span>
                                    <span className="text-muted-foreground">{event.market_impact}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              {!user ? (
                 <Card>
                   <CardContent className="pt-6">
                     <p className="text-center text-muted-foreground">
                       {t('economicCalendar.loginToConfig')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Alert Delivery Methods */}
                  <Card>
                     <CardHeader>
                       <CardTitle>{t('economicCalendar.alertDelivery')}</CardTitle>
                       <CardDescription>
                         {t('economicCalendar.alertDeliveryDesc')}
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="email-alerts">{t('economicCalendar.emailAlerts')}</Label>
                        </div>
                        <Switch
                          id="email-alerts"
                          checked={preferences.email_enabled}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, email_enabled: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="telegram-alerts">{t('economicCalendar.telegramAlerts')}</Label>
                        </div>
                        <Switch
                          id="telegram-alerts"
                          checked={preferences.telegram_enabled}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, telegram_enabled: checked })
                          }
                        />
                      </div>

                      {preferences.telegram_enabled && (
                        <div className="ml-8 space-y-2">
                          <Label htmlFor="telegram-chat-id">{t('economicCalendar.telegramChatId')}</Label>
                          <Input
                            id="telegram-chat-id"
                            placeholder={t('economicCalendar.telegramChatIdPlaceholder')}
                            value={preferences.telegram_chat_id || ""}
                            onChange={(e) =>
                              setPreferences({ ...preferences, telegram_chat_id: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('economicCalendar.telegramHint')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Filter Preferences */}
                  <Card>
                     <CardHeader>
                       <CardTitle>{t('economicCalendar.alertFilters')}</CardTitle>
                       <CardDescription>
                         {t('economicCalendar.alertFiltersDesc')}
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Regions */}
                      <div className="space-y-3">
                        <Label>{t('economicCalendar.regions')}</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {REGION_KEYS.map((region) => (
                            <div key={region.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`region-${region.value}`}
                                checked={preferences.regions.includes(region.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPreferences({
                                      ...preferences,
                                      regions: [...preferences.regions, region.value],
                                    });
                                  } else {
                                    setPreferences({
                                      ...preferences,
                                      regions: preferences.regions.filter((r) => r !== region.value),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`region-${region.value}`} className="font-normal cursor-pointer">
                                {t(`economicCalendar.${region.key}`)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Indicator Types */}
                      <div className="space-y-3">
                        <Label>{t('economicCalendar.indicatorTypes')}</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {INDICATOR_KEYS.map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type.value}`}
                                checked={preferences.indicator_types.includes(type.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPreferences({
                                      ...preferences,
                                      indicator_types: [...preferences.indicator_types, type.value],
                                    });
                                  } else {
                                    setPreferences({
                                      ...preferences,
                                      indicator_types: preferences.indicator_types.filter((t) => t !== type.value),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`type-${type.value}`} className="font-normal cursor-pointer">
                                {t(`economicCalendar.${type.key}`)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Impact Level */}
                      <div className="space-y-3">
                        <Label>{t('economicCalendar.impactLevel')}</Label>
                        <div className="flex gap-3">
                          {["high", "medium", "low"].map((level) => (
                            <div key={level} className="flex items-center space-x-2">
                              <Checkbox
                                id={`impact-${level}`}
                                checked={preferences.impact_levels.includes(level)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPreferences({
                                      ...preferences,
                                      impact_levels: [...preferences.impact_levels, level],
                                    });
                                  } else {
                                    setPreferences({
                                      ...preferences,
                                      impact_levels: preferences.impact_levels.filter((i) => i !== level),
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`impact-${level}`} className="font-normal cursor-pointer capitalize">
                                {t(`economicCalendar.${level === 'medium' ? 'med' : level}`)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                       <Button onClick={savePreferences} disabled={savingPreferences} className="w-full">
                         {savingPreferences ? t('economicCalendar.saving') : t('economicCalendar.savePreferences')}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

export default EconomicCalendar;
