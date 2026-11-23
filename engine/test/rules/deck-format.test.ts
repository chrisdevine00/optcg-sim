/**
 * Deck construction with the format (M6; CR 5-1-2, rulings RL-37, `cards/format/standard.json`).
 * `deckIssues` is the one source for the builder, Setup and game start (flows F17 step 7).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { DefTable } from '../../src/defs.ts';
import {
  deckErrors,
  deckIssues,
  validateDeck,
  type CardLookup,
  type DeckFormat,
} from '../../src/index.ts';
import { cards } from '../fixtures/index.ts';

const all = cards();
const times = (n: number, id: string) => Array.from({ length: n }, () => id);
const codes = (
  deck: { leader: string; main: string[] },
  lookup: CardLookup = all,
  f: DeckFormat = 'standard',
) => deckIssues(deck, lookup, f).map((i) => i.code);

interface MetaFile {
  archetypes: { id: string; lists: { leader: string; main: { id: string; count: number }[] }[] }[];
}
const meta = JSON.parse(
  readFileSync(new URL('../../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
) as MetaFile;
const lists = meta.archetypes.flatMap((a) =>
  a.lists.map((l, i) => ({
    name: `${a.id} #${i + 1}`,
    deck: { leader: l.leader, main: l.main.flatMap((c) => times(c.count, c.id)) },
  })),
);

/** A legal 50-card Red deck around Leader OP01-001 (Zoro), from Standard-legal Red Characters. */
const RED_LEADER = 'OP01-001';
function redDeck(): string[] {
  const ids: string[] = [];
  const pool = [...allCards()].filter(
    (c) =>
      c.category === 'Character' &&
      c.colors.length === 1 &&
      c.colors[0] === 'Red' &&
      c.legality.standard.status === 'legal' &&
      !c.legality.standard.bannedWith,
  );
  for (const c of pool.slice(0, 13)) ids.push(...times(4, c.id));
  return ids.slice(0, 50);
}
function allCards(): Card[] {
  const out: Card[] = [];
  const dir = new URL('../../../cards/data/sets/', import.meta.url);
  for (const set of ['OP-14.json', 'OP-15.json', 'OP-16.json', 'OP-17.json']) {
    const f = JSON.parse(readFileSync(new URL(set, dir), 'utf8')) as { cards: Card[] };
    out.push(...f.cards);
  }
  return out;
}
const legalRedLeader = () => {
  const l = allCards().find(
    (c) =>
      c.category === 'Leader' &&
      c.colors.join() === 'Red' &&
      c.legality.standard.status === 'legal',
  )!;
  return l.id;
};

describe('deckIssues: every meta list (36 at M6; meta:update may change the count)', () => {
  it('every archetype has 1 to 3 sourced lists', () => {
    for (const a of meta.archetypes) expect(a.lists.length, a.id).toBeGreaterThanOrEqual(1);
    for (const a of meta.archetypes) expect(a.lists.length, a.id).toBeLessThanOrEqual(3);
  });
  for (const l of lists)
    it(`${l.name} is Standard-legal with no issue`, () => {
      expect(deckIssues(l.deck, all, 'standard')).toEqual([]);
    });
});

describe('deckIssues: CR 5-1-2', () => {
  const leader = legalRedLeader();
  const main = redDeck();
  it('a legal deck has no issue', () => {
    expect(main).toHaveLength(50);
    expect(deckIssues({ leader, main }, all)).toEqual([]);
  });
  it('size: 49 and 51 cards, with the fix in the message', () => {
    const short = deckIssues({ leader, main: main.slice(1) }, all);
    expect(short.map((i) => i.code)).toEqual(['size']);
    expect(short[0]!.message).toMatch(/49 cards.*add 1/);
    const long = deckIssues({ leader, main: [...main.slice(0, 49), main[0]!, main[48]!] }, all);
    expect(long.find((i) => i.code === 'size')!.message).toMatch(/51 cards.*remove 1/);
  });
  it('copies: 5 of one card number is CR 5-1-2-3 and names the card', () => {
    const d = [...main.slice(0, 45), ...times(5, main[0]!)];
    const i = deckIssues({ leader, main: d }, all).find((x) => x.code === 'copies')!;
    expect(i).toMatchObject({ rule: 'CR 5-1-2-3', cards: [main[0]], severity: 'error' });
  });
  it('colour: a Blue card under a Red Leader is CR 5-1-2-2', () => {
    const blue = allCards().find(
      (c) =>
        c.category === 'Character' &&
        c.colors.join() === 'Blue' &&
        c.legality.standard.status === 'legal',
    )!;
    const i = deckIssues({ leader, main: [...main.slice(0, 49), blue.id] }, all).find(
      (x) => x.code === 'color',
    )!;
    expect(i).toMatchObject({ rule: 'CR 5-1-2-2', cards: [blue.id] });
  });
  it('a Leader in the deck is CR 5-1-2-1; a non-Leader as Leader is rejected', () => {
    expect(codes({ leader, main: [...main.slice(0, 49), leader] })).toContain('leaderInDeck');
    expect(codes({ leader: main[0]!, main })).toContain('notLeader');
  });
  it('unknown cards: an unknown Leader stops the check; an unknown card is reported', () => {
    expect(codes({ leader: 'OP99-001', main })).toEqual(['unknownLeader']);
    expect(codes({ leader, main: [...main.slice(0, 49), 'OP17-999'] })).toEqual(['unknownCard']);
  });
  it('validateDeck (createGame) reports exactly the CR issues, with their rule', () => {
    const d = { leader, main: [...main.slice(0, 44), ...times(5, main[0]!), 'OP03-002'] };
    const free = deckIssues(d, all, 'free');
    expect(validateDeck(d, new DefTable(all))).toEqual(free.map((i) => `${i.message} (${i.rule})`));
    expect(free.map((i) => i.code)).toEqual(['copies']); // OP03-002 is rotated, not a CR issue
  });
});

