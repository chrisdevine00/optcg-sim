/**
 * Type splitting (ARCHITECTURE §3, data-sources.md "Decision").
 *
 * optcgapi keeps the "/" between types on only a few rows, so "Straw Hat Crew Elbaph" must be split
 * against a vocabulary. The vocabulary is built from:
 *   1. every piece of a "/"-delimited row (confirmed single types),
 *   2. a hand-kept addendum of types that only occur in combinations (below, each with a source), and
 *   3. whole strings seen on some row that cannot be built from other known types.
 * A string with more than one valid split, or whose pieces cannot all be matched without guessing, fails
 * the run unless `RESOLVED` records a human decision with a source. No card ever gets a guess.
 */

export interface VocabEntry {
  type: string;
  source: string;
}

/**
 * Types that appear on no single-type or "/"-delimited optcgapi row, so the vocabulary cannot learn them
 * from upstream alone. Each name was read, "/"-delimited, on the cited page: an official card-list series
 * page as cached by Track B on 2026-10-28 (the named card's entry), or a Limitless card page read on
 * 2026-10-28. This is a list of type names, not card data.
 */
export const ADDENDUM: VocabEntry[] = [
  {
    type: 'Admiral',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569116 (OP16-063)',
  },
  {
    type: 'Alabasta',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-065)',
  },
  {
    type: 'Alvida Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-023)',
  },
  {
    type: 'Asuka Island',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-006)',
  },
  { type: 'Beautiful Pirates', source: 'https://onepiece.limitlesstcg.com/cards/OP01-008' },
  { type: 'Biological Weapon', source: 'https://onepiece.limitlesstcg.com/cards/OP01-072' },
  {
    type: 'Black Cat Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-028)',
  },
  {
    type: 'Bluejam Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-011)',
  },
  { type: 'Brownbeard Pirates', source: 'https://onepiece.limitlesstcg.com/cards/OP10-010' },
  { type: 'Botanist', source: 'https://onepiece.limitlesstcg.com/cards/OP08-109' },
  {
    type: "Buggy's Delivery",
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569302 (ST17-003)',
  },
  { type: 'Celestial Dragons', source: 'https://onepiece.limitlesstcg.com/cards/OP13-091' },
  {
    type: 'Crown Island',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-075)',
  },
  { type: 'Elbaph', source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-093)' },
  {
    type: 'Eldoraggo Crew',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-070)',
  },
  { type: 'Evil Black Drum Kingdom', source: 'https://onepiece.limitlesstcg.com/cards/OP13-018' },
  {
    type: 'Fake Straw Hat Crew',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569202 (EB02-005)',
  },
  { type: 'Five Elders', source: 'https://onepiece.limitlesstcg.com/cards/OP13-091' },
  {
    type: 'Flying Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-033)',
  },
  {
    type: 'Former Arlong Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-031)',
  },
  {
    type: 'Former Baroque Works',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569201 (EB01-061)',
  },
  {
    type: 'Former Big Mom Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-105)',
  },
  {
    type: 'Former CP9',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-071)',
  },
  {
    type: 'Former Navy',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-089)',
  },
  { type: 'Former Rocks Pirates', source: 'https://onepiece.limitlesstcg.com/cards/OP08-051' },
  {
    type: 'Former Roger Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569302 (OP08-118)',
  },
  { type: 'Former Rolling Pirates', source: 'https://onepiece.limitlesstcg.com/cards/OP11-052' },
  {
    type: 'Former Rumbar Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-092)',
  },
  {
    type: 'Galley-La Company',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-066)',
  },
  {
    type: 'Gasparde Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-005)',
  },
  {
    type: 'Giant Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-085)',
  },
  {
    type: 'Goa Kingdom',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-011)',
  },
  {
    type: 'Golden Lion Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569005 (ST05-015)',
  },
  {
    type: 'Grantesoro',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-010)',
  },
  {
    type: 'Hawkins Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-029)',
  },
  { type: 'Homies', source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-117)' },
  {
    type: 'Hot Springs Island',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-065)',
  },
  {
    type: 'Jailer Beast',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-068)',
  },
  { type: 'Jaya', source: 'https://en.onepiece-cardgame.com/cardlist/?series=569302 (OP08-099)' },
  {
    type: 'Jellyfish Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569901 (P-012)',
  },
  { type: 'King of the Pirates', source: 'https://onepiece.limitlesstcg.com/cards/OP13-076' },
  { type: 'Kingdom of Prodence', source: 'https://onepiece.limitlesstcg.com/cards/OP05-080' },
  {
    type: 'Kurozumi Clan',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-067)',
  },
  {
    type: 'Lunarian',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-064)',
  },
  {
    type: 'Mecha Island',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-014)',
  },
  {
    type: 'Merfolk',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-020)',
  },
  {
    type: 'Mogaro Kingdom',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-043)',
  },
  { type: 'Monkey Mountain Alliance', source: 'https://onepiece.limitlesstcg.com/cards/OP08-108' },
  {
    type: 'Mugiwara Chase',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-008)',
  },
  {
    type: 'Neo Navy',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-002)',
  },
  {
    type: 'New Giant Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-088)',
  },
  {
    type: 'Omatsuri Island',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-015)',
  },
  {
    type: 'On-Air Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-028)',
  },
  { type: 'Plague', source: 'https://onepiece.limitlesstcg.com/cards/OP04-047' },
  { type: 'Punk Hazard', source: 'https://onepiece.limitlesstcg.com/cards/OP10-010' },
  {
    type: 'Red-Haired Pirates Allies',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569117 (OP17-021)',
  },
  { type: 'Roger Pirates', source: 'https://onepiece.limitlesstcg.com/cards/OP13-076' },
  {
    type: 'Scientist',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569005 (ST05-015)',
  },
  {
    type: 'Seraphim',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569203 (EB03-059)',
  },
  {
    type: 'Shipbuilding Town',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-009)',
  },
  { type: 'SMILE', source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-076)' },
  {
    type: 'Space Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-062)',
  },
  { type: 'SWORD', source: 'https://en.onepiece-cardgame.com/cardlist/?series=569901 (OP11-004)' },
  {
    type: 'The Franky Family',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-061)',
  },
  {
    type: 'The Moon',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-062)',
  },
  {
    type: 'The Pirates Fest',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-010)',
  },
  {
    type: 'The Sun Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569107 (OP07-020)',
  },
  {
    type: 'The Tontattas',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-052)',
  },
  {
    type: 'Trump Pirates',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569106 (OP06-012)',
  },
  {
    type: 'Vassals',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569301 (OP05-105)',
  },
  {
    type: 'Water Seven',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569103 (OP03-061)',
  },
  {
    type: 'Whitebeard Pirates Allies',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569201 (EB01-005)',
  },
  {
    type: 'Yonta Maria Fleet',
    source: 'https://en.onepiece-cardgame.com/cardlist/?series=569115 (OP15-041)',
  },
];

