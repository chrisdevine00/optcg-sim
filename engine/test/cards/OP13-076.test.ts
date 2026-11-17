/** OP13-076 Divine Departure. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { counterStep, ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP13-076 Divine Departure', () => {
  const start = (given: number, costArea = { active: 6, rested: 0 }) =>
    game(
      {
        leader: { card: ENEL, don: given },
        hand: ['OP13-076'],
        costArea,
        donDeck: 6 - costArea.active - costArea.rested - given,
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );

  it("[Main] You may rest 5 DON!!: with any DON!! given, gives up to 1 of the opponent's Characters -8000 power", () => {
    const g = start(1, { active: 5, rested: 0 });
    play(g, 'OP13-076');
    accept(g);
    payDon(g);
    expect(don(g, 'p1').rested).toBe(5);
    const c7 = g.find('p2', 'characters', V.c7);
    pick(g, [c7]);
    expect(g.power(c7)).toBe(9000 - 8000);
  });

  it('with no DON!! given the cost is still paid but the power is not reduced', () => {
    const g = start(0);
    play(g, 'OP13-076');
    accept(g);
    payDon(g);
    expect(don(g, 'p1').rested).toBe(5);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    expectDecision(g, 'main', 'p1');
  });

  it('the cost may be declined: nothing is rested', () => {
    const g = start(1, { active: 5, rested: 0 });
    play(g, 'OP13-076');
    decline(g);
    expect(don(g, 'p1').active).toBe(5);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('with fewer than 5 active DON!! the cost cannot be paid', () => {
    const g = start(1, { active: 4, rested: 0 });
    play(g, 'OP13-076');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  const counter = (handCards: string[]) => {
    const g = counterStep({ leader: ENEL, hand: ['OP13-076', ...handCards], donDeck: 6 });
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP13-076'), ability: 'counter' });
    return g;
  };

  it('[Counter] You may trash 1 card from your hand: +3000 power during this battle', () => {
    const g = counter([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(trash(g, 'p1')).toContain(BLUE);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('[Counter] may be declined: no trash, no power', () => {
    const g = counter([BLUE]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] cannot be used with no other card in hand', () => {
    const g = counter([]);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
