/** OP09-114 Lindbergh (Character, cost 3). */
import { describe, expect, it } from 'vitest';
import {
  BLOCKER,
  canPick,
  damageGame,
  expectDecision,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  RA_LEADER,
  rep,
  V,
} from './helpers-a09g4.ts';
import { boost } from './helpers-op15g1.ts';

const ID = 'OP09-114';
/** [Maynard]: a 2000-power Character; V.c1 has 3000. */
const P2000 = BLOCKER;

describe('OP09-114 Lindbergh: [On Play]', () => {
  const start = (mine: number, theirs: number) =>
    mk(
      { hand: [ID], life: rep(mine, V.c1) },
      { life: rep(theirs, V.c1), characters: [P2000, V.c1] },
    );

  it('with 5 Life cards in total, K.O. up to 1 opposing Character with 2000 power or less', () => {
    const g = start(2, 3);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', P2000))).toBe(true); // 2000: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false); // 3000
    pick(g, [g.find('p2', 'characters', P2000)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([P2000]);
  });

  it('a total of 6 Life cards (the boundary) does nothing and asks nothing', () => {
    const g = start(3, 3);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toEqual([P2000, V.c1]);
  });

  it('counts both players: 0 mine and 5 theirs is enough', () => {
    const g = start(0, 5);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it('power is current power: a 3000-power Character lowered to 2000 is eligible, a 2000 one raised to 3000 is not', () => {
    const g = start(2, 3);
    boost(g, g.find('p2', 'characters', V.c1), -1000);
    boost(g, g.find('p2', 'characters', P2000), 1000);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', P2000))).toBe(false);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start(2, 3);
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([P2000, V.c1]);
  });
});

describe('OP09-114 Lindbergh: [Trigger]', () => {
  const hit = (leader: string, mine: number, theirs: number) => {
    const g = damageGame(
      ID,
      { leader, life: [ID, ...rep(mine - 1, V.c1)] },
      { life: rep(theirs, V.c1) },
    );
    g.act({ type: 'trigger', activate: true });
    return g;
  };

  it('with a total of 5 Life cards left, it is played (any Leader)', () => {
    const g = hit(RA_LEADER, 3, 3);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a total of 6 (the boundary) is too many: it is not played', () => {
    const g = hit(RA_LEADER, 3, 4);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('needs no particular Leader', () => {
    const g = hit(OTHER_LEADER, 2, 1);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });
});
