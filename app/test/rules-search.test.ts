/**
 * M9 WP5: the rules search (a hand-written token index) and the ways into an entry: rule numbers,
 * glossary links, and a CR number that no entry cites by itself.
 */
import { describe, expect, it } from 'vitest';
import { linkTerms, resolveRule } from '../src/rules/index.ts';
import { numberQuery, search, tokens } from '../src/rules/search.ts';
import { openPath, statusLine } from '../src/rules/RulesRoute.tsx';
import { rulesData } from './rules-support.ts';

const data = rulesData();
const ids = (q: string) => search(data.index, q).map((h) => h.entry.id);

/** [query, ids that must be among the results, id that must come first (or null)] */
const TABLE: [string, string[], string | null][] = [
  ['7-1-4-1', ['item/94', 'item/95', 'RL-19'], 'item/94'],
  ['CR 7-1-4-1', ['item/94'], 'item/94'],
  ['cr 7-1-4', ['item/94'], null],
  ['7-1-4', ['item/94', 'item/95'], null],
  ['8.6.3', ['item/129'], null],
  ['RL-18', ['RL-18'], 'RL-18'],
  ['rl 18', ['RL-18'], 'RL-18'],
  ['rl1', ['RL-01'], 'RL-01'],
  ['item 17', ['item/17'], 'item/17'],
  ['item/94', ['item/94'], 'item/94'],
  ['tie', ['item/94'], 'item/94'],
  ['ties', ['item/94'], 'item/94'],
  ['blocker', ['RL-18', 'RL-19', 'item/91'], null],
  ['leader blocker', ['RL-19'], 'RL-19'],
  ['counter step', ['item/93'], null],
  ['double attack', ['item/95', 'RL-20'], null],
  ['banish', ['item/96', 'RL-21'], 'item/96'],
  ['trigger', ['item/101'], null],
  ['rush', ['item/98'], 'item/98'],
  ['deck out', ['RL-26'], 'RL-26'],
  ['mulligan', ['RL-29'], 'RL-29'],
  ['stage', ['RL-07', 'item/79'], null],
  ['character limit', ['item/78'], 'item/78'],
  ['first turn', ['RL-28', 'item/71'], null],
  ['once per turn', ['item/126'], 'item/126'],
  ['refresh', ['item/67'], null],
  ['negative power', ['item/17'], 'item/17'],
  ['concede', ['item/6'], 'item/6'],
  ['K.O.', ['item/109'], null],
  ['up to', ['item/15', 'item/124'], null],
];

