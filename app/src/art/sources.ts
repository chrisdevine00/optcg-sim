import type { Artwork } from '@optcg/cards';

/**
 * The only place that knows where card art lives (PROMPT.md "Attribution and takedown readiness").
 * One base URL per source; a source can be swapped or disabled here without touching any data.
 * Fallback order per artwork (ADR 0007): optcgapi `card_image` → arjunkai → text-only card face.
 */
export const IMAGE_SOURCES = {
  optcgapi: {
    base: 'https://optcgapi.com/media/static/Card_Images/',
    enabled: true,
    about: 'https://optcgapi.com/documentation',
  },
  /** Off until its maintainer approves third-party use (data-sources.md, "Terms risk"). */
  arjunkai: {
    base: 'https://optcg-api.arjunbansal-ai.workers.dev/images/',
    enabled: false,
    about: 'https://github.com/arjunkai/optcg-api',
  },
} as const;

/** Hosts the service worker may cache images from. */
export const IMAGE_HOSTS = Object.values(IMAGE_SOURCES).map((s) => new URL(s.base).host);

/** Image URLs to try for one artwork, in fallback order. Empty means "draw the text card". */
export function imageCandidates(artwork: Artwork | undefined): string[] {
  if (!artwork) return [];
  const out: string[] = [];
  const { optcgapi, arjunkai } = IMAGE_SOURCES;
  if (optcgapi.enabled && artwork.source === 'optcgapi' && artwork.imageUrls.full) {
    out.push(optcgapi.base + artwork.imageUrls.full);
  }
  // arjunkai keys images by official printing id; ids with "#" are ours, not official.
  if (arjunkai.enabled && !artwork.artworkId.includes('#'))
    out.push(arjunkai.base + artwork.artworkId);
  return out;
}
