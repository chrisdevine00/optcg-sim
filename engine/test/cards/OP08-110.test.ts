/** OP08-110 Wyper: look at 5 for [Upper Yard], add it, then play up to 1 [Upper Yard] from hand. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { HOLLY, KAL, UPPER_YARD } from './helpers-kalgara.ts';

const position = (extra: Partial<Parameters<typeof game>[0]> = {}) =>
  game(
    {
      leader: KAL,
      hand: ['OP08-110'],
      deck: [BLUE, UPPER_YARD, HOLLY, V.c1, V.c2, V.c3],
      costArea: { active: 4, rested: 0 },
      ...extra,
    },
    { leader: PLAIN_BLUE },
  );

const settle = (g: ReturnType<typeof position>) => {
  while (g.legal().some((a) => a.type === 'order'))
    g.act(g.legal().find((a) => a.type === 'order')!);
};

describe('OP08-110 Wyper', () => {
  it('[On Play] adds [Upper Yard] from the top 5, then plays it from the hand', () => {
    const g = position();
    play(g, 'OP08-110');
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1); // only [Upper Yard]
    pick(g, [g.find('p1', 'deck', UPPER_YARD)]);
    settle(g);
    // The look is over before the play; the play offers the card just added.
    if (dec1(g) === 'choose') pick(g, [g.find('p1', 'hand', UPPER_YARD)]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([UPPER_YARD]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('plays an [Upper Yard] already in hand even when none is found in the deck', () => {
    const g = position({ hand: ['OP08-110', UPPER_YARD], deck: [BLUE, HOLLY, V.c1, V.c2, V.c3] });
    play(g, 'OP08-110');
    none(g); // nothing to add (no [Upper Yard] in the top 5)
    settle(g);
    if (dec1(g) === 'choose') pick(g, [g.find('p1', 'hand', UPPER_YARD)]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([UPPER_YARD]);
  });

  it('with no [Upper Yard] anywhere nothing is played', () => {
    const g = position({ deck: [BLUE, HOLLY, V.c1, V.c2, V.c3, V.c4] });
    play(g, 'OP08-110');
    none(g);
    settle(g);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP08-110']);
  });
});

function dec1(g: ReturnType<typeof position>): string | undefined {
  return g.legal().some((a) => a.type === 'pick') ? 'choose' : undefined;
}
