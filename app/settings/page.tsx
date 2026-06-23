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

export default function SettingsPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [form, setForm] = useState<EnvironmentOverride>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    setSavedMessage("Saved. Future report requests from this browser will use this configuration.");
  };

  const handleClear = async () => {
    await clearEnvironmentOverride();
    setForm({});
    setSavedMessage("Cleared. This browser will use the server's default configuration.");
  };

  const hasOverride = Boolean(
    form.baseUrl || form.clientKey || form.proxySecret || form.configToken || form.customHeaders?.length
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mojaz-cream)] text-[var(--mojaz-red)]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Environment Settings</h1>
              <p className="text-xs text-gray-400">Session ID: {sessionId}</p>
            </div>
          </div>

          <p className="mb-6 text-sm text-gray-500">
            Point this browser at a different Mojaz environment for testing. Leave everything blank to use the
            server&apos;s default configuration. The server only honors these values if{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">configToken</code> matches its{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">CONFIG_OVERRIDE_TOKEN</code> - without a
            matching token, this configuration is silently ignored and the default is used instead.
          </p>

          {savedMessage && (
            <Alert variant="success" className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Done</AlertTitle>
              <AlertDescription>{savedMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">
                Base URL
              </label>
              <Input
                id="baseUrl"
                placeholder="http://host.docker.internal:8080"
                value={form.baseUrl || ""}
                onChange={handleChange("baseUrl")}
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clientKey" className="block text-sm font-medium text-gray-700">
                Client Key
              </label>
              <Input
                id="clientKey"
                placeholder="288f51a5-c4b7-4f1a-a43c-..."
                value={form.clientKey || ""}
                onChange={handleChange("clientKey")}
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="proxySecret" className="block text-sm font-medium text-gray-700">
                Proxy Secret
              </label>
              <Input
                id="proxySecret"
                type="password"
                placeholder="Shared_secret_sent_from_proxy..."
                value={form.proxySecret || ""}
                onChange={handleChange("proxySecret")}
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Default Language
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
                <option value="">Use server default</option>
                <option value="ar">Arabic (AR)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Extra Headers</label>
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--mojaz-red)] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add header
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Sent as-is on every upstream Mojaz request (in addition to the headers above).
              </p>

              {(form.customHeaders || []).length === 0 && (
                <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
                  No extra headers added.
                </p>
              )}

              {(form.customHeaders || []).map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Header-Name"
                    value={header.key}
                    onChange={handleHeaderChange(index, "key")}
                    dir="ltr"
                    className="flex-1"
                  />
                  <Input
                    placeholder="value"
                    value={header.value}
                    onChange={handleHeaderChange(index, "value")}
                    dir="ltr"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(index)}
                    aria-label="Remove header"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="configToken" className="block text-sm font-medium text-gray-700">
                Config Token
              </label>
              <Input
                id="configToken"
                type="password"
                placeholder="Shared secret matching CONFIG_OVERRIDE_TOKEN"
                value={form.configToken || ""}
                onChange={handleChange("configToken")}
                dir="ltr"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="mojaz" size="lg" className="flex-1">
                Save
              </Button>
              <Button type="button" variant="mojaz-outline" size="lg" onClick={handleClear} disabled={!hasOverride}>
                <Trash2 className="me-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
