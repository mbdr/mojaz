import { InternationalReportApiResponse } from "@/app/types";
import { API_MESSAGES, translate } from "@/app/lib/messages";
import { buildApiHeaders } from "@/app/lib/apiClient";

export async function retrieveReport(
  requestId: string,
  lang: "ar" | "en"
): Promise<InternationalReportApiResponse> {
  const headers = await buildApiHeaders();
  const response = await fetch(
    `/api/international-report/retrieve?requestId=${encodeURIComponent(requestId)}&lang=${lang}`,
    { headers }
  );
  const data: InternationalReportApiResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || translate(API_MESSAGES.RETRIEVE_FAILED, lang));
  }

  return data;
}
