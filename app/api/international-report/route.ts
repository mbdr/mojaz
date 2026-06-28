/**
 * International Report API Route
 * GET /api/international-report?vin={VIN}&lang={ar|en}
 *
 * Handles:
 * 1. VIN validation
 * 2. API request creation
 * 3. PDF retrieval with polling
 * 4. Response normalization
 */

import { NextRequest, NextResponse } from "next/server";
import { InternationalReportApiResponse } from "@/app/types";
import { translateVinError, validateVin } from "@/app/lib/validation";
import { ProviderFactory } from "@/app/providers/provider.factory";
import { getMojazConfig } from "@/app/config/mojaz.config";
import { MojazProvider } from "@/app/providers/mojaz.provider";
import { withCors } from "@/app/lib/cors";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { pollForReport } from "@/app/lib/pollForReport";
import { parseReportLanguage } from "@/app/lib/language";
import { API_MESSAGES, translate } from "@/app/lib/messages";
import { resolveOverride, getSessionId } from "@/app/lib/envOverrideServer";

/**
 * In production, show just enough of a secret to confirm which value
 * loaded without leaking it fully into logs. In dev, show it in full so
 * it's easy to verify against the upstream service.
 */
function maskSecret(value: string): string {
  if (process.env.NODE_ENV !== "production") return value;
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * GET /api/international-report
 * Query parameters: vin (required), lang (optional, ar|en)
 */
export async function GET(request: NextRequest): Promise<NextResponse<InternationalReportApiResponse>> {
  const origin = request.headers.get("origin");
  const json = (
    body: InternationalReportApiResponse,
    init?: { status?: number; headers?: Record<string, string> }
  ) =>
    withCors(
      NextResponse.json(body, {
        status: init?.status,
        headers: init?.headers,
      }),
      origin
    );

  const { searchParams } = new URL(request.url);
  const language = parseReportLanguage(searchParams.get("lang"));
  const messageLang = language || "en";

  // Tracked outside the try block so a failure after the inquiry step (e.g.
  // a polling timeout) can still report the requestId back to the client -
  // that lets the UI save a "failed" history entry the user can retry later
  // without re-running (and re-billing) the inquiry.
  let requestId = "";

  try {
    if (!checkRateLimit(getClientIp(request))) {
      return json(
        {
          success: false,
          requestId: "",
          pdfBase64: "",
          error: translate(API_MESSAGES.RATE_LIMIT_EXCEEDED, messageLang),
        },
        { status: 429 }
      );
    }

    const vin = searchParams.get("vin");

    if (!vin) {
      return json(
        {
          success: false,
          requestId: "",
          pdfBase64: "",
          error: translate(API_MESSAGES.VIN_PARAM_REQUIRED, messageLang),
        },
        { status: 400 }
      );
    }

    const vinValidation = validateVin(vin);
    if (!vinValidation.isValid) {
      return json(
        {
          success: false,
          requestId: "",
          pdfBase64: "",
          error: translateVinError(vinValidation.errorCode!, messageLang),
        },
        { status: 400 }
      );
    }

    // A client may ask to use a different Mojaz environment (base URL,
    // credentials) and/or add extra headers via Settings/a deep link, but
    // it's only honored if it carries a token matching CONFIG_OVERRIDE_TOKEN
    // server-side - otherwise this silently resolves to undefined and we
    // use the default.
    const override = resolveOverride(request);
    const provider = override
      ? new MojazProvider(override.config, override.extraHeaders)
      : ProviderFactory.getProvider("mojaz");
    const config = { ...getMojazConfig(), ...override?.config };

    console.log("[API] Resolved Mojaz config:", {
      sessionId: getSessionId(request),
      usingOverride: Boolean(override),
      extraHeaderKeys: override?.extraHeaders ? Object.keys(override.extraHeaders) : [],
      baseUrl: config.baseUrl,
      language: language || config.language,
      requestTimeout: config.requestTimeout,
      pollingInterval: config.pollingInterval,
      pollingMaxRetries: config.pollingMaxRetries,
      clientKey: maskSecret(config.clientKey),
      appId: maskSecret(config.appId),
      appKey: maskSecret(config.appKey),
    });

    console.log(`[API] Creating request for VIN: ${vin}`);
    const createResponse = await provider.createRequest(vin, language);
    requestId = createResponse.requestId;

    console.log(`[API] Polling for PDF with requestId: ${requestId}`);
    const pdfBase64 = await pollForReport(provider, requestId, config, language);
    console.log(`[API] PDF retrieved successfully for requestId: ${requestId}`);

    return json(
      {
        success: true,
        requestId,
        pdfBase64,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      }
    );
  } catch (error) {
    console.error("[API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : translate(API_MESSAGES.UNEXPECTED_ERROR, messageLang);

    return json(
      {
        success: false,
        requestId,
        pdfBase64: "",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Preflight requests for cross-origin GET calls
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  return withCors(new NextResponse(null, { status: 204 }), origin);
}

/**
 * Handle other HTTP methods
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, OPTIONS" } }
  );
}
