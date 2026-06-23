/**
 * IndexedDB-backed inquiry history.
 *
 * Stores only lightweight metadata (VIN, requestId, timestamp) - never the
 * Base64 PDF payload, which can be several MB and would bloat IndexedDB for
 * no benefit. Preview/Download re-fetch the PDF on demand via
 * /api/international-report/retrieve using the stored requestId, so a
 * single successful inquiry can be viewed in either language later without
 * re-running (and re-billing) the inquiry step.
 */

const DB_NAME = "mojaz-history";
const DB_VERSION = 1;
const STORE_NAME = "inquiries";

export type HistoryEntryStatus = "success" | "failed";

export interface HistoryEntry {
  requestId: string;
  vin: string;
  createdAt: number;
  status: HistoryEntryStatus;
  /** Set when status is "failed" - the error from the last fetch attempt. */
  error?: string;
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
        const store = db.createObjectStore(STORE_NAME, { keyPath: "requestId" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  const db = await openDb();
  const entries = await new Promise<HistoryEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as HistoryEntry[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteHistoryEntry(requestId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(requestId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
