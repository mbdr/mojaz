/**
 * Type Definitions
 */

export interface MojazApiResponse<T = unknown> {
  resultCode: number;
  resultMessage: string;
  resultObject: T;
  requestId: string;
}

export interface CreateRequestResponse extends MojazApiResponse<null> {
  requestId: string;
}

export interface RetrievePdfResponse extends MojazApiResponse<string> {
  resultObject: string; // Base64 PDF
}

export interface InternationalReportApiResponse {
  success: boolean;
  requestId: string;
  pdfBase64: string;
  error?: string;
}

export interface VinValidationResult {
  isValid: boolean;
  errorCode?: "REQUIRED" | "INVALID_LENGTH" | "INVALID_CHARS";
}

export interface PdfPreviewState {
  isLoading: boolean;
  error: string | null;
  pdfData: string | null;
  requestId: string | null;
}
