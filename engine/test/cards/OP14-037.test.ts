/** OP14-037 For Fun. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  takeDamage,
  expectDecision,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canAccept, canPick, FM_LEADER, isRested, mine } from './helpers-op14g2.ts';

const ID = 'OP14-037';

describe('OP14-037 For Fun', () => {
  const start = (oppChars: unknown[]) =>
    mine(
      FM_LEADER,
      { hand: [ID], characters: [V.c1, V.c2], costArea: { active: 4, rested: 0 } },
      { characters: oppChars },
    );
  /** The cost: rest the 2 Characters and the Leader. */
  const payCost = (g: ReturnType<typeof start>) => {
    pick(g, [g.find('p1', 'characters', V.c1), g.find('p1', 'characters', V.c2), g.leader('p1')]);
  };

  it('[Main]: rest 3 of your cards: K.O. up to 1 rested opposing Character with 7000 base power or less', () => {
    const g = start([{ card: V.c5, rested: true }, { card: V.c6, rested: true }, V.c3]);
    play(g, ID);
    accept(g);
    payCost(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // 7000: boundary in
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // 8000: out
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active: out
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c6, V.c3]);
    expect(trash(g, 'p2')).toEqual([V.c5]);
  });

  it('[Main]: declining the cost does nothing', () => {
    const g = start([{ card: V.c5, rested: true }]);
    play(g, ID);
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(isRested(g, g.leader('p1'))).toBe(false);
  });

  it('[Main]: with fewer than 3 cards to rest the cost cannot be accepted', () => {
    const g = mine(
      FM_LEADER,
      { hand: [ID], costArea: { active: 1, rested: 0 } }, // only the Leader and the 1 DON!! left after paying 1...
      { characters: [{ card: V.c5, rested: true }] },
    );
    play(g, ID); // the Event costs 1: no active DON!! left, the Leader is the only restable card
    expect(canAccept(g)).toBe(false);
  });

  it('[Counter]: your Leader gains +3000 during this battle (no cost)', () => {
    const g = counterStep({ leader: FM_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
