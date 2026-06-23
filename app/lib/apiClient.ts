/**
 * Builds the headers every API call to our own backend should carry:
 * the per-browser session id, and - if one was set via a deep link - the
 * environment override config. The server independently validates the
 * override's token before honoring it (see envOverrideServer.ts); without a
 * valid token it always falls back to the default .env config.
 */

import { getOrCreateSessionId, getEnvironmentOverride } from "@/app/lib/sessionDb";

export async function buildApiHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  try {
    headers["X-Session-Id"] = await getOrCreateSessionId();
  } catch {
    // IndexedDB unavailable (e.g. private browsing) - proceed without a session id.
  }

  try {
    const override = await getEnvironmentOverride();
    if (override?.baseUrl) headers["X-Mojaz-Base-Url"] = override.baseUrl;
    if (override?.clientKey) headers["X-Mojaz-Client-Key"] = override.clientKey;
    if (override?.proxySecret) headers["X-Mojaz-Proxy-Secret"] = override.proxySecret;
    if (override?.language) headers["X-Mojaz-Language"] = override.language;
    if (override?.configToken) headers["X-Config-Token"] = override.configToken;

    const customHeaders = override?.customHeaders?.filter((h) => h.key.trim());
    if (customHeaders && customHeaders.length > 0) {
      const headerMap = Object.fromEntries(customHeaders.map((h) => [h.key.trim(), h.value]));
      // Sent as one JSON-encoded header rather than raw header names, since
      // arbitrary user-typed names could collide with reserved ones above
      // or hit browser-disallowed header restrictions.
      headers["X-Mojaz-Extra-Headers"] = JSON.stringify(headerMap);
    }
  } catch {
    // No override configured - server will use its default environment.
  }

  return headers;
}
