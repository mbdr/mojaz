/**
 * Mojaz Provider Implementation
 * Implements the VehicleReportProvider interface for Mojaz API
 */

import axios, { AxiosInstance } from "axios";
import { ReportLanguage, VehicleReportProvider } from "./provider.interface";
import { getMojazConfig, getMojazHeaders, MojazApiConfig, MOJAZ_ENDPOINTS } from "@/app/config/mojaz.config";
import { CreateRequestResponse, RetrievePdfResponse } from "@/app/types";
import { API_MESSAGES, translate } from "@/app/lib/messages";
import type { MojazConfigOverride } from "@/app/lib/envOverrideServer";

export class MojazProvider implements VehicleReportProvider {
  name = "Mojaz";
  version = "1.0.0";
  private axiosInstance: AxiosInstance;
  private config: MojazApiConfig;
  private extraHeaders?: Record<string, string>;

  constructor(configOverride?: MojazConfigOverride, extraHeaders?: Record<string, string>) {
    this.config = { ...getMojazConfig(), ...configOverride };
    this.extraHeaders = extraHeaders;
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.requestTimeout,
    });
  }

  private buildHeaders(language?: ReportLanguage): Record<string, string> {
    // Extra headers are user-supplied (via Settings/deep link, gated by the
    // same config token check) and applied last so they can add to - or
    // intentionally override - the default headers if needed.
    return { ...getMojazHeaders(this.config, language), ...this.extraHeaders };
  }

  /**
   * Mojaz returns structured, already-localized error bodies (resultMessage)
   * even on 4xx/5xx responses (see integration guide). Axios throws before
   * we can read that body via the normal `.data` access, so surface it here
   * instead of leaking axios's generic "Request failed with status code X".
   * Falls back to a clean, localized generic message for true technical
   * failures (network errors, timeouts) that have no upstream body at all.
   */
  private resolveErrorMessage(error: unknown, language?: ReportLanguage): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { resultMessage?: string } | undefined;
      if (data?.resultMessage) {
        return data.resultMessage;
      }
      return translate(API_MESSAGES.UNEXPECTED_ERROR, language || "en");
    }

    // Errors thrown intentionally above (resultMessage, or an already
    // translated fallback) should pass through unchanged rather than be
    // replaced by the generic message.
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return translate(API_MESSAGES.UNEXPECTED_ERROR, language || "en");
  }

  async createRequest(vin: string, language?: ReportLanguage): Promise<{
    requestId: string;
    message: string;
  }> {
    try {
      const response = await this.axiosInstance.get<CreateRequestResponse>(
        `${MOJAZ_ENDPOINTS.CREATE_REQUEST}?vin=${vin}`,
        { headers: this.buildHeaders(language) }
      );

      if (response.data.resultCode !== 0) {
        throw new Error(response.data.resultMessage || translate(API_MESSAGES.UNEXPECTED_ERROR, language || "en"));
      }

      return {
        requestId: response.data.requestId,
        message: response.data.resultMessage,
      };
    } catch (error) {
      throw new Error(this.resolveErrorMessage(error, language));
    }
  }

  async retrieveReport(requestId: string, language?: ReportLanguage): Promise<{
    requestId: string;
    pdfBase64: string;
    message: string;
  }> {
    try {
      const response = await this.axiosInstance.get<RetrievePdfResponse>(
        `${MOJAZ_ENDPOINTS.RETRIEVE_PDF}?request=${requestId}`,
        { headers: this.buildHeaders(language) }
      );

      if (response.data.resultCode !== 0) {
        throw new Error(response.data.resultMessage || translate(API_MESSAGES.UNEXPECTED_ERROR, language || "en"));
      }

      if (!response.data.resultObject) {
        throw new Error(translate(API_MESSAGES.UNEXPECTED_ERROR, language || "en"));
      }

      return {
        requestId: response.data.requestId,
        pdfBase64: response.data.resultObject,
        message: response.data.resultMessage,
      };
    } catch (error) {
      throw new Error(this.resolveErrorMessage(error, language));
    }
  }

  getInfo() {
    return {
      name: this.name,
      version: this.version,
      baseUrl: this.config.baseUrl,
    };
  }
}
