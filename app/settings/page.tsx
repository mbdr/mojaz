/**
 * Environment Settings
 *
 * Self-service alternative to the deep-link query params (see
 * EnvironmentDeepLink.tsx): lets a tester configure this browser's Mojaz
 * environment override (base URL, credentials, default language, config
 * token) directly through a form instead of constructing a URL by hand.
 * Saved to IndexedDB via sessionDb.ts - the exact same storage the deep
 * link writes to - so either path works interchangeably, and the server
 * still only honors the override if the token matches CONFIG_OVERRIDE_TOKEN.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, KeyRound, Plus, Trash2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import {
  EnvironmentOverride,
  CustomHeader,
  getEnvironmentOverride,
  getOrCreateSessionId,
  setEnvironmentOverride,
  clearEnvironmentOverride,
} from "@/app/lib/sessionDb";
import { getStoredLanguage } from "@/app/lib/languagePreference";

const TEXT = {
  ar: {
    backToHome: "العودة إلى الرئيسية",
    title: "إعدادات البيئة",
    sessionId: "معرف الجلسة",
    description1: "وجّه هذا المتصفح إلى بيئة موجز مختلفة لأغراض الاختبار. اترك كل الحقول فارغة لاستخدام إعدادات الخادم الافتراضية. لن يُعتمد هذا الإعداد إلا إذا تطابقت قيمة",
    description2: "مع",
    description3: "في الخادم - وبدون تطابق الرمز، يتم تجاهل هذا الإعداد تلقائيًا واستخدام الإعداد الافتراضي.",
    doneTitle: "تم",
    savedMessage: "تم الحفظ. ستستخدم طلبات التقارير القادمة من هذا المتصفح هذا الإعداد.",
    clearedMessage: "تم الحذف. سيستخدم هذا المتصفح إعدادات الخادم الافتراضية.",
    baseUrl: "رابط الخادم الأساسي (Base URL)",
    clientKey: "مفتاح العميل (Client Key)",
    appId: "معرّف التطبيق (App ID)",
    appKey: "مفتاح التطبيق (App Key)",
    defaultLanguage: "اللغة الافتراضية",
    useServerDefault: "استخدام إعداد الخادم الافتراضي",
    arabic: "العربية (AR)",
    english: "الإنجليزية (EN)",
    extraHeaders: "ترويسات إضافية (Headers)",
    addHeader: "إضافة ترويسة",
    extraHeadersNote: "تُرسل كما هي مع كل طلب إلى موجز (بالإضافة إلى الترويسات أعلاه).",
    noHeaders: "لا توجد ترويسات إضافية.",
    removeHeader: "حذف الترويسة",
    configToken: "رمز التهيئة (Config Token)",
    save: "حفظ",
    clear: "حذف",
    loading: "جارٍ التحميل...",
  },
  en: {
    backToHome: "Back to home",
    title: "Environment Settings",
    sessionId: "Session ID",
    description1: "Point this browser at a different Mojaz environment for testing. Leave everything blank to use the server's default configuration. The server only honors these values if",
    description2: "matches its",
    description3: "- without a matching token, this configuration is silently ignored and the default is used instead.",
    doneTitle: "Done",
    savedMessage: "Saved. Future report requests from this browser will use this configuration.",
    clearedMessage: "Cleared. This browser will use the server's default configuration.",
    baseUrl: "Base URL",
    clientKey: "Client Key",
    appId: "App ID",
    appKey: "App Key",
    defaultLanguage: "Default Language",
    useServerDefault: "Use server default",
    arabic: "Arabic (AR)",
    english: "English (EN)",
    extraHeaders: "Extra Headers",
    addHeader: "Add header",
    extraHeadersNote: "Sent as-is on every upstream Mojaz request (in addition to the headers above).",
    noHeaders: "No extra headers added.",
    removeHeader: "Remove header",
    configToken: "Config Token",
    save: "Save",
    clear: "Clear",
    loading: "Loading...",
  },
};

export default function SettingsPage() {
  const [isRTL, setIsRTL] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [form, setForm] = useState<EnvironmentOverride>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const t = isRTL ? TEXT.ar : TEXT.en;

  // Reads localStorage (unavailable during SSR), so an effect is correct
  // here rather than something derivable via useMemo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRTL(getStoredLanguage() === "ar");

    Promise.all([getOrCreateSessionId(), getEnvironmentOverride()])
      .then(([id, override]) => {
        setSessionId(id);
        if (override) setForm(override);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof EnvironmentOverride) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSavedMessage(null);
  };

  const handleHeaderChange = (index: number, field: keyof CustomHeader) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => {
      const customHeaders = [...(prev.customHeaders || [])];
      customHeaders[index] = { ...customHeaders[index], [field]: e.target.value };
      return { ...prev, customHeaders };
    });
    setSavedMessage(null);
  };

  const handleAddHeader = () => {
    setForm((prev) => ({ ...prev, customHeaders: [...(prev.customHeaders || []), { key: "", value: "" }] }));
  };

  const handleRemoveHeader = (index: number) => {
    setForm((prev) => ({ ...prev, customHeaders: (prev.customHeaders || []).filter((_, i) => i !== index) }));
    setSavedMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const { customHeaders, ...rest } = form;
    const cleaned: EnvironmentOverride = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => typeof value === "string" && value.trim() !== "")
    );
    const cleanedHeaders = (customHeaders || []).filter((h) => h.key.trim());
    if (cleanedHeaders.length > 0) cleaned.customHeaders = cleanedHeaders;

    await setEnvironmentOverride(cleaned);
    setForm(cleaned);
    setSavedMessage(t.savedMessage);
  };

  const handleClear = async () => {
    await clearEnvironmentOverride();
    setForm({});
    setSavedMessage(t.clearedMessage);
  };

  const hasOverride = Boolean(
    form.baseUrl ||
      form.clientKey ||
      form.appId ||
      form.appKey ||
      form.configToken ||
      form.customHeaders?.length
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">{t.loading}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          {isRTL ? <ArrowLeft className="h-4 w-4 rotate-180" /> : <ArrowLeft className="h-4 w-4" />}
          {t.backToHome}
        </Link>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mojaz-cream)] text-[var(--mojaz-red)]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-400" dir="ltr">
                {t.sessionId}: {sessionId}
              </p>
            </div>
          </div>

          <p className="mb-6 text-sm text-gray-500">
            {t.description1}{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs" dir="ltr">
              configToken
            </code>{" "}
            {t.description2}{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs" dir="ltr">
              CONFIG_OVERRIDE_TOKEN
            </code>{" "}
            {t.description3}
          </p>

          {savedMessage && (
            <Alert variant="success" className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{t.doneTitle}</AlertTitle>
              <AlertDescription>{savedMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">
                {t.baseUrl}
              </label>
              <Input
                id="baseUrl"
                name="mojaz_base_url"
                placeholder="http://host.docker.internal:8080"
                value={form.baseUrl || ""}
                onChange={handleChange("baseUrl")}
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clientKey" className="block text-sm font-medium text-gray-700">
                {t.clientKey}
              </label>
              <Input
                id="clientKey"
                name="mojaz_client_key"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={form.clientKey || ""}
                onChange={handleChange("clientKey")}
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="appId" className="block text-sm font-medium text-gray-700">
                {t.appId}
              </label>
              <Input
                id="appId"
                name="mojaz_app_id"
                placeholder="your-app-id"
                value={form.appId || ""}
                onChange={handleChange("appId")}
                dir="ltr"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="appKey" className="block text-sm font-medium text-gray-700">
                {t.appKey}
              </label>
              <Input
                id="appKey"
                name="mojaz_app_key"
                type="password"
                placeholder="your-app-key"
                value={form.appKey || ""}
                onChange={handleChange("appKey")}
                dir="ltr"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                {t.defaultLanguage}
              </label>
              <select
                id="language"
                value={form.language || ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, language: e.target.value }));
                  setSavedMessage(null);
                }}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
              >
                <option value="">{t.useServerDefault}</option>
                <option value="ar">{t.arabic}</option>
                <option value="en">{t.english}</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">{t.extraHeaders}</label>
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--mojaz-red)] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.addHeader}
                </button>
              </div>
              <p className="text-xs text-gray-400">{t.extraHeadersNote}</p>

              {(form.customHeaders || []).length === 0 && (
                <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
                  {t.noHeaders}
                </p>
              )}

              {(form.customHeaders || []).map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    name={`mojaz_header_key_${index}`}
                    placeholder="Header-Name"
                    value={header.key}
                    onChange={handleHeaderChange(index, "key")}
                    dir="ltr"
                    autoComplete="off"
                    className="flex-1"
                  />
                  <Input
                    name={`mojaz_header_value_${index}`}
                    placeholder="value"
                    value={header.value}
                    onChange={handleHeaderChange(index, "value")}
                    dir="ltr"
                    autoComplete="off"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(index)}
                    aria-label={t.removeHeader}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="configToken" className="block text-sm font-medium text-gray-700">
                {t.configToken}
              </label>
              <Input
                id="configToken"
                name="mojaz_config_token"
                type="password"
                placeholder="Shared secret matching CONFIG_OVERRIDE_TOKEN"
                value={form.configToken || ""}
                onChange={handleChange("configToken")}
                dir="ltr"
                autoComplete="new-password"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="mojaz" size="lg" className="flex-1">
                {t.save}
              </Button>
              <Button type="button" variant="mojaz-outline" size="lg" onClick={handleClear} disabled={!hasOverride}>
                <Trash2 className="me-2 h-4 w-4" />
                {t.clear}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
