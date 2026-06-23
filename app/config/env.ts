/**
 * Environment Configuration
 * Centralized configuration module for environment variables
 * Supports: Local, Development, QA, UAT, Production
 */

// import * as dotenv from "dotenv";
// dotenv.config({path: ".env.local"});

interface EnvironmentConfig {
  mojazBaseUrl: string;
  mojazClientKey: string;
  mojazProxySecret: string;
  mojazLanguage: string;
  requestTimeout: number;
  pollingInterval: number;
  pollingMaxRetries: number;
  environment: string;
}

/**
 * Get environment variable with validation
 */
function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  console.log(`Loading env variable: ${key}=${value ? value : "undefined"}`);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please set it in your .env.local file.`
    );
  }
  return value;
}

/**
 * Parse environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    return {
      mojazBaseUrl: getEnvVariable("MOJAZ_BASE_URL"),
      mojazClientKey: getEnvVariable("MOJAZ_CLIENT_KEY"),
      mojazProxySecret: getEnvVariable("MOJAZ_PROXY_SECRET"),
      mojazLanguage: getEnvVariable("MOJAZ_LANGUAGE", "ar"),
      requestTimeout: Number(getEnvVariable("MOJAZ_REQUEST_TIMEOUT", "30000")),
      pollingInterval: Number(getEnvVariable("MOJAZ_POLLING_INTERVAL", "2000")),
      pollingMaxRetries: Number(getEnvVariable("MOJAZ_POLLING_MAX_RETRIES", "30")),
      environment: process.env.NODE_ENV || "development",
    };
  } catch (error) {
    console.error("Configuration Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Get config for server-side operations (safe)
 */
export function getServerConfig(): EnvironmentConfig {
  if (typeof window !== "undefined") {
    throw new Error(
      "Server configuration should not be accessed from the browser"
    );
  }
  return getEnvironmentConfig();
}

/**
 * Validate configuration on startup
 */
export function validateConfig(): boolean {
  try {
    const config = getEnvironmentConfig();
    console.log("✓ Configuration loaded successfully");
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Mojaz API: ${config.mojazBaseUrl}`);
    console.log(`  Language: ${config.mojazLanguage}`);
    return true;
  } catch (error) {
    console.error("✗ Configuration validation failed:", error);
    return false;
  }
}
