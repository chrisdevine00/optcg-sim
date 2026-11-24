/** EB05-027 Hibari. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { cardsOf, donArea } from './helpers-luffyace.ts';

const HIBARI = 'EB05-027';
const start = (p1Chars: string[] = [], p2Chars: string[] = []) =>
  game(
    {
      leader: PLAIN_BLUE,
      hand: [HIBARI, V.c3],
      characters: p1Chars,
      deck: [BLUE, PURPLE, BLUE, PURPLE],
      ...donArea(5),
    },
    { leader: PLAIN_BLUE, characters: p2Chars },
  );

describe('EB05-027 Hibari', () => {
  it("[On Play] draws 3, trashes 2, then puts an opposing cost-2-or-less Character at the bottom of its owner's deck", () => {
    const g = start([], [V.c2, V.c3]);
    play(g, HIBARI);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(4); // V.c3 + 3 drawn
    pick(g, [
      g.find('p1', 'hand', V.c3),
      g.zone('p1', 'hand').find((c) => c.card !== V.c3)!.instance,
    ]);
    expect(trash(g, 'p1')).toHaveLength(2);
    // Only the cost-2 Character is a candidate.
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(V.c2);
  });

  it('may also target your own Character (cost 2 or less): it goes to the bottom of your deck', () => {
    const g = start([V.c1], []);
    play(g, HIBARI);
    pick(
      g,
      g
        .zone('p1', 'hand')
        .slice(0, 2)
        .map((c) => c.instance),
    );
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(cardsOf(g, 'p1', 'deck').at(-1)).toBe(V.c1);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([HIBARI]);
  });

  it('"up to 1": the Character may be left alone', () => {
    const g = start([], [V.c2]);
    play(g, HIBARI);
    pick(
      g,
      g
        .zone('p1', 'hand')
        .slice(0, 2)
        .map((c) => c.instance),
    );
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it('a Character with cost 3 or more is never offered', () => {
    const g = start([], [V.c3, V.c4]);
    play(g, HIBARI);
    pick(
      g,
      g
        .zone('p1', 'hand')
        .slice(0, 2)
        .map((c) => c.instance),
    );
    // No candidate: the effect ends without a target decision.
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });
});
