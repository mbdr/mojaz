"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  ShieldCheck,
  Zap,
  BadgeCheck,
  FileSearch,
  ShieldAlert,
  Wrench,
  Users,
  Gauge,
  Settings2,
} from "lucide-react";
import { InternationalReportApiResponse } from "./types";
import { LanguageSelector } from "./components/LanguageSelector";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { VinInquiryForm, VinInquiryFailure } from "./components/VinInquiryForm";
import { PdfPreview } from "./components/PdfPreview";
import { Reveal } from "./components/Reveal";
import { InquiryHistory } from "./components/InquiryHistory";
import { PageFlipCard, FlipPage } from "./components/PageFlipCard";
import { EnvironmentDeepLink } from "./components/EnvironmentDeepLink";
import { addHistoryEntry } from "./lib/historyDb";

type Language = "ar" | "en";

const translations: Record<Language, Record<string, string>> = {
  ar: {
    brand: "موجز",
    brandSub: "Mojaz",
    title: "قرار الشراء الصحيح، يبدأ بموجز",
    description: "اطلب تقرير موجز واحصل على أهم البيانات التاريخية للمركبة باستخدام رقم الهيكل (VIN)",
    success: "تم الحصول على التقرير بنجاح",
    successTitle: "نجاح",
    requestId: "معرف الطلب",
    formTitle: "تقرير موجز",
    feature1Title: "سريع وآمن",
    feature1Desc: "احصل على تقارير المركبات بشكل فوري وآمن",
    feature2Title: "سهل الاستخدام",
    feature2Desc: "ما عليك سوى إدخال رقم VIN والبحث",
    feature3Title: "موثوق",
    feature3Desc: "بيانات دقيقة من مصادر موثوقة",
    footer: "© 2026 موجز. جميع الحقوق محفوظة.",
  },
  en: {
    brand: "Mojaz",
    brandSub: "موجز",
    title: "The right purchase decision starts with Mojaz",
    description: "Request a Mojaz report and get the most important historical vehicle data using the VIN",
    success: "Vehicle report retrieved successfully",
    successTitle: "Success",
    requestId: "Request ID",
    formTitle: "Mojaz Report",
    feature1Title: "Fast & Secure",
    feature1Desc: "Get vehicle reports instantly and securely",
    feature2Title: "Easy to Use",
    feature2Desc: "Simply enter a VIN and search",
    feature3Title: "Reliable",
    feature3Desc: "Accurate data from reliable sources",
    footer: "© 2026 Mojaz. All rights reserved.",
  },
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("ar");
  const [pdfData, setPdfData] = useState<InternationalReportApiResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [historyRefreshSignal, setHistoryRefreshSignal] = useState(0);

  const t = translations[language];
  const isRTL = language === "ar";

  const handleSuccess = (data: InternationalReportApiResponse, vin: string) => {
    setPdfData(data);
    setSuccessMessage(t.success);
    setTimeout(() => setSuccessMessage(null), 5000);

    addHistoryEntry({ requestId: data.requestId, vin, createdAt: Date.now(), status: "success" })
      .then(() => setHistoryRefreshSignal((s) => s + 1))
      .catch((error) => console.error("Failed to save inquiry history:", error));
  };

  // If the inquiry step succeeded (we have a requestId) but the report
  // fetch ultimately failed, still save it to history flagged as failed so
  // the user can manually retry later instead of losing track of it.
  const handleError = ({ vin, error, requestId }: VinInquiryFailure) => {
    console.error("Inquiry error:", error);

    if (!requestId) return;

    addHistoryEntry({ requestId, vin, createdAt: Date.now(), status: "failed", error })
      .then(() => setHistoryRefreshSignal((s) => s + 1))
      .catch((dbError) => console.error("Failed to save inquiry history:", dbError));
  };

  const handleClosePdf = () => {
    setPdfData(null);
  };

  const features = [
    { Icon: Zap, title: t.feature1Title, desc: t.feature1Desc },
    { Icon: FileSearch, title: t.feature2Title, desc: t.feature2Desc },
    { Icon: ShieldCheck, title: t.feature3Title, desc: t.feature3Desc },
  ];

  const reportPages: FlipPage[] = isRTL
    ? [
        { icon: BadgeCheck, title: "تقرير المركبة", subtitle: "VIN / رقم الهيكل" },
        { icon: ShieldAlert, title: "سجل الحوادث", subtitle: "تاريخ الحوادث المسجلة" },
        { icon: Wrench, title: "سجل الصيانة", subtitle: "أعمال الصيانة السابقة" },
        { icon: Users, title: "سجل الملاك", subtitle: "عدد ملاك المركبة" },
        { icon: Gauge, title: "قراءة العداد", subtitle: "آخر قراءة مسجلة للمسافة" },
      ]
    : [
        { icon: BadgeCheck, title: "Vehicle Report", subtitle: "VIN / Sequence No." },
        { icon: ShieldAlert, title: "Accident History", subtitle: "Recorded accident records" },
        { icon: Wrench, title: "Maintenance Records", subtitle: "Past maintenance activity" },
        { icon: Users, title: "Ownership History", subtitle: "Number of previous owners" },
        { icon: Gauge, title: "Odometer Reading", subtitle: "Last recorded mileage" },
      ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-extrabold leading-tight text-[var(--mojaz-red)]">
              {t.brand}
            </span>
            <span className="hidden text-sm font-medium text-gray-400 sm:inline">
              {t.brandSub}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
            <Link
              href="/settings"
              aria-label={isRTL ? "إعدادات البيئة" : "Environment settings"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <Settings2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate px-6 pt-16 pb-20">
        {/* decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-24 right-1/3 h-72 w-72 rounded-full bg-[var(--mojaz-cream)] animate-float-slow" />
          <div className="absolute top-40 -left-16 h-56 w-56 rounded-full bg-red-50 animate-float-slower" />
          <div className="absolute bottom-0 right-10 h-40 w-40 rounded-full border border-dashed border-gray-200 animate-float-slow" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          {/* Text + visual */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto flex h-[420px] max-w-sm items-center justify-center">
              <div className="absolute h-72 w-72 rounded-full bg-gray-900/90 animate-float-slow" />
              <div className="relative z-10 flex h-80 w-44 flex-col items-center rounded-[2rem] border-4 border-gray-900 bg-white p-3 shadow-2xl animate-float-slower">
                <div className="mb-2 h-1.5 w-10 rounded-full bg-gray-900" />
                <div className="h-full w-full overflow-hidden rounded-2xl">
                  <PageFlipCard pages={reportPages} isRTL={isRTL} />
                </div>
              </div>

              {/* floating badge chips, apple-style */}
              <div className="absolute -left-2 top-6 animate-float-slower rounded-2xl bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg ring-1 ring-gray-100">
                23,000 {isRTL ? "كم" : "km"}
              </div>
              <div className="absolute -right-4 bottom-12 animate-float-slow rounded-2xl bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg ring-1 ring-gray-100">
                {isRTL ? "موثوق ✓" : "Verified ✓"}
              </div>
            </div>
          </Reveal>

          {/* Form card */}
          <Reveal delay={120} className="order-1 lg:order-2">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 max-w-md text-base text-gray-500 sm:text-lg">{t.description}</p>

            {successMessage && (
              <Alert variant="success" className="mt-6">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>{t.successTitle}</AlertTitle>
                <AlertDescription>
                  {successMessage}
                  {pdfData && (
                    <div className="text-xs mt-2">
                      {t.requestId}: {pdfData.requestId}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] sm:p-8">
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="font-bold text-gray-900">{t.formTitle}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mojaz-cream)] text-[var(--mojaz-red)]">
                  <FileSearch className="h-4 w-4" />
                </span>
              </div>
              <VinInquiryForm onSuccess={handleSuccess} onError={handleError} isRTL={isRTL} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Inquiry History */}
      <InquiryHistory refreshSignal={historyRefreshSignal} isRTL={isRTL} />

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--mojaz-cream)] text-[var(--mojaz-red)] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        {t.footer}
      </footer>

      {/* PDF Preview Modal */}
      {pdfData && (
        <PdfPreview
          pdfBase64={pdfData.pdfBase64}
          requestId={pdfData.requestId}
          onClose={handleClosePdf}
          isRTL={isRTL}
        />
      )}

      <EnvironmentDeepLink isRTL={isRTL} />
    </div>
  );
}
