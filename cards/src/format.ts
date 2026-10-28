import type { Block, Legality } from './schema.ts';

/** A cited source for a piece of format data. */
export interface FormatSource {
  url: string;
  /** ISO date the page was read. */
  checked: string;
  /** Date printed on the page, when it has one. */
  pageDate?: string;
  note?: string;
}

export interface ProductBlock {
  block: Block;
  /** `formula`: booster N is block ceil(N / 4) (topics/013.php). `printed`: the icon on cited printings. */
  basis: 'formula' | 'printed';
  source: FormatSource;
  note?: string;
}

export interface CardRef {
  id: string;
  name: string;
}

/** Shape of `cards/format/standard.json` (ADR 0011). Hand-kept and cited. */
export interface StandardFormat {
  format: 'standard';
  asOf: string;
  regulation: {
    from: string;
    to: string;
    allowedBlocks: Block[];
    source: FormatSource;
  };
  blocksByProduct: Record<string, ProductBlock>;
  exceptions: {
    /** Super Parallel Rare card numbers: Standard-legal regardless of block. */
    superParallel: { source: FormatSource; cards: CardRef[] };
    /** Card numbers treated as a fixed block regardless of reprints. */
    fixedBlock: {
      block: Block;
      legalFrom: string;
      legalUntil: string;
      source: FormatSource;
      cards: CardRef[];
    };
    /** Card numbers whose block was updated by a reprint. All printings become usable. */
    reprintUpdated: { source: FormatSource; cards: CardRef[] };
    /** Card numbers whose newest printing shows a block other than their product's (e.g. `X`). */
    newestPrintedBlock: { source: FormatSource; cards: (CardRef & { block: Block })[] };
  };
  banned: (CardRef & { effective: string | null; source: FormatSource; note?: string })[];
  restricted: (CardRef & { limit: number; effective: string | null; source: FormatSource })[];
  bannedPairs: { cards: [CardRef, CardRef]; effective: string | null; source: FormatSource }[];
  /** Known gaps: products or facts no cited source gives yet. */
  gaps: string[];
}

/** Product code (`OP-17`, `ST-01`, `EB-04`, `PRB-01`, `P`) of a card number. */
export function setCodeOf(id: string): string {
  const m = /^([A-Z]+)(\d*)-\d{3}/.exec(id);
  if (!m) throw new Error(`Not a card number: ${id}`);
  const [, letters, digits] = m;
  return digits ? `${letters}-${digits}` : letters!;
}

/**
 * The block of a card number (RL-37: the newest block printed on any of its printings): a cited override,
 * else the format file's per-number lists (newest printed block, then the fixed-block list), else its
 * product's block. Returns null when no cited source gives one.
 */
export function blockOf(id: string, fmt: StandardFormat, override?: Block | null): Block | null {
  if (override !== undefined && override !== null) return override;
  const ex = fmt.exceptions;
  const printed = ex.newestPrintedBlock.cards.find((c) => c.id === id);
  if (printed) return printed.block;
  if (ex.fixedBlock.cards.some((c) => c.id === id)) return ex.fixedBlock.block;
  return fmt.blocksByProduct[setCodeOf(id)]?.block ?? null;
}

/**
 * Standard legality for a card number (rulings RL-37): legal if it is on an exception list, or its
 * block is allowed; bans and banned pairs apply afterwards. Unknown when the block is unknown.
 */
export function standardLegality(id: string, block: Block | null, fmt: StandardFormat): Legality {
  const has = (list: CardRef[]) => list.some((c) => c.id === id);
  const pairs = fmt.bannedPairs
    .filter((p) => p.cards.some((c) => c.id === id))
    .map((p) => p.cards.find((c) => c.id !== id)!.id);
  const withPairs = (l: Legality): Legality => (pairs.length ? { ...l, bannedWith: pairs } : l);

  const ban = fmt.banned.find((b) => b.id === id);
  if (ban)
    return { status: 'banned', reason: `banned from ${ban.effective ?? 'an undated notice'}` };
  const restricted = fmt.restricted.find((r) => r.id === id);
  if (restricted) return withPairs({ status: 'restricted', limit: restricted.limit });

  const ex = fmt.exceptions;
  if (has(ex.superParallel.cards)) return withPairs({ status: 'legal', reason: 'SPR exception' });
  if (has(ex.fixedBlock.cards)) {
    return withPairs({ status: 'legal', reason: `treated as block ${ex.fixedBlock.block}` });
  }
  if (has(ex.reprintUpdated.cards)) {
    return withPairs({ status: 'legal', reason: 'block updated by reprint' });
  }
  if (block === null) return withPairs({ status: 'unknown', reason: 'block not known' });
  if (fmt.regulation.allowedBlocks.includes(block)) {
    return withPairs({ status: 'legal', reason: `block ${block}` });
  }
  return { status: 'rotated', reason: `block ${block}` };
}

/** Extra Regulation allows every block; only bans and pairs apply (topics/013.php). */
export function extraLegality(id: string, fmt: StandardFormat): Legality {
  const ban = fmt.banned.find((b) => b.id === id);
  if (ban)
    return { status: 'banned', reason: `banned from ${ban.effective ?? 'an undated notice'}` };
  const pairs = fmt.bannedPairs
    .filter((p) => p.cards.some((c) => c.id === id))
    .map((p) => p.cards.find((c) => c.id !== id)!.id);
  return pairs.length ? { status: 'legal', bannedWith: pairs } : { status: 'legal' };
}

/** Every card number the format file names, for the "IDs resolve" check. */
export function formatCardIds(fmt: StandardFormat): string[] {
  const ex = fmt.exceptions;
  return [
    ...ex.superParallel.cards,
    ...ex.fixedBlock.cards,
    ...ex.reprintUpdated.cards,
    ...ex.newestPrintedBlock.cards,
    ...fmt.banned,
    ...fmt.restricted,
    ...fmt.bannedPairs.flatMap((p) => p.cards),
  ].map((c) => c.id);
}
