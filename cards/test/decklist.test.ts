/**
 * Deck lists as text (M6; flows F17 steps 4 and 5): every meta list round-trips without loss in
 * every format, and the parser reports each line.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  exportDeckJson,
  exportDeckText,
  groupDeck,
  parseDeckText,
  type DeckTextFormat,
} from '../src/decklist.ts';
import type { Card, SetFile } from '../src/schema.ts';

const byId = new Map<string, Card>();
const dir = new URL('../data/sets/', import.meta.url);
for (const f of readdirSync(dir)) {
  const set = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SetFile;
  for (const c of set.cards) byId.set(c.id, c);
}
const lookup = (id: string) => byId.get(id);
const nameOf = (id: string) => byId.get(id)?.name ?? '';

interface MetaFile {
  archetypes: { id: string; lists: { leader: string; main: { id: string; count: number }[] }[] }[];
}
const meta = JSON.parse(
  readFileSync(new URL('../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
) as MetaFile;
const lists = meta.archetypes.flatMap((a) =>
  a.lists.map((l, i) => ({
    name: `${a.id} #${i + 1}`,
    deck: {
      leader: l.leader,
      main: l.main.flatMap((c) => Array.from({ length: c.count }, () => c.id)),
    },
    grouped: l.main,
  })),
);
const FORMATS: DeckTextFormat[] = ['compact', 'count', 'limitless'];

describe('round trip: all 36 meta lists, every format (PROMPT M6)', () => {
  it('there are 36 lists', () => expect(lists).toHaveLength(36));
  for (const l of lists)
    it(`${l.name}`, () => {
      for (const f of FORMATS) {
        const text = exportDeckText(l.deck, f, nameOf);
        const back = parseDeckText(text, lookup);
        expect(back.leader, f).toBe(l.deck.leader);
        expect(back.main, f).toEqual(l.deck.main);
        expect(groupDeck(back.main), f).toEqual(l.grouped);
        expect(
          back.lines.every((x) => x.status === 'ok' || x.status === 'leader'),
          f,
        ).toBe(true);
        // Export of an import equals the input (normalised).
        expect(exportDeckText({ leader: back.leader!, main: back.main }, f, nameOf)).toBe(text);
      }
      const json = parseDeckText(exportDeckJson(l.deck, 'x'), lookup);
      expect(json).toMatchObject({ leader: l.deck.leader, main: l.deck.main, lines: [] });
    });
});

describe('parseDeckText', () => {
  it('reads the three formats mixed, with blank lines, headers and comments', () => {
    const p = parseDeckText(
      [
        'Leader',
        '1xOP17-039',
        '',
        'Main deck:',
        '4xOP17-040',
        '3 OP08-051',
        '# a note',
        '2 Rocks Nami OP17-045',
      ].join('\n'),
      lookup,
    );
    expect(p.leader).toBe('OP17-039');
    expect(groupDeck(p.main)).toEqual([
      { id: 'OP17-040', count: 4 },
      { id: 'OP08-051', count: 3 },
      { id: 'OP17-045', count: 2 },
    ]);
  });
  it('a name starting with X is not read as the "4x" separator (X.Drake)', () => {
    expect(parseDeckText('4 X.Drake OP17-075', lookup).lines[0]!.status).toBe('ok');
    expect(parseDeckText('4x X.Drake OP17-075', lookup).lines[0]!.status).toBe('ok');
  });
  it('an alt-art suffix names the same card number', () => {
    expect(parseDeckText('4xOP17-040_p1', lookup).main).toEqual(Array(4).fill('OP17-040'));
    expect(parseDeckText('4 OP17-040_r2', lookup).main).toEqual(Array(4).fill('OP17-040'));
  });
  it('reports unknown IDs and bad lines without adding them', () => {
    const p = parseDeckText('1xOP17-039\n4xOP17-999\nfour of Nami\n4xOP17-040', lookup);
    expect(p.lines.map((l) => [l.line, l.status])).toEqual([
      [1, 'leader'],
      [2, 'unknownCard'],
      [3, 'syntax'],
      [4, 'ok'],
    ]);
    expect(p.lines[1]!.message).toBe('Unknown card ID OP17-999.');
    expect(p.main).toHaveLength(4);
  });
  it('a name that does not match the ID warns and uses the ID', () => {
    const p = parseDeckText(`4 Not ${nameOf('OP17-040')} OP17-040`, lookup);
    expect(p.lines[0]!.status).toBe('nameMismatch');
    expect(p.main).toEqual(Array(4).fill('OP17-040'));
    // Case, spaces and punctuation are not a mismatch.
    const name = nameOf('OP17-040').toUpperCase().replace(/\./g, '');
    expect(parseDeckText(`4 ${name} OP17-040`, lookup).lines[0]!.status).toBe('ok');
  });
  it('no Leader line leaves the Leader null; a second Leader is reported', () => {
    expect(parseDeckText('4xOP17-040', lookup).leader).toBeNull();
    const p = parseDeckText('1xOP17-039\n1xOP17-058', lookup);
    expect(p.leader).toBe('OP17-039');
    expect(p.lines[1]!.status).toBe('extraLeader');
  });
  it('a Leader listed with 4 copies goes in the main deck (the validator flags it)', () => {
    expect(parseDeckText('4xOP17-039', lookup)).toMatchObject({
      leader: null,
      main: Array(4).fill('OP17-039'),
    });
  });
  it('JSON: grouped or flat; bad JSON is a syntax line', () => {
    expect(
      parseDeckText(
        '{"leader":"OP17-039","main":["OP17-040",{"id":"OP08-051","count":2}]}',
        lookup,
      ),
    ).toMatchObject({ leader: 'OP17-039', main: ['OP17-040', 'OP08-051', 'OP08-051'] });
    expect(parseDeckText('{"leader":', lookup).lines[0]!.status).toBe('syntax');
  });
});

describe('exportDeckText', () => {
  const deck = { leader: 'OP17-039', main: ['OP17-040', 'OP17-040', 'OP08-051'] };
  it('writes each format with the Leader first', () => {
    expect(exportDeckText(deck, 'compact')).toBe('1xOP17-039\n2xOP17-040\n1xOP08-051');
    expect(exportDeckText(deck, 'count')).toBe('1 OP17-039\n2 OP17-040\n1 OP08-051');
    expect(exportDeckText(deck, 'limitless', nameOf).split('\n')[0]).toBe(
      `1 ${nameOf('OP17-039')} OP17-039`,
    );
  });
});
