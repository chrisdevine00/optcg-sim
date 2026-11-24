/**
 * ST31-003 Brook (Character, Red, cost 2, 3000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[Opponent's Turn] If you have a total of 3 or more given DON!! cards, this Character
 * gains [Blocker] and +3000 power."
 *
 * Rules: [Opponent's Turn] holds during my opponent's turn only (CR 8-3-2-5); "a total of ... given
 * DON!! cards" counts the DON!! given to my Leader and all my Characters (RD 87: a state check, so
 * more than 3 still counts); DON!! in the cost area or on the other side are not "given to my
 * cards"; given DON!! add +1000 on my own turn only (CR 6-5-5-2); [Blocker] rests it to take the attack.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  kind,
  kw,
  mine,
  noDefence,
  passBlock,
  BLUE,
  RED,
  side,
  SL,
  theirs,
  theirTurn,
} from './kit-stb5a.ts';

const ID = 'ST31-003';
const MARCO = 'OP01-023'; // Red, 5000
const SAI = 'OP01-012'; // Red, 4000
const KING = 'OP02-006'; // Red, 7000

type Placed = string | { card: string; rested?: boolean; don?: number };

/** p2's turn; p1 has Brook plus the given DON!! placements. */
function opp(
  brook: Placed,
  others: Placed[] = [],
  leaderDon = 0,
  p2chars: Placed[] = [KING],
  restedCost = 0,
) {
  return theirTurn(
    side(SL.luffy, BLUE, {
      leader: leaderDon > 0 ? { card: SL.luffy, don: leaderDon } : SL.luffy,
      characters: [brook, ...others],
      costArea: { active: 0, rested: restedCost },
    }),
    side(SL.luffy, RED, { costArea: { active: 10, rested: 0 }, characters: p2chars }),
  );
}
const brookOf = (g: ReturnType<typeof opp>) => g.find('p1', 'characters', ID);

describe("ST31-003 Brook: [Opponent's Turn] with 3+ given DON!!: [Blocker] and +3000", () => {
  it("with exactly 3 DON!! given to Brook: [Blocker] and 6000 power on the opponent's turn", () => {
    const g = opp({ card: ID, don: 3 });
    expect(kw(g, brookOf(g))).toContain('Blocker');
    expect(g.power(brookOf(g))).toBe(6000);
  });

  it('with 2 given DON!! the condition fails: no [Blocker], base 3000', () => {
    const g = opp({ card: ID, don: 2 });
    expect(kw(g, brookOf(g))).not.toContain('Blocker');
    expect(g.power(brookOf(g))).toBe(3000);
  });

  it('the total counts all my cards: 1 on the Leader, 1 on Brook, 1 on another Character', () => {
    const g = opp({ card: ID, don: 1 }, [{ card: MARCO, don: 1 }], 1);
    expect(kw(g, brookOf(g))).toContain('Blocker');
    expect(g.power(brookOf(g))).toBe(6000);
  });

  it('3 given to the Leader alone is enough', () => {
    const g = opp(ID, [], 3);
    expect(kw(g, brookOf(g))).toContain('Blocker');
    expect(g.power(brookOf(g))).toBe(6000);
  });

  it('3 given to other Characters (none on Brook) is enough', () => {
    const g = opp(ID, [
      { card: MARCO, don: 2 },
      { card: SAI, don: 1 },
    ]);
    expect(kw(g, brookOf(g))).toContain('Blocker');
  });

  it('more than 3 still works', () => {
    const g = opp({ card: ID, don: 5 });
    expect(kw(g, brookOf(g))).toContain('Blocker');
    expect(g.power(brookOf(g))).toBe(6000);
  });

  it('2 given plus rested DON!! in the cost area does not count: those are not given', () => {
    const g = opp({ card: ID, don: 2 }, [], 0, [KING], 6);
    expect(kw(g, brookOf(g))).not.toContain('Blocker');
    expect(g.power(brookOf(g))).toBe(3000);
  });

  it("the opponent's given DON!! do not count for my Brook", () => {
    const g = theirs(
      SL.luffy,
      { characters: [{ card: ID, don: 2 }] },
      { characters: [{ card: KING, don: 4 }], costArea: { active: 0, rested: 0 } },
    );
    expect(kw(g, g.find('p1', 'characters', ID))).not.toContain('Blocker');
  });

  it('on my own turn the effect is off: no [Blocker], power 3000 plus 1000 per DON!! given to Brook', () => {
    const g = mine(SL.luffy, {
      characters: [{ card: ID, don: 3 }],
      costArea: { active: 7, rested: 0 },
    });
    const brook = g.find('p1', 'characters', ID);
    expect(kw(g, brook)).not.toContain('Blocker');
    expect(g.power(brook)).toBe(6000); // 3000 + 3 x 1000 from DON!!, not +3000 from the effect
  });

  it('on my own turn with 3 given to the Leader, Brook is plain: 3000 and no [Blocker]', () => {
    const g = mine(
      { card: SL.luffy, don: 3 },
      { characters: [ID], costArea: { active: 7, rested: 0 } },
    );
    const brook = g.find('p1', 'characters', ID);
    expect(kw(g, brook)).not.toContain('Blocker');
    expect(g.power(brook)).toBe(3000);
  });

  it('can block an attack on my Leader, and at 6000 survives a 5000 attacker', () => {
    const g = opp({ card: ID, don: 3 }, [], 0, []);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([brookOf(g)]);
    act(g, { type: 'block', blocker: brookOf(g) });
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.life('p1')).toBe(4);
  });

  it('without the condition Brook (rested or not) is not offered as a blocker', () => {
    const g = opp({ card: ID, don: 2 }, [], 0, []);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    noDefence(g);
  });
});
