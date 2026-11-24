/** EB04-004 Zeff. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { at, attack, finishBattle, mk, MINK1, RED_LEADER } from './helpers-eb04g1.ts';

const ID = 'EB04-004';

describe('EB04-004 Zeff', () => {
  it("[When Attacking]: your Leader's base power becomes 7000 until the end of your opponent's next End Phase", () => {
    const g = mk({ leader: RED_LEADER, characters: [ID] }, { characters: [V.c1] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    attack(g, at(g, 'p1', 'characters', ID));
    expect(g.power(g.leader('p1'))).toBe(7000);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    // The opponent's turn (4): still 7000 through their turn.
    expect(g.decider).toBe('p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endTurn' });
    // Back on your turn 5 the effect is over.
    expect(g.decider).toBe('p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only when Zeff attacks: another Character attacking leaves the Leader at 5000', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, MINK1] }, { characters: [V.c1] });
    attack(g, at(g, 'p1', 'characters', MINK1));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('there is no "up to" and no cost: the Leader is set every time Zeff attacks', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID] });
    attack(g, at(g, 'p1', 'characters', ID));
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Leader gets exactly 7000 even if DON!! are given to it first (base, not current)', () => {
    const g = mk(
      {
        leader: { card: RED_LEADER, don: 2 },
        characters: [ID],
        costArea: { active: 8, rested: 0 },
      },
      {},
    );
    expect(g.power(g.leader('p1'))).toBe(7000); // 5000 + 2 DON!! on your turn
    attack(g, at(g, 'p1', 'characters', ID));
    expect(g.power(g.leader('p1'))).toBe(9000); // base 7000 + the 2 DON!!
  });
});
