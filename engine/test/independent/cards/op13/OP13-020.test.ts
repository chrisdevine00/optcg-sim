/**
 * OP13-020 Meteor Fist (Event, Red, cost 3, {Navy}).
 *
 * Card text: "[Main] Give up to 1 of your opponent's Characters -5000 power during this turn.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-1-2 ("up to"), -N power lasts to the end of the turn, a Character at 0 power or less
 * stays on the field; a [Trigger] is activated instead of adding the Life card to hand (CR 4-6-3)
 * and the Event is then trashed; its cost is not paid.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  cardIds,
  charsOfIds,
  declineTrigger,
  don,
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

const METEOR = 'OP13-020';

function board(p2chars: string[], chars: string[] = []) {
  return mine(
    L13.luffy,
    { hand: [METEOR], characters: chars, costArea: { active: 10, rested: 0 } },
    { characters: p2chars },
  );
}
const p2c = (g: ReturnType<typeof board>, card: string, nth = 0) =>
  at(g, 'p2', 'characters', card, nth);

/** p2 hits my Leader with Thatch; my top Life card is Meteor Fist. Stops at the [Trigger] decision. */
function triggerBoard(p2chars: string[] = [V13.thatch, V13.marco]) {
  const g = theirs(
    L13.luffy,
    { life: [METEOR, V13.mohji, V13.mohji], costArea: { active: 5, rested: 0 } },
    { characters: p2chars },
  );
  attack(g, at(g, 'p2', 'characters', V13.thatch), g.leader('p1'));
  noDefenceUntilTrigger(g);
  return g;
}

describe('OP13-020 Meteor Fist: [Main] up to 1 opposing Character -5000 this turn', () => {
  it('printed values: Event, cost 3', () => {
    const g = board([]);
    expect(g.card(at(g, 'p1', 'hand', METEOR)).cost).toBe(3);
  });

  it('gives the chosen opposing Character -5000, costs 3 DON!!, and the Event is trashed', () => {
    const g = board([V13.kingdew, V13.marco]);
    playRaw(g, METEOR);
    need(g, 'choose', 'p1');
    pickInst(g, [p2c(g, V13.kingdew)]);
    need(g, 'main', 'p1');
    expect(g.power(p2c(g, V13.kingdew))).toBe(2000);
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
    expect(don(g)).toMatchObject({ rested: 3, active: 7 });
    expect(cardIds(g, 'p1', 'trash')).toEqual([METEOR]);
  });

  it('"up to 1": may be played for no target', () => {
    const g = board([V13.kingdew]);
    playRaw(g, METEOR);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(p2c(g, V13.kingdew))).toBe(7000);
    expect(cardIds(g, 'p1', 'trash')).toEqual([METEOR]);
  });

  it('only opposing Characters are offered: not their Leader, not my own Characters', () => {
    const g = board([V13.kingdew], [V13.marco]);
    playRaw(g, METEOR);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([p2c(g, V13.kingdew)]);
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
  });

  it('one target only: the other opposing Character is untouched', () => {
    const g = board([V13.kingdew, V13.kingdew]);
    playRaw(g, METEOR);
    pickInst(g, [p2c(g, V13.kingdew, 0)]);
    const powers = g
      .zone('p2', 'characters')
      .map((c) => g.power(c.instance))
      .sort();
    expect(powers).toEqual([2000, 7000]);
  });

  it('power may go below 0 and the Character stays on the field (Cobra 0 -> -5000)', () => {
    const g = board([V13.cobra0]);
    playRaw(g, METEOR);
    pickInst(g, [p2c(g, V13.cobra0)]);
    expect(g.power(p2c(g, V13.cobra0))).toBe(-5000);
    expect(charsOfIds(g, 'p2')).toEqual([V13.cobra0]);
  });

  it("-5000 lasts this turn only: back to the printed power on the opponent's turn", () => {
    const g = board([V13.kingdew]);
    playRaw(g, METEOR);
    pickInst(g, [p2c(g, V13.kingdew)]);
    expect(g.power(p2c(g, V13.kingdew))).toBe(2000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(p2c(g, V13.kingdew))).toBe(7000);
  });

  it('the opposing Leader is not changed', () => {
    const g = board([V13.kingdew]);
    playRaw(g, METEOR);
    pickInst(g, [p2c(g, V13.kingdew)]);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});

describe('OP13-020 Meteor Fist: [Trigger] activate its [Main] effect', () => {
  it('as a Life card hit by an attack, the [Trigger] is offered', () => {
    const g = triggerBoard();
    need(g, 'trigger', 'p1');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(true);
  });

  it('activating: an opposing Character gets -5000 (this turn), the Event goes to the trash, no DON!! is paid', () => {
    const g = triggerBoard();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g).sort()).toEqual([p2c(g, V13.thatch), p2c(g, V13.marco)].sort());
    pickInst(g, [p2c(g, V13.marco)]);
    expect(g.power(p2c(g, V13.marco))).toBe(0);
    expect(trash(g)).toEqual([METEOR]);
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 5, rested: 0 });
  });

  it('declining: the Event goes to my hand and nothing changes', () => {
    const g = triggerBoard();
    declineTrigger(g);
    expect(hand(g)).toEqual([METEOR]);
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": the activated effect may pick nobody', () => {
    const g = triggerBoard();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(p2c(g, V13.marco))).toBe(5000);
    expect(trash(g)).toEqual([METEOR]);
  });
});
