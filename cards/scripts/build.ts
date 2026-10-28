/**
 * Assembles normalized cards from upstream rows. Printings are reconciled by card number: game fields
 * come from the base printing (the row whose image id is the bare card number, from a set or starter
 * endpoint, with no shifted columns), and any other printing that disagrees is reported.
 */
import type { Artwork, Card, CardField, TextFix } from '../src/schema.ts';
import { setCodeOf } from '../src/format.ts';
import {
  cleanText,
  looseText,
  parseAttributes,
  partialStats,
  repairSigns,
  restoreTriggerMarker,
  rowProblems,
  rowStats,
  selfSignSuspects,
  splitTrigger,
  stripName,
  type RawRow,
} from './normalize.ts';
import { cardSourceUrl, IMAGE_BASE, type SourceFile } from './sources.ts';
import type { TypeVocabulary } from './types-vocab.ts';

export interface SourcedRow extends RawRow {
  file: SourceFile;
  fetchedAt: string;
}

export interface Issue {
  id: string;
  /** `fatal` stops the run unless an override supplies the field. */
  level: 'fatal' | 'warn';
  kind:
    | 'shifted-columns'
    | 'no-valid-row'
    | 'type-split'
    | 'printing-disagrees'
    | 'attribute-dropped'
    | 'self-sign'
    | 'name';
  msg: string;
  /** Fields an override must supply to clear a fatal issue. */
  fields?: CardField[];
}

export interface Assembly {
  cards: Map<string, Card>;
  issues: Issue[];
  /** Repairs by class, for the report. */
  counts: Record<string, number>;
  setNames: Map<string, string>;
  printingCount: number;
}

/** Card number of a row: `P-030_r1` (a printing id upstream used as card_set_id) becomes `P-030`. */
export const cardIdOf = (r: RawRow) => r.card_set_id.replace(/_.*$/, '').trim();

const productOf = (r: SourcedRow, cardId: string): string => {
  if (r.file === 'promos') return 'P';
  const m = /^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/.exec(r.set_id); // OP14-EB04: OP-14 boosters with EB-04 inserts
  if (m) return setCodeOf(cardId) === `${m[3]}-${m[4]}` ? `${m[3]}-${m[4]}` : `${m[1]}-${m[2]}`;
  return r.set_id.replace(/^([A-Z]+)-?(\d+)$/, '$1-$2');
};

const rank = (r: SourcedRow, id: string) =>
  (r.card_image_id === id ? 0 : 2) +
  (r.file === 'promos' ? 1 : 0) +
  (rowProblems(r).length ? 4 : 0);

