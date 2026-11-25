/**
 * OP10-044 Cub (Character, Blue, cost 1, 2000, Counter +1000, {Dressrosa}/{The Tontattas}).
 *
 * Card text: "[On Play] You may rest 1 of your "Dressrosa" type Leader or Stage cards: Return up to 1 of
 * your opponent's Characters with a cost of 1 or less to the owner's hand."
 *
 * Rules: CR 8-3-1-4 ("you may" cost is paid by choice), CR 8-1-2 ("up to" may be skipped), a rested card
 * cannot be rested again, the cost is paid before the effect, CR 3-7-6 (returned cards go to the hand
 * of their owner). The shared cases are in kit-op10b.ts (`describeRestBounce`).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  C10,
  describeRestBounce,
  inst,
  L10,
  mine,
  pickRaw,
  playRaw,
  zoneIds,
} from './kit-op10b.ts';

const CUB = 'OP10-044';

describeRestBounce({ id: CUB, cost: 1 });

describe('OP10-044 Cub: on the field', () => {
  it('printed 2000 power and Counter +1000', () => {
    const g = mine(L10.dressrosa, { hand: [CUB] }, {});
    playRaw(g, CUB);
    act(g, { type: 'optional', accept: false });
    const c = g.card(inst(g, 'p1', 'characters', CUB));
    expect(c.power).toBe(2000);
    expect(c.counter).toBe(1000);
  });

  it('the returned Character may be one that is rested', () => {
    const g = mine(
      L10.dressrosa,
      { hand: [CUB] },
      { characters: [{ card: C10.mohji, rested: true }] },
    );
    playRaw(g, CUB);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.mohji]);
  });
});
