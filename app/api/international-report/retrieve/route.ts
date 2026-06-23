/**
 * Report Retrieval-Only Route
 * GET /api/international-report/retrieve?requestId={id}&lang={ar|en}
 *
 * Re-fetches a previously generated PDF by requestId without re-running the
 * inquiry step. Per the Mojaz integration guide, the inquiry step can incur
 * charges, so history actions (preview/download in a given language) reuse
 * the existing requestId instead of inquiring again.
 */

import { NextRequest, NextResponse } from "next/server";
import { InternationalReportApiResponse } from "@/app/types";
import { ProviderFactory } from "@/app/providers/provider.factory";
import { getMojazConfig } from "@/app/config/mojaz.config";
import { MojazProvider } from "@/app/providers/mojaz.provider";
import { withCors } from "@/app/lib/cors";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";
import { pollForReport } from "@/app/lib/pollForReport";
import { parseReportLanguage } from "@/app/lib/language";
import { API_MESSAGES, translate } from "@/app/lib/messages";
import { resolveOverride, getSessionId } from "@/app/lib/envOverrideServer";

export async function GET(request: NextRequest): Promise<NextResponse<InternationalReportApiResponse>> {
  const origin = request.headers.get("origin");
  const json = (
    body: InternationalReportApiResponse,
    init?: { status?: number; headers?: Record<string, string> }
  ) =>
    withCors(NextResponse.json(body, { status: init?.status, headers: init?.headers }), origin);

  const { searchParams } = new URL(request.url);
  const language = parseReportLanguage(searchParams.get("lang"));
  const messageLang = language || "en";

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

    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return json(
        {
          success: false,
          requestId: "",
          pdfBase64: "",
          error: translate(API_MESSAGES.REQUEST_ID_PARAM_REQUIRED, messageLang),
        },
        { status: 400 }
      );
    }

    const override = resolveOverride(request);
    const provider = override
      ? new MojazProvider(override.config, override.extraHeaders)
      : ProviderFactory.getProvider("mojaz");
    const config = { ...getMojazConfig(), ...override?.config };

    console.log(
      `[API] Retrieving existing report ${requestId} (lang: ${language || config.language}, session: ${getSessionId(request)}, override: ${Boolean(override)})`
    );
    const pdfBase64 = await pollForReport(provider, requestId, config, language);

    return json(
      { success: true, requestId, pdfBase64 },
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
    console.error("[API] Retrieve error:", error);

    const errorMessage =
      error instanceof Error ? error.message : translate(API_MESSAGES.UNEXPECTED_ERROR, messageLang);

    return json(
      { success: false, requestId: searchParams.get("requestId") || "", pdfBase64: "", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  return withCors(new NextResponse(null, { status: 204 }), origin);
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, OPTIONS" } });
}
