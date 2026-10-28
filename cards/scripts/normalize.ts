/**
 * Mechanical repairs for optcgapi.com rows (data-sources.md "Decision"; every defect class from the
 * Track B diff). Pure functions: no I/O, so each class is unit-tested on recorded fixtures.
 */
import type { Attribute, CardCategory, CardField, Color, Keyword, TextFix } from '../src/schema.ts';
import { ATTRIBUTES, CATEGORIES, COLORS, KEYWORDS } from '../src/validate.ts';

/** One row of `/api/allSetCards/`, `/api/allSTCards/` or `/api/promos/filtered/?set_id=P`. */
export interface RawRow {
  card_set_id: string;
  card_image_id: string;
  card_name: string;
  card_type: string;
  card_color: string | null;
  card_cost: string | null;
  card_power: string | null;
  counter_amount: number | null;
  life: string | null;
  attribute: string | null;
  sub_types: string | null;
  card_text: string | null;
  rarity: string | null;
  set_id: string;
  set_name: string | null;
  card_image: string | null;
  date_scraped?: string | null;
}

const MINUS = '−';

/** Junk appended upstream: reprint disclaimers and an "officially errata'd" note. */
const DISCLAIMER = /\s*(?:DISCLAIMER|Disclaimer):[^]*$/;
const ERRATA_NOTE = /\s*This card has been officially errata'd\./g;

/**
 * Removes NULL text, reprint disclaimers and upstream notes, and normalizes whitespace and the minus
 * glyph. Returns the cleaned text and an audit entry for each removal.
 */
export function cleanText(raw: string | null, field: CardField = 'effectText') {
  const fixes: TextFix[] = [];
  let text = (raw ?? '').replace(/\r\n?/g, '\n');
  if (/^\s*NULL\s*$/i.test(text)) {
    fixes.push({ field, kind: 'cleanup', from: text, to: '' });
    text = '';
  }
  const d = DISCLAIMER.exec(text);
  if (d) {
    fixes.push({ field, kind: 'cleanup', from: d[0].trim(), to: '' });
    text = text.slice(0, d.index);
  }
  if (ERRATA_NOTE.test(text)) {
    fixes.push({ field, kind: 'cleanup', from: "This card has been officially errata'd.", to: '' });
    text = text.replace(ERRATA_NOTE, '');
  }
  text = text
    .split('\n')
    .map((l) => l.replace(/[ \t\u00a0]+/g, ' ').trim())
    .filter((l, i, all) => l !== '' || (i > 0 && all[i - 1] !== ''))
    .join('\n')
    .trim();
  return { text: normalizeMinus(text), fixes };
}

/** "-2000", "–2" and "－1" become the true minus "−2000" (visual-system §3.3). Meaning is unchanged. */
export function normalizeMinus(text: string): string {
  return text.replace(/(^|[\s(:])[-–－](?=\d)/g, `$1${MINUS}`);
}

/** Restores the brackets on a [Trigger] marker that upstream printed as bare "Trigger" (OP17-104). */
export function restoreTriggerMarker(text: string, field: CardField = 'effectText') {
  const fixes: TextFix[] = [];
  const out = text.replace(/(^|[.)\]]\s*)Trigger (?=[A-Z])/g, (_m, pre: string) => {
    fixes.push({ field, kind: 'trigger', from: 'Trigger ', to: '[Trigger] ' });
    return `${pre}[Trigger] `;
  });
  return { text: out, fixes };
}

/**
 * Splits the card's own [Trigger] off the effect text. A card's own trigger starts an ability: it sits at
 * the start of the text or a line, or after a sentence or reminder ends. "[Trigger]" mentioned inside a
 * sentence ("a card with a [Trigger]") is a reference and stays in the effect.
 */
export function splitTrigger(text: string): { effect: string; trigger: string | null } {
  let at = -1;
  for (const m of text.matchAll(/\[Trigger\]/g)) {
    const before = text.slice(0, m.index).replace(/[ \t]+$/, '');
    if (before === '' || /[\n.)!\]]$/.test(before)) at = m.index;
  }
  if (at < 0) return { effect: text, trigger: null };
  const effect = text.slice(0, at).trim();
  const trigger = text.slice(at + '[Trigger]'.length).trim();
  return { effect, trigger: trigger === '' ? null : trigger };
}

/**
 * Restores minus signs that upstream drops (data-sources.md; 13 cards in the OP-17 diff):
 * - a DON!! cost: "DON!! 1:" or "DON!! 2 (You may return…" becomes "DON!! −1";
 * - an unsigned power or cost given to an **opponent's** card: "give up to 1 of your opponent's
 *   Characters 3000 power" becomes "−3000 power".
 * Self-directed values are not touched (effect-dsl E-Q8); `selfSignSuspects` flags them instead.
 */
