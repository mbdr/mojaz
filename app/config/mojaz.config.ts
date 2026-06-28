/**
 * Mojaz API Configuration
 * Provides centralized configuration for Mojaz API endpoints and settings
 */

import { getEnvironmentConfig } from "./env";

export interface MojazApiConfig {
  baseUrl: string;
  clientKey: string;
  appId: string;
  appKey: string;
  language: string;
  requestTimeout: number;
  pollingInterval: number;
  pollingMaxRetries: number;
}

/**
 * Get Mojaz API configuration
 * All secrets are server-side only
 */
export function getMojazConfig(): MojazApiConfig {
  const env = getEnvironmentConfig();

  return {
    baseUrl: env.mojazBaseUrl,
    clientKey: env.mojazClientKey,
    appId: env.mojazAppId,
    appKey: env.mojazAppKey,
    language: env.mojazLanguage,
    requestTimeout: env.requestTimeout,
    pollingInterval: env.pollingInterval,
    pollingMaxRetries: env.pollingMaxRetries,
  };
}

/**
 * Mojaz API endpoints
 */
export const MOJAZ_ENDPOINTS = {
  CREATE_REQUEST: "/MojazWeb/api/v1/internal/internationalPdfReport/vin",
  RETRIEVE_PDF: "/MojazWeb/api/v1/internal/internationalPdfReport/request",
} as const;

/**
 * Default Mojaz API headers, built from a resolved config (which may
 * already reflect a validated per-request override - see
 * envOverrideServer.ts - rather than always re-reading the default .env).
 * `language` can be overridden per-request (AR/EN) independently of the
 * configured default - see the Mojaz integration guide.
 * These should only be used server-side.
 */
export function getMojazHeaders(config: MojazApiConfig, language?: string): Record<string, string> {
  return {
    "app-id": config.appId,
    "app-key": config.appKey,
    "Client-key": config.clientKey,
    language: (language || config.language).toLowerCase(),
  };
}
