/**
 * Inquiry History
 * Lists previously inquired VINs (stored in IndexedDB, metadata only) with
 * per-entry Preview / Download actions in either language. Re-fetches the
 * PDF on demand via the retrieve-only API route using the saved requestId,
 * so a single successful inquiry stays usable in both languages without
 * ever re-running (and re-billing) the inquiry step.
 *
 * Entries whose report fetch failed are flagged with a "Failed" badge and a
 * Retry action instead of Preview/Download, so the user can manually
 * re-attempt the fetch later without losing track of the VIN.
 */

"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  History as HistoryIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { PdfPreview } from "./PdfPreview";
import {
  HistoryEntry,
  addHistoryEntry,
  deleteHistoryEntry,
  getAllHistoryEntries,
} from "@/app/lib/historyDb";
import { retrieveReport } from "@/app/lib/reportClient";
import { downloadPdf } from "@/app/lib/pdf";
import { API_MESSAGES, translate } from "@/app/lib/messages";

type ReportLanguage = "ar" | "en";
type ActionKind = "preview" | "download" | "retry";

interface InquiryHistoryProps {
  refreshSignal: number;
  isRTL: boolean;
}

const TEXT = {
  ar: {
    title: "السجل",
    subtitle: "استعلاماتك السابقة، جاهزة للمعاينة أو التحميل بأي لغة",
    requestId: "معرف الطلب",
    preview: "معاينة",
    download: "تحميل",
    retry: "إعادة المحاولة",
    delete: "حذف",
    failedBadge: "فشل الجلب",
    errorPrefix: "تعذر جلب التقرير:",
  },
  en: {
    title: "History",
    subtitle: "Your previous inquiries, ready to preview or download in either language",
    requestId: "Request ID",
    preview: "Preview",
    download: "Download",
    retry: "Retry",
    delete: "Delete",
    failedBadge: "Fetch failed",
    errorPrefix: "Couldn't fetch the report:",
  },
};

export function InquiryHistory({ refreshSignal, isRTL }: InquiryHistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [languageByEntry, setLanguageByEntry] = useState<Record<string, ReportLanguage>>({});
  const [activeAction, setActiveAction] = useState<{ requestId: string; kind: ActionKind } | null>(null);
  const [previewData, setPreviewData] = useState<{ pdfBase64: string; requestId: string; lang: ReportLanguage } | null>(
    null
  );

  const t = isRTL ? TEXT.ar : TEXT.en;

  useEffect(() => {
    getAllHistoryEntries()
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [refreshSignal]);

  if (entries.length === 0) return null;

  const getLang = (requestId: string): ReportLanguage => languageByEntry[requestId] || (isRTL ? "ar" : "en");

  const setLang = (requestId: string, lang: ReportLanguage) =>
    setLanguageByEntry((prev) => ({ ...prev, [requestId]: lang }));

  const updateEntry = (requestId: string, patch: Partial<HistoryEntry>) =>
    setEntries((prev) => prev.map((e) => (e.requestId === requestId ? { ...e, ...patch } : e)));

  const runAction = async (entry: HistoryEntry, kind: ActionKind) => {
    const lang = getLang(entry.requestId);
    setActiveAction({ requestId: entry.requestId, kind });

    try {
      const { pdfBase64 } = await retrieveReport(entry.requestId, lang);

      if (kind === "download") {
        try {
          downloadPdf(pdfBase64, `vehicle-report-${entry.vin}-${lang}.pdf`);
        } catch {
          throw new Error(translate(API_MESSAGES.DOWNLOAD_FAILED, lang));
        }
      } else {
        // "preview" and a successful "retry" both end in showing the PDF.
        setPreviewData({ pdfBase64, requestId: entry.requestId, lang });
      }

      if (entry.status === "failed") {
        const updated: HistoryEntry = { ...entry, status: "success", error: undefined };
        await addHistoryEntry(updated);
        updateEntry(entry.requestId, { status: "success", error: undefined });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      const updated: HistoryEntry = { ...entry, status: "failed", error: message };
      await addHistoryEntry(updated).catch(() => {});
      updateEntry(entry.requestId, { status: "failed", error: message });
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    await deleteHistoryEntry(requestId);
    setEntries((prev) => prev.filter((e) => e.requestId !== requestId));
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString(isRTL ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mojaz-cream)] text-[var(--mojaz-red)]">
          <HistoryIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const lang = getLang(entry.requestId);
          const isFailed = entry.status === "failed";
          const isPreviewLoading = activeAction?.requestId === entry.requestId && activeAction.kind === "preview";
          const isDownloadLoading = activeAction?.requestId === entry.requestId && activeAction.kind === "download";
          const isRetryLoading = activeAction?.requestId === entry.requestId && activeAction.kind === "retry";

          return (
            <div
              key={entry.requestId}
              className={`flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
                isFailed ? "border-red-200" : "border-gray-100"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold text-gray-900" dir="ltr">
                    {entry.vin}
                  </p>
                  {isFailed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      {t.failedBadge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDate(entry.createdAt)} · {t.requestId}: {entry.requestId}
                </p>
                {isFailed && entry.error && (
                  <p className="mt-1 text-xs text-red-600">
                    {t.errorPrefix} {entry.error}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Language toggle */}
                <div className="flex rounded-full border border-gray-200 p-0.5">
                  {(["ar", "en"] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLang(entry.requestId, code)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        lang === code
                          ? "bg-[var(--mojaz-red)] text-white"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {code === "ar" ? "AR" : "EN"}
                    </button>
                  ))}
                </div>

                {isFailed ? (
                  <Button
                    type="button"
                    variant="mojaz"
                    size="sm"
                    disabled={activeAction !== null}
                    onClick={() => runAction(entry, "retry")}
                  >
                    {isRetryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ms-1.5">{t.retry}</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="mojaz-outline"
                      size="sm"
                      disabled={activeAction !== null}
                      onClick={() => runAction(entry, "preview")}
                    >
                      {isPreviewLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="ms-1.5">{t.preview}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="mojaz"
                      size="sm"
                      disabled={activeAction !== null}
                      onClick={() => runAction(entry, "download")}
                    >
                      {isDownloadLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="ms-1.5">{t.download}</span>
                    </Button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(entry.requestId)}
                  aria-label={t.delete}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {previewData && (
        <PdfPreview
          pdfBase64={previewData.pdfBase64}
          requestId={previewData.requestId}
          isRTL={previewData.lang === "ar"}
          onClose={() => setPreviewData(null)}
        />
      )}
    </section>
  );
}
