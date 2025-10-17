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
