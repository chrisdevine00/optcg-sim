/** OP09-112 Belo Betty (Character, cost 3). */
import { describe, expect, it } from 'vitest';
import {
  damageGame,
  expectDecision,
  hand,
  idsOf,
  mk,
  OTHER_LEADER,
  play,
  RA_LEADER,
  rep,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-112';

describe('OP09-112 Belo Betty: [On Play]', () => {
  const start = (life: number) =>
    mk({ leader: OTHER_LEADER, hand: [ID], life: rep(life, V.c1), deck: rep(5, V.c2) });

  it('with 2 Life cards, draws 1 card', () => {
    const g = start(2);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(4);
    expectDecision(g, 'main', 'p1');
  });

  it('with 0 Life cards, draws 1 card ("2 or less" includes 0)', () => {
    const g = start(0);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('with 3 Life cards (the boundary), draws nothing', () => {
    const g = start(3);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("counts your own Life only: the opponent's 2 Life cards do not draw", () => {
    const g = mk({ hand: [ID], life: rep(3, V.c1) }, { life: rep(2, V.c1) });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
  });
});

describe('OP09-112 Belo Betty: [Trigger]', () => {
  /** p2 attacks p1's Leader; p1's top Life card is Belo Betty. `mine` counts it, `theirs` is p2's Life. */
  const hit = (leader: string, mine: number, theirs: number) => {
    const g = damageGame(
      ID,
      { leader, life: [ID, ...rep(mine - 1, V.c1)], deck: rep(5, V.c2) },
      { life: rep(theirs, V.c1) },
    );
    g.act({ type: 'trigger', activate: true });
    return g;
  };

  it('with a Revolutionary Army Leader and a total of 5 Life cards left, it is played', () => {
    const g = hit(RA_LEADER, 3, 3); // 2 + 3 = 5 after the damage
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a total of 6 is too many (the boundary): it is not played', () => {
    const g = hit(RA_LEADER, 3, 4);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('a lower total still plays it', () => {
    const g = hit(RA_LEADER, 1, 0);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('must not be played without a Revolutionary Army Leader', () => {
    const g = hit(OTHER_LEADER, 3, 3);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('played by its [Trigger] with 2 Life cards left, its [On Play] draws 1', () => {
    const g = hit(RA_LEADER, 3, 3);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});
