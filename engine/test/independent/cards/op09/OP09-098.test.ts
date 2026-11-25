/**
 * OP09-098 Black Hole (Event, Black, cost 4, {Blackbeard Pirates}).
 *
 * Card text: "[Main] If your Leader has the "Blackbeard Pirates" type, negate the effect of up to 1 of
 * your opponent's Characters during this turn. Then, if that Character has a cost of 4 or less, K.O. it.
 * [Trigger] Negate the effect of up to 1 of your opponent's Leader or Character cards during this turn."
 *
 * Rules: a colon-less "If" is an effect condition; "Then" after a failed "If" does not resolve; a
 * negated card loses its effects and keywords until the end of the turn; "up to 1".
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  attack,
  blockers,
  BLUE,
  C9,
  chars,
  choices,
  endTurn,
  hand,
  hitLeader,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playId,
  reachablePickSets,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-098';

function start(o: { leader?: string; opp?: string[]; mine?: string[]; active?: number } = {}) {
  const g = mine(
    o.leader ?? L9.bb,
    { hand: [ID], characters: o.mine ?? [], costArea: { active: o.active ?? 10, rested: 0 } },
    { characters: o.opp ?? [C9.franky, C9.doubleAtk] },
  );
  playId(g, ID);
  return g;
}

describe('OP09-098 Black Hole: [Main] with a {Blackbeard Pirates} Leader, negate up to 1 opposing Character, then K.O. it if its cost is 4 or less', () => {
  it("cost 4 (Franky): negated, then K.O.'d (it goes to the trash)", () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', C9.franky)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.doubleAtk]);
    expect(trash(g, 'p2')).toEqual([C9.franky]);
    expect(trash(g)).toEqual([ID]);
  });

  it("boundary: cost 6 (Double Attack Luffy): negated (loses [Double Attack]) but NOT K.O.'d", () => {
    const g = start();
    const luffy = g.find('p2', 'characters', C9.doubleAtk);
    expect(g.card(luffy).keywords).toContain('Double Attack');
    pickInst(g, [luffy]);
    expect(chars(g, 'p2')).toEqual([C9.doubleAtk, C9.franky].sort());
    expect(g.card(luffy).keywords).not.toContain('Double Attack');
    expect(g.power(luffy)).toBe(7000);
  });

  it("boundary: cost 5 is above the limit: negated, not K.O.'d", () => {
    const g = start({ opp: [C9.c5] });
    pickInst(g, [g.find('p2', 'characters', C9.c5)]);
    expect(chars(g, 'p2')).toEqual([C9.c5]);
  });

  it("boundary: cost 4 is within the limit even for a plain Character (Hajrudin, cost 4): K.O.'d", () => {
    const g = start({ opp: [C9.c4] });
    pickInst(g, [g.find('p2', 'characters', C9.c4)]);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('only opposing Characters are candidates: not the opposing Leader, not my Characters', () => {
    const g = start({ mine: [C9.c2] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.doubleAtk, C9.franky].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": choosing nothing negates and K.O.s nothing; never more than one target', () => {
    const g = start();
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    none(g);
    expect(chars(g, 'p2')).toEqual([C9.doubleAtk, C9.franky].sort());
    expect(g.card(g.find('p2', 'characters', C9.franky)).keywords).toContain('Blocker');
  });

  it("a Leader without {Blackbeard Pirates}: no target is asked, nothing is negated or K.O.'d, the Event is still spent", () => {
    const g = start({ leader: L9.neutral });
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.doubleAtk, C9.franky].sort());
    expect(g.card(g.find('p2', 'characters', C9.franky)).keywords).toContain('Blocker');
    expect(trash(g)).toEqual([ID]);
  });

  it("the negation ends with the turn: the cost-6 Character has [Double Attack] again on the opponent's turn", () => {
    const g = start();
    const luffy = g.find('p2', 'characters', C9.doubleAtk);
    pickInst(g, [luffy]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(luffy).keywords).toContain('Double Attack');
  });

  it('a negated cost-5 [Blocker] cannot block this turn (and an un-negated one can)', () => {
    const SHC_BLOCKER = 'OP05-066'; // Purple, cost 5, 6000, [Blocker]
    const control = mine(L9.neutral, { characters: [C9.c4] }, { characters: [SHC_BLOCKER] });
    attack(control, control.find('p1', 'characters', C9.c4), control.leader('p2'));
    need(control, 'block', 'p2');
    expect(blockers(control)).toEqual([control.find('p2', 'characters', SHC_BLOCKER)]);

    const g = mine(L9.bb, { hand: [ID], characters: [C9.c4] }, { characters: [SHC_BLOCKER] });
    playId(g, ID);
    pickInst(g, [g.find('p2', 'characters', SHC_BLOCKER)]);
    expect(chars(g, 'p2')).toEqual([SHC_BLOCKER]);
    attack(g, g.find('p1', 'characters', C9.c4), g.leader('p2'));
    if (kind(g) === 'block') expect(blockers(g)).toEqual([]);
    else expect(kind(g)).toBe('counter');
  });

  it('it costs 4 DON!!: with 3 active DON!! it cannot be played', () => {
    const g = mine(
      L9.bb,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [C9.franky] },
    );
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe('OP09-098 [Trigger] negate the effect of up to 1 opposing Leader or Character during this turn', () => {
  function hit() {
    const g = theirs(L9.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [C9.franky] });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it("offers the opposing Leader and Characters; the chosen Character loses [Blocker] but is NOT K.O.'d", () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.franky, 'ST01-001'].sort());
    pickInst(g, [g.find('p2', 'characters', C9.franky)]);
    expect(g.card(g.find('p2', 'characters', C9.franky)).keywords).not.toContain('Blocker');
    expect(chars(g, 'p2')).toEqual([C9.franky]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining puts the Event into my hand', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(g.card(g.find('p2', 'characters', C9.franky)).keywords).toContain('Blocker');
  });
});
