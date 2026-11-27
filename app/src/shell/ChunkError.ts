/**
 * M10 WP6: is this the failure of a lazy chunk that no longer exists? After a deploy the old hashed
 * files are gone; a tab still running the old build then fails to import a route's chunk. That is not
 * a bug in the page, so the failure page says "the app was updated" and offers one Reload.
 * The messages are the browsers' own (Chrome, Firefox, Safari) and Vite's preload error.
 */
const CHUNK_MESSAGES: readonly RegExp[] = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
  /Loading (?:CSS )?chunk [\w-]+ failed/i,
];

export function isChunkError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'ChunkLoadError') return true;
  return typeof message === 'string' && CHUNK_MESSAGES.some((re) => re.test(message));
}
