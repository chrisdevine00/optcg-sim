/**
 * OP10-047 Koala (Character, Blue, cost 2, 3000, Counter +1000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[When Attacking] You may return 1 of your "Revolutionary Army" type Characters with a cost
 * of 3 or more to the owner's hand: This Character gains +3000 power during this turn."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), a cost of "3 or more" includes 3, "during this turn" (CR 6-6-1-2),
 * [When Attacking] fires at the attack declaration, so the bonus counts in the battle.
 * Scenery (all vanilla): EB05-041 Koala (RA, cost 2), OP05-012 Hack (RA, cost 3, 5000), OP09-113 Morley
 * (RA, cost 4, 6000), OP12-083 Inazuma (RA, cost 5), OP01-023 Marco (not RA, cost 3, 5000).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence } from '../../helpers.ts';
import {
  C10,
  inst,
  L10,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  payCost,
  pickRaw,
  trash,
  useOffered,
  zoneIds,
} from './kit-op10b.ts';

const KOALA = 'OP10-047';

function board(
  others: (string | { card: string; rested: boolean })[],
  p2chars: (string | { card: string; rested: boolean })[] = [],
) {
  return mine(L10.luffy, { characters: [KOALA, ...others] }, { characters: p2chars });
}
const swing = (g: ReturnType<typeof board>, target?: string) =>
  attack(g, inst(g, 'p1', 'characters', KOALA), target ?? g.leader('p2'));

describe('OP10-047 Koala: [When Attacking] return a {Revolutionary Army} Character of cost 3+ to hand: +3000 this turn', () => {
  it('accepting returns the chosen Character to my hand and Koala has 6000', () => {
    const g = board([C10.hack3]);
    swing(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    payCost(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([C10.hack3]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([KOALA]);
    expect(g.power(inst(g, 'p1', 'characters', KOALA))).toBe(6000);
  });

  it('only {Revolutionary Army} Characters with a cost of 3 or more are candidates (cost 3 included)', () => {
    const g = board([C10.hack3, C10.morley4, C10.koala2, C10.marco]);
    swing(g);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.hack3, C10.morley4].sort());
  });

  it('Koala herself (cost 2) is not a candidate: with one other candidate only that one can be returned and Koala stays', () => {
    const g = board([C10.morley4]);
    swing(g);
    act(g, { type: 'optional', accept: true });
    payCost(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([C10.morley4]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([KOALA]);
  });

  it('a cost-2 {Revolutionary Army} Character and a cost-3 non-{Revolutionary Army} Character do not qualify: the cost is unpayable', () => {
    const g = board([C10.koala2, C10.marco]);
    swing(g);
    mustBeUnpayable(g, 'p1');
    expect(g.power(inst(g, 'p1', 'characters', KOALA))).toBe(3000);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('"you may": declining returns nothing and Koala stays at 3000', () => {
    const g = board([C10.hack3]);
    swing(g);
    need(g, 'optional', 'p1');
    expect(useOffered(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expect(zoneIds(g, 'p1', 'characters')).toEqual([KOALA, C10.hack3].sort());
    expect(g.power(inst(g, 'p1', 'characters', KOALA))).toBe(3000);
  });

  it('exactly 1 Character is returned even when several qualify', () => {
    const g = board([C10.hack3, C10.morley4, C10.inazuma5]);
    swing(g);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p1', 'characters', C10.morley4));
    expect(zoneIds(g, 'p1', 'hand')).toEqual([C10.morley4]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([KOALA, C10.hack3, C10.inazuma5].sort());
  });

  it('the +3000 counts in the battle: 6000 K.O.s a rested 5000 Character that 3000 could not', () => {
    const g = board([C10.hack3], [{ card: C10.marco, rested: true }]);
    swing(g, inst(g, 'p2', 'characters', C10.marco));
    act(g, { type: 'optional', accept: true });
    payCost(g);
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([C10.marco]);
    expect(zoneIds(g, 'p1', 'characters')).toContain(KOALA);
  });

  it('control: declining, the 3000 Koala does not K.O. the rested 5000 Character', () => {
    const g = board([C10.hack3], [{ card: C10.marco, rested: true }]);
    swing(g, inst(g, 'p2', 'characters', C10.marco));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it("the bonus lasts the turn but not the opponent's turn: 3000 power again", () => {
    const g = board([C10.hack3]);
    swing(g);
    act(g, { type: 'optional', accept: true });
    payCost(g);
    noDefence(g);
    expect(g.power(inst(g, 'p1', 'characters', KOALA))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', KOALA))).toBe(3000);
  });
});
