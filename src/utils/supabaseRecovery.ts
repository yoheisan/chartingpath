import type { Session, SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __cp_recovery_exchange_key?: string;
    __cp_recovery_exchange_promise?: Promise<void>;
  }
}

export async function waitForSupabaseSession(
  client: SupabaseClient,
  opts: { attempts?: number; delayMs?: number } = {}
): Promise<Session | null> {
  const attempts = opts.attempts ?? 10;
  const delayMs = opts.delayMs ?? 200;

  for (let i = 0; i < attempts; i++) {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session) return session;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

/**
 * Makes recovery links robust in React StrictMode/dev by ensuring we exchange the one-time
 * recovery `code` at most once (single-flight), even if effects run twice.
 */
export async function exchangeRecoverySessionFromUrlOnce(
  client: SupabaseClient
): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");

  const hash = url.hash.startsWith("#") ? url.hash.substring(1) : "";
  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");

  const key = code
    ? `code:${code}`
    : access_token
      ? `token:${access_token.slice(0, 16)}`
      : null;

  // Nothing to exchange.
  if (!key) return;

  // Single-flight: if StrictMode runs effects twice, share the same promise.
  if (window.__cp_recovery_exchange_key === key && window.__cp_recovery_exchange_promise) {
    await window.__cp_recovery_exchange_promise;
    return;
  }

  window.__cp_recovery_exchange_key = key;
  window.__cp_recovery_exchange_promise = (async () => {
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return;
    }

    if (access_token && refresh_token) {
      const { error } = await client.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
    }
  })();

  await window.__cp_recovery_exchange_promise;
}

export function cleanRecoveryUrl(): void {
  const next = new URL(window.location.href);
  next.searchParams.delete("code");
  next.searchParams.delete("state");
  next.searchParams.delete("type");
  next.hash = "";
  const qs = next.searchParams.toString();
  const nextUrl = qs ? `${next.pathname}?${qs}` : next.pathname;
  window.history.replaceState({}, document.title, nextUrl);
}
