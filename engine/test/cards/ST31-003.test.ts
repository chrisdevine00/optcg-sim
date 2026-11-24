/** ST31-003 Brook. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { SHC_LEADER } from './helpers-stg1.ts';

const ID = 'ST31-003';

/** p2's turn (so it is the opponent's turn for Brook): p1 has `leaderDon` on the Leader, `brookDon` on Brook and `otherDon` on a vanilla. */
const opp = (leaderDon: number, brookDon: number, otherDon = 0) =>
  game(
    {
      leader: { card: SHC_LEADER, don: leaderDon },
      characters: [
        { card: ID, don: brookDon },
        { card: V.c1, don: otherDon },
      ],
    },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
const brook = (g: ReturnType<typeof opp>) => g.find('p1', 'characters', ID);

describe('ST31-003 Brook', () => {
  it("[Opponent's Turn]: with a total of 3 or more given DON!!, gains [Blocker] and +3000 power", () => {
    const g = opp(1, 1, 1); // 3 in total, spread over Leader, Brook and another Character
    expect(g.card(brook(g)).keywords).toContain('Blocker');
    expect(g.power(brook(g))).toBe(6000);
  });

  it('all 3 DON!! on another card counts, and more than 3 still gives +3000 once', () => {
    const a = opp(3, 0);
    expect(g(a)).toBe(6000);
    const b = opp(0, 0, 5);
    expect(g(b)).toBe(6000);
    function g(x: ReturnType<typeof opp>) {
      return x.power(brook(x));
    }
  });

  it('with only 2 given DON!! in total: no [Blocker], no power bonus (exact boundary)', () => {
    const g = opp(1, 1, 0);
    expect(g.card(brook(g)).keywords).not.toContain('Blocker');
    expect(g.power(brook(g))).toBe(3000);
  });

  it('the gained [Blocker] really can block an attack', () => {
    const on = opp(2, 1);
    on.act({
      type: 'attack',
      attacker: on.find('p2', 'characters', V.c7),
      target: on.leader('p1'),
    });
    expectDecision(on, 'block', 'p1');
    expect(on.isLegal({ type: 'block', blocker: brook(on), player: 'p1' })).toBe(true);
    const off = opp(1, 1);
    off.act({
      type: 'attack',
      attacker: off.find('p2', 'characters', V.c7),
      target: off.leader('p1'),
    });
    expect(off.isLegal({ type: 'block', blocker: brook(off), player: 'p1' })).toBe(false);
  });

  it('on your own turn it has neither [Blocker] nor the bonus, even with 3 given DON!! (plus the DON!! power of its own)', () => {
    const g = game(
      {
        leader: { card: SHC_LEADER, don: 2 },
        characters: [{ card: ID, don: 1 }],
      },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000); // 3000 + 1000 for its own DON!!
  });
});
