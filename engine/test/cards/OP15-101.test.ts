/** OP15-101 Kalgara: trash 1: look at 5, add up to a total of 2 [Mont Blanc Noland] / {Shandian Warrior} cards. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { GENBO, HOLLY, ids, KAL, NOLAND, SETO } from './helpers-kalgara.ts';

const position = (hand: string[] = ['OP15-101', BLUE]) =>
  game(
    {
      leader: KAL,
      hand,
      deck: [GENBO, HOLLY, NOLAND, SETO, V.c1, V.c2, V.c3],
      costArea: { active: 3, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

const settle = (g: ReturnType<typeof position>) => {
  while (g.legal().some((a) => a.type === 'order'))
    g.act(g.legal().find((a) => a.type === 'order')!);
};

describe('OP15-101 Kalgara', () => {
  it('[On Play] pays by trashing 1 card, then adds up to a total of 2 matching cards', () => {
    const g = position();
    play(g, 'OP15-101');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(ids(g.zone('p1', 'trash'))).toEqual([BLUE]);
    expectDecision(g, 'choose', 'p1');
    // Genbo, [Mont Blanc Noland] and Seto qualify (Holly does not); at most 2 in total.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'deck', GENBO), g.find('p1', 'deck', NOLAND)]);
    settle(g);
    expect(hand(g, 'p1').sort()).toEqual([GENBO, NOLAND].sort());
    // Seto and Holly (looked at, not taken) went to the bottom; the unseen cards stay on top.
    const deck = ids(g.zone('p1', 'deck'));
    expect(deck.slice(0, 2)).toEqual([V.c2, V.c3]);
    expect(deck.slice(2).sort()).toEqual([HOLLY, SETO, V.c1].sort());
  });

  it('does not offer a 3rd card once 2 are chosen ("a total of 2")', () => {
    const g = position();
    play(g, 'OP15-101');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p1', 'deck', GENBO), g.find('p1', 'deck', SETO)]);
    settle(g);
    expect(hand(g, 'p1').sort()).toEqual([GENBO, SETO].sort());
  });

  it('may add fewer (up to)', () => {
    const g = position();
    play(g, 'OP15-101');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(7 - 0);
  });

  it('the trash is a "you may" cost: declining skips the whole look', () => {
    const g = position();
    play(g, 'OP15-101');
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
    expect(g.zone('p1', 'trash')).toEqual([]);
  });

  it('cannot be paid with an empty hand (nothing is offered)', () => {
    const g = position(['OP15-101']);
    play(g, 'OP15-101');
    if (g.legal().some((a) => a.type === 'optional'))
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });
});
