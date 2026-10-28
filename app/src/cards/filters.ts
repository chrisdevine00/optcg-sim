import {
  CATEGORIES,
  COLORS,
  KEYWORDS,
  type Card,
  type CardCategory,
  type Color,
  type Keyword,
  type Legality,
} from '@optcg/cards';

export type CostFilter = '' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10+';
export type SortKey = 'best' | 'id' | 'cost' | 'power' | 'name';

export interface Filters {
  query: string;
  /** A set code, or `all`. While searching, `all` unless the user picked a set (M1-01). */
  set: string;
  colors: Color[];
  categories: CardCategory[];
  cost: CostFilter;
  type: string;
  /** A printed keyword or `Trigger`, matched in the card text (display filter only, never rules). */
  keyword: '' | Keyword | 'Trigger';
  legality: '' | Legality['status'];
  verifiedOnly: boolean;
  sort: SortKey;
  descending: boolean;
}

export const emptyFilters = (set: string): Filters => ({
  query: '',
  set,
  colors: [],
  categories: [],
  cost: '',
  type: '',
  keyword: '',
  legality: '',
  verifiedOnly: false,
  sort: 'best',
  descending: false,
});

const ID_PREFIX = /^(OP|ST|EB|PRB)\s*-?\s*(\d{2})(?:-\d{0,3})?$|^P-\d{0,3}$/i;

/** The set a query names by card number ("op01-016", "ST21", "P-088"), if any. */
export function setFromQuery(query: string): string | null {
  const q = query.trim().toUpperCase();
  const m = ID_PREFIX.exec(q);
  if (!m) return null;
  return m[1] ? `${m[1]}-${m[2]}` : 'P';
}

const haystacks = new WeakMap<Card, string>();
function haystack(c: Card): string {
  let h = haystacks.get(c);
  if (h === undefined) {
    h = [c.id, c.name, c.effectText, c.triggerText ?? '', c.types.join(' ')]
      .join('\n')
      .toLowerCase();
    haystacks.set(c, h);
  }
  return h;
}

export function matches(c: Card, f: Filters): boolean {
  if (f.set !== 'all' && c.set !== f.set) return false;
  if (f.colors.length && !c.colors.some((x) => f.colors.includes(x))) return false;
  if (f.categories.length && !f.categories.includes(c.category)) return false;
  if (f.cost) {
    const v = c.cost;
    if (v === null) return false;
    if (f.cost === '10+' ? v < 10 : v !== Number(f.cost)) return false;
  }
  if (f.type) {
    const t = f.type.trim().toLowerCase();
    if (!c.types.some((x) => x.toLowerCase().includes(t))) return false;
  }
  if (
    f.keyword === 'Trigger'
      ? c.triggerText === null
      : f.keyword && !c.effectText.includes(`[${f.keyword}]`)
  ) {
    return false;
  }
  if (f.legality && c.legality.standard.status !== f.legality) return false;
  if (f.verifiedOnly && !c.verified) return false;
  const q = f.query.trim().toLowerCase();
  if (q) {
    const h = haystack(c);
    const compactId = q.replace(/\s+/g, '');
    if (!h.includes(q) && !h.startsWith(compactId) && !q.split(/\s+/).every((t) => h.includes(t)))
      return false;
  }
  return true;
}

/**
 * How well a card matches the query, lower is better (M1-07): card number, exact name, name prefix, a word
 * of the name, name contains, type, then rules text.
 */
