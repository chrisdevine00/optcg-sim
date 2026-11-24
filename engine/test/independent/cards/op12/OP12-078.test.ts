/**
 * OP12-078 Brochette Blow (Event, Purple, cost 3, {Straw Hat Crew}).
 *
 * Card text: "[Main] If the number of DON!! cards on your field is equal to or less than the number on
 * your opponent's field, draw 1 card. Then, give up to 1 of your opponent's Characters -3000 power
 * during this turn."
 *
 * Rules: CR 3-1-2 (the field includes the cost area; given DON!! are on the field), CR 4-8-1 ("up to"
 * allows 0), CR 6-6-1-3 ("during this turn"), M4b-5 (a "Then" after a failed "If" does not resolve).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  hand,
  kind,
  LDR,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SCN,
  trash,
} from './kit-op12c.ts';

const EVENT = 'OP12-078';

/** p1 holds the Event with `own` active DON!!, p2 has `opp` active DON!! and the given Characters. */
function start(own: number, opp: number, oppChars: string[] = [SCN.c4], myDon = 0) {
  return mine(
    { card: LDR.luffy, don: myDon },
    { hand: [EVENT], costArea: { active: own, rested: 0 } },
    { characters: oppChars, costArea: { active: opp, rested: 0 } },
  );
}

describe('OP12-078 Brochette Blow: [Main] DON!! comparison, draw 1, then -3000', () => {
  it('fewer DON!! than the opponent: draws 1, then -3000 on the chosen opposing Character this turn', () => {
    const g = start(4, 6);
    playRaw(g, EVENT);
    expect(hand(g)).toEqual(['OP02-060']);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(3000);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('boundary: equal DON!! counts (cost paid still counts: rested DON!! are on the field)', () => {
    const g = start(10, 10);
    playRaw(g, EVENT);
    expect(hand(g)).toEqual(['OP02-060']);
    need(g, 'choose', 'p1');
  });

  it('boundary: one DON!! more than the opponent: nothing is drawn and the "Then" does not resolve', () => {
    const g = start(10, 9);
    playRaw(g, EVENT);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('DON!! given to my Leader count as on my field (4 in the cost area + 3 given vs 6)', () => {
    const g = start(4, 6, [SCN.c4], 3);
    playRaw(g, EVENT);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('DON!! given to the opponent count on their field (3 in the cost area + 2 given vs my 5)', () => {
    const g = mine(
      LDR.luffy,
      { hand: [EVENT], costArea: { active: 5, rested: 0 } },
      {
        leader: { card: LDR.luffy, don: 2 },
        characters: [SCN.c4],
        costArea: { active: 3, rested: 0 },
      },
    );
    playRaw(g, EVENT);
    expect(hand(g)).toEqual(['OP02-060']);
  });

  it('"up to 1": the Characters are offered and may be skipped; the card is still drawn', () => {
    const g = start(3, 3, [SCN.c4, SCN.c6]);
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c4, SCN.c6].sort());
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual(['OP02-060']);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
    expect(g.power(at(g, 'p2', 'characters', SCN.c6))).toBe(8000);
  });

  it("only opposing Characters: not the opponent's Leader and not my own Characters", () => {
    const g = mine(
      LDR.luffy,
      { hand: [EVENT], characters: [SCN.c3], costArea: { active: 3, rested: 0 } },
      { characters: [SCN.c4], costArea: { active: 3, rested: 0 } },
    );
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c4]);
    pickCards(g, [SCN.c4]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(5000);
  });

  it('with no opposing Characters the card is drawn and nothing more is asked', () => {
    const g = start(3, 3, []);
    playRaw(g, EVENT);
    expect(hand(g)).toEqual(['OP02-060']);
    expect(atMain(g)).toBe(true);
  });

  it('the -3000 lasts this turn only', () => {
    const g = start(3, 3, [SCN.c4]);
    playRaw(g, EVENT);
    pickCards(g, [SCN.c4]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(3000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('must not: a 3000-power Character at 0 power is not K.O.d by the reduction', () => {
    const g = start(3, 3, [SCN.c1]);
    playRaw(g, EVENT);
    pickCards(g, [SCN.c1]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c1))).toBe(0);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
