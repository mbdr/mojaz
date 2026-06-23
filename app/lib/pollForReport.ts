/**
 * Shared polling logic for retrieving a Mojaz PDF report by requestId.
 * The report isn't always ready immediately - the upstream returns a
 * "not ready" result until generation completes, so this polls on an
 * interval until it succeeds or the retry budget is exhausted.
 */

import { validateBase64Server } from "@/app/lib/validation";
import { ReportLanguage, VehicleReportProvider } from "@/app/providers/provider.interface";
import { MojazApiConfig } from "@/app/config/mojaz.config";

export async function pollForReport(
  provider: VehicleReportProvider,
  requestId: string,
  config: MojazApiConfig,
  language?: ReportLanguage
): Promise<string> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt < config.pollingMaxRetries; attempt++) {
    try {
      const { pdfBase64 } = await provider.retrieveReport(requestId, language);

      if (pdfBase64 && validateBase64Server(pdfBase64)) {
        return pdfBase64;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (attempt < config.pollingMaxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, config.pollingInterval));
    }
  }

  throw new Error(lastError || `Failed to retrieve PDF after ${config.pollingMaxRetries} attempts`);
}
