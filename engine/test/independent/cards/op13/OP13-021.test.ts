/**
 * OP13-021 Gum-Gum Gatling Gun (Event, Red, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Main] Give up to 1 rested DON!! card to 1 of your [Monkey.D.Luffy] cards. Then, give up
 * to 1 of your opponent's Characters -2000 power during this turn.
 * [Trigger] Give up to 1 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: a given DON!! is +1000 power on my turn (CR 6-5-5-2); "up to" may be skipped (CR 8-1-2);
 * -N power lasts to the end of the turn; a [Trigger] is activated instead of adding the Life card
 * to hand. Whether the "Then" part still resolves after "up to 1" chose nothing is not pinned
 * down by the rules on file, so the "give nothing" test asserts only the DON!! side.
 * M6b-Q32 (state of a given DON!!) is open: only totals are asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  charsOfIds,
  declineTrigger,
  don,
  donOn,
  endTurn,
  hand,
  kind,
  L13,
  mine,
  need,
  noDefenceUntilTrigger,
  none,
  offeredInsts,
  pickInst,
  playRaw,
  theirs,
  trash,
  V13,
} from './kit-op13a.ts';

const GATLING = 'OP13-021';

function board(p2chars: string[], chars: string[] = [], leader: string = L13.luffy) {
  return mine(
    leader,
    { hand: [GATLING], characters: chars, costArea: { active: 8, rested: 0 } },
    { characters: p2chars },
  );
}
const p2c = (g: ReturnType<typeof board>, card: string, nth = 0) =>
  at(g, 'p2', 'characters', card, nth);

function triggerBoard() {
  const g = theirs(
    L13.luffy,
    { life: [GATLING, V13.mohji, V13.mohji], costArea: { active: 5, rested: 0 } },
    { characters: [V13.thatch, V13.marco] },
  );
  attack(g, at(g, 'p2', 'characters', V13.thatch), g.leader('p1'));
  noDefenceUntilTrigger(g);
  return g;
}

describe('OP13-021 Gum-Gum Gatling Gun: [Main] give a rested DON!! to my Luffy, then -2000', () => {
  it('printed values: Event, cost 1', () => {
    const g = board([]);
    expect(g.card(at(g, 'p1', 'hand', GATLING)).cost).toBe(1);
  });

  it('gives 1 rested DON!! to my [Monkey.D.Luffy] Leader (+1000 on my turn), then -2000 to an opposing Character', () => {
    const g = board([V13.marco]);
    playRaw(g, GATLING);
    expect(don(g)).toMatchObject({ rested: 1, active: 7 });
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(donOn(g, g.leader('p1'))).toBe(1);
    expect(don(g)).toMatchObject({ given: 1, rested: 0, active: 7 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    need(g, 'choose', 'p1');
    pickInst(g, [p2c(g, V13.marco)]);
    expect(g.power(p2c(g, V13.marco))).toBe(3000);
    expect(trash(g)).toEqual([GATLING]);
  });

  it('the DON!! is a rested one: the active DON!! count is unchanged', () => {
    const g = board([V13.marco]);
    playRaw(g, GATLING);
    pickInst(g, [g.leader('p1')]);
    expect(don(g).active).toBe(7);
  });

  it('only cards named [Monkey.D.Luffy] can receive it: Leader and Luffy Character, not other names or the opposing Luffy', () => {
    const g = board([V13.marco], [V13.luffy, V13.ace]);
    playRaw(g, GATLING);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V13.luffy)].sort());
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
    pickInst(g, [at(g, 'p1', 'characters', V13.luffy)]);
    expect(donOn(g, at(g, 'p1', 'characters', V13.luffy))).toBe(1);
    expect(donOn(g, g.leader('p1'))).toBe(0);
  });

  it('"up to 1": the DON!! may be left where it is', () => {
    const g = board([V13.marco]);
    playRaw(g, GATLING);
    need(g, 'choose', 'p1');
    none(g);
    expect(don(g).given).toBe(0);
    expect(donOn(g, g.leader('p1'))).toBe(0);
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
  });

  it('the -2000 target is an opposing Character only (not their Leader, not mine), at most one', () => {
    const g = board([V13.marco, V13.kingdew], [V13.luffy]);
    playRaw(g, GATLING);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g).sort()).toEqual([p2c(g, V13.marco), p2c(g, V13.kingdew)].sort());
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
    pickInst(g, [p2c(g, V13.kingdew)]);
    expect(g.power(p2c(g, V13.kingdew))).toBe(5000);
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
  });

  it('a 2000-power Character goes to 0 and stays on the field', () => {
    const g = board([V13.higumaB]);
    playRaw(g, GATLING);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [p2c(g, V13.higumaB)]);
    expect(g.power(p2c(g, V13.higumaB))).toBe(0);
    expect(charsOfIds(g, 'p2')).toEqual([V13.higumaB]);
  });

  it("the -2000 lasts this turn only: back on the opponent's turn", () => {
    const g = board([V13.marco]);
    playRaw(g, GATLING);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [p2c(g, V13.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
  });
});

describe('OP13-021 Gum-Gum Gatling Gun: [Trigger] up to 1 opposing Character -2000', () => {
  it('as a Life card hit by an attack, the [Trigger] is offered', () => {
    const g = triggerBoard();
    need(g, 'trigger', 'p1');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(true);
  });

  it('activating: -2000 to an opposing Character, no DON!! given, the Event is trashed', () => {
    const g = triggerBoard();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [p2c(g, V13.marco)]);
    expect(g.power(p2c(g, V13.marco))).toBe(3000);
    expect(don(g).given).toBe(0);
    expect(trash(g)).toEqual([GATLING]);
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": the target may be skipped', () => {
    const g = triggerBoard();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
  });

  it('declining the [Trigger]: the Event goes to hand and nothing changes', () => {
    const g = triggerBoard();
    declineTrigger(g);
    expect(hand(g)).toEqual([GATLING]);
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
  });
});
