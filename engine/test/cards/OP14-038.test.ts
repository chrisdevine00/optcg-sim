/** OP14-038 I Never Bother to Remember the Faces of Trash. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  takeDamage,
  expectDecision,
  hand,
  none,
  pick,
  play,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick, FM_LEADER, isRested, mine } from './helpers-op14g2.ts';

const ID = 'OP14-038';

describe('OP14-038 I Never Bother to Remember the Faces of Trash', () => {
  const start = () =>
    mine(
      FM_LEADER,
      { hand: [ID], characters: [V.c1, V.c2], costArea: { active: 3, rested: 0 } },
      { characters: [V.c5, V.c6] },
    );

  it('[Main]: rest 2 of your cards: draw 1 and rest an opposing Character with 7000 base power or less', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c2)]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // 7000: in
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // 8000: out
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(isRested(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(1); // drew 1 (the Event left the hand)
  });

  it('[Main]: "and" is not a condition: the draw happens when the rest is skipped ("up to")', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c2)]);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(isRested(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('[Main]: declining the cost draws nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('[Counter]: your Leader gains +3000 during this battle', () => {
    const g = counterStep({ leader: FM_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