describe('deckIssues: Standard (cards/format/standard.json)', () => {
  const leader = legalRedLeader();
  const main = redDeck();
  const swap = (id: string) => [...main.slice(0, 49), id];
  it('a banned card (OP14-020 Dracule Mihawk) is an error in Standard and Extra', () => {
    const l = allCards().find((c) => c.id === 'OP14-020')!;
    const greenLeader = allCards().find(
      (c) => c.category === 'Leader' && l.colors.every((x) => c.colors.includes(x)),
    )!;
    const d = { leader: greenLeader.id, main: [...times(4, 'OP14-020'), ...main.slice(0, 46)] };
    for (const f of ['standard', 'extra'] as const) {
      const i = deckIssues(d, all, f).find((x) => x.code === 'banned')!;
      expect(i.cards).toEqual(['OP14-020']);
      expect(i.message).toMatch(/banned/);
    }
    expect(codes(d, all, 'free')).not.toContain('banned');
  });
  it('a rotated card (OP03-002, block 1) is an error in Standard only', () => {
    expect(codes({ leader, main: swap('OP03-002') })).toEqual(['rotated']);
    expect(deckErrors({ leader, main: swap('OP03-002') }, all, 'extra')).toEqual([]);
  });
  it('a card whose block no source gives (EB05-001) is a warning, not an error', () => {
    const i = deckIssues({ leader: 'EB05-001', main }, all);
    const w = i.filter((x) => x.code === 'legalityUnknown');
    expect(w.map((x) => x.severity)).toEqual(['warning']);
    expect(deckErrors({ leader: 'EB05-001', main }, all).map((x) => x.code)).not.toContain(
      'legalityUnknown',
    );
  });
  it('a banned pair (OP07-115 with EB04-058) is one error naming both; either alone is fine', () => {
    const a = all('OP07-115')!;
    const b = all('EB04-058')!;
    const yLeader = allCards().find(
      (c) =>
        c.category === 'Leader' &&
        [...a.colors, ...b.colors].every((x) => c.colors.includes(x)) &&
        c.legality.standard.status === 'legal',
    )!;
    const filler = allCards()
      .filter(
        (c) =>
          c.category === 'Character' &&
          c.colors.every((x) => yLeader.colors.includes(x)) &&
          c.legality.standard.status === 'legal' &&
          !c.legality.standard.bannedWith,
      )
      .slice(0, 12)
      .flatMap((c) => times(4, c.id));
    const both = { leader: yLeader.id, main: ['OP07-115', 'EB04-058', ...filler.slice(0, 48)] };
    const pairs = deckIssues(both, all).filter((x) => x.code === 'bannedPair');
    expect(pairs).toHaveLength(1);
    expect(new Set(pairs[0]!.cards)).toEqual(new Set(['OP07-115', 'EB04-058']));
    const one = { leader: yLeader.id, main: ['OP07-115', ...filler.slice(0, 49)] };
    expect(codes(one).filter((c) => c !== 'rotated')).not.toContain('bannedPair');
  });
  it('a restricted card over its limit is an error; at its limit it is fine', () => {
    const id = main[0]!;
    const card = all(id)!;
    const restricted: CardLookup = (x) =>
      x === id
        ? { ...card, legality: { ...card.legality, standard: { status: 'restricted', limit: 1 } } }
        : all(x);
    expect(codes({ leader, main }, restricted)).toEqual(['restricted']);
    const atLimit = [id, ...main.filter((x) => x !== id)];
    expect(codes({ leader, main: atLimit }, restricted)).toEqual(['size']);
  });
  it('the Leader itself is checked (a rotated Leader)', () => {
    expect(all(RED_LEADER)!.legality.standard.status).toBe('rotated');
    expect(codes({ leader: RED_LEADER, main })).toEqual(['rotated']);
  });
});
