import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * check-alert-matches
 * 
 * Cross-references user alerts (from the `alerts` table) with recently detected
 * live patterns, read from `v_live_detections_with_edge` so that every detection
 * carries the measured historical edge for its pattern/timeframe/asset/direction
 * cell.
 *
 * EDGE FILTER: aggregate expectancy across all resolved historical occurrences is
 * negative. Patterns as a whole lose money. We therefore dispatch an alert ONLY
 * when the detection lands in a cell with a measured edge (qualifies = true, i.e.
 * n >= 100 AND expectancy > 0). Everything else is recorded in
 * `alert_suppression_log` so the user can see what we deliberately withheld.
 * The silence is the product.
 *
 * PAPER AUTOPILOT: every alert that fires is also logged as a paper trade with
 * source = 'edge_alert_autopilot', regardless of the user's auto_paper_trade
 * setting. That flag governs the user's own opt-in trades; this is our unedited
 * forward record of every signal we issue.
 * 
 * Called automatically after each scan-live-patterns run completes.
 */

// Symbol normalization: alerts store "GBPUSD=X" or "USDJPY=X", live_pattern_detections
// stores the Yahoo symbol (e.g. "GBPUSD=X"). They should match directly, but we also
// handle case where alert symbol might not have the suffix.
function normalizeSymbol(sym: string): string {
  return sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Pattern ID normalization: alerts use chart_pattern enum (kebab-case like "ascending-triangle"),
// live_pattern_detections uses pattern_id (same kebab-case). Should match directly.
// But some old alerts might use underscore format like "morning_star" while live detections
// use "morning-star". Normalize both.
function normalizePatternId(id: string): string {
  return id.toLowerCase().replace(/_/g, '-');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: filter by asset type if called from scan pipeline
    let assetType: string | null = null;
    try {
      const body = await req.json();
      assetType = body?.assetType || null;
    } catch {
      // No body is fine
    }

    console.log(`[check-alert-matches] Starting. assetType filter: ${assetType || 'all'}`);

    // 1. Fetch all active user alerts
    const { data: alerts, error: alertsErr } = await supabase
      .from("alerts")
      .select("id, user_id, symbol, pattern, timeframe, status, auto_paper_trade, webhook_url, webhook_secret, risk_percent, max_correlated_exposure_pct")
      .eq("status", "active");

    if (alertsErr) {
      throw new Error(`Failed to fetch alerts: ${alertsErr.message}`);
    }

    if (!alerts || alerts.length === 0) {
      console.log("[check-alert-matches] No active alerts found");
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profiles for all alert users
    const userIds = [...new Set(alerts.map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, push_notifications_enabled, email_notifications_enabled")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Paper portfolios: used for position sizing on the alert payload and for the
    // autopilot forward record.
    const { data: portfolios } = await supabase
      .from("paper_portfolios")
      .select("id, user_id, current_balance")
      .in("user_id", userIds);

    const portfolioMap = new Map(
      (portfolios || []).map(p => [p.user_id, p])
    );

    console.log(`[check-alert-matches] Found ${alerts.length} active alerts`);

    // 2. Fetch active live pattern detections (no time cutoff - if it's active, it's valid)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let detectionsQuery = supabase
      .from("v_live_detections_with_edge")
      .select("id, instrument, pattern_id, pattern_name, timeframe, asset_type, direction, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, current_price, first_detected_at, last_confirmed_at, total_trades, win_rate_pct, expectancy_r, est_cost_r, expectancy_r_net, avg_rr, cell_status, suspended_reason, qualifies");

    if (assetType) {
      detectionsQuery = detectionsQuery.eq("asset_type", assetType);
    }

    const { data: detections, error: detectionsErr } = await detectionsQuery;

    if (detectionsErr) {
      throw new Error(`Failed to fetch detections: ${detectionsErr.message}`);
    }

    if (!detections || detections.length === 0) {
      console.log("[check-alert-matches] No recent live detections found");
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[check-alert-matches] Found ${detections.length} recent live detections`);

    // 3. Build a lookup map of detections by normalized (symbol + pattern + timeframe)
    const detectionMap = new Map<string, typeof detections[0]>();
    for (const det of detections) {
      const key = `${normalizeSymbol(det.instrument)}|${normalizePatternId(det.pattern_id)}|${det.timeframe}`;
      detectionMap.set(key, det);
    }

    // 4. Get recent alerts_log entries to avoid duplicate notifications
    // Only check logs from last 24h to avoid re-notifying
    const { data: recentLogs } = await supabase
      .from("alerts_log")
      .select("alert_id, triggered_at")
      .gte("triggered_at", cutoff);

    const notifiedAlertIds = new Set(
      (recentLogs || []).map(log => log.alert_id)
    );

    // 5. Match alerts to detections
    let matchCount = 0;
    let suppressedCount = 0;
    const suppressionRows: any[] = [];
    const notifications: Promise<any>[] = [];

    // Debug: log some sample keys
    const sampleAlertKeys = alerts.slice(0, 3).map(a => 
      `${normalizeSymbol(a.symbol)}|${normalizePatternId(a.pattern)}|${a.timeframe}`
    );
    const sampleDetKeys = detections.slice(0, 3).map(d =>
      `${normalizeSymbol(d.instrument)}|${normalizePatternId(d.pattern_id)}|${d.timeframe}`
    );
    console.log(`[check-alert-matches] Sample alert keys: ${sampleAlertKeys.join(', ')}`);
    console.log(`[check-alert-matches] Sample detection keys: ${sampleDetKeys.join(', ')}`);

    for (const alert of alerts) {
      // Skip if already notified recently
      if (notifiedAlertIds.has(alert.id)) continue;

      const alertKey = `${normalizeSymbol(alert.symbol)}|${normalizePatternId(alert.pattern)}|${alert.timeframe}`;
      const matchedDetection = detectionMap.get(alertKey);

      if (!matchedDetection) continue;

      // EDGE FILTER — see file header. `qualifies` is decided on expectancy NET of
      // estimated costs, and is false for cells the kill switch has suspended.
      // No net edge, no alert.
      if (!matchedDetection.qualifies) {
        suppressedCount++;
        suppressionRows.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          detection_id: matchedDetection.id,
          symbol: alert.symbol,
          pattern_id: alert.pattern,
          timeframe: alert.timeframe,
          asset_type: matchedDetection.asset_type,
          direction: matchedDetection.direction,
          total_trades: matchedDetection.total_trades ?? 0,
          expectancy_r: matchedDetection.expectancy_r ?? 0,
          reason: matchedDetection.cell_status === 'suspended'
            ? 'cell_suspended'
            : (matchedDetection.total_trades ?? 0) < 100
              ? 'insufficient_sample'
              : 'negative_net_expectancy',
        });
        continue;
      }

      matchCount++;
      console.log(`[check-alert-matches] MATCH: Alert ${alert.id} → ${alert.symbol} ${alert.pattern} ${alert.timeframe}`);

      // 6. Log the detection in alerts_log first, then send notification, then update email_sent
      const processAlert = async () => {
        try {
          // Position size from the user's configured risk, against their paper balance.
          const portfolio = portfolioMap.get(alert.user_id);
          const riskPercent = Math.min(alert.risk_percent ?? 1.0, 5);
          const stopDistance = Math.abs(
            (matchedDetection.entry_price ?? 0) - (matchedDetection.stop_loss_price ?? 0)
          );
          const riskAmount = portfolio ? (portfolio.current_balance * riskPercent) / 100 : 0;
          const positionSize = stopDistance > 0 && riskAmount > 0
            ? Number((riskAmount / stopDistance).toFixed(6))
            : null;

          const edgeStats = {
            sample_size: matchedDetection.total_trades ?? 0,
            win_rate_pct: matchedDetection.win_rate_pct ?? null,
            expectancy_r: matchedDetection.expectancy_r ?? null,
            est_cost_r: matchedDetection.est_cost_r ?? null,
            expectancy_r_net: matchedDetection.expectancy_r_net ?? null,
            avg_rr: matchedDetection.avg_rr ?? null,
            risk_percent: riskPercent,
            position_size: positionSize,
            disclaimer: 'Historical outcomes are not forward returns. Expectancy is shown gross and after estimated costs; the cost estimate is provisional and not your broker\'s actual spread and commission. Not financial advice.',
          };

          // CORRELATED-RISK CHECK — inform, never suppress.
          // Cluster = direction + asset class + country. We deliberately do not
          // compute pairwise return correlation: no price-history table is
          // available, and raw correlation converges to 1 in exactly the stress
          // scenarios that matter. Cluster grouping is the honest approximation.
          const capPct = Number(alert.max_correlated_exposure_pct ?? 4.0);
          let concentration: Record<string, unknown> | null = null;
          try {
            const { data: clusterRows, error: clusterErr } = await supabase.rpc('get_exposure_cluster', {
              p_user_id: alert.user_id,
              p_symbol: alert.symbol,
              p_direction: matchedDetection.direction === 'short' ? 'short' : 'long',
              p_asset_type: matchedDetection.asset_type ?? null,
              p_new_position_pct: riskPercent,
            });
            if (clusterErr) {
              console.error(`[check-alert-matches] Cluster lookup error for alert ${alert.id}:`, clusterErr);
            } else {
              const c = Array.isArray(clusterRows) ? clusterRows[0] : clusterRows;
              if (c) {
                const afterAdd = Number(c.correlated_after_add ?? 0);
                concentration = {
                  cluster_key: c.cluster_key,
                  existing_positions_in_cluster: c.existing_positions_in_cluster,
                  existing_pct_in_cluster: Number(c.existing_pct_in_cluster ?? 0),
                  correlated_after_add: afterAdd,
                  max_correlated_exposure_pct: capPct,
                  warning: afterAdd > capPct,
                };
                if (afterAdd > capPct) {
                  console.log(`[check-alert-matches] CONCENTRATION WARNING alert ${alert.id}: ${c.cluster_key} ${afterAdd}% > cap ${capPct}%`);
                }
              }
            }
          } catch (clusterCatch) {
            console.error(`[check-alert-matches] Cluster exception for alert ${alert.id}:`, clusterCatch);
          }

          // Insert log entry first to get the ID
          const { data: logData, error: logError } = await supabase
            .from("alerts_log")
            .insert({
              alert_id: alert.id,
              pattern_data: {
                pattern: alert.pattern,
                pattern_name: matchedDetection.pattern_name,
                confidence: matchedDetection.quality_score === 'A' ? 0.95 : 
                           matchedDetection.quality_score === 'B' ? 0.85 :
                           matchedDetection.quality_score === 'C' ? 0.7 : 0.6,
                description: `${matchedDetection.pattern_name} detected on ${alert.symbol} (${alert.timeframe}) - Grade ${matchedDetection.quality_score || 'C'}`,
                detection_id: matchedDetection.id,
                edge: edgeStats,
                concentration,
                signal_class: concentration?.warning ? 'concentration_warning' : 'clean',
              },
              price_data: {
                symbol: alert.symbol,
                timeframe: alert.timeframe,
                current_price: matchedDetection.current_price || matchedDetection.entry_price,
                position_size: positionSize,
              },
              entry_price: matchedDetection.entry_price,
              stop_loss_price: matchedDetection.stop_loss_price,
              take_profit_price: matchedDetection.take_profit_price,
              outcome_status: 'pending',
              email_sent: false,
            })
            .select('id')
            .single();

          if (logError) {
            console.error(`[check-alert-matches] Log error for alert ${alert.id}:`, logError);
            return;
          }

          // 7. Send notification via send-pattern-alert
          const confidence = matchedDetection.quality_score === 'A' ? 0.95 : 
                             matchedDetection.quality_score === 'B' ? 0.85 :
                             matchedDetection.quality_score === 'C' ? 0.7 : 0.6;

          const { data: notifyData, error: notifyError } = await supabase.functions.invoke('send-pattern-alert', {
            body: {
              alert: {
                id: alert.id,
                symbol: alert.symbol,
                timeframe: alert.timeframe,
                pattern: alert.pattern,
                user_id: alert.user_id,
                profiles: {
                  email: profileMap.get(alert.user_id)?.email,
                  email_notifications_enabled: profileMap.get(alert.user_id)?.email_notifications_enabled,
                  push_notifications_enabled: profileMap.get(alert.user_id)?.push_notifications_enabled,
                },
              },
              patternResult: {
                confidence,
                description: `${matchedDetection.pattern_name} detected - Grade ${matchedDetection.quality_score || 'C'} quality signal`,
                edge: edgeStats,
              },
              marketData: [{
                o: matchedDetection.entry_price,
                h: matchedDetection.entry_price,
                l: matchedDetection.entry_price,
                c: matchedDetection.current_price || matchedDetection.entry_price,
                t: Math.floor(Date.now() / 1000),
              }],
              bracketLevels: {
                direction: matchedDetection.direction === 'long' ? 'long' : 'short',
                entryPrice: matchedDetection.entry_price,
                stopLossPrice: matchedDetection.stop_loss_price,
                takeProfitPrice: matchedDetection.take_profit_price,
                riskRewardRatio: matchedDetection.risk_reward_ratio,
                stopLossMethod: 'pattern-based',
                takeProfitMethod: 'pattern-based',
                positionSize,
              },
            },
          });

          if (notifyError) {
            console.error(`[check-alert-matches] Notify error for alert ${alert.id}:`, notifyError);
          } else {
            // Parse the response to check email success
            const emailSuccess = notifyData?.channels?.email?.success === true;
            if (emailSuccess && logData?.id) {
              await supabase
                .from("alerts_log")
                .update({ 
                  email_sent: true, 
                  email_sent_at: new Date().toISOString() 
                })
                .eq("id", logData.id);
              console.log(`[check-alert-matches] Email sent and logged for alert ${alert.id}`);
            } else {
              console.warn(`[check-alert-matches] Notification sent but email not confirmed for alert ${alert.id}:`, notifyData);
            }
          }

          // 8a. PAPER AUTOPILOT — system record of every signal we issue, always.
          try {
            const { error: autopilotErr } = await supabase
              .from("paper_trades")
              .insert({
                user_id: alert.user_id,
                portfolio_id: portfolio?.id ?? null,
                symbol: alert.symbol,
                trade_type: matchedDetection.direction === 'short' ? 'short' : 'long',
                entry_price: matchedDetection.entry_price,
                stop_loss: matchedDetection.stop_loss_price,
                take_profit: matchedDetection.take_profit_price,
                quantity: positionSize ?? 1,
                status: 'open',
                detection_id: matchedDetection.id,
                pattern_id: alert.pattern,
                timeframe: alert.timeframe,
                asset_type: matchedDetection.asset_type,
                source: 'edge_alert_autopilot',
                attribution: 'system',
                alerted_at: new Date().toISOString(),
                notes: `[autopilot] ${matchedDetection.pattern_name} | n=${matchedDetection.total_trades} exp=${matchedDetection.expectancy_r}R gross / ${matchedDetection.expectancy_r_net}R net`,
              });
            if (autopilotErr) {
              console.error(`[check-alert-matches] Autopilot insert error for alert ${alert.id}:`, autopilotErr);
            } else {
              console.log(`[check-alert-matches] Autopilot paper trade logged for alert ${alert.id}`);
            }
          } catch (autopilotCatch) {
            console.error(`[check-alert-matches] Autopilot exception for alert ${alert.id}:`, autopilotCatch);
          }

          // 8b. User opt-in Auto Paper Trade (separate from the system record above)
          if (alert.auto_paper_trade) {
            try {
              const { error: paperErr } = await supabase.functions.invoke('auto-paper-trade', {
                body: {
                  user_id: alert.user_id,
                  symbol: alert.symbol,
                  direction: matchedDetection.direction || 'long',
                  entry_price: matchedDetection.entry_price,
                  stop_loss_price: matchedDetection.stop_loss_price,
                  take_profit_price: matchedDetection.take_profit_price,
                  risk_percent: alert.risk_percent || 1.0,
                  pattern: alert.pattern,
                  timeframe: alert.timeframe,
                  detection_id: matchedDetection.id,
                },
              });
              if (paperErr) {
                console.error(`[check-alert-matches] Auto paper trade error for alert ${alert.id}:`, paperErr);
              } else {
                console.log(`[check-alert-matches] Auto paper trade opened for alert ${alert.id}`);
              }
            } catch (paperCatch) {
              console.error(`[check-alert-matches] Auto paper trade exception for alert ${alert.id}:`, paperCatch);
            }
          }

          // 9. Fire Signal Webhook (if configured)
          if (alert.webhook_url) {
            try {
              const { error: webhookErr } = await supabase.functions.invoke('fire-signal-webhook', {
                body: {
                  user_id: alert.user_id,
                  alert_id: alert.id,
                  webhook_url: alert.webhook_url,
                  webhook_secret: alert.webhook_secret,
                  symbol: alert.symbol,
                  direction: matchedDetection.direction || 'long',
                  timeframe: alert.timeframe,
                  entry_price: matchedDetection.entry_price,
                  stop_loss_price: matchedDetection.stop_loss_price,
                  take_profit_price: matchedDetection.take_profit_price,
                  risk_reward_ratio: matchedDetection.risk_reward_ratio,
                  pattern: alert.pattern,
                  quality_grade: matchedDetection.quality_score || 'C',
                  detection_id: matchedDetection.id,
                },
              });
              if (webhookErr) {
                console.error(`[check-alert-matches] Webhook error for alert ${alert.id}:`, webhookErr);
              } else {
                console.log(`[check-alert-matches] Webhook fired for alert ${alert.id}`);
              }
            } catch (webhookCatch) {
              console.error(`[check-alert-matches] Webhook exception for alert ${alert.id}:`, webhookCatch);
            }
          }

        } catch (err) {
          console.error(`[check-alert-matches] Error processing alert ${alert.id}:`, err);
        }
      };

      notifications.push(processAlert());
    }

    // Wait for all notifications to complete
    await Promise.allSettled(notifications);

    // Record suppressed detections rather than dropping them silently.
    if (suppressionRows.length > 0) {
      const { error: suppressErr } = await supabase
        .from("alert_suppression_log")
        .insert(suppressionRows);
      if (suppressErr) {
        console.error("[check-alert-matches] Suppression log error:", suppressErr);
      }
    }

    console.log(`[check-alert-matches] Done. Fired ${matchCount}, suppressed ${suppressedCount} for lack of measured edge (out of ${alerts.length} alerts)`);

    return new Response(JSON.stringify({
      success: true,
      totalAlerts: alerts.length,
      totalDetections: detections.length,
      matched: matchCount,
      suppressed: suppressedCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[check-alert-matches] Fatal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
