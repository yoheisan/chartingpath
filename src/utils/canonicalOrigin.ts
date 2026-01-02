// Centralizes logic for Lovable preview domains so PKCE flows keep the same origin
// (PKCE stores a code_verifier in localStorage, which is origin-scoped).

export function getCanonicalAppOrigin(): string {
  const host = window.location.hostname;

  // Already on the canonical preview domain.
  if (host.endsWith(".lovableproject.com")) return window.location.origin;

  // Lovable editor preview iframe domain.
  // Example: id-preview--<project_uuid>.lovable.app
  const match = host.match(/^id-preview--([0-9a-f-]{36})\.lovable\.app$/i);
  if (match) {
    const projectId = match[1];
    return `https://${projectId}.lovableproject.com`;
  }

  // Custom domains / production.
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
