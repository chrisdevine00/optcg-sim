import type { Card } from './schema.ts';

export const COLORS = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'] as const;
export const CATEGORIES = ['Leader', 'Character', 'Event', 'Stage'] as const;
export const ATTRIBUTES = ['Slash', 'Strike', 'Ranged', 'Special', 'Wisdom'] as const;
export const KEYWORDS = [
  'Rush',
  'Rush: Character',
  'Double Attack',
  'Banish',
  'Blocker',
  'Unblockable',
] as const;
const BLOCKS: readonly unknown[] = [1, 2, 3, 4, 5, 6, 7, 8, 'X'];
const STATUSES = ['legal', 'banned', 'restricted', 'rotated', 'unknown'];
const FIX_KINDS = ['sign', 'cleanup', 'trigger', 'override'];
const ID = /^(OP\d{2}|ST\d{2}|EB\d{2}|PRB\d{2}|P)-\d{3}$/;

const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v);
const isStr = (v: unknown) => typeof v === 'string';
const intOrNull = (v: unknown) => v === null || (isInt(v) && (v as number) >= 0);

/**
 * Validates one generated record against the schema and the game's invariants. Returns a list of
 * problems; an empty list means the record is valid. No dependencies, so it runs in tests and scripts.
 */
export function validateCard(c: Card): string[] {
  const p: string[] = [];
  const req = (ok: boolean, msg: string) => {
    if (!ok) p.push(`${c?.id ?? '?'}: ${msg}`);
  };
  req(isStr(c.id) && ID.test(c.id), `bad id ${String(c.id)}`);
  req(isStr(c.name) && c.name.trim() === c.name && c.name.length > 0, 'name empty or untrimmed');
  req(!/\s\([^)]*\)$/.test(c.name), `name keeps a printing suffix: ${c.name}`);
  req((CATEGORIES as readonly string[]).includes(c.category), `bad category ${c.category}`);
  req(
    Array.isArray(c.colors) &&
      c.colors.length > 0 &&
      c.colors.every((x) => (COLORS as readonly string[]).includes(x)),
    `bad colors ${JSON.stringify(c.colors)}`,
  );
  req(
    intOrNull(c.cost) && intOrNull(c.power) && intOrNull(c.counter) && intOrNull(c.life),
    'bad stat',
  );
  if (c.category === 'Leader') {
    req(c.cost === null && isInt(c.life) && isInt(c.power), 'Leader needs life and power, no cost');
  } else {
    req(c.life === null, 'only Leaders have life');
    req(isInt(c.cost), 'non-Leader needs a cost');
  }
  if (c.category === 'Character') req(isInt(c.power), 'Character needs power');
  if (c.category === 'Event' || c.category === 'Stage') {
    req(c.power === null, `${c.category} has no power`);
  }
  req(
    Array.isArray(c.attributes) &&
      c.attributes.every((x) => (ATTRIBUTES as readonly string[]).includes(x)),
    `bad attributes ${JSON.stringify(c.attributes)}`,
  );
  req(
    Array.isArray(c.types) && c.types.every((t) => isStr(t) && t.trim() === t && t.length > 0),
    `bad types ${JSON.stringify(c.types)}`,
  );
  req(new Set(c.types).size === c.types.length, 'duplicate type');
  req(isStr(c.rarity) && c.rarity.length > 0, 'rarity empty');
  req(isStr(c.set) && c.set.length > 0, 'set empty');
  req(c.block === null || BLOCKS.includes(c.block), `bad block ${String(c.block)}`);
  req(isStr(c.effectText), 'effectText not a string');
  req(!/^NULL$/i.test(c.effectText), 'effectText is NULL');
  req(!/disclaimer:/i.test(c.effectText), 'effectText keeps a disclaimer');
  req(c.triggerText === null || (isStr(c.triggerText) && c.triggerText.length > 0), 'bad trigger');
  req(!/\[Trigger\]\s*$/.test(c.effectText), 'effectText ends with an empty [Trigger]');
  req(
    Array.isArray(c.keywords) &&
      c.keywords.every((k) => (KEYWORDS as readonly string[]).includes(k)),
    'bad keywords',
  );
  req(typeof c.verified === 'boolean', 'verified not boolean');
  req(Array.isArray(c.verifiedBy), 'verifiedBy missing');
  if (c.verified) req(c.verifiedBy.length > 0, 'verified card without a source');
  req(
    Array.isArray(c.textFixes) &&
      c.textFixes.every((f) => FIX_KINDS.includes(f.kind) && isStr(f.from) && isStr(f.to)),
    'bad textFixes',
  );
  req(Array.isArray(c.artworks) && c.artworks.length > 0, 'no artworks');
  const ids = new Set<string>();
  for (const a of c.artworks ?? []) {
    req(isStr(a.artworkId) && a.artworkId.startsWith(c.id), `artwork ${a.artworkId} not under id`);
    req(!ids.has(a.artworkId), `duplicate artwork ${a.artworkId}`);
    ids.add(a.artworkId);
    req(
      a.imageUrls.full === undefined || !/^https?:/.test(a.imageUrls.full),
      'image path absolute',
    );
  }
  for (const f of ['standard', 'extra'] as const) {
    req(STATUSES.includes(c.legality?.[f]?.status), `bad ${f} legality`);
  }
  req(isStr(c.sourceUrl) && c.sourceUrl.startsWith('https://'), 'sourceUrl');
  req(isStr(c.fetchedAt) && !Number.isNaN(Date.parse(c.fetchedAt)), 'fetchedAt');
  return p;
}