describe('search', () => {
  it.each(TABLE)('%s', (q, has, first) => {
    const got = ids(q);
    for (const id of has) expect(got, `${q} should find ${id}`).toContain(id);
    if (first) expect(got[0], q).toBe(first);
  });

  it('is a table of at least 30 queries', () => {
    expect(TABLE.length).toBeGreaterThanOrEqual(30);
  });

  it('a misspelling returns nothing, and the status says so', () => {
    for (const q of ['blokcer', 'xyzzy', '9-9-9', 'rl 99']) expect(ids(q), q).toEqual([]);
    const said = statusLine('blokcer', 0, 0, data.entries.length);
    expect(said).toContain('No rules match “blokcer”');
    expect(said).toContain('rule number');
  });

  it('says how many it found, and how many it lists', () => {
    expect(statusLine('', 0, 0, 186)).toMatch(/^186 rules\./);
    expect(statusLine('tie', 1, 1, 186)).toBe('1 result for “tie”.');
    expect(statusLine('life', 90, 40, 186)).toBe('90 results for “life”, the first 40 listed.');
  });

  it('puts a title match above a body match (title ×3)', () => {
    const hits = search(data.index, 'banish');
    expect(hits[0]!.entry.title.toLowerCase()).toContain('banish');
    expect(hits[0]!.score).toBeGreaterThan(hits.at(-1)!.score);
  });

  it('matches by prefix and needs every word', () => {
    expect(ids('doub att')).toContain('item/95');
    expect(ids('banish xyzzy')).toEqual([]);
  });

  it('an exact rule number comes before a prefix match', () => {
    const hits = search(data.index, '7-1-4');
    const exact = hits.filter((h) => h.entry.cr.includes('7-1-4'));
    const prefix = hits.filter((h) => !h.entry.cr.includes('7-1-4'));
    expect(prefix.length).toBeGreaterThan(0);
    expect(hits.indexOf(prefix[0]!)).toBeGreaterThanOrEqual(exact.length);
  });

  it('reads numbers and tokens', () => {
    expect(numberQuery('CR 7-1-4-1')).toEqual({ cr: '7-1-4-1' });
    expect(numberQuery('RL-7')).toEqual({ id: 'RL-07' });
    expect(numberQuery('item 5')).toEqual({ id: 'item/5' });
    expect(numberQuery('tie')).toBeNull();
    expect(numberQuery('7')).toBeNull();
    expect(tokens('[Blocker] K.O.’d')).toEqual(['blocker', 'ko', 'd']);
  });

  it('Enter on a CR number opens its page; on a ruling, the ruling', () => {
    const cr = search(data.index, '7-1-4-1')[0]!.entry;
    expect(openPath('7-1-4-1', cr)).toBe('/rules/cr/7-1-4-1');
    const rl = search(data.index, 'RL-18')[0]!.entry;
    expect(openPath('RL-18', rl)).toBe('/rules/RL-18');
    expect(openPath('tie', cr)).toBe('/rules/item/94');
  });
});

describe('resolving a rule id', () => {
  it('finds an entry by its id', () => {
    expect(resolveRule(data, 'RL-18')).toMatchObject({ kind: 'entry' });
    expect(resolveRule(data, 'item/17')).toMatchObject({ kind: 'entry' });
    expect(resolveRule(data, 'rl-18')).toMatchObject({ kind: 'entry' });
  });
  it('a CR number lists the entries that cite it', () => {
    const r = resolveRule(data, 'cr/7-1-4-1');
    expect(r).toMatchObject({ kind: 'cr', via: 'exact', matched: '7-1-4-1' });
    if (r?.kind === 'cr') expect(r.entries.map((e) => e.id)).toContain('item/94');
  });
  it('a number nobody cites falls back to the rule around it, or to what is inside it', () => {
    const deeper = resolveRule(data, 'cr/7-1-4-1-1-1-1');
    expect(deeper).toMatchObject({ kind: 'cr', via: 'parent', matched: '7-1-4-1-1-1' });
    const inside = resolveRule(data, 'cr/7-1');
    expect(inside?.kind).toBe('cr');
  });
  it('an unknown id is not found', () => {
    expect(resolveRule(data, 'cr/9-9-9')).toBeNull();
    expect(resolveRule(data, 'RL-99')).toBeNull();
    expect(resolveRule(data, 'nonsense')).toBeNull();
  });
});

describe('glossary links', () => {
  it('links the first mention of a term, at most four, and keeps the words', () => {
    const text = 'The [Blocker] rests and the Counter Step follows; a Leader may be the target.';
    const pieces = linkTerms(text, data.glossary);
    expect(pieces.map((p) => (typeof p === 'string' ? p : p.text)).join('')).toBe(text);
    const linked = pieces.filter((p) => typeof p !== 'string');
    expect(linked.length).toBeGreaterThan(0);
    expect(linked.length).toBeLessThanOrEqual(4);
    expect(linked.map((p) => (p as { text: string }).text)).toContain('[Blocker]');
  });
  it('never links a word that is too common, or a term inside another', () => {
    const pieces = linkTerms('Your hand and your deck have cost and power.', data.glossary);
    expect(pieces).toEqual(['Your hand and your deck have cost and power.']);
  });
});
