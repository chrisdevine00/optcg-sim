/**
 * The pieces of Settings → Data and History's "Export this game" that are not React (M8 WP5):
 * building an export file, reading an imported one (size-checked, then validated), and finding the
 * games an import would collide with. Everything stays in the browser: a Blob and a link click.
 */
import { ENGINE_VERSION } from '@optcg/engine';
import { MAX_IMPORT_BYTES, IMPORT_ERRORS, parseExport, type ParsedBundle } from './validate.ts';
import { EXPORT_SCHEMA, type ExportBundle, type ReviewStore } from './types.ts';

export const BUILD = `optcg-sim engine ${ENGINE_VERSION}`;

const day = (t: number) => new Date(t).toISOString().slice(0, 10);

export const exportFileName = (t = Date.now()) => `optcg-sim-export-${day(t)}.json`;
export const gameFileName = (id: string, t = Date.now()) => `optcg-sim-game-${id}-${day(t)}.json`;

export const bundleText = (b: ExportBundle): string => JSON.stringify(b) + '\n';

/** Everything: games, reviews, tutorial timing and lethal progress. */
export async function exportEverything(store: ReviewStore): Promise<string> {
  return bundleText(await store.exportAll(BUILD));
}

/** One game and its review ("Export this game" in History). Same format, so Import reads it. */
export async function exportGame(store: ReviewStore, id: string): Promise<string | null> {
  const game = await store.getGame(id);
  if (!game) return null;
  const review = await store.getReview(id);
  return bundleText({
    schema: EXPORT_SCHEMA,
    exportedAt: Date.now(),
    build: BUILD,
    games: [game],
    reviews: review ? [review] : [],
    timing: {},
    progress: {},
  });
}

/** Reads a chosen file as text, refusing one over 50 MB before reading it. */
export async function readImportFile(file: Blob): Promise<ParsedBundle> {
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, error: IMPORT_ERRORS.tooBig };
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: IMPORT_ERRORS.notJson };
  }
  return parseExport(text, file.size);
}

/** Ids in the bundle that are already stored: the ones "Replace / Keep both / Cancel" is about. */
export async function conflictsOf(store: ReviewStore, bundle: ExportBundle): Promise<string[]> {
  const have = new Set((await store.listGames()).map((g) => g.id));
  return bundle.games.filter((g) => have.has(g.id)).map((g) => g.id);
}