/**
 * Strings whose split is ambiguous against the vocabulary, resolved by reading a cited card page.
 * Keys are compared case-insensitively.
 */
export const RESOLVED: Record<string, { types: string[]; source: string }> = {};

export type SplitResult =
  { ok: true; types: string[] } | { ok: false; reason: 'ambiguous' | 'unmatched'; detail: string };

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const key = (s: string) => norm(s).toLowerCase();

export class TypeVocabulary {
  /** Lowercased type -> canonical spelling. */
  readonly types = new Map<string, string>();
  /** Lowercased types confirmed by a delimiter or the addendum (never treated as suspicious). */
  readonly confirmed = new Set<string>();

  /**
   * @param rawStrings every non-empty `sub_types` value upstream (one entry per row)
   * @param addendum hand-kept confirmed singles
   */
  constructor(rawStrings: string[], addendum: VocabEntry[] = ADDENDUM) {
    const counts = new Map<string, Map<string, number>>();
    const see = (s: string) => {
      const k = key(s);
      const m = counts.get(k) ?? new Map<string, number>();
      m.set(norm(s), (m.get(norm(s)) ?? 0) + 1);
      counts.set(k, m);
    };
    const wholes = new Set<string>();
    for (const raw of rawStrings) {
      if (raw.includes('/')) {
        for (const piece of raw.split('/').map(norm).filter(Boolean)) {
          see(piece);
          this.confirmed.add(key(piece));
        }
      } else if (norm(raw)) {
        see(raw);
        wholes.add(key(raw));
      }
    }
    for (const a of addendum) {
      see(a.type);
      // The addendum spelling wins over upstream casing.
      counts.get(key(a.type))!.set(norm(a.type), Number.MAX_SAFE_INTEGER);
      this.confirmed.add(key(a.type));
    }
    // Canonical spelling: the confirmed or most frequent form.
    for (const [k, forms] of counts) {
      const best = [...forms].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]![0];
      this.types.set(k, best);
    }
    // Remove whole strings that are really combinations of other known types (fixed point).
    let changed = true;
    while (changed) {
      changed = false;
      for (const w of wholes) {
        if (this.confirmed.has(w) || !this.types.has(w)) continue;
        const without = new Set(this.types.keys());
        without.delete(w);
        if (segmentations(w, without, 2).some((s) => s.length >= 2)) {
          this.types.delete(w);
          changed = true;
        }
      }
    }
  }

  /** Unconfirmed single types that start or end with another known type: likely unsplit pairs. */
  suspicious(): string[] {
    if (this.suspiciousCache) return this.suspiciousCache;
    const out: string[] = [];
    for (const k of this.types.keys()) {
      if (this.confirmed.has(k)) continue;
      const words = k.split(' ');
      for (let i = 1; i < words.length; i++) {
        const head = words.slice(0, i).join(' ');
        const tail = words.slice(i).join(' ');
        if (this.types.has(head) || this.types.has(tail)) {
          out.push(this.types.get(k)!);
          break;
        }
      }
    }
    this.suspiciousCache = out.sort();
    return this.suspiciousCache;
  }

  private suspiciousCache: string[] | undefined;

  split(raw: string | null | undefined): SplitResult {
    if (raw === null || raw === undefined || !norm(raw)) return { ok: true, types: [] };
    const resolved = RESOLVED[key(raw)];
    if (resolved) return { ok: true, types: resolved.types };
    if (raw.includes('/')) {
      return {
        ok: true,
        types: raw
          .split('/')
          .map(norm)
          .filter(Boolean)
          .map((t) => this.canon(t)),
      };
    }
    const k = key(raw);
    const segs = segmentations(k, new Set(this.types.keys()), 3);
    if (segs.length === 0) return { ok: false, reason: 'unmatched', detail: raw };
    if (segs.length > 1) {
      const options = segs.map((s) => s.map((t) => this.canon(t)).join(' / ')).join(' | ');
      return { ok: false, reason: 'ambiguous', detail: `${raw} -> ${options}` };
    }
    const only = segs[0]!;
    // A single unconfirmed type that looks like an unsplit pair is not trusted.
    if (only.length === 1 && this.suspicious().some((s) => key(s) === k)) {
      return { ok: false, reason: 'unmatched', detail: `${raw} (may hide an unknown type)` };
    }
    return { ok: true, types: only.map((t) => this.canon(t)) };
  }

  private canon(t: string): string {
    return this.types.get(key(t)) ?? norm(t);
  }
}

/** All ways to write `k` (lowercased, single-spaced) as a sequence of vocabulary entries. */
export function segmentations(k: string, vocab: Set<string>, limit: number): string[][] {
  const words = k.split(' ');
  const out: string[][] = [];
  const walk = (i: number, acc: string[]) => {
    if (out.length >= limit) return;
    if (i === words.length) {
      out.push([...acc]);
      return;
    }
    for (let j = i + 1; j <= words.length; j++) {
      const piece = words.slice(i, j).join(' ');
      if (vocab.has(piece)) walk(j, [...acc, piece]);
    }
  };
  walk(0, []);
  return out;
}
