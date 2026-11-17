/** OP15-108 Nami: look at 3, add up to 1 {Sky Island} card, the rest to the bottom. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { GENBO, HOLLY, ids, KAL } from './helpers-kalgara.ts';

const position = () =>
  game(
    {
      leader: KAL,
      hand: ['OP15-108'],
      deck: [BLUE, HOLLY, GENBO, V.c1, V.c2],
      costArea: { active: 1, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

const settle = (g: ReturnType<typeof position>) => {
  while (g.legal().some((a) => a.type === 'order'))
    g.act(g.legal().find((a) => a.type === 'order')!);
};

describe('OP15-108 Nami', () => {
  it('[On Play] looks at exactly 3 cards: the 3rd {Sky Island} card is offered, the 4th is not', () => {
    const g = position();
    play(g, 'OP15-108');
    expectDecision(g, 'choose', 'p1');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2); // Holly and Genbo
    pick(g, [g.find('p1', 'deck', GENBO)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([GENBO]);
    const deck = ids(g.zone('p1', 'deck'));
    expect(deck.slice(0, 2)).toEqual([V.c1, V.c2]);
    expect(deck.slice(2).sort()).toEqual([BLUE, HOLLY].sort());
  });

  it('may add nothing', () => {
    const g = position();
    play(g, 'OP15-108');
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });
});
