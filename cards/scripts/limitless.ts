/**
 * Reads a saved Limitless card page (https://onepiece.limitlesstcg.com/cards/<ID>), the M1 cross-check
 * source for meta-list cards. Limitless is used by a person to verify, never as pipeline input.
 */
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
    standard: pick(/<div>Standard<\/div>\s*<div class="[^"]*">\s*([^<]+?)\s*<\/div>/),
  };
}
