/**
 * M10 WP7: the deck builder's keyboard (flows F17 step 1, review M6-3 and N-2) and the JSON
 * importer's report (M6-11). The roving model is a pure function; the tab-stop count is taken from
 * the rendered builder (server render: the markup is what the keyboard sees).
 *
 * Reverts, each failing its test: give every tile `tabIndex={0}` (the tab-stop and one-stop tests);
 * wrap the grid keys (`moveFocus` wraps: the clamp tests); drop the `tabIndex={-1}` on a tile's
 * buttons (the one-stop test); restore the silent clamp in the importer (the table of bad counts).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Card, SetFile } from '@optcg/cards';
import { parseDeckText } from '@optcg/cards';
import { Editor } from '../src/decks/DecksRoute.tsx';
import { cycleArt, isGridKey, moveFocus, sanitizeJsonDeck } from '../src/decks/keys.ts';
import type { SavedDeck } from '../src/decks/store.ts';
import { DECKS } from '../src/play/setup/decks.ts';

const byId = new Map<string, Card>();
const dir = new URL('../../cards/data/sets/', import.meta.url);
for (const f of readdirSync(dir))
  for (const c of (JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SetFile).cards)
    byId.set(c.id, c);

const rocks = DECKS.find((d) => d.leader === 'OP17-039')!;
const deck = (p: Partial<SavedDeck> = {}): SavedDeck => ({
  id: 'saved:t',
  name: 'Test',
  leader: rocks.spec.leader,
  main: rocks.spec.main.slice(),
  format: 'standard',
  art: {},
  updatedAt: '2026-11-27T00:00:00Z',
  ...p,
});

describe('moveFocus: the roving grid as a pure function', () => {
  // 10 tiles, 4 columns: rows are 0-3, 4-7, 8-9.
  const go = (i: number, key: string) => moveFocus(i, key, 4, 10);
  it('Left and Right move by one and never wrap', () => {
    expect(go(5, 'ArrowRight')).toBe(6);
    expect(go(5, 'ArrowLeft')).toBe(4);
    expect(go(3, 'ArrowRight')).toBe(4); // reading order: the next row's first tile
    expect(go(0, 'ArrowLeft')).toBe(0);
    expect(go(9, 'ArrowRight')).toBe(9);
  });
  it('Up and Down move by a row (the column count) and clamp at the ends', () => {
    expect(go(5, 'ArrowDown')).toBe(9);
    expect(go(1, 'ArrowDown')).toBe(5);
    expect(go(5, 'ArrowUp')).toBe(1);
    expect(go(2, 'ArrowUp')).toBe(2);
    // Down from the row above a short last row lands on its last tile; from the last row, stays.
    expect(go(7, 'ArrowDown')).toBe(9);
    expect(go(8, 'ArrowDown')).toBe(8);
    expect(go(9, 'ArrowDown')).toBe(9);
  });
  it('Home and End go to the first and last tile', () => {
    expect(go(6, 'Home')).toBe(0);
    expect(go(2, 'End')).toBe(9);
  });
  it('an out-of-range index is clamped, an empty grid stays at 0, other keys do nothing', () => {
    expect(moveFocus(99, 'ArrowLeft', 4, 10)).toBe(8);
    expect(moveFocus(-3, 'ArrowRight', 4, 10)).toBe(1);
    expect(moveFocus(0, 'ArrowDown', 4, 0)).toBe(0);
    expect(go(5, 'x')).toBe(5);
    expect(moveFocus(2, 'ArrowDown', 0, 10)).toBe(3); // a zero column count reads as one column
    expect(['ArrowLeft', 'End', 'Enter', 'a'].map(isGridKey)).toEqual([true, true, false, false]);
  });
});

describe('A cycles the art of the focused card', () => {
  const alt = [...byId.values()].find((c) => c.artworks.length >= 3)!;
  const single = [...byId.values()].find((c) => c.artworks.length === 1)!;
  it('with alternates: the next art, wrapping, and a polite line "Art 2 of 3"', () => {
    const one = cycleArt(deck(), alt)!;
    expect(one.deck.art[alt.id]).toBe(alt.artworks[1]!.artworkId);
    expect(one.line).toBe(`${alt.name}: art 2 of ${alt.artworks.length}.`);
    let d = one.deck;
    for (let i = 2; i <= alt.artworks.length; i++) d = cycleArt(d, alt)!.deck;
    expect(d.art[alt.id]).toBe(alt.artworks[0]!.artworkId);
  });
  it('without alternates: nothing changes', () => {
    expect(cycleArt(deck(), single)).toBeNull();
  });
});

describe('JSON import names every entry it cannot use (M6-11)', () => {
  const leader = 'OP17-039';
  const json = (main: unknown[]) => JSON.stringify({ leader, main });
  const run = (entry: unknown) => sanitizeJsonDeck(json(['OP17-040', entry]));
  const table: [unknown, string][] = [
    [{ id: 'OP17-041', count: 'x' }, 'Entry 2: count “x” is not a number, skipped'],
    [{ id: 'OP17-041', count: null }, 'Entry 2: count null is not a number, skipped'],
    [{ id: 'OP17-041', count: true }, 'Entry 2: count true is not a number, skipped'],
    [{ id: 'OP17-041', count: 0 }, 'Entry 2: count 0 is less than 1, skipped'],
    [{ id: 'OP17-041', count: -3 }, 'Entry 2: count -3 is less than 1, skipped'],
    [{ id: 'OP17-041', count: 2.5 }, 'Entry 2: count 2.5 is not a whole number, skipped'],
    [{ id: 'OP17-041', count: 99 }, 'Entry 2: count 99 is more than a deck holds (50), skipped'],
    [null, 'Entry 2: not a card entry (it needs an "id"), skipped'],
    [7, 'Entry 2: not a card entry (it needs an "id"), skipped'],
    [{ count: 2 }, 'Entry 2: not a card entry (it needs an "id"), skipped'],
    // M10-R10. Revert: drop the id-type and quantity-key checks in sanitizeJsonDeck (these four then pass).
    [{ id: 'OP17-041', qty: 4 }, 'Entry 2: "qty" is not read, use "count", skipped'],
    [{ id: 'OP17-041', quantity: 4 }, 'Entry 2: "quantity" is not read, use "count", skipped'],
    [
      { id: 7, count: 2 },
      'Entry 2: the "id" must be text such as "OP17-039", not a number, skipped',
    ],
    [
      { id: null, count: 2 },
      'Entry 2: the "id" must be text such as "OP17-039", not another kind of value, skipped',
    ],
  ];
  it.each(table)('%j reads %s', (entry, message) => {
    const r = run(entry);
    expect(r.problems).toEqual([message]);
    // And the entry is really left out, so "skipped" is true of what the parser then reads.
    const parsed = parseDeckText(r.text, (id) => byId.get(id));
    expect(parsed.main).toEqual(['OP17-040']);
  });
  it('good counts and string entries pass untouched', () => {
    const text = json(['OP17-040', { id: 'OP17-041', count: 3 }]);
    const r = sanitizeJsonDeck(text);
    expect(r.problems).toEqual([]);
    expect(r.text).toBe(text);
    expect(parseDeckText(r.text, (id) => byId.get(id)).main).toHaveLength(4);
  });
  it('says when an entry has no count and is read as 1 (M10-R10), and keeps it', () => {
    const r = sanitizeJsonDeck(json(['OP17-040', { id: 'OP17-042' }]));
    expect(r.problems).toEqual(['Entry 2: no count, read as 1']);
    expect(parseDeckText(r.text, (id) => byId.get(id)).main).toEqual(['OP17-040', 'OP17-042']);
  });
  it('numbers each entry by its place in the list, and reports every one', () => {
    const r = sanitizeJsonDeck(
      json(['OP17-040', { id: 'OP17-041', count: 'x' }, 'OP17-042', { id: 'OP17-043', count: 0 }]),
    );
    expect(r.problems.map((p) => p.slice(0, 8))).toEqual(['Entry 2:', 'Entry 4:']);
  });
  it('text that is not a JSON deck is left to the parser', () => {
    for (const t of ['4xOP17-040', '{not json', '{"leader":"OP17-039"}', ''])
      expect(sanitizeJsonDeck(t)).toEqual({ text: t, problems: [] });
  });
});

// ------------------------------------------------------------------------------------------------
// Tab stops in the rendered builder
// ------------------------------------------------------------------------------------------------

interface Stop {
  tag: string;
  attrs: string;
  id: string;
}
/** The elements a Tab key can land on, in document order, from rendered markup. */
function tabStops(html: string): Stop[] {
  const out: Stop[] = [];
  const tag =
    /<(a|button|input|select|textarea|summary|li|ul|div|span|p|section|h\d|details)\b([^>]*)>/g;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    const [, name, attrs = ''] = m;
    const ti = /\btabindex="(-?\d+)"/.exec(attrs);
    const disabled = /\bdisabled(=|\s|$|\/)/.test(attrs);
    let focusable = false;
    if (ti) focusable = Number(ti[1]) >= 0;
    else if (name === 'a') focusable = /\bhref=/.test(attrs);
    else if (name === 'input') focusable = !/type="hidden"/.test(attrs) && !disabled;
    else if (name === 'button' || name === 'select' || name === 'textarea') focusable = !disabled;
    else if (name === 'summary') focusable = true;
    if (focusable) out.push({ tag: name!, attrs, id: /\bid="([^"]*)"/.exec(attrs)?.[1] ?? '' });
  }
  return out;
}

