/**
 * OP10-066 Giolla (Character, Purple, cost 2, 2000, Counter +2000, {Donquixote Pirates}).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] You may rest 2 of your DON!! cards: Rest up to 1
 * of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: [On Your Opponent's Attack] fires when the opponent declares an attack (CR 10-2-...), the cost
 * is 2 active DON!! (CR 8-3-1-4 "you may"), "[Once Per Turn]" (CR 10-2-13), "up to" (CR 8-1-2), cost
 * "4 or less" includes 4, resting a Character needs it to be active to have an effect.
 * Scenery: ST01-001 Luffy (the attacking Leader), vanilla opposing Characters.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  C10,
  canUse,
  donSum,
  doneRaw,
  inst,
  kind,
  L10,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  passBlock,
  passCounter,
  pickRaw,
  rested,
  theirs,
} from './kit-op10b.ts';

const GIOLLA = 'OP10-066';

function defend(
  p2chars: string[] = [C10.mohji, C10.hajrudin4, C10.kingdew],
  don = { active: 5, rested: 0 },
  p1chars: string[] = [],
): TestGame {
  return theirs(
    L10.dp,
    { characters: [GIOLLA, ...p1chars], costArea: don },
    { characters: p2chars },
  );
}
const hit = (g: TestGame) => attack(g, g.leader('p2'), g.leader('p1'));

describe("OP10-066 Giolla: [On Your Opponent's Attack] [Once Per Turn] rest 2 DON!!: rest up to 1 opposing Character with a cost of 4 or less", () => {
  it('when the opponent attacks: pay 2 DON!! (rested) and the chosen opposing Character is rested', () => {
    const g = defend();
    hit(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(rested(g, inst(g, 'p2', 'characters', C10.mohji))).toBe(true);
    expect(donSum(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('boundary: cost 1 and cost 4 Characters are offered, a cost-5 Character is not', () => {
    const g = defend();
    hit(g);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.hajrudin4, C10.mohji].sort());
  });

  it('only opposing Characters can be chosen (not my own, not a Leader)', () => {
    const g = defend([C10.mohji], { active: 5, rested: 0 }, [C10.gordon]);
    hit(g);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.mohji]);
  });

  it('"you may": declining pays nothing and rests nothing', () => {
    const g = defend();
    hit(g);
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expect(rested(g, inst(g, 'p2', 'characters', C10.mohji))).toBe(false);
    expect(donSum(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
  });

  it('"up to 1": choosing nobody still pays the 2 DON!!', () => {
    const g = defend();
    hit(g);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(donSum(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    expect(rested(g, inst(g, 'p2', 'characters', C10.mohji))).toBe(false);
  });

  it('with only 1 active DON!! the cost of 2 cannot be paid: nothing is rested', () => {
    const g = defend([C10.mohji], { active: 1, rested: 3 });
    hit(g);
    mustBeUnpayable(g, 'p1');
    expect(rested(g, inst(g, 'p2', 'characters', C10.mohji))).toBe(false);
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 3 });
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = defend([C10.mohji, C10.thatch]);
    hit(g);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', C10.thatch), g.leader('p1'));
    expect(kind(g)).not.toBe('optional');
    expect(kind(g)).toBe('block');
  });

  it('it also fires when the attack is on one of my Characters', () => {
    const g = theirs(
      L10.dp,
      {
        characters: [GIOLLA, { card: C10.gordon, rested: true }],
        costArea: { active: 5, rested: 0 },
      },
      { characters: [C10.mohji] },
    );
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', C10.gordon));
    need(g, 'optional', 'p1');
  });

  it('it does not fire on my own attack (my turn)', () => {
    const g = mine(L10.dp, { characters: [GIOLLA, C10.marco] }, { characters: [C10.mohji] });
    attack(g, inst(g, 'p1', 'characters', C10.marco), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });

  it("[Once Per Turn] renews: on the opponent's next turn an attack offers it again", () => {
    const g = defend([C10.mohji, C10.thatch]);
    hit(g);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', C10.thatch), g.leader('p1'));
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
  });
});
