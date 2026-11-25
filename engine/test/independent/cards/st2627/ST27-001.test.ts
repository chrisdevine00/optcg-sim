/**
 * ST27-001 Avalo Pizarro (Character, Black, cost 1, 1000, Counter +1000, {Blackbeard Pirates},
 * Special).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may rest 1 of your [Fullalead] cards: If your Leader
 * has the "Blackbeard Pirates" type, this Character gains +4000 power during this turn.
 * [On K.O.] Draw 1 card."
 *
 * Rules: CR 8-3 (a cost needs a legal payment: a rested card cannot be rested again), the "If"
 * after the cost colon is an effect condition (convention: the cost is paid and the Once Per Turn is
 * spent even when the check fails), CR 6-6-1-3 ("during this turn"), CR 10-2-1 (K.O. is a Character
 * moved to trash by battle or by an effect; returning to hand is not a K.O.).
 *
 * The only [Fullalead] cards are OP09-099 (Black Stage, {Blackbeard Pirates}) and OP17-057 (Blue
 * Stage, {Rocks Pirates}): the cost names the card, not a color or type.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  canActivate,
  charIds,
  defendNothing,
  endTurn,
  fill,
  hand,
  mine,
  n,
  need,
  offeredAbilities,
  pickInst,
  SL,
  SS,
  ST27,
  theirs,
  toMyNextMain,
  trash,
  useAbility,
  waitingAtMain,
} from './kit-st2627a.ts';
import { ROCKS, choose, offered, accept, payDon } from '../kit.ts';

const PIZ = ST27.pizarro;

function start(leader: string, stage?: string | { card: string; rested: boolean }) {
  return mine(leader, { characters: [PIZ], ...(stage ? { stage } : {}) });
}

const stageRested = (g: ReturnType<typeof start>) => g.zone('p1', 'stage')[0]!.rested;
const pizPower = (g: ReturnType<typeof start>) => g.power(at(g, 'p1', 'characters', PIZ));

describe('ST27-001 Avalo Pizarro: [Activate: Main] [Once Per Turn] rest a [Fullalead]: +4000', () => {
  it('with a {Blackbeard Pirates} Leader and an active [Fullalead] Stage: rests it and Pizarro gets +4000 (1000 -> 5000)', () => {
    const g = start(SL.bbp, SS.fullaleadBlack);
    expect(pizPower(g)).toBe(1000);
    useAbility(g, at(g, 'p1', 'characters', PIZ));
    expect(waitingAtMain(g)).toBe(true);
    expect(stageRested(g)).toBe(true);
    expect(pizPower(g)).toBe(5000);
  });

  it('the cost names the card: the Blue [Fullalead] Stage pays it just the same', () => {
    const g = start(SL.bbp, SS.fullaleadBlue);
    useAbility(g, at(g, 'p1', 'characters', PIZ));
    expect(stageRested(g)).toBe(true);
    expect(pizPower(g)).toBe(5000);
  });

  it('a Leader without the type: the cost is paid (Stage rested), no power is gained (effect condition)', () => {
    const g = start(SL.shanks, SS.fullaleadBlack);
    useAbility(g, at(g, 'p1', 'characters', PIZ));
    expect(stageRested(g)).toBe(true);
    expect(pizPower(g)).toBe(1000);
  });

  it('with no [Fullalead] card the ability cannot be activated', () => {
    const g = start(SL.bbp);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PIZ))).toEqual([]);
  });

  it('another {Blackbeard Pirates} card that is not a [Fullalead] (a Character) does not pay the cost', () => {
    const g = mine(SL.bbp, { characters: [PIZ, SS.bbp4] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PIZ))).toEqual([]);
  });

  it('a [Fullalead] that is already rested cannot be rested again: not offered', () => {
    const g = start(SL.bbp, { card: SS.fullaleadBlack, rested: true });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PIZ))).toEqual([]);
  });

  it('once used, the ability is not offered again this turn, and is offered again next turn', () => {
    const g = start(SL.bbp, SS.fullaleadBlue);
    const piz = at(g, 'p1', 'characters', PIZ);
    useAbility(g, piz);
    expect(canActivate(g, piz)).toBe(false);
    toMyNextMain(g);
    expect(pizPower(g)).toBe(1000);
    expect(canActivate(g, piz)).toBe(true);
    useAbility(g, piz);
    expect(pizPower(g)).toBe(5000);
  });

  it('"during this turn": the +4000 is gone on the opponent\'s turn', () => {
    const g = start(SL.bbp, SS.fullaleadBlack);
    useAbility(g, at(g, 'p1', 'characters', PIZ));
    expect(pizPower(g)).toBe(5000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(pizPower(g)).toBe(1000);
  });

  it('the Once Per Turn is spent by a failed condition too: a non-matching Leader still uses it up (convention)', () => {
    const g = start(SL.shanks, SS.fullaleadBlack);
    const piz = at(g, 'p1', 'characters', PIZ);
    useAbility(g, piz);
    // The Stage is rested anyway, so the ability is not offered again; both reasons give the same answer.
    expect(canActivate(g, piz)).toBe(false);
  });

  it('only Pizarro gains the power; the Leader and the other Characters do not', () => {
    const g = mine(SL.bbp, {
      characters: [PIZ, SS.bbp4],
      stage: SS.fullaleadBlack,
    });
    useAbility(g, at(g, 'p1', 'characters', PIZ));
    expect(g.power(at(g, 'p1', 'characters', SS.bbp4))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('ST27-001 Avalo Pizarro: [On K.O.] draw 1 card', () => {
  function defend(extra: { hand?: string[] } = {}) {
    return theirs(
      SL.shanks,
      { characters: [{ card: PIZ, rested: true }], deck: fill(SS.c1, 10), ...extra },
      { characters: [SS.c5] },
    );
  }

  it("K.O.'d in battle: draws 1 card (hand +1, deck -1)", () => {
    const g = defend();
    expect(hand(g)).toEqual([]);
    defendNothing(g, at(g, 'p2', 'characters', SS.c5), at(g, 'p1', 'characters', PIZ));
    expect(charIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([PIZ]);
    expect(hand(g)).toEqual([SS.c1]);
    expect(n(g, 'p1', 'deck')).toBe(9);
  });

  it("K.O.'d by an effect (my own Teach): draws 1 card", () => {
    const g = mine(SL.shanks, { characters: [PIZ, ST27.teach], deck: fill(SS.c1, 10) });
    useAbility(g, at(g, 'p1', 'characters', ST27.teach));
    pickInst(g, [at(g, 'p1', 'characters', PIZ)]);
    expect(trash(g)).toEqual([PIZ]);
    expect(hand(g)).toEqual([SS.c1]);
  });

  it("with a {Blackbeard Pirates} Leader, K.O.'d by a 9000 attacker: still draws exactly 1", () => {
    const g = theirs(
      SL.bbp,
      { characters: [{ card: PIZ, rested: true }], deck: fill(SS.c1, 10) },
      { characters: [SS.oars9] },
    );
    defendNothing(g, at(g, 'p2', 'characters', SS.oars9), at(g, 'p1', 'characters', PIZ));
    expect(hand(g)).toEqual([SS.c1]);
  });

  it("must not draw when Pizarro leaves the field without being K.O.'d (returned to hand by an effect)", () => {
    const g = theirs(
      SL.shanks,
      { characters: [PIZ], deck: fill(SS.c1, 10) },
      { hand: [ROCKS.rocksEvent], costArea: { active: 5, rested: 0 } },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', ROCKS.rocksEvent) });
    if (offered(g, 'p2')) accept(g);
    payDon(g, 5);
    choose(g, [at(g, 'p1', 'characters', PIZ)]);
    expect(hand(g)).toEqual([PIZ]);
    expect(n(g, 'p1', 'deck')).toBe(10);
  });
});
