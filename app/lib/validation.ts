/**
 * Validation Utilities
 */

import { VinValidationResult } from "@/app/types";
import { VIN_ERROR_MESSAGES, VinErrorCode, AppLanguage } from "@/app/lib/messages";

/**
 * Validate VIN format (17 characters, alphanumeric).
 * Returns a language-agnostic error code; callers translate it for display
 * (see VIN_ERROR_MESSAGES) so this stays decoupled from presentation language.
 */
export function validateVin(vin: string): VinValidationResult {
  const trimmed = vin.trim().toUpperCase();

  if (!trimmed) {
    return { isValid: false, errorCode: "REQUIRED" };
  }

  if (trimmed.length !== 17) {
    return { isValid: false, errorCode: "INVALID_LENGTH" };
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(trimmed)) {
    return { isValid: false, errorCode: "INVALID_CHARS" };
  }

  return { isValid: true };
}

/**
 * Convenience helper for server routes that need a translated message
 * directly rather than the raw error code.
 */
export function translateVinError(errorCode: VinErrorCode, language: AppLanguage): string {
  return VIN_ERROR_MESSAGES[errorCode][language];
}

/**
 * Validate Base64 string
 */
export function validateBase64(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

/**
 * Validate Base64 string (server-side compatible)
 */
export function validateBase64Server(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"]/g, "").toUpperCase();
}
