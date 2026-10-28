import type { Card, CardCategory, Color, Keyword, Legality } from '@optcg/cards';

export type CostFilter = '' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10+';
export type SortKey = 'id' | 'cost' | 'power' | 'name';

export interface Filters {
  query: string;
  /** A set code, or `all`. */
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
  sort: 'id',
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

const SORTS: Record<SortKey, (a: Card, b: Card) => number> = {
  id: () => 0,
  cost: (a, b) => (a.cost ?? -1) - (b.cost ?? -1),
  power: (a, b) => (b.power ?? -1) - (a.power ?? -1),
  name: (a, b) => a.name.localeCompare(b.name),
};

/** Filters and sorts; ties keep set order, then card number. */
export function filterCards(
  cards: readonly Card[],
  f: Filters,
  setOrder: (code: string) => number,
): Card[] {
  const byId = (a: Card, b: Card) =>
    setOrder(a.set) - setOrder(b.set) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return cards.filter((c) => matches(c, f)).sort((a, b) => SORTS[f.sort](a, b) || byId(a, b));
}

/** Every type on the given cards, for the type filter's suggestions. */
export function allTypes(cards: readonly Card[]): string[] {
  return [...new Set(cards.flatMap((c) => c.types))].sort((a, b) => a.localeCompare(b));
}
