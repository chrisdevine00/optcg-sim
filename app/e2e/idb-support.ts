/** Reads the app's IndexedDB directly, so a test sees what is stored, not what the page remembers. */
import type { Page } from '@playwright/test';

export interface StoredRun {
  runId: string;
  startedAt: string;
  completedMs: number | null;
  totalActiveMs: number;
  steps: {
    stepId: string;
    blockedAttempts: number;
    exits: number;
    inputs: { pointer: number; keyboard: number };
  }[];
}

/** The tutorial timing runs in the `timing` store, oldest first. */
async function readRuns(page: Page): Promise<StoredRun[]> {
  return page.evaluate(
    () =>
      new Promise<StoredRun[]>((resolve, reject) => {
        const open = indexedDB.open('optcg-sim');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction('timing').objectStore('timing').getAll();
          req.onsuccess = () => {
            db.close();
            resolve(
              (req.result as StoredRun[]).sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
            );
          };
          req.onerror = () => reject(req.error);
        };
      }),
  );
}

/** Reads until two reads 100 ms apart agree, so a write still queued behind memory has landed. */
export async function timingRuns(page: Page): Promise<StoredRun[]> {
  let last = JSON.stringify(await readRuns(page));
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(100);
    const now = JSON.stringify(await readRuns(page));
    if (now === last) break;
    last = now;
  }
  return JSON.parse(last) as StoredRun[];
}