export function repairSigns(text: string, field: CardField = 'effectText') {
  const fixes: TextFix[] = [];
  let out = text.replace(/DON!! (\d+)(?=\s*(?::|,|\(You may return))/g, (m, n: string) => {
    const to = `DON!! ${MINUS}${n}`;
    fixes.push({ field, kind: 'sign', from: m, to });
    return to;
  });
  out = mapClauses(out, (clause) => {
    const give = /\b[Gg]ives?\b/.exec(clause);
    if (!give) return clause;
    const opp = clause.indexOf("opponent's", give.index);
    if (opp < 0) return clause;
    const head = clause.slice(0, opp);
    const tail = clause
      .slice(opp)
      .replace(
        /(?<=\b(?:Characters?|cards?|Leaders?|Stages?|them|it|other|less|more) )(\d+) (power|cost)\b(?! or (?:less|more))/g,
        (m, n: string, what: string, at: number, whole: string) => {
          // Only the opponent's cards: "…opponent's effect, you may give your Leader 2000 power" is not.
          const between = whole.slice(whole.lastIndexOf("opponent's", at), at);
          if (/\byour\b(?! opponent's)/.test(between.replace(/^opponent's/, ''))) return m;
          const to = `${MINUS}${n} ${what}`;
          fixes.push({ field, kind: 'sign', from: m, to });
          return to;
        },
      );
    return head + tail;
  });
  return { text: out, fixes };
}

/** Unsigned power or cost given to your own card: probably a dropped sign, never auto-repaired (E-Q8). */
export function selfSignSuspects(text: string): string[] {
  const out: string[] = [];
  mapClauses(text, (clause) => {
    for (const m of clause.matchAll(
      /\b[Gg]ives? (?:this|your|that)\b([^.]*?)(?<![+\u2212\d])\b(\d+) (power|cost)\b(?! or (?:less|more))/g,
    )) {
      if (!m[1]!.includes("opponent's")) out.push(m[0]);
    }
    return clause;
  });
  return out;
}

/** Applies `fn` to each clause: text between sentence ends, bullets and line breaks. */
function mapClauses(text: string, fn: (clause: string) => string): string {
  return text
    .split(/((?<=\.)\s+|\n|•)/)
    .map((part, i) => (i % 2 === 0 ? fn(part) : part))
    .join('');
}

/**
 * Strips upstream printing suffixes from a name: "(005)", "(Alternate Art)", "[Finalist]",
 * " - P-117", and product names. Returns the base name and the stripped label.
 */
export function stripName(raw: string): { name: string; label?: string } {
  let name = raw.replace(/\s+/g, ' ').trim();
  const parts: string[] = [];
  for (;;) {
    const m =
      /\s+\(([^()]*)\)$/.exec(name) ??
      /\s+\[([^\]]*)\]$/.exec(name) ??
      /\s+-\s*((?:[A-Z]{1,3}\d{0,2}-\d{3})?.*)$/.exec(name);
    if (!m) break;
    parts.unshift(m[1]!.trim());
    name = name.slice(0, m.index).trim();
  }
  const label = parts.filter((p) => !/^(?:[A-Z]{1,3}\d{0,2}-)?\d{3}$/.test(p)).join(' · ');
  return label ? { name, label } : { name };
}

