import { ReportLanguage } from "@/app/providers/provider.interface";

export function parseReportLanguage(value: string | null): ReportLanguage | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return normalized === "ar" || normalized === "en" ? (normalized as ReportLanguage) : undefined;
}
