/**
 * OP09-095 Laffitte (Character, Black, cost 1, 1000, Counter +1000, {Blackbeard Pirates}, Strike).
 *
 * Card text: "[Activate: Main] You may rest 1 of your DON!! cards and this Character: Look at 5 cards
 * from the top of your deck; reveal up to 1 "Blackbeard Pirates" type card and add it to your hand.
 * Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: the cost is resting 1 active DON!! and this Character. A quoted `"text"` type matches any
 * type containing the text (CR 2-4-3-1: "Blackbeard Pirates" also matches {Blackbeard Pirates
 * Allies}); the type filter applies to every card category. The deck is hidden, so the pick is asked
 * even when nothing in the top 5 qualifies (max 0). The revealed card is public (CR 11-2-1).
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  act,
  actRaw,
  askedEmpty,
  atMain,
  chr,
  decision,
  deck,
  don,
  donChoices,
  hand,
  kind,
  LD9,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC9,
  settleOrders,
  tail,
  minus,
} from './kit-op09c.ts';

const LAF = 'OP09-095';
const BBP = {
  /** OP09-091 Vasco Shot: Black Character, {Blackbeard Pirates}. */
  vasco: 'OP09-091',
  /** OP09-088 Shiryu: Black Character, {Blackbeard Pirates}. */
  shiryu: 'OP09-088',
  /** OP09-096 My Era...Begins!!: Black Event, {Blackbeard Pirates}. */
  event: 'OP09-096',
  /** OP09-099 Fullalead: Black Stage, {Blackbeard Pirates}. */
  stage: 'OP09-099',
  /** OP09-094 Peachbeard: Black Character, {Peachbeard Pirates}/{Blackbeard Pirates Allies}. */
  allies: 'OP09-094',
} as const;
const MISS = SC9.c2;
const BELOW = [BBP.vasco, ...Array.from({ length: 8 }, () => SC9.mohji)];

function start(top: string[], o: { active?: number; rested?: number; leader?: string } = {}) {
  const active = o.active ?? 9;
  const g = mine(
    o.leader ?? LD9.bbp,
    {
      characters: [LAF],
      deck: [...top, ...BELOW],
      costArea: { active, rested: o.rested ?? 0 },
    },
    {},
  );
  actRaw(g, chr(g, 'p1', LAF));
  // The cost may ask which DON!! to rest (when active and rested DON!! both exist).
  for (let i = 0; i < 3 && kind(g) === 'choose' && decision(g)?.purpose === 'cost'; i++) {
    const pay = donChoices(g).find((c) => c.from === 'costActive');
    if (!pay) break;
    act(g, { type: 'pick', choice: pay });
  }
  return g;
}

const pad = (k: number) => Array.from({ length: k }, () => MISS);

function finish(g: ReturnType<typeof start>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('OP09-095 Laffitte: [Activate: Main] rest 1 DON!! + this: look at 5, add up to 1 {Blackbeard Pirates}, rest to the bottom', () => {
  it('printed values: cost 1, 1000, Counter +1000', () => {
    const g = mine(LD9.bbp, { characters: [LAF] }, {});
    const c = g.card(chr(g, 'p1', LAF));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(1000);
    expect(c.counter).toBe(1000);
  });

  it('paying rests exactly 1 DON!! and Laffitte', () => {
    const g = start([BBP.shiryu, MISS, MISS, MISS, MISS]);
    expect(g.card(chr(g, 'p1', LAF)).rested).toBe(true);
    expect(don(g)).toMatchObject({ active: 8, rested: 1 });
  });

  it('offers exactly the {Blackbeard Pirates} cards of the top 5, of any category (Character, Event, Stage)', () => {
    const g = start([BBP.shiryu, MISS, BBP.event, BBP.stage, SC9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BBP.event, BBP.shiryu, BBP.stage].sort());
  });

  it('the picked card goes to my hand; the other 4 go to the bottom of my deck', () => {
    const top = [BBP.shiryu, MISS, BBP.event, SC9.c3, SC9.c4];
    const g = start(top);
    pickCards(g, [BBP.event]);
    finish(g);
    expect(hand(g)).toEqual([BBP.event]);
    expect(deck(g)).toHaveLength(5 + BELOW.length - 1 + 0);
    expect(deck(g)[0]).toBe(BBP.vasco); // the first card below the looked-at five
    expect(tail(deck(g), 4)).toEqual(minus(top, [BBP.event]).sort());
  });

  it('"up to 1": adding nothing is allowed; all 5 cards go to the bottom', () => {
    const top = [BBP.shiryu, MISS, BBP.event, SC9.c3, SC9.c4];
    const g = start(top);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5 + BELOW.length);
    expect(deck(g)[0]).toBe(BBP.vasco);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const g = start([BBP.shiryu, MISS, BBP.event, BBP.stage, MISS]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(BBP.shiryu)).toBe(true);
    expect(sets.has(BBP.stage)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a {Blackbeard Pirates} card in 6th position is not offered', () => {
    const g = start([MISS, MISS, MISS, MISS, MISS]);
    // The deck is hidden: the pick is asked even though nothing qualifies (max 0).
    askedEmpty(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BBP.vasco);
    expect(tail(deck(g), 5)).toEqual(pad(5));
  });

  // DISAGREEMENTS-c.md C-1: the card text quotes the type, and CR 2-4-3-1 reads a quoted type as a
  // substring match. The script appears to match the exact type only.
  it.fails(
    '"type including": a {Blackbeard Pirates Allies} card (Peachbeard) qualifies for the quoted type',
    () => {
      const g = start([BBP.allies, MISS, MISS, MISS, MISS]);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([BBP.allies]);
    },
  );

  it('a card of another type (cost 1 Character without the type) is not offered', () => {
    const g = start([SC9.c1, SC9.tb1, SC9.gordon, MISS, MISS]);
    askedEmpty(g);
    finish(g);
    expect(hand(g)).toEqual([]);
  });

  it('the chosen card is revealed; the others are not', () => {
    const g = start([BBP.shiryu, MISS, BBP.event, SC9.c3, SC9.c4]);
    pickCards(g, [BBP.shiryu]);
    finish(g);
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === BBP.shiryu)).toBe(true);
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === MISS)).toBe(false);
  });

  it('there is no Leader condition: a Leader without {Blackbeard Pirates} works the same', () => {
    const g = start([BBP.shiryu, MISS, MISS, MISS, MISS], { leader: LD9.luffy });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BBP.shiryu]);
  });

  it('the ability needs an active DON!!: with all DON!! rested it is not offered', () => {
    const g = mine(LD9.bbp, { characters: [LAF], costArea: { active: 0, rested: 5 } }, {});
    expect(abil(g, chr(g, 'p1', LAF))).toEqual([]);
  });

  it('a rested Laffitte cannot pay the rest cost: not offered', () => {
    const g = mine(LD9.bbp, { characters: [{ card: LAF, rested: true }] }, {});
    expect(abil(g, chr(g, 'p1', LAF))).toEqual([]);
  });

  it('works with exactly one active DON!!, which is rested as the cost', () => {
    const g = start([BBP.shiryu, MISS, MISS, MISS, MISS], { active: 1, rested: 3 });
    need(g, 'choose', 'p1');
    expect(don(g)).toMatchObject({ active: 0, rested: 4 });
  });

  it('once per rest: not offered again in the same turn', () => {
    const g = start([BBP.shiryu, MISS, MISS, MISS, MISS]);
    pickCards(g, [BBP.shiryu]);
    finish(g);
    expect(abil(g, chr(g, 'p1', LAF))).toEqual([]);
  });
});
