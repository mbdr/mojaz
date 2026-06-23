/**
 * Environment Deep Link
 *
 * Lets a tester point this browser at a different Mojaz environment without
 * rebuilding/redeploying, by visiting a URL like:
 *
 *   /?envBaseUrl=http://localhost:8080&envClientKey=...&envProxySecret=...&configToken=...
 *
 * On mount: if these params are present, save them to IndexedDB (scoped to
 * this browser only) and strip them from the address bar immediately so the
 * credentials don't linger in browser history or get shared via copy-paste.
 * Every subsequent API call attaches the saved override as headers; the
 * server only honors it if `configToken` matches CONFIG_OVERRIDE_TOKEN, so a
 * deep link alone isn't enough without that shared secret. With no override
 * saved (or an invalid token), the server transparently falls back to its
 * default .env configuration.
 */

"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { setEnvironmentOverride, getEnvironmentOverride } from "@/app/lib/sessionDb";

export function EnvironmentDeepLink({ isRTL = false }: { isRTL?: boolean }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const baseUrl = params.get("envBaseUrl") || undefined;
    const clientKey = params.get("envClientKey") || undefined;
    const proxySecret = params.get("envProxySecret") || undefined;
    const language = params.get("envLanguage") || undefined;
    const configToken = params.get("configToken") || undefined;

    const hasDeepLinkParams = baseUrl || clientKey || proxySecret || language || configToken;

    if (hasDeepLinkParams) {
      setEnvironmentOverride({ baseUrl, clientKey, proxySecret, language, configToken })
        .then(() => setActive(true))
        .catch((error) => console.error("Failed to save environment override:", error));

      // Strip the override params from the URL so they don't linger in
      // history or get accidentally shared.
      ["envBaseUrl", "envClientKey", "envProxySecret", "envLanguage", "configToken"].forEach((key) =>
        params.delete(key)
      );
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    } else {
      getEnvironmentOverride()
        .then((override) => setActive(Boolean(override?.baseUrl || override?.clientKey)))
        .catch(() => setActive(false));
    }
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed bottom-4 z-50 flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg ltr:left-4 rtl:right-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Settings2 className="h-3.5 w-3.5 text-[var(--mojaz-red)]" />
      {isRTL ? "بيئة مخصصة نشطة" : "Custom environment active"}
    </div>
  );
}
