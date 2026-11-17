/**
 * P-093 Trafalgar Law (Character, Purple, cost 4, 6000; Heart Pirates).
 *
 * Card text:
 *   "[Blocker]
 *    [On Play] If the number of DON!! cards on your field is equal to or less than the number on your
 *    opponent's field, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: DON!! on the field = cost area (active and rested) plus given DON!! (RL-24); paying the cost
 * rests DON!! that stay on the field; the added DON!! is RESTED (unlike OP12-073's active one); CR
 * 4-10-1 false "if"; CR 10-1-4 [Blocker].
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  attack,
  blockers,
  BLUE,
  donOf,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  side,
  theirTurn,
} from './kit-d.ts';

const LAW = 'P-093';

function game(p1Don: number, p2Don: number, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, { hand: [LAW], costArea: { active: p1Don, rested: 0 } }),
    side(LEAD.luffy, RED, { costArea: { active: p2Don, rested: 0 }, ...p2 }),
  );
}

describe('P-093 Trafalgar Law [On Play]: DON!! on my field <= the opponent’s: add 1 DON!! rested', () => {
  it('equal (4 vs 4): +1 DON!! from the deck, RESTED', () => {
    const g = game(4, 4);
    const before = donOf(g, 'p1').deck;
    playFromHand(g, LAW);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5, deck: before - 1 });
  });

  it('fewer (4 vs 7): +1 DON!! rested', () => {
    const g = game(4, 7);
    playFromHand(g, LAW);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
  });

  it('more (4 vs 3): nothing is added', () => {
    const g = game(4, 3);
    const before = donOf(g, 'p1').deck;
    playFromHand(g, LAW);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: before });
  });

  it('given DON!! on the opponent’s side count: 2 active + 2 given = 4 vs 4 is equal', () => {
    const g = game(4, 2, { leader: { card: LEAD.luffy, don: 2 } });
    playFromHand(g, LAW);
    expect(donOf(g, 'p1').rested).toBe(5);
  });

  it('my own given DON!! count too: 4 + 1 given = 5 vs 4 is more, so nothing', () => {
    const g = myTurn(
      side({ card: LD.navy, don: 1 }, BLUE, { hand: [LAW], costArea: { active: 4, rested: 0 } }),
      side(LEAD.luffy, RED, { costArea: { active: 4, rested: 0 } }),
    );
    playFromHand(g, LAW);
    expect(donOf(g, 'p1').rested).toBe(4);
  });

  it('with an empty DON!! deck nothing can be added and nothing breaks', () => {
    const g = myTurn(
      side(LD.navy, BLUE, { hand: [LAW], costArea: { active: 10, rested: 0 } }),
      side(LEAD.luffy, RED, { costArea: { active: 10, rested: 0 } }),
    );
    expect(donOf(g, 'p1').deck).toBe(0);
    playFromHand(g, LAW);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 4, deck: 0 });
  });
});

describe('P-093 Trafalgar Law: [Blocker]', () => {
  it('it can block on the opponent’s turn', () => {
    const g = theirTurn(side(LD.navy, BLUE, { characters: [LAW] }), side(LEAD.luffy, RED));
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', LAW)]);
  });
});