export function matchRank(c: Card, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const name = c.name.toLowerCase();
  const loose = (s: string) => s.replace(/[^a-z0-9]/g, '');
  if (c.id.toLowerCase() === q.replace(/\s+/g, '')) return 0;
  if (name === q || loose(name) === loose(q)) return 1;
  // A whole word of the name ranks with a name prefix: "Zoro" finds Roronoa Zoro as well as Zoro-Juurou (M1-35).
  const words = name.split(/[\s.\-"]+/);
  if (name.startsWith(q) || loose(name).startsWith(loose(q)) || words.includes(q)) return 2;
  if (words.some((w) => w.startsWith(q))) return 3;
  if (name.includes(q) || loose(name).includes(loose(q))) return 4;
  if (c.types.some((t) => t.toLowerCase().includes(q))) return 5;
  return 6;
}

const CATEGORY_RANK: Record<CardCategory, number> = { Leader: 0, Character: 1, Event: 2, Stage: 3 };

/** Cost sorts put cards without a cost (Leaders) last in either direction (M1-29). */
const cost = (c: Card, desc: boolean) => c.cost ?? (desc ? -Infinity : Infinity);

/** Filters and sorts; ties keep set order, then card number. */
export function filterCards(
  cards: readonly Card[],
  f: Filters,
  setOrder: (code: string) => number,
): Card[] {
  const byId = (a: Card, b: Card) =>
    setOrder(a.set) - setOrder(b.set) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const dir = f.descending ? -1 : 1;
  const key: Record<SortKey, (a: Card, b: Card) => number> = {
    // Equal matches: Leaders and Characters before Events and Stages, then set and card number.
    best: (a, b) =>
      f.query.trim()
        ? matchRank(a, f.query) - matchRank(b, f.query) ||
          CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]
        : 0,
    id: () => 0,
    cost: (a, b) => (cost(a, f.descending) - cost(b, f.descending)) * dir,
    power: (a, b) => ((a.power ?? -1) - (b.power ?? -1)) * dir,
    name: (a, b) => a.name.localeCompare(b.name) * dir,
  };
  const idDir = f.sort === 'id' || f.sort === 'best' ? dir : 1;
  return cards.filter((c) => matches(c, f)).sort((a, b) => key[f.sort](a, b) || byId(a, b) * idDir);
}

const DEFAULTS = emptyFilters('');

/** Filters as a query string (M1-13): only non-default values, so links stay short. */
export function filtersToQuery(f: Filters, defaultSet: string): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query) p.set('q', f.query);
  if (f.set !== defaultSet) p.set('set', f.set);
  if (f.colors.length) p.set('color', f.colors.join(','));
  if (f.categories.length) p.set('category', f.categories.join(','));
  if (f.cost) p.set('cost', f.cost);
  if (f.type) p.set('type', f.type);
  if (f.keyword) p.set('keyword', f.keyword);
  if (f.legality) p.set('legality', f.legality);
  if (f.verifiedOnly) p.set('meta', '1');
  if (f.sort !== DEFAULTS.sort) p.set('sort', f.sort);
  if (f.descending) p.set('desc', '1');
  return p;
}

export function filtersFromQuery(
  p: URLSearchParams,
  defaultSet: string,
): Filters & { setPicked: boolean } {
  const list = <T extends string>(k: string, allowed: readonly T[]) =>
    (p.get(k) ?? '').split(',').filter((x): x is T => (allowed as readonly string[]).includes(x));
  const one = <T extends string>(k: string, allowed: readonly T[], d: T) => {
    const v = p.get(k);
    return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : d;
  };
  return {
    query: p.get('q') ?? '',
    set: p.get('set') ?? defaultSet,
    setPicked: p.has('set'),
    colors: list('color', COLORS),
    categories: list('category', CATEGORIES),
    cost: one('cost', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'] as const, ''),
    type: p.get('type') ?? '',
    keyword: one('keyword', [...KEYWORDS, 'Trigger'] as const, ''),
    legality: one('legality', ['legal', 'banned', 'restricted', 'rotated', 'unknown'] as const, ''),
    verifiedOnly: p.get('meta') === '1',
    sort: one('sort', ['best', 'id', 'cost', 'power', 'name'] as const, 'best'),
    descending: p.get('desc') === '1',
  };
}

/** Every type on the given cards, for the type filter's suggestions. */
export function allTypes(cards: readonly Card[]): string[] {
  return [...new Set(cards.flatMap((c) => c.types))].sort((a, b) => a.localeCompare(b));
}
