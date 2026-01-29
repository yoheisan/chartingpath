import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All timeframes to scan
const TIMEFRAMES = ['1h', '4h', '1d', '1wk'];

// All asset types to scan
const ASSET_TYPES = ['fx', 'crypto', 'stocks', 'commodities', 'indices', 'etfs'];

// Pattern tiers - use hyphen format to match PATTERN_REGISTRY
const BASE_PATTERNS = ['double-bottom', 'double-top', 'triple-bottom', 'triple-top', 'ascending-triangle', 'descending-triangle', 'symmetrical-triangle'];
const EXTENDED_PATTERNS = ['head-and-shoulders', 'inverse-head-and-shoulders', 'rising-wedge', 'falling-wedge'];
const PREMIUM_PATTERNS = ['bullish-flag', 'bearish-flag', 'cup-and-handle', 'inverse-cup-and-handle', 'donchian-breakout-long', 'donchian-breakout-short'];
const ALL_PATTERNS = [...BASE_PATTERNS, ...EXTENDED_PATTERNS, ...PREMIUM_PATTERNS];

interface ScanResult {
  timeframe: string;
  assetType: string;
  patternsFound: number;
  instrumentsScanned: number;
  success: boolean;
  error?: string;
  durationMs: number;
}

async function scanTimeframeAsset(
  supabaseUrl: string,
  supabaseKey: string,
  timeframe: string,
  assetType: string
): Promise<ScanResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[schedule-pattern-scans] Starting scan: ${assetType} @ ${timeframe}`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/scan-live-patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        timeframe,
        assetType,
        maxTickers: 100, // Pro tier limit for comprehensive scanning
        allowedPatterns: ALL_PATTERNS,
        forceRefresh: true, // Important: triggers the slow path that actually scans and persists
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    const durationMs = Date.now() - startTime;
    
    console.log(`[schedule-pattern-scans] Completed ${assetType} @ ${timeframe}: ${data.patterns?.length || 0} patterns in ${durationMs}ms`);
    
    return {
      timeframe,
      assetType,
      patternsFound: data.patterns?.length || 0,
      instrumentsScanned: data.instrumentsScanned || 0,
      success: true,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[schedule-pattern-scans] Error scanning ${assetType} @ ${timeframe}:`, error.message);
    
    return {
      timeframe,
      assetType,
      patternsFound: 0,
      instrumentsScanned: 0,
      success: false,
      error: error.message,
      durationMs,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse optional parameters
    let targetTimeframes = TIMEFRAMES;
    let targetAssetTypes = ASSET_TYPES;
    let batchSize = 2; // How many parallel scans to run
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.timeframes?.length) targetTimeframes = body.timeframes;
        if (body.assetTypes?.length) targetAssetTypes = body.assetTypes;
        if (body.batchSize) batchSize = Math.min(body.batchSize, 4); // Cap at 4 for safety
      } catch {}
    }
    
    console.log(`[schedule-pattern-scans] Starting multi-timeframe scan`);
    console.log(`[schedule-pattern-scans] Timeframes: ${targetTimeframes.join(', ')}`);
    console.log(`[schedule-pattern-scans] Asset Types: ${targetAssetTypes.join(', ')}`);
    
    // Build the work queue: all combinations of timeframe x assetType
    const workQueue: { timeframe: string; assetType: string }[] = [];
    for (const timeframe of targetTimeframes) {
      for (const assetType of targetAssetTypes) {
        workQueue.push({ timeframe, assetType });
      }
    }
    
    console.log(`[schedule-pattern-scans] Total scans to run: ${workQueue.length}`);
    
    const results: ScanResult[] = [];
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < workQueue.length; i += batchSize) {
      const batch = workQueue.slice(i, i + batchSize);
      
      console.log(`[schedule-pattern-scans] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(workQueue.length / batchSize)}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(({ timeframe, assetType }) => 
          scanTimeframeAsset(supabaseUrl, supabaseKey, timeframe, assetType)
        )
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('[schedule-pattern-scans] Batch item failed:', result.reason);
        }
      }
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < workQueue.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Calculate summary
    const totalPatterns = results.reduce((sum, r) => sum + r.patternsFound, 0);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalDurationMs = Date.now() - startTime;
    
    // Log summary by timeframe
    const summaryByTimeframe: Record<string, { patterns: number; scans: number }> = {};
    for (const r of results) {
      if (!summaryByTimeframe[r.timeframe]) {
        summaryByTimeframe[r.timeframe] = { patterns: 0, scans: 0 };
      }
      summaryByTimeframe[r.timeframe].patterns += r.patternsFound;
      summaryByTimeframe[r.timeframe].scans++;
    }
    
    console.log(`[schedule-pattern-scans] === SCAN COMPLETE ===`);
    console.log(`[schedule-pattern-scans] Total duration: ${(totalDurationMs / 1000).toFixed(1)}s`);
    console.log(`[schedule-pattern-scans] Scans: ${successCount} succeeded, ${failCount} failed`);
    console.log(`[schedule-pattern-scans] Total patterns found: ${totalPatterns}`);
    
    for (const [tf, summary] of Object.entries(summaryByTimeframe)) {
      console.log(`[schedule-pattern-scans]   ${tf}: ${summary.patterns} patterns across ${summary.scans} asset types`);
    }
    
    // Log scan completion to analytics
    try {
      await supabase.from('analytics_events').insert({
        event_name: 'pattern_scan_completed',
        properties: {
          timeframes: targetTimeframes,
          assetTypes: targetAssetTypes,
          totalPatterns,
          successCount,
          failCount,
          durationMs: totalDurationMs,
          summaryByTimeframe,
        },
      });
    } catch (e) {
      console.warn('[schedule-pattern-scans] Failed to log analytics:', e);
    }
    
    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalScans: results.length,
        successCount,
        failCount,
        totalPatterns,
        durationMs: totalDurationMs,
        byTimeframe: summaryByTimeframe,
      },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('[schedule-pattern-scans] Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
