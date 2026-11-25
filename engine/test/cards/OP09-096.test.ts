/** OP09-096 My Era...Begins!! (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  BB4,
  BB5,
  BLUE,
  canPick,
  damageGame,
  expectDecision,
  hand,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  times,
  trash,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-096';

describe('OP09-096 My Era...Begins!!: [Main]', () => {
  // Top 3: a Blackbeard Pirates Character, another copy of this card, a non-Blackbeard card.
  const top3 = [BB4, ID, V.c1];
  const start = (deck = [...top3, BB5, ...times(5, BLUE)]) => mk({ hand: [ID], deck });

  it('reveals up to 1 Blackbeard Pirates card from the top 3 into your hand and trashes the rest', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', BB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // another type
    pick(g, [g.find('p1', 'deck', BB4)]);
    expect(hand(g, 'p1')).toEqual([BB4]);
    expect(trash(g, 'p1').sort()).toEqual([ID, ID, V.c1].sort()); // the Event, the other copy, the card with another type
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(BB5); // the 4th card was not looked at
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(6);
    expectDecision(g, 'main', 'p1');
  });

  it('must not take another [My Era...Begins!!] even though it has the type', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
  });

  it('"up to 1": taking nothing trashes all 3', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([ID, ID, BB4, V.c1].sort());
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(BB5);
  });

  it('boundary: the 4th card is not looked at (so it cannot be taken)', () => {
    const g = start([V.c1, V.c1, V.c1, BB4, ...times(4, BLUE)]);
    play(g, ID);
    // The choice is still asked (a hidden top must not show "no match"), at max 0.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c1, V.c1, V.c1, ID]); // all 3 looked-at cards trashed
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(BB4);
  });
});

describe('OP09-096 My Era...Begins!!: [Trigger]', () => {
  it("activates this card's [Main] effect", () => {
    const g = damageGame(ID, {
      leader: OTHER_LEADER,
      deck: [V.c1, BB4, V.c2, V.c3, ...times(5, BLUE)],
    });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', BB4)]);
    expect(hand(g, 'p1')).toEqual([BB4]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c1, V.c2].sort());
  });
});
