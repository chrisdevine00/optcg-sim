/** OP14-116 Salamander. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, PURPLE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { BW5, counterGame, ids, KUJA5, KUJA6, KUJA_LEADER, LILY4, TBP4 } from './helpers-op14g4.ts';

const ID = 'OP14-116';
const run = (handCards: string[], characters: string[] = []) =>
  counterGame(ID, { leader: KUJA_LEADER, hand: [ID, ...handCards], characters });

describe('OP14-116 Salamander', () => {
  it('[Counter] +2000 power to your Leader during this battle, then plays a {Kuja Pirates}/{Amazon Lily} Character with cost 4 or less from the hand', () => {
    const g = run([LILY4, KUJA6, TBP4, KUJA5]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expectDecision(g, 'choose', 'p1');
    // Offered: LILY4 only (cost 5 and 6 are too dear, a {Thriller Bark Pirates} card is the wrong type).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', LILY4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([LILY4]);
    expect(hand(g, 'p1')).toEqual(expect.arrayContaining([KUJA6, TBP4, KUJA5]));
    expect(hand(g, 'p1')).not.toContain(LILY4);
  });

  it('the +2000 may go to a Character instead', () => {
    const g = run([LILY4], [V.c1]);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"Then" is not "if you do": declining the power target still plays the Character', () => {
    const g = run([LILY4]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', LILY4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([LILY4]);
  });

  it('"up to 1": the Character may be left in the hand', () => {
    const g = run([LILY4]);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([LILY4]);
  });

  it('with no Character to play the power bonus alone resolves', () => {
    const g = run([BW5, BLUE, PURPLE]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] draws 1 card', () => {
    const g = damageWith(ID, { leader: KUJA_LEADER, deck: [BLUE, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
