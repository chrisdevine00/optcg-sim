/** EB02-059 Without Your Help I Can't Become the King of the Pirates!!!!. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, PURPLE } from './helpers.ts';
import {
  canPick,
  counterGame,
  ids,
  NSHC3,
  SANJI_RED1,
  SANJI_YELLOW2,
  SHC_LEADER,
  V,
  YSHC3,
  YSHC5,
  YSHC6,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-059';
// p2's 7000-power Character attacks p1's 5000-power Leader; the Counter is activated, targets chosen.
const run = (life: string[], handCards: string[] = []) => {
  const g = counterGame(ID, { leader: SHC_LEADER, life, hand: [ID, ...handCards] });
  expectDecision(g, 'choose', 'p1');
  return g;
};

describe("EB02-059 Without Your Help I Can't Become the King of the Pirates!!!!", () => {
  it('[Counter] gives up to 1 Leader or Character +1000 power during this battle', () => {
    const g = run([PURPLE, PURPLE, PURPLE]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    // With 3 Life no Character is played and the battle goes on.
    expect(dec(g)?.kind).toBe('counter');
  });

  it('[Counter] "up to 1": may give the power to nothing', () => {
    const g = run([PURPLE, PURPLE, PURPLE]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with 1 Life (boundary) plays a yellow {Straw Hat Crew} Character or [Sanji] with cost 5 or less from the hand', () => {
    const g = run([PURPLE], [YSHC5, YSHC3, YSHC6, NSHC3, SANJI_RED1, SANJI_YELLOW2, V.c2]);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'choose', 'p1');
    // Offered: yellow Straw Hat Crew of cost 5 and 3, and any [Sanji] of cost 5 or less (red or yellow).
    for (const c of [YSHC5, YSHC3, SANJI_RED1, SANJI_YELLOW2])
      expect(canPick(g, g.find('p1', 'hand', c)), c).toBe(true);
    // Not offered: cost 6, a Straw Hat Crew that is not yellow and not [Sanji], a vanilla.
    for (const c of [YSHC6, NSHC3, V.c2])
      expect(canPick(g, g.find('p1', 'hand', c)), c).toBe(false);
    pick(g, [g.find('p1', 'hand', YSHC5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([YSHC5]);
    expect(hand(g, 'p1')).not.toContain(YSHC5);
  });

  it('with 0 Life the condition (1 or less) holds as well', () => {
    const g = run([], [YSHC3]);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'hand', YSHC3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([YSHC3]);
  });

  it('must not play with 2 Life (boundary): no choice is asked', () => {
    const g = run([PURPLE, PURPLE], [YSHC3]);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).toBe('counter');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('"Then" is sequential: with 1 Life a Character may be played even when no power was given', () => {
    const g = run([PURPLE], [YSHC3]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    pick(g, [g.find('p1', 'hand', YSHC3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([YSHC3]);
  });
});
