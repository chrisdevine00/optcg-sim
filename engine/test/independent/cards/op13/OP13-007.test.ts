/**
 * OP13-007 Ace & Sabo & Luffy (Character, Red, cost 1, 1000, Counter +2000, {Goa Kingdom}, Strike).
 *
 * Card text: "[Activate: Main] You may give 1 of your active DON!! cards to 1 of your Leader or
 * Character cards and trash this Character: Give up to 1 of your opponent's Characters -3000 power
 * during this turn."
 *
 * Rules: CR 8-3 (a cost is paid in full or not at all; the "you may" cost is the player's choice
 * to activate), CR 8-1-2 ("up to"), -N power lasts to the end of the turn, a Character at 0 power
 * or less is not trashed by the rules.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  charsOfIds,
  don,
  donOn,
  endTurn,
  L13,
  mine,
  need,
  none,
  offeredAbilities,
  offeredInsts,
  pickInst,
  trash,
  useAbility,
  V13,
} from './kit-op13a.ts';

const AAL = 'OP13-007';

function board(
  o: { chars?: string[]; p2chars?: string[]; costArea?: { active: number; rested: number } } = {},
) {
  return mine(
    L13.luffy,
    { characters: [AAL, ...(o.chars ?? [])], costArea: o.costArea ?? { active: 5, rested: 3 } },
    { characters: o.p2chars ?? [V13.cobra0, V13.marco] },
  );
}
/** Activate and pay the cost, giving the DON!! to `to` (an instance); stops at the effect's target prompt. */
function activateGiving(g: ReturnType<typeof board>, to: string) {
  useAbility(g, at(g, 'p1', 'characters', AAL));
  need(g, 'choose', 'p1');
  pickInst(g, [to]);
}

describe('OP13-007 Ace & Sabo & Luffy: give 1 active DON!! and trash this: -3000', () => {
  it('printed values: cost 1, 1000, Counter +2000', () => {
    const g = board();
    const c = g.card(at(g, 'p1', 'characters', AAL));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(1000);
    expect(c.counter).toBe(2000);
  });

  it('paying: 1 active DON!! goes to the chosen Leader, this Character is trashed, an opposing Character gets -3000', () => {
    const g = board();
    const before = don(g);
    activateGiving(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V13.marco)]);
    need(g, 'main', 'p1');
    expect(donOn(g, g.leader('p1'))).toBe(1);
    expect(don(g)).toMatchObject({ given: 1, active: before.active - 1, rested: before.rested });
    expect(charsOfIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([AAL]);
    expect(g.power(at(g, 'p2', 'characters', V13.marco))).toBe(2000);
  });

  it('the DON!! may go to another Character of mine instead of the Leader', () => {
    const g = board({ chars: [V13.hajrudin] });
    const target = at(g, 'p1', 'characters', V13.hajrudin);
    useAbility(g, at(g, 'p1', 'characters', AAL));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toContain(g.leader('p1'));
    expect(offeredInsts(g)).toContain(target);
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
    pickInst(g, [target]);
    none(g);
    expect(donOn(g, target)).toBe(1);
    expect(g.power(target)).toBe(7000);
  });

  it('the cost is given from the ACTIVE DON!!: the active count drops, the rested count is unchanged', () => {
    const g = board({ costArea: { active: 2, rested: 6 } });
    activateGiving(g, g.leader('p1'));
    expect(don(g)).toMatchObject({ active: 1, rested: 6, given: 1 });
  });

  it('the DON!! may be given to this Character itself: it is then trashed and the DON!! returns to the cost area (rested)', () => {
    const g = board();
    const before = don(g);
    activateGiving(g, at(g, 'p1', 'characters', AAL));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V13.marco)]);
    expect(trash(g)).toEqual([AAL]);
    expect(don(g).given).toBe(0);
    expect(don(g)).toMatchObject({ active: before.active - 1, rested: before.rested + 1 });
    expect(g.power(at(g, 'p2', 'characters', V13.marco))).toBe(2000);
  });

  it('"up to 1": after paying, the target may be skipped; the cost stays paid', () => {
    const g = board();
    activateGiving(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    none(g);
    expect(charsOfIds(g, 'p1')).toEqual([]);
    expect(donOn(g, g.leader('p1'))).toBe(1);
    expect(g.power(at(g, 'p2', 'characters', V13.marco))).toBe(5000);
  });

  it('only opposing Characters are offered as the -3000 target (not the Leader, not mine)', () => {
    const g = board({ chars: [V13.hajrudin] });
    activateGiving(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g).sort()).toEqual(
      [at(g, 'p2', 'characters', V13.cobra0), at(g, 'p2', 'characters', V13.marco)].sort(),
    );
  });

  it('a Character at 0 power takes -3000 and stays on the field (no rule trashes it)', () => {
    const g = board();
    activateGiving(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', V13.cobra0)]);
    expect(g.power(at(g, 'p2', 'characters', V13.cobra0))).toBe(-3000);
    expect(charsOfIds(g, 'p2')).toEqual([V13.cobra0, V13.marco].sort());
  });

  it("-3000 lasts this turn only: at the opponent's turn the power is back", () => {
    const g = board();
    activateGiving(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', V13.marco)]);
    expect(g.power(at(g, 'p2', 'characters', V13.marco))).toBe(2000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p2', 'characters', V13.marco))).toBe(5000);
  });

  it('with no active DON!! the cost cannot be paid: nothing is trashed, nothing given, no -3000', () => {
    const g = board({ costArea: { active: 0, rested: 8 } });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', AAL))).toEqual([]);
    expect(charsOfIds(g, 'p1')).toEqual([AAL]);
    expect(don(g).given).toBe(0);
  });

  it('with exactly 1 active DON!! the cost can be paid', () => {
    const g = board({ costArea: { active: 1, rested: 7 } });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', AAL)).length).toBe(1);
    activateGiving(g, g.leader('p1'));
    expect(don(g)).toMatchObject({ active: 0, given: 1 });
  });

  it('must not: the opposing Leader and my own Characters are unchanged', () => {
    const g = board({ chars: [V13.hajrudin] });
    activateGiving(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', V13.marco)]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', V13.hajrudin))).toBe(6000);
    expect(cardIds(g, 'p1', 'trash')).toEqual([AAL]);
  });
});
