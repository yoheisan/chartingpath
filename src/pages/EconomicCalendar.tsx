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

const REGIONS = [
  // Americas
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "AR", label: "Argentina" },
  
  // Europe
  { value: "EU", label: "Euro Area" },
  { value: "UK", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "RU", label: "Russia" },
  { value: "TR", label: "Turkey" },
  
  // Asia-Pacific
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "KR", label: "South Korea" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "ID", label: "Indonesia" },
  { value: "SG", label: "Singapore" },
  
  // Middle East & Africa
  { value: "SA", label: "Saudi Arabia" },
  { value: "ZA", label: "South Africa" },
];

const INDICATOR_TYPES = [
  { value: "inflation", label: "Inflation (CPI, PPI)" },
  { value: "employment", label: "Employment (NFP, Unemployment)" },
  { value: "gdp", label: "GDP & Growth" },
  { value: "interest_rate", label: "Interest Rate Decisions" },
  { value: "manufacturing", label: "Manufacturing (PMI)" },
  { value: "retail", label: "Retail Sales" },
  { value: "trade", label: "Trade Balance" },
];

const EconomicCalendar = () => {
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
          // Refresh events on any database change
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      clearInterval(autoRefreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

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
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      
      // Filter out weekend events (Saturday = 6, Sunday = 0)
      const filteredData = (data || []).filter(event => {
        const eventDate = new Date(event.scheduled_time);
        const dayOfWeek = eventDate.getUTCDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
      });
      
      setEvents(filteredData);
    } catch (error: any) {
      toast.error("Failed to fetch events: " + error.message);
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
    return <Badge variant={variants[level] || "default"}>{level.toUpperCase()}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

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
    const names: Record<string, string> = {
      US: "United States",
      EU: "Eurozone",
      UK: "United Kingdom",
      JP: "Japan",
      CN: "China",
      AU: "Australia",
      CA: "Canada",
      KR: "South Korea",
      IN: "India",
      SG: "Singapore",
    };
    return names[region] || region;
  };

  // Group events by day of the week in user's timezone
  const groupEventsByDay = (eventsList: EconomicEvent[]) => {
    const grouped: Record<string, EconomicEvent[]> = {};
    
    eventsList.forEach(event => {
      const eventDate = new Date(event.scheduled_time);
      const dayKey = format(eventDate, 'EEEE, MMMM d, yyyy');
      
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
  
  // Week boundaries in user's timezone
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
  });
  
  const thisWeekEvents = filteredEvents.filter(e => {
    const eventTime = new Date(e.scheduled_time);
    return eventTime >= thisWeekStart && eventTime <= thisWeekEnd;
  });
  
  const nextWeekEvents = filteredEvents.filter(e => {
    const eventTime = new Date(e.scheduled_time);
    return eventTime >= nextWeekStart && eventTime <= nextWeekEnd;
  });
  
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

  // Get current timezone info
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentTime = new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur animate-pulse"></div>
                <Badge variant="destructive" className="relative px-4 py-1.5 text-sm font-bold animate-pulse">
                  ⚡ LIVE
                </Badge>
              </div>
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold">
                Faster than Investing.com & Forex Factory
              </Badge>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Real-Time Economic Calendar
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Instant alerts for key economic indicators - Zero latency with real-time database updates
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              <Badge variant="outline" className="font-mono">
                🕐 {currentTime}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline" className="font-mono">
                📍 {userTimezone}
              </Badge>
              <span className="text-muted-foreground text-xs">
                (All times shown in your local timezone)
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 justify-center flex-wrap items-center">
            <Badge variant="outline" className="gap-2 px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time • 5-sec polling on high-impact events</span>
            </Badge>
            
            <Badge variant="secondary" className="px-4 py-2">
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
            
            {/* Country Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Filter by country:</Label>
              <div className="flex gap-2 flex-wrap">
                {REGIONS.map((region) => (
                  <Button
                    key={region.value}
                    variant={selectedCountries.includes(region.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCountries(prev =>
                        prev.includes(region.value)
                          ? prev.filter(c => c !== region.value)
                          : [...prev, region.value]
                      );
                    }}
                    className="gap-2"
                  >
                    <img 
                      src={getCountryFlag(region.value)} 
                      alt={`${region.label} flag`}
                      className="w-5 h-4 object-cover rounded"
                    />
                    {region.value}
                  </Button>
                ))}
                {selectedCountries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCountries([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Importance Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Importance:</Label>
              <div className="flex gap-2">
                {[
                  { value: "high", label: "High", variant: "destructive" },
                  { value: "medium", label: "Medium", variant: "default" },
                  { value: "low", label: "Low", variant: "secondary" }
                ].map((importance) => (
                  <Button
                    key={importance.value}
                    variant={selectedImportance.includes(importance.value) ? importance.variant as any : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedImportance(prev =>
                        prev.includes(importance.value)
                          ? prev.filter(i => i !== importance.value)
                          : [...prev, importance.value]
                      );
                    }}
                  >
                    {importance.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Alert Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6 mt-6">
              {/* Week Navigation Tabs */}
              <Tabs defaultValue="this-week" className="w-full">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
                  <TabsTrigger value="last-week">
                    Last Week ({lastWeekEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="this-week">
                    This Week ({thisWeekEvents.length})
                  </TabsTrigger>
                  <TabsTrigger value="next-week">
                    Next Week ({nextWeekEvents.length})
                  </TabsTrigger>
                </TabsList>

                {/* Last Week */}
                <TabsContent value="last-week">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Last Week Events ({lastWeekEvents.length})
                      </CardTitle>
                      <CardDescription>
                        {format(lastWeekStart, 'MMM d')} - {format(lastWeekEnd, 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(lastWeekByDay).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No events for last week</p>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(lastWeekByDay).map(([day, dayEvents]) => (
                            <div key={day} className="space-y-3">
                              <h3 className="font-semibold text-lg border-b pb-2">{day}</h3>
                              <div className="space-y-3">
                                {dayEvents.map((event) => (
                                  <div key={event.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                          <img 
                                            src={getCountryFlag(event.region)} 
                                            alt={`${event.region} flag`}
                                            className="w-6 h-4 object-cover rounded"
                                          />
                                          <h4 className="font-semibold text-base">{event.event_name}</h4>
                                          {getImpactBadge(event.impact_level)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{formatDateTime(event.scheduled_time)}</p>
                                        <div className="flex gap-4 text-sm">
                                          {event.actual_value && (
                                            <div>
                                              <span className="text-muted-foreground">Actual: </span>
                                              <span className="font-semibold">{event.actual_value}</span>
                                            </div>
                                          )}
                                          {event.forecast_value && (
                                            <div>
                                              <span className="text-muted-foreground">Forecast: </span>
                                              <span>{event.forecast_value}</span>
                                            </div>
                                          )}
                                          {event.previous_value && (
                                            <div>
                                              <span className="text-muted-foreground">Previous: </span>
                                              <span>{event.previous_value}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
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

                {/* This Week */}
                <TabsContent value="this-week">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        This Week Events ({thisWeekEvents.length})
                        <Badge variant="outline" className="ml-2 gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Real-time
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {format(thisWeekStart, 'MMM d')} - {format(thisWeekEnd, 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(thisWeekByDay).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No events for this week</p>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(thisWeekByDay).map(([day, dayEvents]) => (
                            <div key={day} className="space-y-3">
                              <h3 className="font-semibold text-lg border-b pb-2">{day}</h3>
                              <div className="space-y-3">
                                {dayEvents.map((event) => (
                                  <div key={event.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                          <img 
                                            src={getCountryFlag(event.region)} 
                                            alt={`${event.region} flag`}
                                            className="w-6 h-4 object-cover rounded"
                                          />
                                          <h4 className="font-semibold text-base">{event.event_name}</h4>
                                          {getImpactBadge(event.impact_level)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{formatDateTime(event.scheduled_time)}</p>
                                        <div className="flex gap-4 text-sm">
                                          {event.actual_value && (
                                            <div>
                                              <span className="text-muted-foreground">Actual: </span>
                                              <span className="font-semibold">{event.actual_value}</span>
                                            </div>
                                          )}
                                          {event.forecast_value && (
                                            <div>
                                              <span className="text-muted-foreground">Forecast: </span>
                                              <span>{event.forecast_value}</span>
                                            </div>
                                          )}
                                          {event.previous_value && (
                                            <div>
                                              <span className="text-muted-foreground">Previous: </span>
                                              <span>{event.previous_value}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
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
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Next Week Events ({nextWeekEvents.length})
                      </CardTitle>
                      <CardDescription>
                        {format(nextWeekStart, 'MMM d')} - {format(nextWeekEnd, 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(nextWeekByDay).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No events for next week</p>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(nextWeekByDay).map(([day, dayEvents]) => (
                            <div key={day} className="space-y-3">
                              <h3 className="font-semibold text-lg border-b pb-2">{day}</h3>
                              <div className="space-y-3">
                                {dayEvents.map((event) => (
                                  <div key={event.id} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                          <img 
                                            src={getCountryFlag(event.region)} 
                                            alt={`${event.region} flag`}
                                            className="w-6 h-4 object-cover rounded"
                                          />
                                          <h4 className="font-semibold text-base">{event.event_name}</h4>
                                          {getImpactBadge(event.impact_level)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{formatDateTime(event.scheduled_time)}</p>
                                        <div className="flex gap-4 text-sm">
                                          {event.actual_value && (
                                            <div>
                                              <span className="text-muted-foreground">Actual: </span>
                                              <span className="font-semibold">{event.actual_value}</span>
                                            </div>
                                          )}
                                          {event.forecast_value && (
                                            <div>
                                              <span className="text-muted-foreground">Forecast: </span>
                                              <span>{event.forecast_value}</span>
                                            </div>
                                          )}
                                          {event.previous_value && (
                                            <div>
                                              <span className="text-muted-foreground">Previous: </span>
                                              <span>{event.previous_value}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
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
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Releases ({releasedEvents.length})</CardTitle>
                      <Badge variant="outline" className="gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Past 7 days
                      </Badge>
                    </div>
                    <CardDescription>
                      Economic data released in the past 7 days with market impact analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(releasedByDay).map(([day, dayEvents]) => (
                        <div key={day} className="space-y-3">
                          <h3 className="font-semibold text-lg sticky top-0 bg-background py-2 border-b">{day}</h3>
                          <div className="space-y-3">
                            {dayEvents.map((event) => (
                              <div key={event.id} className="border rounded-lg p-3 space-y-3 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2 flex-1">
                                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-muted rounded overflow-hidden">
                                      <img 
                                        src={getCountryFlag(event.region)} 
                                        alt={`${getCountryName(event.region)} flag`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                      <h4 className="font-semibold text-sm">{event.event_name}</h4>
                                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span className="font-medium">{getCountryName(event.region)}</span>
                                        <span>•</span>
                                        <span>{format(new Date(event.scheduled_time), 'h:mm a')}</span>
                                      </p>
                                    </div>
                                  </div>
                                  {getImpactBadge(event.impact_level)}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-xs pl-8">
                                  {event.actual_value && (
                                    <div>
                                      <span className="text-muted-foreground">Actual:</span>
                                      <p className="font-semibold">{event.actual_value}</p>
                                    </div>
                                  )}
                                  {event.forecast_value && (
                                    <div>
                                      <span className="text-muted-foreground">Forecast:</span>
                                      <p className="font-medium">{event.forecast_value}</p>
                                    </div>
                                  )}
                                  {event.previous_value && (
                                    <div>
                                      <span className="text-muted-foreground">Previous:</span>
                                      <p className="font-medium">{event.previous_value}</p>
                                    </div>
                                  )}
                                </div>
                                {event.market_impact && (
                                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 p-2 rounded ml-8">
                                    <p className="text-xs font-medium">Market Impact:</p>
                                    <p className="text-xs text-muted-foreground mt-1">{event.market_impact}</p>
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
                      Please login to configure alert preferences
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Alert Delivery Methods */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Delivery</CardTitle>
                      <CardDescription>
                        Choose how you want to receive economic event alerts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="email-alerts">Email Alerts</Label>
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
                          <Label htmlFor="telegram-alerts">Telegram Alerts</Label>
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
                          <Label htmlFor="telegram-chat-id">Telegram Chat ID</Label>
                          <Input
                            id="telegram-chat-id"
                            placeholder="Your Telegram Chat ID"
                            value={preferences.telegram_chat_id || ""}
                            onChange={(e) =>
                              setPreferences({ ...preferences, telegram_chat_id: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Get your Chat ID by messaging @userinfobot on Telegram
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Filter Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Filters</CardTitle>
                      <CardDescription>
                        Customize which events you want to be notified about
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Regions */}
                      <div className="space-y-3">
                        <Label>Regions</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {REGIONS.map((region) => (
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
                                {region.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Indicator Types */}
                      <div className="space-y-3">
                        <Label>Indicator Types</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {INDICATOR_TYPES.map((type) => (
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
                                {type.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Impact Level */}
                      <div className="space-y-3">
                        <Label>Impact Level</Label>
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
                                {level}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={savePreferences} disabled={savingPreferences} className="w-full">
                        {savingPreferences ? "Saving..." : "Save Preferences"}
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
