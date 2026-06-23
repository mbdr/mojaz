/**
 * Provider Interface
 * Defines the contract for vehicle report providers
 * Supports future extensibility for multiple providers
 */

export type ReportLanguage = "ar" | "en";

export interface VehicleReportProvider {
  name: string;
  version: string;

  /**
   * Create report request
   */
  createRequest(vin: string, language?: ReportLanguage): Promise<{
    requestId: string;
    message: string;
  }>;

  /**
   * Retrieve report. `language` controls the response language (and, per
   * the Mojaz integration guide, the language of the generated PDF) and can
   * be supplied independently of the language used at creation time.
   */
  retrieveReport(requestId: string, language?: ReportLanguage): Promise<{
    requestId: string;
    pdfBase64: string;
    message: string;
  }>;

  /**
   * Get provider info
   */
  getInfo(): {
    name: string;
    version: string;
    baseUrl: string;
  };
}