const render = (d: SavedDeck) =>
  renderToStaticMarkup(createElement(Editor, { deck: d, cards: byId }));

describe('the builder has few Tab stops (M6-3, N-2)', () => {
  const html = render(deck());
  const stops = tabStops(html);
  const at = (id: string) => stops.findIndex((s) => s.id === id);

  it('Tab order is search, filters, the grid, then the deck pane, within 12 stops to the deck', () => {
    const search = at('deck-search');
    const name = at('deck-name');
    expect(search).toBeGreaterThanOrEqual(0);
    expect(name).toBeGreaterThan(search);
    // From the search box to the deck name, both counted. Before M10 this was 127.
    expect(name - search + 1).toBeLessThanOrEqual(12);
    const filters = stops.slice(search + 1, name).filter((s) => s.tag !== 'a');
    expect(filters.some((s) => s.tag === 'select')).toBe(true);
  });

  it('the card grid is exactly one stop, and so is the deck list', () => {
    const tiles = stops.filter((s) => /data-tile=/.test(s.attrs));
    expect(tiles).toHaveLength(1);
    expect(tiles[0]!.attrs).toContain('data-tile="0"');
    const rows = stops.filter((s) => /data-deckrow=/.test(s.attrs));
    expect(rows).toHaveLength(1);
    // No step button anywhere in the grid or the list is in the order.
    expect(stops.filter((s) => s.tag === 'button' && /^(Add|Remove) one/.test(attrOf(s)))).toEqual(
      [],
    );
  });

  it('there are skip links both ways, and the whole page stays under 25 stops', () => {
    const skips = stops.filter((s) => /skip-link/.test(s.attrs));
    expect(skips).toHaveLength(2);
    expect(html).toContain('Skip to the deck');
    expect(html).toContain('Skip to the card grid');
    expect(stops.length).toBeLessThan(25);
  });

  it('with no Leader the grid is still one stop', () => {
    const none = tabStops(render(deck({ leader: null, main: [] })));
    expect(none.filter((s) => /data-tile=/.test(s.attrs))).toHaveLength(1);
    expect(none.filter((s) => s.tag === 'button' && /Choose /.test(attrOf(s)))).toEqual([]);
  });

  it('the counting helper sees a tile with tabindex 0 (so a revert is caught)', () => {
    const leaky = html.replace(/(<li[^>]*?)tabindex="-1"([^>]*data-tile=)/g, '$1tabindex="0"$2');
    expect(tabStops(leaky).filter((s) => /data-tile=/.test(s.attrs)).length).toBeGreaterThan(1);
  });
});

/** The aria-label of a rendered button, from the full markup of its start tag. */
function attrOf(s: Stop): string {
  return /aria-label="([^"]*)"/.exec(s.attrs)?.[1] ?? '';
}
