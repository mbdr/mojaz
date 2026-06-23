/**
 * Processing Indicator
 * Shown while the server polls the upstream provider for the PDF report,
 * which can take anywhere from ~10 seconds to a minute or more.
 */

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProcessingIndicatorProps {
  isRTL?: boolean;
}

const STAGES_EN = [
  { at: 0, label: "Connecting to Mojaz..." },
  { at: 10, label: "Validating vehicle data..." },
  { at: 30, label: "Fetching historical records..." },
  { at: 60, label: "Compiling your report..." },
  { at: 120, label: "Almost there, finalizing the PDF..." },
];

const STAGES_AR = [
  { at: 0, label: "جارٍ الاتصال بموجز..." },
  { at: 10, label: "جارٍ التحقق من بيانات المركبة..." },
  { at: 30, label: "جارٍ جلب السجلات التاريخية..." },
  { at: 60, label: "جارٍ تجميع التقرير..." },
  { at: 120, label: "اقتربنا، نُجهّز ملف PDF..." },
];

export function ProcessingIndicator({ isRTL = false }: ProcessingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);
  const stages = isRTL ? STAGES_AR : STAGES_EN;

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const stage = stages.reduce((current, candidate) => (elapsed >= candidate.at ? candidate : current), stages[0]);

  // Asymptotic progress: fast at first, slows down, never quite hits 100%
  // until the request actually resolves — avoids lying about real progress.
  const progress = Math.min(96, (1 - Math.exp(-elapsed / 90)) * 100);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeLabel = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}s`;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mojaz-cream)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--mojaz-red)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{stage.label}</p>
          <p className="text-xs text-gray-400">
            {isRTL ? `الوقت المنقضي: ${timeLabel}` : `Elapsed: ${timeLabel}`}
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[var(--mojaz-red)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        {isRTL
          ? "نتحقق من حالة التقرير كل 20 ثانية، وقد تستغرق العملية حتى 3 دقائق، يرجى الانتظار..."
          : "We check for your report every 20 seconds — this can take up to a few minutes, please hold on..."}
      </p>
    </div>
  );
}
