/** OP17-059 Aramaki. */
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
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { ROSI } from './helpers-hancock-rosi.ts';

describe('OP17-059 Aramaki', () => {
  const start = (opp: string[]) => {
    const g = game(
      {
        leader: ROSI,
        hand: ['OP17-059'],
        deck: [BLUE, BLUE],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: opp },
    );
    play(g, 'OP17-059');
    return g;
  };

  it('has [Blocker]', () => {
    const g = start([]);
    decline(g);
    expect(g.card(g.find('p1', 'characters', 'OP17-059')).keywords).toContain('Blocker');
  });

  it('[On Play] DON!! −1: draws 1 and K.O.s up to 2 Characters with a cost of 2 or less', () => {
    const g = start([V.c1, V.c2, V.c3]);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(4);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    // Only the cost 1 and cost 2 Characters are candidates.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(g.zone('p2', 'trash')).toHaveLength(2);
  });

  it('the DON!! −1 may be declined: nothing is drawn or K.O.d', () => {
    const g = start([V.c1]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(don(g, 'p1').deck).toBe(3);
  });

  it('with no target the draw still happens', () => {
    const g = start([V.c4]);
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
