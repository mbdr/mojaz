/**
 * PDF Preview Component
 * Displays PDF from Base64 data
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { base64ToBlob, downloadPdf } from "@/app/lib/pdf";
import { Download, X, AlertCircle, Loader2, ExternalLink, BadgeCheck } from "lucide-react";

interface PdfPreviewProps {
  pdfBase64: string;
  requestId: string;
  onClose: () => void;
  isRTL?: boolean;
}

export function PdfPreview({ pdfBase64, requestId, onClose, isRTL = false }: PdfPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const t = isRTL
    ? {
        title: "تقرير المركبة",
        requestId: "معرف الطلب",
        ready: "جاهز",
        openNewTab: "فتح في تبويب جديد",
        download: "تحميل PDF",
        close: "إغلاق",
        downloadError: "خطأ في التحميل",
        loadingPreview: "جارٍ تحميل المعاينة...",
        prepareFailed: "تعذر تجهيز ملف PDF للمعاينة",
        downloadFailed: "تعذر تحميل ملف PDF",
        previewFailed: "تعذر تحميل معاينة PDF. استخدم زر التحميل أدناه بدلاً من ذلك.",
      }
    : {
        title: "Vehicle Report",
        requestId: "Request ID",
        ready: "Ready",
        openNewTab: "Open in new tab",
        download: "Download PDF",
        close: "Close",
        downloadError: "Download Error",
        loadingPreview: "Loading preview...",
        prepareFailed: "Failed to prepare PDF for preview",
        downloadFailed: "Failed to download PDF",
        previewFailed: "Failed to load PDF preview. Use Download below instead.",
      };

  // data: URIs are unreliable for multi-MB PDFs across browsers; building a
  // Blob and an object URL instead handles large binary payloads correctly.
  // pdfUrl is pure derived state from pdfBase64, so it's computed directly
  // here rather than via an effect+setState; only the revoke cleanup (an
  // actual side effect) needs its own effect below.
  const { pdfUrl, prepareFailed } = useMemo(() => {
    try {
      const blob = base64ToBlob(pdfBase64);
      return { pdfUrl: URL.createObjectURL(blob), prepareFailed: false };
    } catch {
      return { pdfUrl: null, prepareFailed: true };
    }
  }, [pdfBase64]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const filename = `vehicle-report-${requestId}.pdf`;
      downloadPdf(pdfBase64, filename);
    } catch {
      setError(t.downloadFailed);
    }
  };

  const displayError = error || (prepareFailed ? t.prepareFailed : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 backdrop-blur-sm sm:p-6"
      dir={isRTL ? "rtl" : "ltr"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 bg-gradient-to-l from-[var(--mojaz-red-dark)] to-[var(--mojaz-red)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold sm:text-lg">{t.title}</h2>
              <p className="truncate text-xs text-white/80">
                {t.requestId}: {requestId}
                <span className="mx-2 inline-block h-1 w-1 rounded-full bg-white/50 align-middle" />
                {t.ready}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {displayError && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t.downloadError}</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {/* PDF Viewer */}
        <div className="relative flex-1 overflow-hidden bg-gray-100">
          {!iframeLoaded && !displayError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--mojaz-red)]" />
              <p className="text-sm text-gray-400">{t.loadingPreview}</p>
            </div>
          )}
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title={t.title}
              className="h-full w-full border-0"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setError(t.previewFailed)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3.5 sm:px-6">
          <Button variant="mojaz-outline" onClick={onClose}>
            {t.close}
          </Button>
          {pdfUrl && (
            <Button variant="mojaz-outline" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                {t.openNewTab}
              </a>
            </Button>
          )}
          <Button variant="mojaz" onClick={handleDownload}>
            <Download className="me-2 h-4 w-4" />
            {t.download}
          </Button>
        </div>
      </div>
    </div>
  );
}
