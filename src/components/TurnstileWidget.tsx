import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact" | "invisible";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;
let cachedSiteKey: string | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    if (window.turnstile) return resolve();
    const existing = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile-load")));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile-load"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function fetchSiteKey(): Promise<string | null> {
  if (cachedSiteKey) return cachedSiteKey;
  try {
    const { data, error } = await supabase.functions.invoke("verify-turnstile", {
      method: "GET",
    });
    if (error) throw error;
    const key = (data as any)?.siteKey || null;
    if (key) cachedSiteKey = key;
    return key;
  } catch (err) {
    console.warn("[Turnstile] could not fetch site key", err);
    return null;
  }
}

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export function TurnstileWidget({ onVerify, onExpire, theme = "auto" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const siteKey = await fetchSiteKey();
        if (!siteKey) {
          setUnavailable(true);
          return;
        }
        await loadScript();
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => setUnavailable(true),
        });
      } catch {
        setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch {
        // noop
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (unavailable) {
    // Fail-open: don't block real users if Turnstile is misconfigured/blocked.
    return null;
  }

  return <div ref={containerRef} className="flex justify-center" />;
}

/**
 * Verifies a Turnstile token via the edge function.
 * Returns true on success or if Turnstile isn't configured (fail-open).
 */
export async function verifyTurnstileToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const { data, error } = await supabase.functions.invoke("verify-turnstile", {
      body: { token },
    });
    if (error) {
      console.warn("[Turnstile] verify error:", error.message);
      return false;
    }
    return !!(data as any)?.success;
  } catch (err) {
    console.warn("[Turnstile] verify exception:", err);
    return false;
  }
}