/**
 * EB04-004 Zeff (Character, Red, cost 7, 8000, no Counter, {East Blue}).
 *
 * Card text: "[When Attacking] Your Leader's base power becomes 7000 until the end of your
 * opponent's next End Phase."
 *
 * Rules: "becomes" sets base power (DON!! and +/- are added on top); a duration "until the end of
 * your opponent's next End Phase" created on my turn lasts through the opponent's turn and ends at
 * their End Phase; the effect is automatic (no "up to", no "may").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  endTurn,
  kind,
  LE,
  mine,
  noDefence,
  passBlock,
  passCounter,
  SN,
} from './kit-eb04a.ts';

const ZEFF = 'EB04-004';
const leader = (g: ReturnType<typeof mine>) => g.power(g.leader('p1'));

function swing(g: ReturnType<typeof mine>, target: 'leader' | 'char' = 'leader') {
  const t = target === 'leader' ? g.leader('p2') : at(g, 'p2', 'characters', SN.c1);
  attack(g, at(g, 'p1', 'characters', ZEFF), t);
}

describe('EB04-004 Zeff: [When Attacking] Leader base power becomes 7000 until the end of the opponent next End Phase', () => {
  it('printed values: cost 7, 8000', () => {
    const g = mine(LE.luffy, { characters: [ZEFF] }, {});
    const c = g.card(at(g, 'p1', 'characters', ZEFF));
    expect(c.cost).toBe(7);
    expect(c.power).toBe(8000);
  });

  it('attacking raises a 5000 Leader to 7000 at once', () => {
    const g = mine(LE.luffy, { characters: [ZEFF] }, {});
    expect(leader(g)).toBe(5000);
    swing(g);
    expect(leader(g)).toBe(7000);
    noDefence(g);
  });

  it('it also triggers when attacking a Character', () => {
    const g = mine(
      LE.luffy,
      { characters: [ZEFF] },
      { characters: [{ card: SN.c1, rested: true }] },
    );
    swing(g, 'char');
    expect(leader(g)).toBe(7000);
    passBlock(g);
    passCounter(g);
  });

  it('must not happen: without an attack the Leader stays at 5000', () => {
    const g = mine(LE.luffy, { characters: [ZEFF, SN.c4] }, {});
    expect(leader(g)).toBe(5000);
    endTurn(g);
    expect(leader(g)).toBe(5000);
  });

  it('the effect lasts through the opponent turn', () => {
    const g = mine(LE.luffy, { characters: [ZEFF] }, {});
    swing(g);
    noDefence(g);
    expect(kind(g)).toBe('main');
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(leader(g)).toBe(7000);
  });

  it("the effect ends at the opponent's End Phase: my next turn the Leader is 5000 again", () => {
    const g = mine(LE.luffy, { characters: [ZEFF] }, {});
    swing(g);
    noDefence(g);
    endTurn(g);
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(leader(g)).toBe(5000);
  });

  it('"base power" is set, not added: a 6000 Leader becomes 7000, not 8000', () => {
    const g = mine(LE.magellan, { characters: [ZEFF] }, {});
    expect(leader(g)).toBe(6000);
    swing(g);
    expect(leader(g)).toBe(7000);
    noDefence(g);
  });

  it('DON!! given to the Leader are added on top of the new base (7000 + 1000 per DON!!)', () => {
    const g = mine(
      { card: LE.luffy, don: 2 },
      { characters: [ZEFF], costArea: { active: 8, rested: 0 } },
      {},
    );
    expect(leader(g)).toBe(7000);
    swing(g);
    expect(leader(g)).toBe(9000);
    noDefence(g);
  });

  it('two Zeffs attacking do not stack: the base is 7000, not 9000', () => {
    const g = mine(LE.luffy, { characters: [ZEFF, ZEFF] }, {});
    attack(g, at(g, 'p1', 'characters', ZEFF, 0), g.leader('p2'));
    noDefence(g);
    expect(leader(g)).toBe(7000);
    attack(g, at(g, 'p1', 'characters', ZEFF, 1), g.leader('p2'));
    noDefence(g);
    expect(leader(g)).toBe(7000);
  });
});
