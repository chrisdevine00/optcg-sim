/** OP12-056 Monkey.D.Garp. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { BN, ids, mine, NAVY_PURPLE, offered } from './helpers-op12g2.ts';

const ID = 'OP12-056';

// In hand with Garp: a cost-trash fodder card, then candidates and non-candidates.
const HAND = [ID, ID, V.c1, BN.c4, BN.c6, BN.c7, BN.c8big, NAVY_PURPLE];

describe('OP12-056 Monkey.D.Garp', () => {
  const onPlay = (handCards: string[] = HAND) => {
    const g = mine({ hand: handCards, costArea: { active: 8, rested: 0 } });
    play(g, ID);
    return g;
  };

  it('trash 1 card, then play a blue {Navy} Character with 8000 power or less from your hand', () => {
    const g = onPlay();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BN.c6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, BN.c6]);
    expect(g.card(g.find('p1', 'characters', BN.c6)).rested).toBe(false);
    expect(hand(g, 'p1')).not.toContain(BN.c6);
  });

  it('candidates: 8000 power is the limit; not 10000, not non-blue, not non-Navy, not another [Monkey.D.Garp]', () => {
    const g = onPlay();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const cands = offered(g);
    expect(cands).toContain(g.find('p1', 'hand', BN.c4));
    expect(cands).toContain(g.find('p1', 'hand', BN.c6)); // 8000
    expect(cands).toContain(g.find('p1', 'hand', BN.c7)); // 8000
    expect(cands).not.toContain(g.find('p1', 'hand', BN.c8big)); // 10000
    expect(cands).not.toContain(g.find('p1', 'hand', NAVY_PURPLE));
    expect(cands).not.toContain(g.find('p1', 'hand', ID)); // the other Garp (name excluded)
    expect(cands).toHaveLength(3);
  });

  it('the card trashed as the cost cannot also be the card played', () => {
    const g = onPlay([ID, BN.c4, BN.c6]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BN.c6)]);
    expect(offered(g)).toEqual([g.find('p1', 'hand', BN.c4)]);
    pick(g, [g.find('p1', 'hand', BN.c4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, BN.c4]);
    expect(trash(g, 'p1')).toEqual([BN.c6]);
  });

  it('"up to 1": the cost is paid and nothing may be played', () => {
    const g = onPlay();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('declining the cost trashes and plays nothing', () => {
    const g = onPlay();
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });
});
