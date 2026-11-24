/**
 * OP15-012 Buggy (Character, Red, cost 3, 4000, Counter +1000, {Buggy Pirates}/{East Blue}).
 *
 * Card text: "[When Attacking] Give up to 1 rested DON!! card to its owner's Leader or 1 of their
 * Characters. [On K.O.] Draw 1 card."
 *
 * M6b-Q24 (whose DON!! is given) is open: my own DON!! stay all active in every position, so the
 * opponent's rested DON!! are the only candidates under any reading. Rules: given DON!! are neither
 * active nor rested (CR 4-4-2), add power only on their owner's turn (CR 6-5-5-2), return rested at
 * their owner's Refresh (CR 6-2-3); "up to" allows 0 (CR 8-4-4-1); [On K.O.] fires for any K.O.
 * (battle or effect), not for a return to the hand (CR 10-2-17).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  choices,
  don,
  endUpTo,
  hand,
  kind,
  mine,
  need,
  n,
  no,
  passBlock,
  payDonStrict,
  pickInst,
  theirs,
  toTheirMain,
  W3C,
  W3L,
  yes,
} from './kit-w3.ts';

const BUGGY = 'OP15-012';

type P2 = Parameters<typeof mine>[2];
function attacking(p2: P2 = {}) {
  const g = mine(
    W3L.kid,
    { characters: [BUGGY] },
    { characters: [W3C.thatch], costArea: { active: 2, rested: 3 }, ...p2 },
  );
  const buggy = g.find('p1', 'characters', BUGGY);
  attack(g, buggy, g.leader('p2'));
  return { g, buggy, thatch: g.find('p2', 'characters', W3C.thatch) };
}

describe('OP15-012 Buggy: [When Attacking] give up to 1 rested DON!!', () => {
  it("gives one of the opponent's rested DON!! to their Leader, then the attack goes on", () => {
    const { g } = attacking();
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, given: 0 });
    need(g, 'block', 'p2');
  });

  it('may give it to one of their Characters instead', () => {
    const { g, thatch } = attacking();
    pickInst(g, [thatch]);
    expect(g.card(thatch).don).toBe(1);
    expect(g.card(g.leader('p2')).don).toBe(0);
  });

  it("candidates are the opponent's Leader and Characters, not my own cards", () => {
    const { g, thatch } = attacking();
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([g.leader('p2'), thatch].sort());
  });

  it('"up to 1": may give none; the attack still happens and no DON!! moves', () => {
    const { g } = attacking();
    endUpTo(g);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 3, given: 0 });
    need(g, 'block', 'p2');
  });

  it('only a rested DON!! may be given: with none rested nothing is given and the attack goes on', () => {
    const { g, thatch } = attacking({ costArea: { active: 4, rested: 0 } });
    if (kind(g) === 'choose') {
      if (choices(g).includes(thatch)) pickInst(g, [thatch]);
      else endUpTo(g);
    }
    expect(don(g, 'p2')).toMatchObject({ active: 4, rested: 0, given: 0 });
    need(g, 'block', 'p2');
  });

  it('gives exactly one DON!! although three are rested', () => {
    const { g, thatch } = attacking();
    pickInst(g, [thatch]);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
  });

  it("the given DON!! add no power on my turn, and return to the cost area at their owner's Refresh", () => {
    const { g, thatch } = attacking();
    pickInst(g, [thatch]);
    expect(g.power(thatch)).toBe(8000);
    passBlock(g);
    act(g, { type: 'endCounter' });
    // Buggy (4000) attacked the Leader (5000): no damage. End the turn.
    expect(atMain(g)).toBe(true);
    toTheirMain(g);
    expect(g.card(g.find('p2', 'characters', W3C.thatch)).don).toBe(0);
    expect(don(g, 'p2')).toMatchObject({ given: 0, active: 7, rested: 0 });
  });
});

describe('OP15-012 Buggy: [On K.O.] draw 1 card', () => {
  const defending = (extra: Parameters<typeof theirs>[2] = {}) =>
    theirs(
      W3L.kid,
      { characters: [{ card: BUGGY, rested: true }] },
      { characters: [W3C.thatch], ...extra },
    );

  it("K.O.'d in battle: its controller draws exactly 1 card", () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', BUGGY));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(n(g, 'p1', 'deck')).toBe(14);
  });

  it("K.O.'d by an effect: also draws 1 card", () => {
    const g = theirs(
      W3L.kid,
      { characters: [BUGGY] },
      { hand: [W3C.impactDial], characters: [W3C.thatch] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', BUGGY)]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(n(g, 'p1', 'hand')).toBe(1);
  });

  it('returned to the hand (not a K.O.): nothing is drawn', () => {
    const g = theirs(
      W3L.kid,
      { characters: [BUGGY] },
      { hand: [W3C.bounce], costArea: { active: 10, rested: 0 } },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.bounce) });
    yes(g, 'p2');
    pickInst(g, [g.find('p1', 'characters', BUGGY)]);
    expect(hand(g)).toEqual([BUGGY]);
    expect(n(g, 'p1', 'deck')).toBe(15);
    void no;
    void payDonStrict;
  });
});
