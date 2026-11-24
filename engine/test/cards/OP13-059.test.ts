/** OP13-059 Brilliant Punk. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  hand,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { canAccept, canPick, counterStep, idsOf, mine } from './helpers-op13g3.ts';

const ID = 'OP13-059';

describe('OP13-059 Brilliant Punk', () => {
  const start = (mineChars: string[], opp: string[]) =>
    mine({ hand: [ID], characters: mineChars }, { characters: opp }, 6);

  it("[Main] you may return 1 of your Characters to the owner's hand: return up to 1 Character with a cost of 6 or less to the owner's hand", () => {
    const g = start([V.c1, V.c4], [V.c6, V.c7]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    // Cost 6 is in range (either side), cost 7 is not; the returned Character is gone.
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(idsOf(g, 'p2', 'hand')).toEqual([V.c6]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": after paying the cost the effect may return nothing', () => {
    const g = start([V.c1], [V.c6]);
    play(g, ID);
    accept(g);
    // One Character of yours: the cost is paid with it, no prompt.
    g.act({ type: 'done' });
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('declining the optional cost does nothing, the Event is still played', () => {
    const g = start([V.c1], [V.c6]);
    play(g, ID);
    decline(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([V.c1]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('with no Character of yours the cost cannot be paid: accepting is illegal', () => {
    const g = start([], [V.c6]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(false);
  });

  it('[Trigger] draw 1 card', () => {
    const g = counterStep({ leader: 'ST01-001', life: [ID, V.c1, V.c1], deck: [V.c2, V.c3] });
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });
});
