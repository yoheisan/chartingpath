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
  { value: "US", label: "United States" },
  { value: "EU", label: "Euro Area" },
  { value: "UK", label: "United Kingdom" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "KR", label: "South Korea" },
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
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
  const [preferences, setPreferences] = useState<UserPreferences>({
    regions: ["US", "EU", "UK", "JP", "CN", "AU", "KR", "IN"],
    indicator_types: ["inflation", "employment", "gdp", "interest_rate"],
    impact_levels: ["high"],
    email_enabled: false,
    telegram_enabled: false,
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchEvents();

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
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("economic_events")
        .select("*")
        .gte("scheduled_time", oneWeekAgo.toISOString())
        .lte("scheduled_time", nextWeek.toISOString())
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
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
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      const startDate = oneWeekAgo.toISOString().split('T')[0];
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const endDate = nextWeek.toISOString().split('T')[0];

      // Include all regions to ensure APAC data is generated
      const allRegions = ["US", "EU", "UK", "JP", "CN", "AU", "CA", "KR", "IN", "SG"];

      const { data, error } = await supabase.functions.invoke("fetch-economic-calendar", {
        body: {
          start_date: startDate,
          end_date: endDate,
          regions: allRegions,
          impact_levels: preferences.impact_levels.length > 0 ? preferences.impact_levels : ["high", "medium", "low"],
        },
      });

      if (error) throw error;
      toast.success(`Refreshed calendar with ${data.count} events from all regions`);
      fetchEvents();
    } catch (error: any) {
      toast.error("Failed to refresh calendar: " + error.message);
    } finally {
      setLoading(false);
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
      US: "us",
      EU: "eu",
      UK: "gb",
      JP: "jp",
      CN: "cn",
      AU: "au",
      CA: "ca",
      KR: "kr",
      IN: "in",
      SG: "sg",
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

  // Get unique countries from events
  const availableCountries = Array.from(new Set(events.map(e => e.region)));

  // Filter events by selected countries
  const filteredByCountry = selectedCountries.length > 0
    ? events.filter(e => selectedCountries.includes(e.region))
    : events;

  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay())); // End of current week (Sunday)
  endOfWeek.setHours(23, 59, 59, 999);
  
  const startOfNextWeek = new Date(endOfWeek);
  startOfNextWeek.setDate(endOfWeek.getDate() + 1);
  startOfNextWeek.setHours(0, 0, 0, 0);

  const upcomingEvents = filteredByCountry.filter(e => !e.released);
  const thisWeekEvents = upcomingEvents.filter(e => new Date(e.scheduled_time) <= endOfWeek);
  const nextWeekEvents = upcomingEvents.filter(e => new Date(e.scheduled_time) > endOfWeek);
  const releasedEvents = filteredByCountry.filter(e => e.released);

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
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 justify-center flex-wrap items-center">
            <Button onClick={refreshCalendar} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Calendar
            </Button>
            
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
              {/* Upcoming Events with This Week / Next Week Tabs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Upcoming Events ({upcomingEvents.length})
                      <Badge variant="outline" className="ml-2 gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Real-time
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Events scheduled ahead • Updates instantly via WebSocket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="this-week" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                      <TabsTrigger value="this-week">
                        This Week ({thisWeekEvents.length})
                      </TabsTrigger>
                      <TabsTrigger value="next-week">
                        Next Week ({nextWeekEvents.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="this-week" className="mt-4">
                      <div className="space-y-4">
                        {thisWeekEvents.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No events scheduled for this week. Click refresh to load latest data.
                          </p>
                        ) : (
                          thisWeekEvents.map((event) => (
                            <div key={event.id} className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                                    <img 
                                      src={getCountryFlag(event.region)} 
                                      alt={`${getCountryName(event.region)} flag`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <h3 className="font-semibold">{event.event_name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span className="font-medium">{getCountryName(event.region)}</span>
                                      <span>•</span>
                                      <span>{formatDateTime(event.scheduled_time)}</span>
                                    </p>
                                  </div>
                                </div>
                                {getImpactBadge(event.impact_level)}
                              </div>
                              {event.forecast_value && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Forecast:</span>{" "}
                                  <span className="font-medium">{event.forecast_value}</span>
                                  {event.previous_value && (
                                    <>
                                      {" | "}
                                      <span className="text-muted-foreground">Previous:</span>{" "}
                                      <span className="font-medium">{event.previous_value}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="next-week" className="mt-4">
                      <div className="space-y-4">
                        {nextWeekEvents.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No events scheduled for next week. Click refresh to load latest data.
                          </p>
                        ) : (
                          nextWeekEvents.map((event) => (
                            <div key={event.id} className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                                    <img 
                                      src={getCountryFlag(event.region)} 
                                      alt={`${getCountryName(event.region)} flag`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    <h3 className="font-semibold">{event.event_name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span className="font-medium">{getCountryName(event.region)}</span>
                                      <span>•</span>
                                      <span>{formatDateTime(event.scheduled_time)}</span>
                                    </p>
                                  </div>
                                </div>
                                {getImpactBadge(event.impact_level)}
                              </div>
                              {event.forecast_value && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Forecast:</span>{" "}
                                  <span className="font-medium">{event.forecast_value}</span>
                                  {event.previous_value && (
                                    <>
                                      {" | "}
                                      <span className="text-muted-foreground">Previous:</span>{" "}
                                      <span className="font-medium">{event.previous_value}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

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
                    <div className="space-y-4">
                      {releasedEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                                <img 
                                  src={getCountryFlag(event.region)} 
                                  alt={`${getCountryName(event.region)} flag`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-1 flex-1">
                                <h3 className="font-semibold">{event.event_name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <span className="font-medium">{getCountryName(event.region)}</span>
                                  <span>•</span>
                                  <span>{formatDateTime(event.scheduled_time)}</span>
                                </p>
                              </div>
                            </div>
                            {getImpactBadge(event.impact_level)}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
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
                            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 p-3 rounded">
                              <p className="text-sm font-medium">Market Impact:</p>
                              <p className="text-sm text-muted-foreground mt-1">{event.market_impact}</p>
                            </div>
                          )}
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
