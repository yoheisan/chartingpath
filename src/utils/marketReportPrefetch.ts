import { supabase } from "@/integrations/supabase/client";

let prefetchPromise: Promise<any> | null = null;
let prefetchedData: any = null;

export const prefetchMarketReport = async () => {
  // If already prefetching or prefetched, return existing promise/data
  if (prefetchPromise) return prefetchPromise;
  if (prefetchedData) return Promise.resolve(prefetchedData);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  prefetchPromise = supabase.functions
    .invoke("get-cached-market-report", {
      body: {
        timezone: timezone,
        markets: ["stocks", "forex", "crypto", "commodities"],
        timeSpan: "previous_day",
        tone: "professional",
        forceGenerate: false,
      },
    })
    .then(({ data, error }) => {
      if (error) throw error;
      prefetchedData = data;
      return data;
    })
    .catch((error) => {
      console.error("Prefetch error:", error);
      prefetchPromise = null;
      return null;
    });

  return prefetchPromise;
};

export const getPrefetchedReport = () => {
  return prefetchedData;
};

export const clearPrefetchedReport = () => {
  prefetchedData = null;
  prefetchPromise = null;
};
