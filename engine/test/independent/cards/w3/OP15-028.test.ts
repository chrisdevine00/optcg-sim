/**
 * OP15-028 Meowban Brothers (Character, Green, cost 1, 2000, Counter +2000, {East Blue}/{Black Cat Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {East Blue} type, give up to 1 DON!! card from your
 * opponent's cost area to 1 of your opponent's Characters."
 *
 * Open: M6b-Q24 (whose DON!!) and M6b-Q44 (who picks active or rested). The tests give the DON!!
 * class the engine asks for and assert only what every reading shares: one DON!! leaves the
 * opponent's cost area for the chosen Character; either kind is eligible when it is the only kind
 * there. Rules: a condition that fails stops the effect (CR 8-3-3); "up to" allows 0 (CR 8-4-4-1);
 * given DON!! return rested at their owner's Refresh (CR 6-2-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  choices,
  don,
  endUpTo,
  fieldDon,
  giveAnyDon,
  kind,
  mine,
  need,
  toTheirMain,
  W3C,
  W3L,
} from './kit-w3.ts';

const MEOW = 'OP15-028';
/** OP15-001 Krieg: Green/Red Leader, types {Krieg Pirates}/{East Blue}. Its text works on the opponent's turn only. */
const KRIEG = 'OP15-001';

type P2 = Parameters<typeof mine>[2];
function played(leader: string = W3L.eastBlue, p2: P2 = {}) {
  const g = mine(
    leader,
    { hand: [MEOW] },
    {
      characters: [W3C.thatch, W3C.sai],
      costArea: { active: 2, rested: 2 },
      ...p2,
    },
  );
  act(g, { type: 'playCard', card: g.find('p1', 'hand', MEOW) });
  const first = (c: string) =>
    g.zone('p2', 'characters').find((x) => x.card === c)?.instance as string;
  return { g, thatch: first(W3C.thatch), sai: first(W3C.sai) };
}

describe('OP15-028 Meowban Brothers: [On Play] East Blue Leader: give up to 1 DON!! from their cost area', () => {
  it("with an {East Blue} Leader: one DON!! leaves the opponent's cost area and is given to the chosen Character", () => {
    const { g, thatch } = played();
    need(g, 'choose', 'p1');
    giveAnyDon(g, 'p1', { from: 'costActive', target: thatch });
    expect(atMain(g)).toBe(true);
    expect(g.card(thatch).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 2, given: 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1, given: 0 });
  });

  it('a Leader with {East Blue} among several types also qualifies', () => {
    const { g, sai } = played(KRIEG);
    need(g, 'choose', 'p1');
    giveAnyDon(g, 'p1', { from: 'costActive', target: sai });
    expect(g.card(sai).don).toBe(1);
    expect(fieldDon(g, 'p2')).toBe(4);
    expect(don(g, 'p2').given).toBe(1);
  });

  it('a rested DON!! is eligible (the only kind in the cost area)', () => {
    const { g, thatch } = played(W3L.eastBlue, { costArea: { active: 0, rested: 3 } });
    giveAnyDon(g, 'p1', { from: 'costRested', target: thatch });
    expect(g.card(thatch).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 2, given: 1 });
  });

  it('an active DON!! is eligible (the only kind in the cost area)', () => {
    const { g, sai } = played(W3L.eastBlue, { costArea: { active: 3, rested: 0 } });
    giveAnyDon(g, 'p1', { from: 'costActive', target: sai });
    expect(g.card(sai).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 0, given: 1 });
  });

  it('the target must be a Character: the Leader is not a candidate', () => {
    const { g, thatch, sai } = played();
    // The DON!! class (when asked first) is answered; the next instance choice lists Characters only.
    while (kind(g) === 'choose' && choices(g).length === 0) {
      act(g, { type: 'pick', choice: { from: 'costActive' } });
    }
    expect(choices(g).sort()).toEqual([thatch, sai].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('"up to 1": exactly one DON!! is given, never two', () => {
    const { g, thatch } = played();
    giveAnyDon(g, 'p1', { from: 'costActive', target: thatch });
    expect(don(g, 'p2').given).toBe(1);
    expect(fieldDon(g, 'p2')).toBe(4);
  });

  it('"up to 1": may give none', () => {
    const { g } = played();
    while (kind(g) === 'choose' && choices(g).length === 0) {
      act(g, { type: 'pick', choice: { from: 'costActive' } });
    }
    endUpTo(g);
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 0 });
  });

  it('without an {East Blue} Leader nothing happens and nothing is asked', () => {
    const { g } = played(W3L.kid);
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 0 });
  });

  it('with no opposing Character there is no target: no DON!! is given', () => {
    const { g } = played(W3L.eastBlue, { characters: [] });
    while (kind(g) === 'choose') {
      if (choices(g).length === 0 && g.legal().some((a) => a.type === 'pick')) {
        act(g, { type: 'pick', choice: { from: 'costActive' } });
      } else endUpTo(g);
    }
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ given: 0 });
    expect(fieldDon(g, 'p2')).toBe(4);
  });

  it("with no DON!! in the opponent's cost area nothing happens", () => {
    const { g } = played(W3L.eastBlue, { costArea: { active: 0, rested: 0 } });
    if (kind(g) === 'choose') endUpTo(g);
    expect(atMain(g)).toBe(true);
    expect(fieldDon(g, 'p2')).toBe(0);
  });

  it("the given DON!! return to the opponent's cost area at their Refresh Phase", () => {
    const { g, thatch } = played();
    giveAnyDon(g, 'p1', { from: 'costActive', target: thatch });
    toTheirMain(g);
    expect(g.card(g.find('p2', 'characters', W3C.thatch)).don).toBe(0);
    expect(don(g, 'p2')).toMatchObject({ given: 0, active: 6, rested: 0 });
  });
});
