/** OP15-074 Varie. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { counterStep, ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-074 Varie', () => {
  const start = (leader: string) =>
    game(
      {
        leader,
        hand: ['OP15-074'],
        characters: [V.c3],
        costArea: { active: 2, rested: 0 },
        donDeck: leader === ENEL ? 4 : 8,
      },
      { leader: PLAIN_BLUE },
    );

  it("[Main] DON!! -1: with an [Enel] Leader draws 1, then a Character gains +2 cost until the end of the opponent's next End Phase", () => {
    const g = start(ENEL);
    play(g, 'OP15-074');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    const c3 = g.find('p1', 'characters', V.c3);
    pick(g, [c3]);
    expect(g.card(c3).cost).toBe(5);
    g.act({ type: 'endTurn' }); // p1's End Phase: not the opponent's
    expect(g.card(c3).cost).toBe(5);
    g.act({ type: 'endTurn' }); // p2's End Phase
    expect(g.card(c3).cost).toBe(3);
  });

  it('may be declined: no DON!! returned, no draw', () => {
    const g = start(ENEL);
    play(g, 'OP15-074');
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('without an [Enel] Leader neither the draw nor the cost increase happens (the "Then" is inside the "if", CR 4-10-1)', () => {
    const g = start(PLAIN_PURPLE);
    play(g, 'OP15-074');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', V.c3)).cost).toBe(3);
  });

  it('[Counter]: up to 1 of your [Enel] cards gains +2000 power during this battle', () => {
    const g = counterStep({ leader: ENEL, hand: ['OP15-074'], characters: [V.c3], donDeck: 6 });
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP15-074'), ability: 'counter' });
    // Only the [Enel] Leader is offered, not the vanilla Character.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('[Counter] works on an [Enel] Character under a different Leader', () => {
    const g = counterStep({
      leader: PLAIN_PURPLE,
      hand: ['OP15-074'],
      characters: ['OP15-118', V.c3],
    });
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP15-074'), ability: 'counter' });
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', 'OP15-118')]);
    expect(g.power(g.find('p1', 'characters', 'OP15-118'))).toBe(10000 + 2000);
  });
});
