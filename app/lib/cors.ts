/**
 * CORS helpers for API routes.
 *
 * Allowed origins are read from ALLOWED_ORIGINS (comma-separated). If unset,
 * same-origin requests are allowed and cross-origin requests are rejected by
 * omitting the Access-Control-Allow-Origin header (browsers then block the read).
 */

function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function resolveAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;

  const allowed = getAllowedOrigins();
  if (allowed.includes("*")) return requestOrigin;
  if (allowed.includes(requestOrigin)) return requestOrigin;

  return null;
}

export function corsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowedOrigin = resolveAllowedOrigin(requestOrigin);
  if (!allowedOrigin) return {};

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function withCors<T extends { headers: Headers }>(response: T, requestOrigin: string | null): T {
  const headers = corsHeaders(requestOrigin);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
