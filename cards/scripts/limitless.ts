/**
 * Reads a saved Limitless card page (https://onepiece.limitlesstcg.com/cards/<ID>). It is the M1
 * cross-check source for meta-list cards and, since ADR 0015, the pipeline input for the cards of a
 * product optcgapi.com does not have yet (`LIMITLESS_PRODUCTS` in sources.ts).
 */
import type { Card } from '../src/schema.ts';
import { looseText, printedKeywords, type RawRow } from './normalize.ts';

export interface LimitlessCard {
  id: string;
  name: string;
  category: string;
  colors: string[];
  cost: number | null;
  life: number | null;
  power: number | null;
  counter: number | null;
  attributes: string[];
  types: string[];
  effectText: string;
  triggerText: string | null;
  block: string | null;
  standard: string | null;
  /** Rarity as Limitless names it ("Leader", "Super Rare"); null when the page has none. */
  rarity: string | null;
  /** Product name of the base printing, such as "The Dominance of God". */
  product: string | null;
}

const decode = (s: string) =>
  s
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const strip = (html: string) =>
  decode(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n'),
  );

export function parseLimitless(html: string): LimitlessCard {
  const pick = (re: RegExp) => re.exec(html)?.[1]?.trim() ?? null;
  const id = pick(/<span class="card-text-id">([^<]+)<\/span>/);
  if (!id) throw new Error('not a Limitless card page');
  const typeLine = strip(pick(/<p class="card-text-type">([\s\S]*?)<\/p>/) ?? '');
  const category = pick(/data-tooltip="Category">([^<]+)</) ?? '';
  const colors = (pick(/data-tooltip="Color">([^<]+)</) ?? '').split('/').map((s) => s.trim());
  const cost = /(\d+) Cost/.exec(typeLine);
  const life = /(\d+) Life/.exec(typeLine);
  // The stats paragraph only exists for cards with power.
  const statsBlock = /<p class="card-text-section">([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '';
  const stats = strip(statsBlock);
  const power = /(\d+) Power/.exec(stats);
  const counter = /\+(\d+) Counter/.exec(stats);
  const attributes = [...statsBlock.matchAll(/data-tooltip="Attribute">([^<]+)</g)].flatMap((m) =>
    m[1]!.split('/').map((s) => s.trim()),
  );
  const sections = [...html.matchAll(/<div class="card-text-section">([\s\S]*?)<\/div>/g)].map(
    (m) => m[1]!,
  );
  const textHtml = sections.find((s) => !/card-text-title|data-tooltip="Type"/.test(s)) ?? '';
  const text = strip(textHtml);
  const at = text.startsWith('[Trigger]') ? 0 : text.lastIndexOf('\n[Trigger]') + 1;
  const t = at > 0 || text.startsWith('[Trigger]') ? [text.slice(0, at), text.slice(at)] : [text];
  const typeStr = pick(/data-tooltip="Type">([^<]+)</);
  // "The Dominance of God (OP18)" then "Leader" in the base printing's box.
  const currentPrint = [
    ...(/<div class="prints-current-details">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? '').matchAll(
      /<span[^>]*>([\s\S]*?)<\/span>/g,
    ),
  ]
    .map((m) => strip(m[1]!).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return {
    id,
    name: decode(pick(/<span class="card-text-name">(?:<a[^>]*>)?([^<]+)/) ?? ''),
    category,
    colors,
    cost: cost ? Number(cost[1]) : null,
    life: life ? Number(life[1]) : null,
    power: power ? Number(power[1]) : null,
    counter: counter ? Number(counter[1]) : null,
    attributes,
    types: typeStr
      ? decode(typeStr)
          .split('/')
          .map((s) => s.trim())
      : [],
    effectText: (t.length > 1 ? t.slice(0, -1).join('\n') : t[0]!).trim(),
    triggerText:
      t.length > 1
        ? t
            .at(-1)!
            .replace(/^\[Trigger\]\s*/, '')
            .trim()
        : null,
    block: pick(/<div class="regulation-mark">\s*Block\s*([^<\s]+)/),
    rarity: currentPrint[1] ?? null,
    product: currentPrint[0]?.replace(/\s*\([A-Z0-9-]+\)\s*$/, '') ?? null,
    standard: pick(/<div>Standard<\/div>\s*<div class="[^"]*">\s*([^<]+?)\s*<\/div>/),
  };
}

/** Limitless rarity names to the printed codes optcgapi and the official list use. */
export const RARITY_CODES: Record<string, string> = {
  Leader: 'L',
  Common: 'C',
  Uncommon: 'UC',
  Rare: 'R',
  'Super Rare': 'SR',
  'Secret Rare': 'SEC',
  'Special Card': 'SP',
  'Treasure Rare': 'TR',
  Promo: 'P',
};

/**
 * One Limitless card page as an optcgapi-shaped row, so a product optcgapi lacks goes through the same
 * normalizer as every other card. The row has no image (no new image host; text face until optcgapi
 * has the set). Throws on a rarity it does not know rather than guessing.
 */
export function limitlessRow(c: LimitlessCard, setCode: string): RawRow {
  const rarity = c.rarity === null ? null : RARITY_CODES[c.rarity];
  if (rarity === undefined) throw new Error(`${c.id}: unknown Limitless rarity "${c.rarity}"`);
  const num = (n: number | null) => (n === null ? null : String(n));
  return {
    card_set_id: c.id,
    card_image_id: c.id,
    card_name: c.name,
    card_type: c.category,
    card_color: c.colors.join('/'),
    card_cost: num(c.cost),
    card_power: num(c.power),
    counter_amount: c.counter,
    life: num(c.life),
    attribute: c.attributes.join('/') || null,
    sub_types: c.types.join('/') || null,
    card_text: [c.effectText, c.triggerText === null ? '' : `[Trigger] ${c.triggerText}`]
      .filter(Boolean)
      .join('\n'),
    rarity,
    set_id: setCode,
    set_name: c.product,
    card_image: null,
  };
}

/** Card numbers of one product listed on its Limitless set page (reprints of other sets excluded). */
export function limitlessSetIds(html: string, prefix: string): string[] {
  const re = new RegExp(`/cards/(${prefix}-\\d{3})\\b`, 'g');
  return [...new Set([...html.matchAll(re)].map((m) => m[1]!))].sort();
}

const noReminder = (s: string | null) => (s ?? '').replace(/\([^)]*\)/g, '');
const sameSet = (a: readonly string[], b: readonly string[]) =>
  JSON.stringify([...a].map((x) => x.toLowerCase()).sort()) ===
  JSON.stringify([...b].map((x) => x.toLowerCase()).sort());

/** Field-by-field differences between our card and the Limitless page. Empty means verified. */
export function compareWithLimitless(c: Card, l: LimitlessCard): string[] {
  const d: string[] = [];
  const diff = (field: string, ours: unknown, theirs: unknown) =>
    d.push(`${field}: ours ${JSON.stringify(ours)} | limitless ${JSON.stringify(theirs)}`);
  if (c.name.replace(/\s+/g, ' ') !== l.name.replace(/\s+/g, ' ')) diff('name', c.name, l.name);
  if (c.category !== l.category) diff('category', c.category, l.category);
  if (!sameSet(c.colors, l.colors)) diff('colors', c.colors, l.colors);
  if (c.category === 'Leader') {
    if (c.life !== l.life) diff('life', c.life, l.life);
  } else if (c.cost !== l.cost) diff('cost', c.cost, l.cost);
  if (c.power !== l.power) diff('power', c.power, l.power);
  if (c.counter !== l.counter) diff('counter', c.counter, l.counter);
  if (!sameSet(c.attributes, l.attributes)) diff('attributes', c.attributes, l.attributes);
  if (!sameSet(c.types, l.types)) diff('types', c.types, l.types);
  if (looseText(noReminder(c.effectText)) !== looseText(noReminder(l.effectText))) {
    diff('effectText', c.effectText, l.effectText);
  }
  if (looseText(noReminder(c.triggerText)) !== looseText(noReminder(l.triggerText))) {
    diff('triggerText', c.triggerText, l.triggerText);
  }
  const ours = printedKeywords(c.effectText);
  const theirs = printedKeywords(l.effectText);
  if (!sameSet(ours, theirs)) diff('printed keywords', ours, theirs);
  return d;
}
