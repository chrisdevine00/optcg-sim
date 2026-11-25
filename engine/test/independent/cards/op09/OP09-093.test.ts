/**
 * OP09-093 Marshall.D.Teach (Character, Black, cost 10, 12000, no Counter, {Blackbeard Pirates}/
 * {The Four Emperors}, Special).
 *
 * Card text: "[Blocker]
 * [Activate: Main] [Once Per Turn] If your Leader has the "Blackbeard Pirates" type and this
 * Character was played on this turn, negate the effect of up to 1 of your opponent's Leader during
 * this turn. Then, negate the effect of up to 1 of your opponent's Characters and that Character
 * cannot attack until the end of your opponent's next turn."
 *
 * Rules: there is no colon, so the "If" is an effect condition: the ability can be activated and its
 * Once Per Turn is spent even when the check fails (DECISIONS 2026-11-24). A negated card's effects
 * (including its keywords and continuous effects) do not apply (CR 8-2). "Until the end of your
 * opponent's next turn" lasts through that whole turn and ends with it (RL-11, QA-OP09 OP09-093).
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  actRaw,
  atMain,
  attack,
  blockers,
  canHit,
  chr,
  endTurn,
  kind,
  LD9,
  mayEnd,
  mine,
  need,
  none,
  offeredIds,
  offeredInsts,
  pickInst,
  playRaw,
  SC9,
} from './kit-op09c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const TEACH = 'OP09-093';
const VASCO = SC9.vasco; // OP09-091: [Blocker]

type P2 = { characters?: string[]; life?: string[] };

function board(
  leader: string = LD9.bbp,
  o: { fresh?: boolean; p2?: P2; p2Leader?: string; own?: string[] } = {},
): TestGame {
  const fresh = o.fresh ?? true;
  return mine(
    leader,
    { characters: [{ card: TEACH, playedThisTurn: fresh }, ...(o.own ?? [])] },
    { characters: [SC9.c4, SC9.c3], life: [SC9.c1], ...(o.p2 ?? {}) },
    o.p2Leader ?? LD9.bonney,
  );
}

function teach(g: TestGame) {
  return chr(g, 'p1', TEACH);
}

/** Activate and negate the opponent's Leader, then the Character `target`. */
function negateBoth(g: TestGame, target: string) {
  actRaw(g, teach(g));
  need(g, 'choose', 'p1');
  pickInst(g, [g.leader('p2')]);
  need(g, 'choose', 'p1');
  pickInst(g, [chr(g, 'p2', target)]);
}

