/** ST33-003 Smoker. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { canAccept, NAVY_LEADER, offers } from './helpers-stg2.ts';

const ID = 'ST33-003';
const start = (opp: string[], mine: string[] = [BLUE]) =>
  game(
    {
      leader: NAVY_LEADER,
      hand: [ID, ...mine],
      characters: [V.c1],
      costArea: { active: 2, rested: 0 },
    },
    { leader: 'ST03-001', characters: opp, deck: [PURPLE, PURPLE] },
  );

describe('ST33-003 Smoker', () => {
  it('trash 1: places 2 opposing Characters with cost 2 or less at the bottom of their owner deck, the owner choosing the order', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)]);
    expect(dec(g)?.kind).toBe('order');
    expect(dec(g)?.player).toBe('p2');
    // "first" ends up above the rest: V.c2 first puts V.c1 last.
    g.act({ type: 'order', first: g.find('p2', 'characters', V.c2) } as never);
    expect(g.zone('p2', 'characters')).toEqual([]);
    const deck = g.zone('p2', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(4);
    expect(deck.slice(0, 2)).toEqual([PURPLE, PURPLE]);
    expect(deck.slice(2)).toEqual([V.c2, V.c1]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('a Character with cost 3 is not a candidate (cost 2 is), and your own Characters are not', () => {
    const g = start([V.c2, V.c3]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(new Set(offers(g))).toEqual(new Set([g.find('p2', 'characters', V.c2)]));
  });

  it('"up to 2": one Character needs no order and may be chosen alone', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p2', 'characters', V.c2)]); // fewer than 2: the helper ends the pick
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1]);
    expect(g.zone('p2', 'deck').map((c) => c.card)).toEqual([PURPLE, PURPLE, V.c2]);
  });

  it('declining the cost leaves everything in place', () => {
    const g = start([V.c1]);
    play(g, ID);
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = start([V.c1], []);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });
});
