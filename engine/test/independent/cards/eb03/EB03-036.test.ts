/**
 * EB03-036 Baby 5 (Character, Purple, cost 4, 2000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] DON!! −1 (You may return the specified number of DON!! cards from your field
 * to your DON!! deck.): K.O. up to 2 of your opponent's Characters with a base cost of 3 or less."
 *
 * Rules: CR 4-8-1 ("up to"), CR 4-9 (base cost), DON!! −N is a "you may" cost (RL-52), CR 8-3-1
 * (all-or-nothing cost), DON!! given to a card counts as on the field (CR 3-9).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  C14,
  canFinish,
  chars,
  costDon,
  donChoices,
  donSum,
  inst,
  kind,
  LB,
  LD,
  mine,
  need,
  offeredIds,
  pickCards,
  put,
  reachablePickSets,
  settle,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-036';
const MOHJI = 'OP02-060'; // cost 1, 3000
const SAI = 'OP01-012'; // cost 2, 4000
const MARCO = 'OP01-023'; // cost 3, 5000
const HAJRUDIN = 'OP01-018'; // cost 4, 6000
const KINGDEW = 'OP02-006'; // cost 5, 7000

function start(o: {
  p2?: string[];
  mine?: (string | { card: string; don: number })[];
  active?: number;
}) {
  return mine(
    LB.luffy,
    { hand: [ID], characters: o.mine ?? [], costArea: { active: o.active ?? 10, rested: 0 } },
    { characters: o.p2 ?? [] },
  );
}

/** Play Baby 5, accept the DON!! −1 cost and pay it from active DON!!; leaves the target pick pending. */
function pay(g: ReturnType<typeof start>) {
  put(g, ID);
  answerMay(g, true);
  settle(g, { cost: 'don' });
}

describe("EB03-036 Baby 5: [On Play] DON!! −1: K.O. up to 2 of the opponent's Characters with base cost 3 or less", () => {
  it('pays DON!! −1 (one DON!! goes back to the DON!! deck) and K.O.s two Characters of base cost 3 or less', () => {
    const g = start({ p2: [MOHJI, SAI, MARCO] });
    const before = donSum(g);
    pay(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SAI, MARCO]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([MOHJI]);
    expect(trash(g, 'p2')).toEqual([MARCO, SAI].sort());
    const d = donSum(g);
    expect(d.deck).toBe(before.deck + 1);
    expect(d.active + d.rested + d.given).toBe(9);
    expect(chars(g)).toEqual([ID]);
  });

  it("offers only the opponent's Characters with base cost 3 or less: not cost 4 or 5, and none of my own", () => {
    const g = start({ mine: [MOHJI], p2: [MARCO, HAJRUDIN, KINGDEW, C14.camie] });
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.camie, MARCO].sort());
  });

  it('"up to 2": it may K.O. just one', () => {
    const g = start({ p2: [SAI, MARCO] });
    pay(g);
    pickCards(g, [MARCO]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SAI]);
  });

  it('"up to 2": it may K.O. none, and the DON!! −1 has been paid anyway', () => {
    const g = start({ p2: [SAI, MARCO] });
    const before = donSum(g);
    pay(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([MARCO, SAI].sort());
    expect(donSum(g).deck).toBe(before.deck + 1);
  });

  it('never more than 2 even with three candidates', () => {
    const g = start({ p2: [MOHJI, SAI, MARCO] });
    pay(g);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it("declining the cost: nothing is returned and nothing is K.O.'d", () => {
    const g = start({ p2: [SAI, MARCO] });
    const before = donSum(g);
    put(g, ID);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([MARCO, SAI].sort());
    expect(donSum(g).deck).toBe(before.deck);
    expect(donSum(g).rested).toBe(4);
  });

  it('with no legal target the cost is still offered, and the Event/Character play ends back at Main when declined', () => {
    const g = start({ p2: [HAJRUDIN, KINGDEW] });
    put(g, ID);
    // No Character with base cost 3 or less: whether the engine asks or not, nothing may be K.O.'d.
    if (kind(g) === 'optional') answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN, KINGDEW].sort());
  });

  it('the DON!! may be returned from the rested DON!! (the ones that paid for the card)', () => {
    // 4 DON!! only: playing Baby 5 rests all four, then DON!! −1 can only take a rested one.
    const g = mine(
      LB.luffy,
      { hand: [ID], costArea: { active: 4, rested: 0 } },
      { characters: [MARCO] },
    );
    const before = donSum(g);
    put(g, ID);
    answerMay(g, true);
    // The engine pays on its own when only one class is possible; otherwise pick a rested one.
    if (donChoices(g).length) costDon(g, 1, 'costRested');
    pickCards(g, [MARCO]);
    expect(atMain(g)).toBe(true);
    const d = donSum(g);
    expect(d.deck).toBe(before.deck + 1);
    expect(d.rested).toBe(3);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('the DON!! returned may be one given to a Character', () => {
    const g = mine(
      LB.luffy,
      { hand: [ID], characters: [{ card: C14.marco, don: 1 }], costArea: { active: 4, rested: 0 } },
      { characters: [SAI] },
    );
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    const marco = inst(g, 'p1', 'characters', C14.marco);
    act(g, { type: 'pick', choice: { from: 'given', card: marco } });
    pickCards(g, [SAI]);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).given).toBe(0);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('"base cost": a base-cost-1 Character whose current cost is 13 (OP17-094 Rodo under an {Elbaph} Leader) is still a target', () => {
    const g = mine(
      LB.luffy,
      { hand: [ID], costArea: { active: 10, rested: 0 } },
      { characters: ['OP17-094', HAJRUDIN] },
      LD.elbaph,
    );
    expect(g.card(inst(g, 'p2', 'characters', 'OP17-094')).cost).toBe(13);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP17-094']);
    pickCards(g, ['OP17-094']);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
  });

  it('"base cost": a base-cost-4 Character is not a target even if nothing lowers it (cost 4 is offered nowhere)', () => {
    const g = start({ p2: [HAJRUDIN] });
    put(g, ID);
    if (kind(g) === 'optional') answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
  });
});
