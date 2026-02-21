/**
 * Lightweight analytics utility for tracking user journey events.
 * Writes to the `analytics_events` table via Supabase.
 * 
 * Events follow a noun.verb naming convention:
 *   - page.view, page.leave
 *   - copilot.open, copilot.action_click
 *   - pattern_lab.mode_select, pattern_lab.run_backtest
 *   - script.generate, script.copy
 *   - alert.create
 */

import { supabase } from '@/integrations/supabase/client';

// ---------- Session ----------

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  // Persist per browser-tab session
  const key = 'cp_session_id';
  let stored = sessionStorage.getItem(key);
  if (!stored) {
    stored = crypto.randomUUID();
    sessionStorage.setItem(key, stored);
  }
  _sessionId = stored;
  return stored;
}

// ---------- User ID cache ----------

let _cachedUserId: string | null = null;

async function getUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId;
  try {
    const { data } = await supabase.auth.getUser();
    _cachedUserId = data.user?.id ?? null;
  } catch {
    _cachedUserId = null;
  }
  return _cachedUserId;
}

// Listen for auth changes to update cached user
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUserId = session?.user?.id ?? null;
});

// ---------- Queue & Batching ----------

interface QueuedEvent {
  event_name: string;
  properties: Record<string, string | number | boolean | null | undefined>;
  user_id: string | null;
  session_id: string;
  ts: string;
}

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 3_000;
const MAX_BATCH_SIZE = 20;

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);

  try {
    const { error } = await supabase.from('analytics_events').insert(batch);
    if (error) {
      console.warn('[analytics] flush error:', error.message);
      // Re-enqueue on failure (drop if queue is huge to avoid memory leak)
      if (queue.length < 200) queue.push(...batch);
    }
  } catch (err) {
    console.warn('[analytics] flush exception:', err);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', () => flush());
}

// ---------- Public API ----------

/**
 * Track an analytics event.
 * Non-blocking — events are batched and flushed every 3 seconds.
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, string | number | boolean | null | undefined> = {}
) {
  const userId = await getUserId();
  const sessionId = getSessionId();

  queue.push({
    event_name: eventName,
    properties: {
      ...properties,
      url: window.location.pathname,
      referrer: document.referrer || null,
    },
    user_id: userId,
    session_id: sessionId,
    ts: new Date().toISOString(),
  });

  if (queue.length >= MAX_BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Track a page view. Called automatically by usePageTracking().
 */
export function trackPageView(path: string, params?: Record<string, string>) {
  trackEvent('page.view', {
    path,
    search_params: params ? JSON.stringify(params) : null,
  });
}

/**
 * Track page leave with time-on-page.
 */
export function trackPageLeave(path: string, durationMs: number) {
  trackEvent('page.leave', {
    path,
    duration_ms: durationMs,
    duration_sec: Math.round(durationMs / 1000),
  });
}
