/**
 * OP15-010 Nezumi (Character, Red, cost 2, 2000, Counter +1000, {Navy}/{East Blue}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to its owner's Leader or
 * 1 of their Characters."
 *
 * Reading (M6b-Q24 is open, see OPEN-QUESTIONS): the DON!! given is a rested DON!! of the opponent,
 * given to the opponent's own Leader or Character. Every position here keeps my own DON!! all
 * active, so only that reading has a candidate. Rules: given DON!! are neither active nor rested
 * (CR 4-4-2), add +1000 only on their owner's turn (CR 6-5-5-2) and return rested at their owner's
 * Refresh (CR 6-2-3); "up to" allows 0 (CR 8-4-4-1); [Once Per Turn] CR 10-2-13.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  choices,
  don,
  endUpTo,
  kind,
  mine,
  need,
  offeredIds,
  offeredNow,
  pickInst,
  toMyNextMain,
  toTheirMain,
  useAbility,
  W3C,
  W3L,
} from './kit-w3.ts';

const NEZ = 'OP15-010';
const THATCH = W3C.thatch;

type P2 = Parameters<typeof mine>[2];
function start(p2: P2 = {}, p1Don = { active: 10, rested: 0 }) {
  const g = mine(
    W3L.kid,
    { characters: [NEZ], costArea: p1Don },
    { characters: [THATCH], costArea: { active: 2, rested: 3 }, ...p2 },
  );
  const nez = g.find('p1', 'characters', NEZ);
  return { g, nez, thatch: g.find('p2', 'characters', THATCH) };
}

describe('OP15-010 Nezumi: [Activate: Main] [Once Per Turn] give up to 1 rested DON!!', () => {
  it("gives one of the opponent's rested DON!! to their Character; my own DON!! are untouched", () => {
    const { g, nez, thatch } = start();
    useAbility(g, nez);
    need(g, 'choose', 'p1');
    pickInst(g, [thatch]);
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 1 });
    expect(g.card(thatch).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, given: 0 });
  });

  it("may give it to the opponent's Leader instead", () => {
    const { g, nez, thatch } = start();
    useAbility(g, nez);
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(g.card(thatch).don).toBe(0);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
  });

  it("candidates are the opponent's Leader and Characters only, never mine", () => {
    const { g, nez, thatch } = start();
    useAbility(g, nez);
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([g.leader('p2'), thatch].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(nez);
  });

  it('"up to 1": gives exactly one DON!! even when three are rested', () => {
    const { g, nez, thatch } = start();
    useAbility(g, nez);
    pickInst(g, [thatch]);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": may give none, and the use still counts as the turn\'s [Once Per Turn]', () => {
    const { g, nez } = start();
    useAbility(g, nez);
    endUpTo(g);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 3, given: 0 });
    expect(atMain(g)).toBe(true);
    expect(offeredNow(g, nez)).toBe(false);
  });

  it('only a RESTED DON!! can be given: with every opposing DON!! active nothing moves', () => {
    const { g, nez, thatch } = start({ costArea: { active: 5, rested: 0 } });
    if (offeredNow(g, nez)) {
      useAbility(g, nez);
      if (kind(g) === 'choose' && choices(g).includes(thatch)) {
        // The engine may still ask for a target; whatever is picked, no active DON!! is given.
        pickInst(g, [thatch]);
      }
    }
    expect(don(g, 'p2')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(g.card(thatch).don).toBe(0);
  });

  it('[Once Per Turn]: after one use it is not offered again, and it is offered again next turn', () => {
    const { g, nez, thatch } = start();
    useAbility(g, nez);
    pickInst(g, [thatch]);
    expect(offeredNow(g, nez)).toBe(false);
    toMyNextMain(g);
    expect(offeredNow(g, nez)).toBe(true);
  });

  it("the given DON!! add no power on my turn (CR 6-5-5-2): the opponent's Character stays 8000", () => {
    const { g, nez, thatch } = start();
    expect(g.power(thatch)).toBe(8000);
    useAbility(g, nez);
    pickInst(g, [thatch]);
    expect(g.card(thatch).don).toBe(1);
    expect(g.power(thatch)).toBe(8000);
  });

  it("the given DON!! return to their owner's cost area at that owner's Refresh Phase (CR 6-2-3)", () => {
    const { g, nez, thatch } = start();
    useAbility(g, nez);
    pickInst(g, [thatch]);
    toTheirMain(g);
    expect(g.card(g.find('p2', 'characters', THATCH)).don).toBe(0);
    // 5 on the field before, 2 placed in the DON!! Phase; all active after the Refresh.
    expect(don(g, 'p2')).toMatchObject({ given: 0, active: 7, rested: 0 });
    void offeredIds;
  });
});
