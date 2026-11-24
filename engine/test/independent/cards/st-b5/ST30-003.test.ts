/**
 * ST30-003 Edward.Newgate (Character, Red, cost 8, 6000, Counter +1000, {The Four Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[Your Turn] All of your Characters with 6000 base power gain +1000 power."
 *
 * Rules: [Your Turn] holds during my own turn only (CR 8-3-2-4), "base power" ignores DON!! and
 * modifiers (CR 4-9-2), "6000 base power" is exactly 6000 (RL-49), "Characters" excludes Leaders,
 * a permanent effect stops when its source leaves the field (CR 8-1-3-3), two sources stack.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, KO_SRC, squardKo, mine, noDefence, pw, SL, theirs } from './kit-stb5a.ts';

const ID = 'ST30-003';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const JIL = 'OP03-006'; // Red, cost 4, 6000
const KING = 'OP02-006'; // Red, cost 5, 7000
const MARCO = 'OP01-023'; // Red, cost 3, 5000
const LEADER6000 = 'OP02-001'; // Edward.Newgate Leader, Red, 6000, 6 Life

describe('ST30-003 Edward.Newgate: [Your Turn] my Characters with 6000 base power gain +1000', () => {
  it('on my turn a 6000-base Character gains +1000, and so does Newgate itself', () => {
    const g = mine(SL.luffy, { characters: [ID, HAJ] });
    expect(pw(g, 'p1', HAJ)).toBe(7000);
    expect(pw(g, 'p1', ID)).toBe(7000);
  });

  it('every such Character gains it, not only one', () => {
    const g = mine(SL.luffy, { characters: [ID, HAJ, JIL] });
    expect(pw(g, 'p1', HAJ)).toBe(7000);
    expect(pw(g, 'p1', JIL)).toBe(7000);
  });

  it('a 7000-base and a 5000-base Character are unaffected (exactly 6000)', () => {
    const g = mine(SL.luffy, { characters: [ID, KING, MARCO] });
    expect(pw(g, 'p1', KING)).toBe(7000);
    expect(pw(g, 'p1', MARCO)).toBe(5000);
  });

  it("not on the opponent's turn: the same Characters are at base power", () => {
    const g = theirs(SL.luffy, { characters: [ID, HAJ] }, {});
    expect(pw(g, 'p1', HAJ)).toBe(6000);
    expect(pw(g, 'p1', ID)).toBe(6000);
  });

  it('the effect returns when my turn comes round again and is off in between', () => {
    const g = mine(SL.luffy, { characters: [ID, HAJ] });
    act(g, { type: 'endTurn' });
    expect(pw(g, 'p1', HAJ)).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(pw(g, 'p1', HAJ)).toBe(7000);
  });

  it('it checks base power: a 5000-base Character with 1 DON!! (6000 power) does not gain', () => {
    const g = mine(SL.luffy, {
      characters: [ID, { card: MARCO, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    expect(pw(g, 'p1', MARCO)).toBe(6000);
  });

  it('a 6000-base Character with 1 DON!! gains the +1000 on top of the DON!!', () => {
    const g = mine(SL.luffy, {
      characters: [ID, { card: HAJ, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    expect(pw(g, 'p1', HAJ)).toBe(8000);
  });

  it("only Characters: my 6000-power Leader and the opponent's 6000-base Characters are unaffected", () => {
    const g = mine(LEADER6000, { characters: [ID] }, { characters: [HAJ] });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(pw(g, 'p2', HAJ)).toBe(6000);
  });

  it('two Newgates stack: each gives +1000 to every 6000-base Character', () => {
    const g = mine(SL.luffy, { characters: [ID, ID, HAJ] });
    expect(pw(g, 'p1', HAJ)).toBe(8000);
  });

  it('the +1000 turns a lost attack into a won one (7000 vs a rested 7000 Character)', () => {
    const g = mine(
      SL.luffy,
      { characters: [ID, HAJ] },
      { characters: [{ card: KING, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', HAJ), g.find('p2', 'characters', KING));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('without Newgate the same attack fails (6000 vs 7000)', () => {
    const g = mine(SL.luffy, { characters: [HAJ] }, { characters: [{ card: KING, rested: true }] });
    attack(g, g.find('p1', 'characters', HAJ), g.find('p2', 'characters', KING));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('when Newgate is K.O.d (opponent turn) the bonus does not come back on my next turn', () => {
    const g = theirs(
      SL.luffy,
      { characters: [ID, HAJ] },
      { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
    );
    squardKo(g, g.find('p1', 'characters', ID));
    act(g, { type: 'endTurn' });
    expect(pw(g, 'p1', HAJ)).toBe(6000);
  });

  it('control: with Newgate alive the same turn sequence gives 7000 on my next turn', () => {
    const g = theirs(SL.luffy, { characters: [ID, HAJ] });
    act(g, { type: 'endTurn' });
    expect(pw(g, 'p1', HAJ)).toBe(7000);
  });
});
