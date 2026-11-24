/**
 * OP15-005 Cabaji (Character, Red, cost 2, 3000, Counter +1000, {Buggy Pirates}/{East Blue}).
 *
 * Card text: "[When Attacking] If your opponent has any DON!! cards given, this Character gains
 * +2000 power during this turn."
 *
 * Rules: CR 6-5-5 (DON!! given to a Leader or Character), CR 8-1-2 (mandatory), "during this turn"
 * ends at the end of the turn. A DON!! card in the cost area is not "given".
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence, toMyNextMain } from './kit-op15a.ts';
import { at, LD15, mine, SCN, need } from './kit-op15a.ts';

const CABAJI = 'OP15-005';

/** p1 has Cabaji (and Marco, 5000); p2's Leader / Characters as given. */
function board(
  p2: {
    leader?: string | { card: string; don?: number };
    chars?: (string | { card: string; don?: number })[];
    p1leader?: string | { card: string; don?: number };
  } = {},
) {
  return mine(
    p2.p1leader ?? LD15.luffy,
    { characters: [CABAJI, SCN.c3] },
    { characters: p2.chars ?? [], ...(p2.leader ? { leader: p2.leader } : {}) },
  );
}

function swing(g: ReturnType<typeof board>) {
  const cabaji = at(g, 'p1', 'characters', CABAJI);
  attack(g, cabaji, g.leader('p2'));
  return cabaji;
}

describe('OP15-005 Cabaji: +2000 when attacking if the opponent has DON!! given', () => {
  it('DON!! given to the opponent Leader: +2000 (5000)', () => {
    const g = board({ leader: { card: LD15.luffy, don: 1 } });
    const c = swing(g);
    expect(g.power(c)).toBe(5000);
  });

  it('DON!! given to an opposing Character counts too', () => {
    const g = board({ chars: [{ card: SCN.c3, don: 1 }] });
    const c = swing(g);
    expect(g.power(c)).toBe(5000);
  });

  it('no DON!! given anywhere on the opponent side: no bonus (3000)', () => {
    const g = board({ chars: [SCN.c3] });
    const c = swing(g);
    expect(g.power(c)).toBe(3000);
  });

  it('DON!! sitting in the opponent cost area is not "given": no bonus', () => {
    const g = mine(LD15.luffy, { characters: [CABAJI] }, { costArea: { active: 5, rested: 5 } });
    const c = swing(g);
    expect(g.power(c)).toBe(3000);
  });

  it("my own given DON!! does not count (only the opponent's)", () => {
    const g = mine(
      { card: LD15.luffy, don: 2 },
      { characters: [CABAJI], costArea: { active: 8, rested: 0 } },
    );
    const c = swing(g);
    expect(g.power(c)).toBe(3000);
  });

  it('several given DON!! cards still give the bonus once (+2000, not more)', () => {
    const g = board({ leader: { card: LD15.luffy, don: 2 }, chars: [{ card: SCN.c3, don: 3 }] });
    const c = swing(g);
    expect(g.power(c)).toBe(5000);
  });

  it('the bonus decides the battle: 5000 hits a 5000 Leader, 3000 does not', () => {
    const withDon = board({ leader: { card: LD15.luffy, don: 1 } });
    swing(withDon);
    noDefence(withDon);
    expect(withDon.life('p2')).toBe(3);
    const without = board();
    swing(without);
    noDefence(without);
    expect(without.life('p2')).toBe(4);
  });

  it('only Cabaji gains it, not the other Character', () => {
    const g = board({ leader: { card: LD15.luffy, don: 1 } });
    swing(g);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(5000);
  });

  it('the bonus lasts this turn only: back to 3000 on my next turn', () => {
    const g = board({ leader: { card: LD15.luffy, don: 1 } });
    const c = swing(g);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(g.power(c)).toBe(5000);
    toMyNextMain(g);
    expect(g.power(c)).toBe(3000);
  });
});
