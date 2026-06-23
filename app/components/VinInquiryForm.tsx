/**
 * VIN Inquiry Form Component
 * Handles user input, validation, and API calls
 */

"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { InternationalReportApiResponse } from "../types";
import { validateVin, translateVinError } from "../lib/validation";
import { Input } from "./ui/input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { ProcessingIndicator } from "./ProcessingIndicator";
import { buildApiHeaders } from "../lib/apiClient";

export interface VinInquiryFailure {
  vin: string;
  error: string;
  requestId?: string;
}

interface VinInquiryFormProps {
  onSuccess: (data: InternationalReportApiResponse, vin: string) => void;
  onError: (failure: VinInquiryFailure) => void;
  isRTL?: boolean;
}

const TEXT = {
  ar: {
    label: "رقم الهيكل (VIN)",
    placeholder: "مثال: 1HGBH41JXMN109186",
    helper: "أدخل رقم هيكل مكوّن من 17 حرفًا. الحروف I، O، Q غير مسموح بها.",
    errorTitle: "خطأ",
    search: "بحث",
    clear: "إلغاء",
    genericError: "حدث خطأ غير متوقع",
  },
  en: {
    label: "Vehicle Identification Number (VIN)",
    placeholder: "e.g., 1HGBH41JXMN109186",
    helper: "Enter a 17-character VIN. Characters I, O, Q are not allowed.",
    errorTitle: "Error",
    search: "Search",
    clear: "Clear",
    genericError: "An unexpected error occurred",
  },
};

export function VinInquiryForm({ onSuccess, onError, isRTL = false }: VinInquiryFormProps) {
  const [vin, setVin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const lang = isRTL ? "ar" : "en";
  const t = TEXT[lang];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setVin(value);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateVin(vin);
    if (!validation.isValid) {
      const message = translateVinError(validation.errorCode!, lang);
      setValidationError(message);
      onError({ vin, error: message });
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      const headers = await buildApiHeaders();
      const response = await fetch(
        `/api/international-report?vin=${encodeURIComponent(vin)}&lang=${lang}`,
        { headers }
      );
      const data: InternationalReportApiResponse = await response.json();

      if (!response.ok || !data.success) {
        const message = data.error || t.genericError;
        setValidationError(message);
        onError({ vin, error: message, requestId: data.requestId || undefined });
        return;
      }

      onSuccess(data, vin);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.genericError;
      setValidationError(message);
      onError({ vin, error: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setVin("");
    setValidationError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-2">
        <label htmlFor="vin" className="block text-sm font-medium text-gray-800">
          {t.label}
        </label>
        <Input
          id="vin"
          placeholder={t.placeholder}
          value={vin}
          onChange={handleChange}
          disabled={isLoading}
          maxLength={17}
          className="h-12 rounded-full px-5 font-mono text-base focus-visible:ring-[var(--mojaz-red)]"
          dir="ltr"
        />
        <p className="text-xs text-gray-500">{t.helper}</p>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <ProcessingIndicator isRTL={isRTL} />
      ) : (
        <div className="flex gap-2">
          <Button type="submit" variant="mojaz" size="lg" disabled={!vin} className="flex-1">
            {t.search}
          </Button>
          <Button type="button" variant="mojaz-outline" size="lg" onClick={handleClear}>
            {t.clear}
          </Button>
        </div>
      )}
    </form>
  );
}
