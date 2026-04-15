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
 *   - session.engaged, session.scroll_depth
 */

import { supabase } from '@/integrations/supabase/client';

// ---------- Bot Detection ----------

const BOT_UA_PATTERNS = /bot|crawl|spider|slurp|baidu|yandex|sogou|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|bingbot|googlebot/i;

function detectBotSuspect(): boolean {
  try {
    if ((navigator as any).webdriver) return true;
    if (BOT_UA_PATTERNS.test(navigator.userAgent)) return true;
    if (window.innerWidth === 0 && window.innerHeight === 0) return true;
  } catch {
    // SSR or restricted environment
  }
  return false;
}

const _isBotSuspect = typeof window !== 'undefined' ? detectBotSuspect() : false;

// ---------- Session ----------

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
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

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUserId = session?.user?.id ?? null;
});

// ---------- Engagement Tracking ----------

let _engagedFired = false;
const _sessionStart = typeof window !== 'undefined' ? Date.now() : 0;

function checkAndFireEngaged(reason: string) {
  if (_engagedFired || _isBotSuspect) return;
  _engagedFired = true;
  trackEvent('session.engaged', { trigger: reason });
}

if (typeof window !== 'undefined') {
  // Fire engaged after 5 seconds on page
  setTimeout(() => {
    checkAndFireEngaged('time_5s');
  }, 5000);

  // Fire engaged on first meaningful click
  const clickHandler = () => {
    checkAndFireEngaged('click');
    document.removeEventListener('click', clickHandler);
  };
  document.addEventListener('click', clickHandler, { passive: true });
}

// ---------- Scroll Depth Tracking ----------

const _scrollMilestones = new Set<number>();

if (typeof window !== 'undefined') {
  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone && !_scrollMilestones.has(milestone)) {
        _scrollMilestones.add(milestone);
        trackEvent('session.scroll_depth', { depth: milestone, path: window.location.pathname });

        if (milestone >= 25) {
          checkAndFireEngaged('scroll_25');
        }
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

// ---------- Queue & Batching ----------

interface QueuedEvent {
  event_name: string;
  properties: Record<string, string | number | boolean | null | undefined>;
  user_id: string | null;
  session_id: string;
  ts: string;
  is_bot_suspect: boolean;
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
    is_bot_suspect: _isBotSuspect,
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
