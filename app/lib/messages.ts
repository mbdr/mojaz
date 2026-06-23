/**
 * Centralized bilingual copy for synthetic (non-upstream) messages used
 * across the API routes and client components. Upstream Mojaz API messages
 * already come back in the requested language and are passed through as-is
 * - this file only covers strings this app generates itself.
 */

export type AppLanguage = "ar" | "en";

export const VIN_ERROR_MESSAGES = {
  REQUIRED: { ar: "رقم الهيكل (VIN) مطلوب", en: "VIN is required" },
  INVALID_LENGTH: { ar: "يجب أن يتكون رقم الهيكل من 17 حرفًا بالضبط", en: "VIN must be exactly 17 characters" },
  INVALID_CHARS: {
    ar: "رقم الهيكل يحتوي على حروف غير صالحة (I، O، Q غير مسموح بها)",
    en: "VIN contains invalid characters (I, O, Q are not allowed)",
  },
} as const;

export type VinErrorCode = keyof typeof VIN_ERROR_MESSAGES;

export const API_MESSAGES = {
  VIN_PARAM_REQUIRED: { ar: "معامل رقم الهيكل (VIN) مطلوب", en: "VIN parameter is required" },
  REQUEST_ID_PARAM_REQUIRED: { ar: "معامل معرف الطلب مطلوب", en: "requestId parameter is required" },
  RATE_LIMIT_EXCEEDED: {
    ar: "تم تجاوز الحد المسموح من الطلبات. الحد الأقصى 100 طلب كل 15 دقيقة",
    en: "Rate limit exceeded. Maximum 100 requests per 15 minutes.",
  },
  UNEXPECTED_ERROR: { ar: "حدث خطأ غير متوقع", en: "An unexpected error occurred" },
  RETRIEVE_FAILED: { ar: "تعذر جلب تقرير المركبة", en: "Failed to retrieve vehicle report" },
  DOWNLOAD_FAILED: { ar: "تعذر تحميل ملف PDF", en: "Failed to download PDF" },
} as const;

export function translate(entry: { ar: string; en: string }, language: AppLanguage): string {
  return entry[language];
}
