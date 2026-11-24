/**
 * OP15-023 Arlong (Character, Green, cost 4, 5000, Counter +1000, {Fish-Man}/{Arlong Pirates}/{East Blue}).
 *
 * Card text: "[On K.O.] Up to 2 of your opponent's rested cards will not become active in your
 * opponent's next Refresh Phase. [Activate: Main] [Once Per Turn] You may give 1 of your
 * opponent's rested DON!! cards to 1 of your opponent's Characters: Give up to 1 DON!! card from
 * its owner's cost area to its owner's Leader or 1 of their Characters."
 *
 * Open: M6b-Q24 (whose DON!! is given), M6b-Q25 (do rested DON!! count as "cards" for the
 * [On K.O.]) and M6b-Q44 (who picks active or rested for the effect's DON!!). The [On K.O.] tests
 * keep every opposing DON!! active (no rested DON!! to argue about); the effect tests assert only
 * the totals every reading shares and pick whichever class the engine asks for. Rules: "up to"
 * allows 0 (CR 8-4-4-1); the Refresh Phase sets rested cards active (CR 6-2-4); given DON!! return
 * rested first (CR 6-2-3); [Once Per Turn] CR 10-2-13.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  choices,
  don,
  endUpTo,
  giveAnyDon,
  kind,
  mine,
  need,
  offeredIds,
  offeredNow,
  passBlock,
  pickInst,
  theirs,
  toTheirMain,
  useAbility,
  W3C,
  W3L,
  yes,
  payDonStrict,
} from './kit-w3.ts';

const ARLONG = 'OP15-023';
const KINGDEW = W3C.kingdew;

type P2 = Parameters<typeof mine>[2];
function activating(p2: P2 = {}) {
  const g = mine(
    W3L.kid,
    { characters: [ARLONG] },
    { characters: [W3C.thatch, W3C.sai], costArea: { active: 2, rested: 3 }, ...p2 },
  );
  const first = (c: string) =>
    g.zone('p2', 'characters').find((x) => x.card === c)?.instance as string;
  return {
    g,
    me: g.find('p1', 'characters', ARLONG),
    thatch: first(W3C.thatch),
    sai: first(W3C.sai),
  };
}

describe('OP15-023 Arlong: [Activate: Main] [Once Per Turn] give DON!! as a cost and an effect', () => {
  it('cost: one rested DON!! to a Character; effect: one more DON!! from the cost area to the Leader', () => {
    const { g, me, thatch } = activating();
    useAbility(g, me);
    need(g, 'choose', 'p1');
    pickInst(g, [thatch]);
    giveAnyDon(g, 'p1', { from: 'costActive', target: g.leader('p2') });
    expect(atMain(g)).toBe(true);
    expect(g.card(thatch).don).toBe(1);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 2, given: 2 });
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, given: 0 });
  });

  it('the cost asks for exactly 1 opposing Character (never the Leader)', () => {
    const { g, me, thatch, sai } = activating();
    useAbility(g, me);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(choices(g).sort()).toEqual([thatch, sai].sort());
  });

  it('an ACTIVE DON!! may be given by the effect: with one rested DON!! (spent on the cost) only active ones remain', () => {
    const { g, me, thatch } = activating({ costArea: { active: 3, rested: 1 } });
    useAbility(g, me);
    pickInst(g, [thatch]);
    giveAnyDon(g, 'p1', { from: 'costActive', target: g.leader('p2') });
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 0, given: 2 });
  });

  it('a RESTED DON!! may be given by the effect too: with only rested DON!! both gives come from them', () => {
    const { g, me, thatch, sai } = activating({ costArea: { active: 0, rested: 3 } });
    useAbility(g, me);
    pickInst(g, [thatch]);
    giveAnyDon(g, 'p1', { from: 'costRested', target: sai });
    expect(atMain(g)).toBe(true);
    expect(g.card(sai).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 1, given: 2 });
  });

  it('the cost needs a rested opposing DON!!: with none the ability is not offered', () => {
    const { g, me } = activating({ costArea: { active: 5, rested: 0 } });
    expect(offeredNow(g, me)).toBe(false);
  });

  it('the cost needs an opposing Character: with none the ability is not offered', () => {
    const { g, me } = activating({ characters: [] });
    expect(offeredNow(g, me)).toBe(false);
  });

  it('"up to 1": after paying the cost the effect may give nothing; the cost stays paid', () => {
    const { g, me, thatch } = activating({ costArea: { active: 2, rested: 3 } });
    useAbility(g, me);
    pickInst(g, [thatch]);
    // The effect's DON!! pick (when asked) is followed by an optional target: end it empty.
    if (
      kind(g) === 'choose' &&
      g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object')
    ) {
      act(g, { type: 'pick', choice: { from: 'costActive' } });
    }
    endUpTo(g);
    expect(atMain(g)).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 1 });
  });

  it('[Once Per Turn]: not offered again after it was used', () => {
    const { g, me, thatch } = activating();
    useAbility(g, me);
    pickInst(g, [thatch]);
    giveAnyDon(g, 'p1', { from: 'costActive', target: g.leader('p2') });
    expect(offeredNow(g, me)).toBe(false);
  });

  it("all the given DON!! return to their owner's cost area at that owner's Refresh Phase", () => {
    const { g, me, thatch } = activating();
    useAbility(g, me);
    pickInst(g, [thatch]);
    giveAnyDon(g, 'p1', { from: 'costActive', target: g.leader('p2') });
    toTheirMain(g);
    expect(don(g, 'p2')).toMatchObject({ given: 0, active: 7, rested: 0 });
  });
});

describe("OP15-023 Arlong: [On K.O.] up to 2 of the opponent's rested cards stay rested at their next Refresh", () => {
  /**
   * p2's turn: Arlong (rested, so Thatch can attack it) is K.O.'d in battle. p2 has rested Sai and
   * Marco, an active Kingdew, and the rested attacker Thatch. All opposing DON!! are active.
   */
  function koed() {
    const g = theirs(
      W3L.kid,
      { characters: [{ card: ARLONG, rested: true }] },
      {
        characters: [
          W3C.thatch,
          { card: W3C.sai, rested: true },
          { card: W3C.marco, rested: true },
          KINGDEW,
        ],
      },
    );
    attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', ARLONG));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }
  const at = (g: ReturnType<typeof koed>, c: string) => g.find('p2', 'characters', c);
  /** p2 ends the turn, p1 ends the next: p2's Refresh Phase has run. */
  const pastRefresh = (g: ReturnType<typeof koed>) => {
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
  };

  it("offers the opponent's rested cards only (the attacker, Sai, Marco), not the active Kingdew", () => {
    const g = koed();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W3C.marco, W3C.sai, W3C.thatch].sort());
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('the chosen two stay rested through the next Refresh Phase; the others become active', () => {
    const g = koed();
    pickInst(g, [at(g, W3C.sai), at(g, W3C.marco)]);
    pastRefresh(g);
    expect(g.card(at(g, W3C.sai)).rested).toBe(true);
    expect(g.card(at(g, W3C.marco)).rested).toBe(true);
    expect(g.card(at(g, W3C.thatch)).rested).toBe(false);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('the hold lasts one Refresh only: the following Refresh sets them active', () => {
    const g = koed();
    pickInst(g, [at(g, W3C.sai), at(g, W3C.marco)]);
    pastRefresh(g);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(at(g, W3C.sai)).rested).toBe(false);
    expect(g.card(at(g, W3C.marco)).rested).toBe(false);
  });

  it('"up to 2": at most two can be chosen out of three candidates', () => {
    const g = koed();
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(2);
    expect(d.min).toBe(0);
  });

  it('"up to 2": one card is enough, and the unchosen rested cards become active', () => {
    const g = koed();
    pickInst(g, [at(g, W3C.thatch)]);
    pastRefresh(g);
    expect(g.card(at(g, W3C.thatch)).rested).toBe(true);
    expect(g.card(at(g, W3C.sai)).rested).toBe(false);
    expect(g.card(at(g, W3C.marco)).rested).toBe(false);
  });

  it('choosing nothing: every rested card becomes active as usual', () => {
    const g = koed();
    endUpTo(g);
    pastRefresh(g);
    expect(g.card(at(g, W3C.sai)).rested).toBe(false);
    expect(g.card(at(g, W3C.marco)).rested).toBe(false);
    expect(g.card(at(g, W3C.thatch)).rested).toBe(false);
  });

  it("also fires when the K.O. is by the opponent's effect", () => {
    const g = theirs(
      W3L.kid,
      { characters: [ARLONG] },
      { hand: [W3C.impactDial], characters: [{ card: W3C.sai, rested: true }] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', ARLONG)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W3C.sai]);
    void yes;
    void payDonStrict;
  });

  it('returned to the hand (not a K.O.): nothing is asked', () => {
    const g = theirs(
      W3L.kid,
      { characters: [ARLONG] },
      { hand: [W3C.bounce], characters: [{ card: W3C.sai, rested: true }] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.bounce) });
    yes(g, 'p2');
    pickInst(g, [g.find('p1', 'characters', ARLONG)]);
    expect(kind(g)).toBe('main');
  });
});
