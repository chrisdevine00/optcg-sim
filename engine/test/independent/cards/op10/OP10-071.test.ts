/**
 * OP10-071 Donquixote Doflamingo (Character, Purple, cost 8, 9000, no Counter, {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] DON!! −1: Play up to 1 "Donquixote Pirates" type Character card with a cost of 5 or
 * less from your hand.
 * [On Your Opponent's Attack] [Once Per Turn] You may rest 1 of your DON!! cards: Add up to 1 DON!!
 * card from your DON!! deck and set it as active."
 *
 * Rules: DON!! −N is optional and needs the DON!! on the field (CR 10-2-10, RL-52), "up to" (CR 8-1-2),
 * a cost of 5 or less includes 5, a played card enters active unless the effect says rested, "add up to
 * N DON!!" asks a count (E-Q11), [Once Per Turn] (CR 10-2-13), [On Your Opponent's Attack] fires on the
 * opponent's declaration only.
 * Scenery (vanilla {Donquixote Pirates}): OP05-035 Bellamy (3), OP10-073 Buffalo (4), OP10-068 Diamante (5),
 * OP14-066 Diamante (6); OP01-023 Marco (not DP), OP04-036 Donquixote Family (a {Donquixote Pirates} Event).
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  answerCount,
  C10,
  canUse,
  countIds,
  doneRaw,
  donSum,
  expectMain,
  hand,
  inst,
  kind,
  L10,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  passBlock,
  passCounter,
  payDon,
  pickRaw,
  playRaw,
  rested,
  theirs,
  zoneIds,
} from './kit-op10b.ts';

const DOFLA = 'OP10-071';
const EVENT = 'OP04-036';

function start(handCards: string[], active = 10): TestGame {
  return mine(L10.dp, { hand: [DOFLA, ...handCards], costArea: { active, rested: 0 } }, {});
}
const dive = (g: TestGame) => {
  playRaw(g, DOFLA);
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
  payDon(g, 1, 'costActive');
};

describe('OP10-071 Donquixote Doflamingo: [On Play] DON!! -1: play up to 1 {Donquixote Pirates} Character (cost 5 or less) from hand', () => {
  it('pays DON!! -1 (one DON!! to the DON!! deck) and plays the chosen Character from hand, active', () => {
    const g = start([C10.buffalo4]);
    const before = donSum(g);
    dive(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', C10.buffalo4));
    expectMain(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([DOFLA, C10.buffalo4].sort());
    expect(rested(g, inst(g, 'p1', 'characters', C10.buffalo4))).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(donSum(g).deck).toBe(before.deck + 1 + 0);
    expect(donSum(g).active + donSum(g).rested).toBe(10 - 1);
  });

  it('boundary: {Donquixote Pirates} Characters of cost 3, 4 and 5 are offered; cost 6, another type and an Event are not', () => {
    const g = start([C10.bellamyDp, C10.buffalo4, C10.diamante5, C10.diamante6, C10.marco, EVENT]);
    dive(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.bellamyDp, C10.buffalo4, C10.diamante5].sort());
  });

  it('"up to 1": choosing nothing plays nothing, but the DON!! -1 is paid', () => {
    const g = start([C10.buffalo4]);
    const before = donSum(g);
    dive(g);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g);
    expect(hand(g)).toEqual([C10.buffalo4]);
    expect(donSum(g).deck).toBe(before.deck + 1);
  });

  it('plays only one card even when several qualify', () => {
    const g = start([C10.buffalo4, C10.diamante5]);
    dive(g);
    pickRaw(g, g.find('p1', 'hand', C10.diamante5));
    expectMain(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([DOFLA, C10.diamante5].sort());
    expect(hand(g)).toEqual([C10.buffalo4]);
  });

  it('"DON!! -1" is optional: declining returns no DON!! and plays nothing', () => {
    const g = start([C10.buffalo4]);
    const before = donSum(g);
    playRaw(g, DOFLA);
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expectMain(g);
    expect(hand(g)).toEqual([C10.buffalo4]);
    expect(donSum(g).deck).toBe(before.deck);
  });

  it('with no qualifying card in hand the DON!! -1 may still be paid and nothing is played', () => {
    const g = start([C10.diamante6, C10.marco]);
    dive(g);
    if (kind(g) === 'choose') {
      expect(offeredNow(g)).toEqual([]);
      doneRaw(g);
    }
    expectMain(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([DOFLA]);
  });
});

describe("OP10-071 Donquixote Doflamingo: [On Your Opponent's Attack] [Once Per Turn] rest 1 DON!!: add 1 DON!! from the DON!! deck, active", () => {
  const defend = (don = { active: 3, rested: 0 }, donDeck?: number): TestGame =>
    theirs(
      L10.dp,
      { characters: [DOFLA], costArea: don, ...(donDeck === undefined ? {} : { donDeck }) },
      { characters: [C10.kingdew] },
    );
  const hit = (g: TestGame) => attack(g, g.leader('p2'), g.leader('p1'));

  it('rest 1 DON!!, then 1 DON!! is added from the DON!! deck as active: active count unchanged, rested +1, DON!! deck -1', () => {
    const g = defend();
    const before = donSum(g);
    hit(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    expect(countIds(g)).toEqual(['1', '0']);
    answerCount(g, 1);
    const after = donSum(g);
    expect(after).toMatchObject({
      active: before.active,
      rested: before.rested + 1,
      deck: before.deck - 1,
    });
  });

  it('"up to 1": adding none still pays the rest', () => {
    const g = defend();
    const before = donSum(g);
    hit(g);
    act(g, { type: 'optional', accept: true });
    answerCount(g, 0);
    const after = donSum(g);
    expect(after).toMatchObject({
      active: before.active - 1,
      rested: before.rested + 1,
      deck: before.deck,
    });
  });

  it('"you may": declining rests nothing and adds nothing', () => {
    const g = defend();
    const before = donSum(g);
    hit(g);
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expect(donSum(g)).toMatchObject({
      active: before.active,
      rested: before.rested,
      deck: before.deck,
    });
  });

  it('with no active DON!! the cost of resting 1 cannot be paid', () => {
    const g = defend({ active: 0, rested: 3 });
    const before = donSum(g);
    hit(g);
    mustBeUnpayable(g, 'p1');
    expect(donSum(g)).toMatchObject({ active: 0, rested: 3, deck: before.deck });
  });

  it('[Once Per Turn]: a second attack in the same turn does not offer it again', () => {
    const g = theirs(
      L10.dp,
      { characters: [DOFLA], costArea: { active: 3, rested: 0 } },
      { characters: [C10.kingdew, C10.thatch] },
    );
    hit(g);
    act(g, { type: 'optional', accept: true });
    answerCount(g, 1);
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', C10.thatch), g.leader('p1'));
    expect(kind(g)).toBe('block');
  });

  it('it does not fire on my own attacks', () => {
    const g = mine(
      L10.dp,
      { characters: [DOFLA, C10.marco], costArea: { active: 3, rested: 0 } },
      {},
    );
    attack(g, inst(g, 'p1', 'characters', C10.marco), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });
});
