/**
 * OP10-048 Sai (Character, Blue, cost 3, 5000, no Counter, {Happosui Army}/{Dressrosa}).
 *
 * Card text: "[On Play] You may rest 1 of your "Dressrosa" type Leader or Stage cards: Return up to 1 of
 * your opponent's Characters with a cost of 1 or less to the owner's hand."
 *
 * Rules: as OP10-044 Cub (same effect). The shared cases are in kit-op10b.ts (`describeRestBounce`).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import { C10, describeRestBounce, donSum, inst, L10, mine, pickRaw, playRaw } from './kit-op10b.ts';

const SAI = 'OP10-048';

describeRestBounce({ id: SAI, cost: 3 });

describe('OP10-048 Sai: on the field', () => {
  it('printed 5000 power and no Counter value', () => {
    const g = mine(L10.dressrosa, { hand: [SAI] }, {});
    playRaw(g, SAI);
    act(g, { type: 'optional', accept: false });
    const c = g.card(inst(g, 'p1', 'characters', SAI));
    expect(c.power).toBe(5000);
    expect(c.counter).toBeNull();
  });

  it('the play cost (3 DON!!) is paid before the effect; resting the Leader costs no DON!!', () => {
    const g = mine(L10.dressrosa, { hand: [SAI] }, { characters: [C10.mohji] });
    playRaw(g, SAI);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(donSum(g)).toMatchObject({ active: 7, rested: 3 });
  });
});
