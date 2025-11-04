import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CachedReport {
  report: string;
  timestamp: number;
  timezone: string;
}

interface MarketReportContextType {
  cachedReport: CachedReport | null;
  prefetchReport: (timezone: string) => Promise<void>;
  isReportFresh: (timezone: string, maxAgeMinutes?: number) => boolean;
}

const MarketReportContext = createContext<MarketReportContextType | undefined>(undefined);

export const MarketReportProvider = ({ children }: { children: ReactNode }) => {
  const [cachedReport, setCachedReport] = useState<CachedReport | null>(null);

  const prefetchReport = async (timezone: string) => {
    try {
      // First, try to fetch from the database
      const { data: dbReports, error: dbError } = await supabase
        .from("market_reports")
        .select("*")
        .eq("timezone", timezone)
        .order("generated_at", { ascending: false })
        .limit(1);

      if (!dbError && dbReports && dbReports.length > 0) {
        const dbReport = dbReports[0];
        const reportAge = Date.now() - new Date(dbReport.generated_at).getTime();
        
        // If report is less than 15 minutes old, use it
        if (reportAge < 15 * 60 * 1000) {
          console.log("Using cached report from database");
          setCachedReport({
            report: dbReport.report_content,
            timestamp: new Date(dbReport.generated_at).getTime(),
            timezone,
          });
          return;
        }
      }

      // If no recent report in DB, generate a new one
      console.log("Generating fresh report");
      const { data, error } = await supabase.functions.invoke("generate-market-report", {
        body: {
          timezone,
          markets: ["stocks", "forex", "crypto", "commodities"],
          timeSpan: "previous_day",
          tone: "professional",
        },
      });

      if (error) throw error;

      setCachedReport({
        report: data.report,
        timestamp: Date.now(),
        timezone,
      });
    } catch (error) {
      console.error("Error prefetching market report:", error);
    }
  };

  const isReportFresh = (timezone: string, maxAgeMinutes = 30) => {
    if (!cachedReport) return false;
    if (cachedReport.timezone !== timezone) return false;
    
    const ageMinutes = (Date.now() - cachedReport.timestamp) / 1000 / 60;
    return ageMinutes < maxAgeMinutes;
  };

  return (
    <MarketReportContext.Provider value={{ cachedReport, prefetchReport, isReportFresh }}>
      {children}
    </MarketReportContext.Provider>
  );
};

export const useMarketReport = () => {
  const context = useContext(MarketReportContext);
  if (!context) {
    throw new Error("useMarketReport must be used within MarketReportProvider");
  }
  return context;
};
