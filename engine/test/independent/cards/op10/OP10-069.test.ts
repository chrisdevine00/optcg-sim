/**
 * OP10-069 Fighting Fish (Character, Purple, cost 4, 6000, no Counter, {Animal}/{Dressrosa}).
 *
 * Card text: "[DON!! x1] [When Attacking] DON!! −1 (You may return the specified number of DON!! cards from
 * your field to your DON!! deck.): K.O. up to 1 of your opponent's Characters with a cost of 1 or less."
 *
 * Rules: [DON!! x1] needs 1 DON!! given to this Character (CR 10-2-...), DON!! −N is optional ("you may")
 * and needs the DON!! on the field (CR 10-2-10, RL-52), "up to" (CR 8-1-2), a cost of "1 or less"
 * includes 1; the K.O. is by an effect. A DON!! −N cost where my DON!! are all in one state needs no choice.
 * Scenery: OP02-060 Mohji (cost 1), ST05-007 Gordon (cost 1), OP01-012 Sai (cost 2).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  C10,
  canUse,
  doneRaw,
  donSum,
  expectMain,
  inst,
  kind,
  L10,
  mine,
  need,
  offeredNow,
  payDon,
  pickRaw,
  trash,
  zoneIds,
} from './kit-op10b.ts';

const FISH = 'OP10-069';

function board(
  p2chars: (string | { card: string; rested: boolean })[] = [C10.mohji],
  don = 1,
  active = 3,
) {
  return mine(
    L10.luffy,
    { characters: [{ card: FISH, don }], costArea: { active, rested: 0 } },
    { characters: p2chars },
  );
}
const swing = (g: TestGame, target?: string) =>
  attack(g, inst(g, 'p1', 'characters', FISH), target ?? g.leader('p2'));
const pay = (g: TestGame) => {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
  payDon(g, 1, 'costActive');
};

describe('OP10-069 Fighting Fish: [DON!! x1] [When Attacking] DON!! -1: K.O. up to 1 opposing Character with a cost of 1 or less', () => {
  it('pays DON!! -1 (one DON!! to the DON!! deck) and K.O.s the chosen cost-1 Character', () => {
    const g = board();
    const before = donSum(g);
    swing(g);
    pay(g);
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(trash(g, 'p2')).toEqual([C10.mohji]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(donSum(g)).toMatchObject({ active: before.active - 1, deck: before.deck + 1 });
  });

  it('boundary: a cost-1 Character is offered, a cost-2 Character is not', () => {
    const g = board([C10.mohji, C10.sai]);
    swing(g);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.mohji]);
  });

  it('only opposing Characters are offered (not the Leader, not my own Fish)', () => {
    const g = board([C10.mohji]);
    swing(g);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.mohji]);
  });

  it('"up to 1": choosing nobody still pays the DON!! -1 and K.O.s nothing', () => {
    const g = board();
    const before = donSum(g);
    swing(g);
    pay(g);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
    expect(donSum(g).deck).toBe(before.deck + 1);
  });

  it("only one Character is K.O.'d even when two qualify", () => {
    const g = board([C10.mohji, C10.gordon]);
    swing(g);
    pay(g);
    pickRaw(g, inst(g, 'p2', 'characters', C10.gordon));
    expect(trash(g, 'p2')).toEqual([C10.gordon]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
  });

  it('"you may": declining returns no DON!! and K.O.s nothing', () => {
    const g = board();
    const before = donSum(g);
    swing(g);
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
    expect(donSum(g)).toMatchObject({ active: before.active, deck: before.deck });
  });

  it('[DON!! x1]: with no DON!! given to Fish the attack asks nothing and K.O.s nothing', () => {
    const g = board([C10.mohji], 0);
    swing(g);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
  });

  it('DON!! -1 may return a rested DON!!: with no active DON!! and 2 rested ones the cost is payable', () => {
    const g = mine(
      L10.luffy,
      { characters: [{ card: FISH, don: 1 }], costArea: { active: 0, rested: 2 } },
      { characters: [C10.mohji] },
    );
    const before = donSum(g);
    swing(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    payDon(g, 1, 'costRested');
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(trash(g, 'p2')).toEqual([C10.mohji]);
    expect(donSum(g)).toMatchObject({ rested: before.rested - 1, deck: before.deck + 1 });
  });

  it('it also fires when Fish attacks a rested opposing Character', () => {
    const g = board([{ card: C10.sai, rested: true }, C10.mohji]);
    swing(g, inst(g, 'p2', 'characters', C10.sai));
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.mohji]);
  });

  it("a rested cost-1 Character can be K.O.'d", () => {
    const g = board([{ card: C10.mohji, rested: true }]);
    swing(g);
    pay(g);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(trash(g, 'p2')).toEqual([C10.mohji]);
    noDefence(g);
    expectMain(g);
  });
});