describe('OP09-093 Marshall.D.Teach: [Blocker]; [Activate: Main] [Once Per Turn] negate their Leader, then a Character', () => {
  it('printed values: cost 10, 12000, no Counter, keyword [Blocker]', () => {
    const g = board();
    const c = g.card(teach(g));
    expect(c.cost).toBe(10);
    expect(c.power).toBe(12000);
    expect(c.counter ?? null).toBeNull();
    expect(c.keywords).toContain('Blocker');
  });

  it('after playing it from hand this turn (10 DON!!), the ability is offered', () => {
    const g = mine(LD9.bbp, { hand: [TEACH], costArea: { active: 10, rested: 0 } }, {});
    playRaw(g, TEACH);
    expect(atMain(g)).toBe(true);
    expect(abil(g, teach(g))).toHaveLength(1);
  });

  it("negates the opponent's Leader this turn: a Leader whose [Opponent's Turn] +2000 applies loses it", () => {
    const g = board();
    expect(g.power(g.leader('p2'))).toBe(7000); // 1 Life: +2000 on my turn
    actRaw(g, teach(g));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p2')]);
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).negated).toBe(true);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it("then offers only the opponent's Characters for the second negation, and negates the chosen one", () => {
    const g = board(LD9.bbp, { own: [SC9.c5] });
    actRaw(g, teach(g));
    pickInst(g, [g.leader('p2')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC9.c3, SC9.c4].sort());
    expect(offeredInsts(g)).not.toContain(chr(g, 'p1', SC9.c5));
    expect(offeredInsts(g)).not.toContain(teach(g));
    pickInst(g, [chr(g, 'p2', SC9.c4)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c4)).negated).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c3)).negated).toBeFalsy();
  });

  it("the negated Character cannot attack on the opponent's next turn, the others can", () => {
    const g = board();
    negateBoth(g, SC9.c4);
    expect(atMain(g)).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canHit(g, chr(g, 'p2', SC9.c4), g.leader('p1'))).toBe(false);
    expect(canHit(g, chr(g, 'p2', SC9.c3), g.leader('p1'))).toBe(true);
  });

  it("the attack ban ends with the opponent's next turn: they can attack with it the turn after", () => {
    const g = board();
    negateBoth(g, SC9.c4);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canHit(g, chr(g, 'p2', SC9.c4), g.leader('p1'))).toBe(true);
  });

  it('a negated Blocker cannot block this turn (the Character really has no effect)', () => {
    const g = board(LD9.bbp, { p2: { characters: [VASCO] }, own: [SC9.c4] });
    // Control: without the negation Vasco Shot is offered as a blocker.
    const control = board(LD9.bbp, { p2: { characters: [VASCO] }, own: [SC9.c4] });
    attack(control, chr(control, 'p1', SC9.c4), control.leader('p2'));
    expect(blockers(control)).toContain(chr(control, 'p2', VASCO));
    negateBoth(g, VASCO);
    attack(g, chr(g, 'p1', SC9.c4), g.leader('p2'));
    if (kind(g) === 'block') expect(blockers(g)).not.toContain(chr(g, 'p2', VASCO));
  });

  it('"up to 1": the Leader negation may be skipped for the Character one; the Leader stays un-negated', () => {
    const g = board();
    actRaw(g, teach(g));
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    // Either the Character prompt follows or the whole effect ended; the Leader is not negated.
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.power(g.leader('p2'))).toBe(7000);
  });

  it('"up to 1": the Character negation may be skipped; the Leader stays negated and nobody is barred from attacking', () => {
    const g = board();
    actRaw(g, teach(g));
    pickInst(g, [g.leader('p2')]);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p2')).negated).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c4)).negated).toBeFalsy();
    endTurn(g);
    expect(canHit(g, chr(g, 'p2', SC9.c4), g.leader('p1'))).toBe(true);
  });

  it('[Once Per Turn]: after one use it is not offered again this turn', () => {
    const g = board();
    negateBoth(g, SC9.c4);
    expect(abil(g, teach(g))).toEqual([]);
  });

  it('not played this turn: the ability is still offered and spends its Once Per Turn, but nothing is negated', () => {
    const g = board(LD9.bbp, { fresh: false });
    expect(abil(g, teach(g))).toHaveLength(1);
    actRaw(g, teach(g));
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    if (kind(g) === 'choose') none(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.power(g.leader('p2'))).toBe(7000);
    expect(g.card(chr(g, 'p2', SC9.c4)).negated).toBeFalsy();
    expect(abil(g, teach(g))).toEqual([]);
  });

  it('a Leader without {Blackbeard Pirates}: nothing is negated even when played this turn', () => {
    const g = board(LD9.luffy);
    expect(abil(g, teach(g))).toHaveLength(1);
    actRaw(g, teach(g));
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    if (kind(g) === 'choose') none(g);
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.power(g.leader('p2'))).toBe(7000);
  });

  it('must not negate my own Leader or Characters (Teach keeps [Blocker])', () => {
    const g = board();
    negateBoth(g, SC9.c4);
    expect(g.card(g.leader('p1')).negated).toBeFalsy();
    expect(g.card(teach(g)).negated).toBeFalsy();
    expect(g.card(teach(g)).keywords).toContain('Blocker');
  });

  it("is not offered during the opponent's turn", () => {
    const g = board();
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.legal().some((a) => a.type === 'activate' && a.card === teach(g))).toBe(false);
  });
});
