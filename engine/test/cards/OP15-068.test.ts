/** OP15-068 Heavenly Warriors. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, passBlock, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { canBlockWith, DRESSROSA_LEADER, mine } from './helpers-op15g2.ts';

const ID = 'OP15-068';

describe('OP15-068 Heavenly Warriors', () => {
  const kw = (active: number, rested = 0) => {
    const g = mine(DRESSROSA_LEADER, { characters: [ID] }, {}, active, rested);
    return g.card(g.find('p1', 'characters', ID)).keywords;
  };

  it('with 6 DON!! on your field it has [Blocker]', () => {
    expect(kw(6)).toContain('Blocker');
    expect(kw(0)).toContain('Blocker');
  });

  it('with 7 DON!! it does not', () => {
    expect(kw(7)).not.toContain('Blocker');
    expect(kw(3, 4)).not.toContain('Blocker');
  });

  it('rested DON!! count: 2 active + 4 rested is 6', () => {
    expect(kw(2, 4)).toContain('Blocker');
  });

  const attacked = (n: number) => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID], costArea: { active: n, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    return g;
  };

  it('it can actually block when the condition holds, and cannot when it fails', () => {
    const a = attacked(6);
    expectDecision(a, 'block', 'p1');
    expect(canBlockWith(a, a.find('p1', 'characters', ID))).toBe(true);
    passBlock(a);
    const b = attacked(7);
    expect(canBlockWith(b, b.find('p1', 'characters', ID))).toBe(false);
  });

  it('the opponent DON!! count is irrelevant', () => {
    const g = game(
      { leader: DRESSROSA_LEADER, characters: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 0, rested: 0 } },
    );
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});
