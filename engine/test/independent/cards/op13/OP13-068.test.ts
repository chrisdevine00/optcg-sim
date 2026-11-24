/**
 * OP13-068 Douglas Bullet (Character, Purple, cost 3, 4000, Counter +1000, {FILM}/{Former Roger Pirates}).
 *
 * Card text: "If you have 8 or more DON!! cards on your field, this Character gains +2000 power.
 * [On Play] If your Leader's type includes "Roger Pirates", add up to 1 DON!! card from your DON!!
 * deck and rest it."
 *
 * Rules: CR 3-1-2 ("the field" includes the cost area; DON!! given count as on the field), CR 2-4-3-1,
 * E-Q11 (the count), CR 3-9-3.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  atMain,
  ch,
  countOptions,
  defend,
  don,
  LD13,
  me,
  need,
  playRaw,
} from './kit-op13c.ts';

const ID = 'OP13-068';

/** p1's Main Phase with Bullet already on the field and `active`/`rested` DON!! in the cost area. */
function field(leader: string, active: number, rested = 0, given = 0, p2Active = 10) {
  return me(
    given ? { card: leader, don: given } : leader,
    { characters: [ID], costArea: { active, rested } },
    { costArea: { active: p2Active, rested: 0 } },
  );
}

describe('OP13-068 Douglas Bullet: +2000 power with 8 or more DON!! on my field', () => {
  it('7 DON!! on the field: 4000; 8 DON!!: 6000', () => {
    const seven = field(LD13.plain, 7);
    expect(seven.power(ch(seven, 'p1', ID))).toBe(4000);
    const eight = field(LD13.plain, 8);
    expect(eight.power(ch(eight, 'p1', ID))).toBe(6000);
  });

  it('rested DON!! count: 4 active + 4 rested is 8', () => {
    const g = field(LD13.plain, 4, 4);
    expect(g.power(ch(g, 'p1', ID))).toBe(6000);
  });

  it('DON!! given to my Leader count: 6 in the cost area + 2 given is 8', () => {
    const g = field(LD13.plain, 6, 0, 2);
    expect(g.power(ch(g, 'p1', ID))).toBe(6000);
  });

  it('boundary with given DON!!: 5 in the cost area + 2 given is 7, so 4000', () => {
    const g = field(LD13.plain, 5, 0, 2);
    expect(g.power(ch(g, 'p1', ID))).toBe(4000);
  });

  it('must not: the opponent’s DON!! do not count (10 on their field, 7 on mine)', () => {
    const g = field(LD13.plain, 7, 0, 0, 10);
    expect(g.power(ch(g, 'p1', ID))).toBe(4000);
  });

  it('the bonus applies on the opponent’s turn too', () => {
    const g = defend(LD13.plain, { characters: [ID], costArea: { active: 8, rested: 0 } });
    expect(g.power(ch(g, 'p1', ID))).toBe(6000);
  });
});

describe('OP13-068 Douglas Bullet: [On Play] if my Leader’s type includes "Roger Pirates", add up to 1 DON!! rested', () => {
  function play(leader: string, active = 7) {
    return me(leader, { hand: [ID], costArea: { active, rested: 0 } });
  }

  it('a {Former Roger Pirates} Leader: asks the count and adds 1 RESTED DON!!', () => {
    const g = play(LD13.rogerPiratesLeader);
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({
      active: before.active - 3,
      rested: before.rested + 3 + 1,
      deck: before.deck - 1,
    });
  });

  it('the added DON!! is the eighth on the field, so the power bonus turns on (7 + 1 = 8)', () => {
    const g = play(LD13.rogerPiratesLeader);
    playRaw(g, ID);
    expect(g.power(ch(g, 'p1', ID))).toBe(4000);
    addDon(g, 1);
    expect(g.power(ch(g, 'p1', ID))).toBe(6000);
  });

  it('choosing 0: no DON!! added, so the power stays 4000', () => {
    const g = play(LD13.rogerPiratesLeader);
    playRaw(g, ID);
    addDon(g, 0);
    expect(g.power(ch(g, 'p1', ID))).toBe(4000);
  });

  it('a Leader without a Roger Pirates type: nothing is added and no count is asked', () => {
    const g = play(LD13.plain);
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('with an empty DON!! deck the count is not asked', () => {
    const g = play(LD13.rogerPiratesLeader, 10);
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
  });
});