export function parseColors(raw: string | null): Color[] | null {
  const parts = (raw ?? '').split(/[\s/]+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.every((p) => (COLORS as readonly string[]).includes(p)) ? (parts as Color[]) : null;
}

export function parseAttributes(raw: string | null): {
  attributes: Attribute[];
  dropped: string[];
} {
  const attributes: Attribute[] = [];
  const dropped: string[] = [];
  const value = (raw ?? '').trim();
  if (!value || /^(NULL|N\/A|\?)$/i.test(value)) {
    return { attributes, dropped: value ? [value] : [] };
  }
  const parts = value.split(/[\s/]+/).filter(Boolean);
  if (!parts.every((p) => (ATTRIBUTES as readonly string[]).includes(p))) {
    return { attributes, dropped: [value] };
  }
  for (const p of parts) if (!attributes.includes(p as Attribute)) attributes.push(p as Attribute);
  return { attributes, dropped };
}

export function parseCategory(raw: string): CardCategory | null {
  return (CATEGORIES as readonly string[]).includes(raw) ? (raw as CardCategory) : null;
}

const isNum = (v: string | null) => v !== null && /^\d+$/.test(v.trim());
const isNullish = (v: string | null) => v === null || /^(NULL|)$/i.test(v.trim());

/**
 * Detects shifted columns (OP17-099 has its types in the power column; many promo rows shift power,
 * types and counter one column over; OP12-016 to OP12-019 have types in the cost column). A row with any
 * of these is rejected for game fields: its stats come from another printing or an override.
 */
export function rowProblems(r: RawRow): string[] {
  const p: string[] = [];
  const cat = parseCategory(r.card_type);
  if (!cat) p.push(`category "${r.card_type}"`);
  if (!parseColors(r.card_color)) p.push(`colors "${r.card_color}"`);
  if (!isNullish(r.card_power) && !isNum(r.card_power)) p.push(`power "${r.card_power}"`);
  if (cat === 'Character' && !isNum(r.card_power)) p.push('Character without power');
  if (!isNullish(r.card_cost) && !isNum(r.card_cost)) p.push(`cost "${r.card_cost}"`);
  if (cat && cat !== 'Leader' && !isNum(r.card_cost)) p.push(`${cat} without cost`);
  if (cat === 'Leader' && !(isNum(r.life) && Number(r.life) <= 10)) p.push(`life "${r.life}"`);
  if (cat === 'Leader' && !isNum(r.card_power)) p.push('Leader without power');
  if (isNum(r.sub_types)) p.push(`types "${r.sub_types}"`);
  return p;
}

/** Parsed game fields of a row that passed `rowProblems`. */
export function rowStats(r: RawRow) {
  const cat = parseCategory(r.card_type)!;
  const num = (v: string | null) => (isNum(v) ? Number(v!.trim()) : null);
  return {
    category: cat,
    colors: parseColors(r.card_color)!,
    cost: cat === 'Leader' ? null : num(r.card_cost),
    power: cat === 'Event' || cat === 'Stage' ? null : num(r.card_power),
    counter: r.counter_amount && r.counter_amount > 0 ? r.counter_amount : null,
    life: cat === 'Leader' ? num(r.life) : null,
  };
}

/**
 * Best-effort parse of a row whose columns are shifted: each field that still parses is kept, and the
 * ones that do not are listed so an override must supply them.
 */
export function partialStats(r: RawRow) {
  const broken: CardField[] = [];
  const category = parseCategory(r.card_type);
  if (!category) broken.push('category');
  const colors = parseColors(r.card_color);
  if (!colors) broken.push('colors');
  const cat = category ?? 'Character';
  const num = (v: string | null) => (isNum(v) ? Number(v!.trim()) : null);
  const cost = cat === 'Leader' ? null : num(r.card_cost);
  if (cat !== 'Leader' && cost === null) broken.push('cost');
  const power = cat === 'Event' || cat === 'Stage' ? null : num(r.card_power);
  if ((cat === 'Leader' || cat === 'Character') && power === null) broken.push('power');
  const life = cat === 'Leader' && isNum(r.life) && Number(r.life) <= 10 ? Number(r.life) : null;
  if (cat === 'Leader' && life === null) broken.push('life');
  // A shifted row's counter column cannot be trusted for a Character.
  if (cat === 'Character') broken.push('counter');
  // Types sit in the wrong column whenever any other column is shifted.
  broken.push('types', 'attributes');
  return {
    stats: { category: cat, colors: colors ?? [], cost, power, counter: null, life },
    broken,
  };
}

const KW_ALT = KEYWORDS.map((k) => k.replace(': ', ': ?')).join('|');

/**
 * Printed keyword abilities in a card's effect text: a keyword that starts an ability (start of text or
 * line, after a sentence or reminder, or after another printed keyword). "gains [Blocker]" is an effect,
 * not a printed keyword. Used only to check verified overrides (effect-dsl E-D7), never to grant them.
 */
export function printedKeywords(effect: string): Keyword[] {
  const out: Keyword[] = [];
  let lastEnd = -1;
  for (const m of effect.matchAll(new RegExp(`\\[(${KW_ALT})\\]`, 'g'))) {
    const before = effect.slice(0, m.index).replace(/[ \t]+$/, '');
    const chained = lastEnd >= 0 && effect.slice(lastEnd, m.index).trim() === '';
    if (before === '' || /[\n.)]$/.test(before) || chained) {
      const kw = m[1]!.replace(/: ?/, ': ') as Keyword;
      if (!out.includes(kw)) out.push(kw);
      lastEnd = m.index + m[0].length;
      // Skip the reminder text that follows a printed keyword.
      const rest = effect.slice(lastEnd);
      const reminder = /^\s*\([^)]*\)/.exec(rest);
      if (reminder) lastEnd += reminder[0].length;
    }
  }
  return out;
}

/** Loose comparison key for text: ignores whitespace, punctuation, case and minus glyphs. */
export function looseText(s: string | null): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/[−–－]/g, '-')
    .replace(/[^a-z0-9+-]/g, '');
}
