/** OP13-112 Vegapunk. */
import { describe, expect, it } from 'vitest';
import { PLAIN_PURPLE, V } from './helpers.ts';
import { canBlockWith, mine, OTHER_LEADER, theirs } from './helpers-op13g4.ts';

const ID = 'OP13-112';

describe('OP13-112 Vegapunk', () => {
  const has = (leaderDon: number, selfDon: number, otherDon = 0): boolean => {
    const g = mine({
      leader: { card: PLAIN_PURPLE, don: leaderDon },
      characters: [
        { card: ID, don: selfDon },
        { card: V.c1, don: otherDon },
      ],
    });
    return g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');
  };

  it('gains [Blocker] with 2 given DON!! in total (on itself)', () => {
    expect(has(0, 2)).toBe(true);
  });

  it('1 given DON!! is not enough (exact threshold)', () => {
    expect(has(0, 1)).toBe(false);
    expect(has(0, 0)).toBe(false);
  });

  it('counts DON!! given to the Leader and to other Characters', () => {
    expect(has(1, 1)).toBe(true);
    expect(has(2, 0)).toBe(true);
    expect(has(0, 0, 2)).toBe(true);
    expect(has(1, 0, 0)).toBe(false);
  });

  it('can actually block when it has the keyword, not otherwise', () => {
    for (const [don, can] of [
      [2, true],
      [1, false],
    ] as const) {
      const g = theirs(
        { leader: OTHER_LEADER, characters: [{ card: ID, don }] },
        { characters: [V.c7] },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(can);
    }
  });
});