export function assemble(rows: SourcedRow[], vocab: TypeVocabulary): Assembly {
  const issues: Issue[] = [];
  const counts: Record<string, number> = {};
  const bump = (k: string, n = 1) => (counts[k] = (counts[k] ?? 0) + n);
  const byId = new Map<string, SourcedRow[]>();
  for (const r of rows) {
    const id = cardIdOf(r);
    byId.set(id, [...(byId.get(id) ?? []), r]);
  }

  const cards = new Map<string, Card>();
  for (const [id, group] of [...byId].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const sorted = [...group].sort(
      (a, b) => rank(a, id) - rank(b, id) || (a.card_image_id < b.card_image_id ? -1 : 1),
    );
    const base = sorted[0]!;
    const fatal = (kind: Issue['kind'], msg: string, fields: CardField[]) =>
      issues.push({ id, level: 'fatal', kind, msg, fields });
    const warn = (kind: Issue['kind'], msg: string) =>
      issues.push({ id, level: 'warn', kind, msg });

    for (const r of group) {
      const p = rowProblems(r);
      if (p.length) {
        bump('shifted-columns rejected');
        warn('shifted-columns', `${r.card_image_id} (${r.file}) rejected: ${p.join('; ')}`);
      }
    }
    const valid = sorted.find((r) => rowProblems(r).length === 0);
    let stats = valid ? rowStats(valid) : null;
    if (!valid) {
      const partial = partialStats(base);
      stats = partial.stats;
      fatal(
        'no-valid-row',
        `every printing has shifted columns (${rowProblems(base).join('; ')})`,
        partial.broken,
      );
    }
    const src = valid ?? base;

    // Text: cleanup, trigger marker, trigger split, sign repair.
    const fixes: TextFix[] = [];
    const cleaned = cleanText(src.card_text);
    fixes.push(...cleaned.fixes);
    const marked = restoreTriggerMarker(cleaned.text);
    fixes.push(...marked.fixes);
    const split = splitTrigger(marked.text);
    const eff = repairSigns(split.effect, 'effectText');
    const trg = split.trigger === null ? null : repairSigns(split.trigger, 'triggerText');
    fixes.push(...eff.fixes, ...(trg?.fixes ?? []));
    for (const f of fixes) bump(fixClass(f));
    if (split.trigger !== null) bump('trigger: split from effect');
    for (const s of [...selfSignSuspects(eff.text), ...selfSignSuspects(trg?.text ?? '')]) {
      bump('self-directed sign flagged (E-Q8)');
      warn('self-sign', `possible dropped sign, not repaired: "${s}"`);
    }

    // Name: printing suffixes stripped.
    const { name } = stripName(src.card_name);
    if (name !== src.card_name.trim()) bump('name suffix stripped');
    const names = new Set(group.map((r) => stripName(r.card_name).name));
    if (names.size > 1) warn('name', `printings disagree on name: ${[...names].join(' | ')}`);

    // Types: split against the vocabulary.
    let types: string[] = [];
    if (valid) {
      const st = vocab.split(valid.sub_types);
      if (st.ok) {
        types = [...new Set(st.types)];
        if (types.length < st.types.length) bump('types deduplicated');
        if (types.length > 1 && !(valid.sub_types ?? '').includes('/')) bump('types split');
      } else {
        fatal('type-split', `${st.reason}: ${st.detail}`, ['types']);
      }
    }

    const attr = parseAttributes(valid ? src.attribute : null);
    if (attr.dropped.length) {
      bump('attribute junk dropped');
      warn('attribute-dropped', `attribute "${attr.dropped.join(', ')}" dropped`);
    }

    // Other printings that disagree with the base on game fields.
    for (const r of group) {
      if (r === src || rowProblems(r).length) continue;
      const o = rowStats(r);
      const diffs: string[] = [];
      if (stats) {
        for (const k of ['category', 'cost', 'power', 'counter', 'life'] as const) {
          if (o[k] !== stats[k]) diffs.push(`${k} ${String(o[k])} vs ${String(stats[k])}`);
        }
        if (o.colors.join('/') !== stats.colors.join('/'))
          diffs.push(`colors ${o.colors.join('/')}`);
      }
      const t = cleanText(r.card_text).text;
      if (looseText(t).replace(/^-+/, '') !== looseText(cleaned.text)) diffs.push('text');
      if (diffs.length) {
        bump('printings disagreeing');
        warn('printing-disagrees', `${r.card_image_id} (${r.file}): ${diffs.join('; ')}`);
      }
    }

    const card: Card = {
      id,
      name,
      category: stats?.category ?? 'Character',
      colors: stats?.colors ?? [],
      cost: stats?.cost ?? null,
      power: stats?.power ?? null,
      counter: stats?.counter ?? null,
      life: stats?.life ?? null,
      attributes: attr.attributes,
      types,
      rarity: (src.card_image_id === id ? src.rarity : null) ?? base.rarity ?? 'PR',
      set: setCodeOf(id),
      block: null,
      effectText: eff.text,
      triggerText: trg?.text ?? null,
      keywords: [],
      verified: false,
      verifiedBy: [],
      textFixes: fixes,
      artworks: artworks(id, sorted),
      legality: { standard: { status: 'unknown' }, extra: { status: 'unknown' } },
      sourceUrl: cardSourceUrl(id),
      fetchedAt: src.fetchedAt,
    };
    cards.set(id, card);
  }

  return {
    cards,
    issues,
    counts,
    setNames: setNames(rows),
    printingCount: [...cards.values()].reduce((n, c) => n + c.artworks.length, 0),
  };
}

function fixClass(f: TextFix): string {
  if (f.kind === 'sign')
    return f.from.startsWith('DON!!') ? 'sign: DON!! cost' : "sign: opponent's power/cost";
  if (f.kind === 'trigger') return 'trigger: marker restored';
  if (/^NULL$/i.test(f.from)) return 'cleanup: NULL text';
  if (/disclaimer/i.test(f.from)) return 'cleanup: reprint disclaimer';
  return "cleanup: errata'd note";
}

/** One artwork per distinct printing; upstream ids reused for different art get `#2`, `#3`. */
function artworks(id: string, rows: SourcedRow[]): Artwork[] {
  const out: Artwork[] = [];
  const byPid = new Map<string, Artwork[]>();
  for (const r of rows) {
    const path = r.card_image ? r.card_image.replace(IMAGE_BASE, '') : undefined;
    const pid = r.card_image_id.trim().startsWith(id)
      ? r.card_image_id.trim()
      : `${id}#${r.card_image_id.trim()}`;
    const same = byPid.get(pid) ?? [];
    if (same.length) {
      if (path === undefined || same.some((a) => a.imageUrls.full === path)) continue;
      const blank = same.find((a) => !a.imageUrls.full);
      if (blank) {
        blank.imageUrls = { full: path };
        continue;
      }
    }
    const { label } = stripName(r.card_name);
    const a: Artwork = {
      artworkId: same.length ? `${pid}#${same.length + 1}` : pid,
      imageUrls: path ? { full: path } : {},
      source: 'optcgapi',
      product: productOf(r, id),
      rarity: r.rarity ?? '',
    };
    if (label) a.label = label;
    same.push(a);
    byPid.set(pid, same);
    out.push(a);
  }
  return out;
}

function setNames(rows: SourcedRow[]): Map<string, string> {
  const tally = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (r.file === 'promos' || !r.set_name) continue;
    const id = cardIdOf(r);
    const code = productOf(r, id);
    if (code !== setCodeOf(id) || code === 'EB-04') continue;
    const m = tally.get(code) ?? new Map<string, number>();
    m.set(r.set_name, (m.get(r.set_name) ?? 0) + 1);
    tally.set(code, m);
  }
  const names = new Map<string, string>();
  for (const [code, m] of tally) names.set(code, [...m].sort((a, b) => b[1] - a[1])[0]![0]);
  names.set('EB-04', 'Extra Booster EB-04 (inserted in OP-14 and OP-15 boosters)');
  names.set('P', 'Promotion cards');
  return names;
}
