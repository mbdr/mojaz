/**
 * Per-browser session identity + environment override, stored in IndexedDB.
 *
 * - sessionId: a stable UUID generated once per browser/profile, used to
 *   identify "who" made a request without any login system.
 * - environmentOverride: an optional alternate Mojaz API config (base URL,
 *   credentials, default language) captured from a deep link (see
 *   EnvironmentDeepLink.tsx), so testers can point this browser at a
 *   different backend without rebuilding/redeploying. The server only
 *   honors this if it's paired with a token matching CONFIG_OVERRIDE_TOKEN
 *   - see app/lib/envOverrideServer.ts.
 */

const DB_NAME = "mojaz-session";
const DB_VERSION = 1;
const STORE_NAME = "session";
const RECORD_KEY = "current";

export interface CustomHeader {
  key: string;
  value: string;
}

export interface EnvironmentOverride {
  baseUrl?: string;
  clientKey?: string;
  proxySecret?: string;
  language?: string;
  configToken?: string;
  /** Arbitrary extra headers forwarded to the upstream Mojaz API call. */
  customHeaders?: CustomHeader[];
}

interface SessionRecord {
  key: typeof RECORD_KEY;
  sessionId: string;
  environmentOverride?: EnvironmentOverride;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readRecord(): Promise<SessionRecord | undefined> {
  const db = await openDb();
  const record = await new Promise<SessionRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result as SessionRecord | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record;
}

async function writeRecord(record: SessionRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function getOrCreateSessionId(): Promise<string> {
  const existing = await readRecord();
  if (existing?.sessionId) return existing.sessionId;

  const sessionId = generateSessionId();
  await writeRecord({ key: RECORD_KEY, sessionId, environmentOverride: existing?.environmentOverride });
  return sessionId;
}

export async function getEnvironmentOverride(): Promise<EnvironmentOverride | undefined> {
  const record = await readRecord();
  return record?.environmentOverride;
}

export async function setEnvironmentOverride(override: EnvironmentOverride): Promise<void> {
  const sessionId = await getOrCreateSessionId();
  await writeRecord({ key: RECORD_KEY, sessionId, environmentOverride: override });
}

export async function clearEnvironmentOverride(): Promise<void> {
  const sessionId = await getOrCreateSessionId();
  await writeRecord({ key: RECORD_KEY, sessionId, environmentOverride: undefined });
}
