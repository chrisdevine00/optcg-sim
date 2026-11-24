/**
 * OP16-100 Hallowed Glacier Slash (Event, Black, cost 1, {Land of Wano}).
 *
 * Card text: "[Main] You may rest 2 of your DON!! cards: If your opponent's Character has been
 * K.O.'d during this turn, set your Leader [Yamato] as active. [Counter] Your Leader gains +3000
 * power during this battle."
 *
 * Open: M6b-Q22 (a K.O. that a replacement prevented): no test depends on it; the readings every
 * test shares are "an opposing Character K.O.'d this turn by any cause" and "my own Character K.O.'d
 * or an opposing Character merely returned to the hand does not count". Rules: "You may ... :" is a
 * cost; if the condition fails after the cost the effect does not resolve (CR 8-3-3); the Leader
 * must be named [Yamato]; a [Counter] boost lasts for the battle only (CR 7-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  atMain,
  attack,
  canCounterNow,
  don,
  kind,
  need,
  no,
  passBlock,
  passCounter,
  payDonStrict,
  decision,
  pickInst,
  mine,
  theirs,
  unusable,
  W3C,
  W3L,
  yes,
} from './kit-w3.ts';

const GLACIER = 'OP16-100';
/** EB05-045 Ms. Monday: "[On Play] K.O. up to 1 of your Characters with a type including 'Baroque Works'". */
const MONDAY = 'EB05-045';
/** OP14-095 Mr.9: Black, cost 5, 6000, {Baroque Works}, vanilla. */
const MR9 = 'OP14-095';

/** Pay the "rest 2 of your DON!!" cost if the engine asks which DON!!. */
function payIfAsked(g: ReturnType<typeof mine>, n: number) {
  if (kind(g) === 'choose' && decision(g)?.purpose === 'cost') payDonStrict(g, n);
}

type P1 = NonNullable<Parameters<typeof mine>[1]>;
type P2 = Parameters<typeof mine>[2];
/** My Main Phase with a rested [Yamato] Leader and the Event in hand. */
function board(p1: P1 = {}, p2: P2 = {}, leader: string = W3L.yamato) {
  return mine(
    { card: leader, rested: true },
    { hand: [GLACIER], ...p1 },
    { characters: [{ card: W3C.sai, rested: true }, W3C.marco], ...p2 },
  );
}
/** Play Impact Dial first to K.O. the opposing Sai (cost 2), then return to my Main Phase. */
function koWithEvent(g: ReturnType<typeof mine>) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', W3C.impactDial) });
  pickInst(g, [g.find('p2', 'characters', W3C.sai)]);
  expect(atMain(g)).toBe(true);
}
function playGlacier(g: ReturnType<typeof mine>) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', GLACIER) });
}

describe("OP16-100 Hallowed Glacier Slash: [Main] rest 2 DON!!: if an opposing Character was K.O.'d this turn, set [Yamato] active", () => {
  it("an opposing Character K.O.'d by my effect this turn: my rested [Yamato] Leader becomes active", () => {
    const g = board({ hand: [W3C.impactDial, GLACIER] });
    expect(g.card(g.leader('p1')).rested).toBe(true);
    koWithEvent(g);
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(atMain(g)).toBe(true);
  });

  it("the cost is exactly 2 DON!! rested (plus the Event's own 1)", () => {
    const g = board({ hand: [W3C.impactDial, GLACIER] });
    koWithEvent(g);
    const before = don(g, 'p1');
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(don(g, 'p1')).toMatchObject({
      active: before.active - 3,
      rested: before.rested + 3,
    });
  });

  it("a K.O. in battle counts: my Character K.O.'s their rested Character, then the Leader is set active", () => {
    const g = board({ characters: [W3C.thatch] });
    attack(g, g.find('p1', 'characters', W3C.thatch), g.find('p2', 'characters', W3C.sai));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([W3C.marco]);
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('no K.O. this turn: the cost may be paid but the Leader stays rested', () => {
    const g = board();
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(atMain(g)).toBe(true);
  });

  it("my OWN Character K.O.'d this turn does not count", () => {
    const g = board({ hand: [MONDAY, GLACIER], characters: [MR9] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MONDAY) });
    pickInst(g, [g.find('p1', 'characters', MR9)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MONDAY]);
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it("an opposing Character merely returned to the hand (not K.O.'d) does not count", () => {
    const g = board({ hand: [W3C.bounce, GLACIER] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', W3C.bounce) });
    yes(g, 'p1');
    payIfAsked(g, 5);
    pickInst(g, [g.find('p2', 'characters', W3C.marco)]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('only a Leader named [Yamato] is set active: another rested Leader stays rested', () => {
    const g = board({ hand: [W3C.impactDial, GLACIER] }, {}, W3L.plain);
    koWithEvent(g);
    playGlacier(g);
    yes(g, 'p1');
    payIfAsked(g, 2);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"You may": declining keeps the DON!! and the Leader rested even after a K.O.', () => {
    const g = board({ hand: [W3C.impactDial, GLACIER] });
    koWithEvent(g);
    const before = don(g, 'p1');
    playGlacier(g);
    no(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: before.active - 1, rested: before.rested + 1 });
  });

  it("the cost needs 2 more active DON!! after the Event's own cost: with 2 active it cannot be paid", () => {
    const g = board({ hand: [W3C.impactDial, GLACIER], costArea: { active: 4, rested: 0 } });
    koWithEvent(g); // 2 DON!! spent, 2 active left
    playGlacier(g); // 1 spent, 1 active left: the 2-DON!! cost cannot be paid
    unusable(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });
});

describe('OP16-100 Hallowed Glacier Slash: [Counter] my Leader gains +3000 power during this battle', () => {
  /** p2's Leader (5000) attacks my Yamato Leader (5000); I hold the Event. */
  function defending() {
    const g = theirs(
      W3L.yamato,
      { hand: [GLACIER], costArea: { active: 2, rested: 0 } },
      { characters: [W3C.thatch] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('is offered in the Counter Step and makes my Leader 8000, so the 5000 attack fails', () => {
    const g = defending();
    need(g, 'counter', 'p1');
    const event = g.find('p1', 'hand', GLACIER);
    expect(canCounterNow(g, event)).toBe(true);
    activateCounter(g, event);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without the Counter the same attack connects (5000 against 5000)', () => {
    const g = defending();
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the +3000 lasts for the battle only', () => {
    const g = defending();
    activateCounter(g, g.find('p1', 'hand', GLACIER));
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs its printed 1 DON!!: with no active DON!! it cannot be used', () => {
    const g = theirs(
      W3L.yamato,
      { hand: [GLACIER], costArea: { active: 0, rested: 2 } },
      { characters: [W3C.thatch] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(canCounterNow(g, g.find('p1', 'hand', GLACIER))).toBe(false);
  });
});
