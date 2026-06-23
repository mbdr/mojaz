/**
 * Server-side validation for client-supplied environment overrides.
 *
 * A client (via EnvironmentDeepLink, the Settings page, and apiClient) can
 * ask to point requests at a different Mojaz base URL / credentials, and/or
 * add arbitrary extra headers to the upstream call. This is only honored if:
 *   1. CONFIG_OVERRIDE_TOKEN is set in this server's environment, AND
 *   2. the request's X-Config-Token header matches it exactly.
 *
 * Without both, every request silently falls back to the default .env
 * config with no extra headers - a client can never force the server to
 * call an arbitrary host, use arbitrary credentials, or inject arbitrary
 * headers into the upstream call just by sending headers. This exists for
 * controlled multi-environment testing (e.g. QA pointing at a staging
 * Mojaz instance), not as a general-purpose passthrough.
 */

import { NextRequest } from "next/server";
import { MojazApiConfig } from "@/app/config/mojaz.config";

export type MojazConfigOverride = Partial<
  Pick<MojazApiConfig, "baseUrl" | "clientKey" | "proxySecret" | "language">
>;

export interface ResolvedOverride {
  config?: MojazConfigOverride;
  extraHeaders?: Record<string, string>;
}

function isAuthorized(request: NextRequest): boolean {
  const requiredToken = process.env.CONFIG_OVERRIDE_TOKEN;
  if (!requiredToken) return false;

  const providedToken = request.headers.get("x-config-token");
  return Boolean(providedToken) && providedToken === requiredToken;
}

function parseExtraHeaders(request: NextRequest): Record<string, string> | undefined {
  const raw = request.headers.get("x-mojaz-extra-headers");
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;

    const headers = Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => typeof key === "string" && key.trim() && typeof value === "string"
      )
    ) as Record<string, string>;

    return Object.keys(headers).length > 0 ? headers : undefined;
  } catch {
    // Malformed JSON from a client - ignore rather than fail the request.
    return undefined;
  }
}

export function resolveOverride(request: NextRequest): ResolvedOverride | undefined {
  if (!isAuthorized(request)) return undefined;

  const config: MojazConfigOverride = {};
  const baseUrl = request.headers.get("x-mojaz-base-url");
  const clientKey = request.headers.get("x-mojaz-client-key");
  const proxySecret = request.headers.get("x-mojaz-proxy-secret");
  const language = request.headers.get("x-mojaz-language");

  if (baseUrl) config.baseUrl = baseUrl;
  if (clientKey) config.clientKey = clientKey;
  if (proxySecret) config.proxySecret = proxySecret;
  if (language) config.language = language;

  const extraHeaders = parseExtraHeaders(request);
  const hasConfig = Object.keys(config).length > 0;

  if (!hasConfig && !extraHeaders) return undefined;

  return { config: hasConfig ? config : undefined, extraHeaders };
}

export function getSessionId(request: NextRequest): string | null {
  return request.headers.get("x-session-id");
}
