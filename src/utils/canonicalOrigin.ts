// Centralizes logic for Lovable preview domains so PKCE flows keep the same origin
// (PKCE stores a code_verifier in localStorage, which is origin-scoped).

export function getCanonicalAppOrigin(): string {
  // In development/preview, just use the current origin.
  // This prevents redirect loops when .lovableproject.com is not available.
  // The canonical redirect feature should only be used in production with a verified custom domain.
  return window.location.origin;
}

export function redirectToCanonicalOriginIfNeeded(): void {
  const canonical = getCanonicalAppOrigin();
  if (canonical === window.location.origin) return;

  const url = new URL(window.location.href);

  // Don't redirect while handling auth callbacks.
  const hasAuthCallbackParams =
    url.searchParams.has("code") ||
    url.searchParams.get("type") === "recovery" ||
    url.hash.includes("access_token=") ||
    url.hash.includes("type=recovery");

  if (hasAuthCallbackParams) return;

  window.location.replace(`${canonical}${url.pathname}${url.search}${url.hash}`);
}
