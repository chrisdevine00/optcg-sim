/** OP10-065 Sugar. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, hand, none, payDon, pick, V } from './helpers.ts';
import { activate, offeredAb } from './helpers-w3s.ts';
import {
  canPick,
  cardsOf,
  deckOf,
  DP4,
  DP5,
  DP_EVENT,
  DP_LEADER,
  finishOrder,
  mk,
} from './helpers-a10g2.ts';

const ID = 'OP10-065';

describe('OP10-065 Sugar', () => {
  // Top 5: {Donquixote Pirates} Event, plain, {Donquixote Pirates} Character, plain, {Donquixote Pirates} Character; 6th: {Donquixote Pirates}.
  const top5 = [DP_EVENT, V.c1, DP4, V.c2, DP5];
  const start = (p1: Parameters<typeof mk>[0] = {}) =>
    mk({ leader: DP_LEADER, characters: [ID], deck: deckOf([...top5, DP4]), ...p1 });
  const sugar = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

  it('[Activate: Main] rest 1 DON!! and this Character: looks at 5, adds up to 1 {Donquixote Pirates} card to the hand, the rest to the bottom', () => {
    const g = start();
    activate(g, sugar(g), 'search');
    payDon(g);
    pick(g, [g.find('p1', 'deck', DP_EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DP_EVENT]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(DP_EVENT);
    expect(g.card(sugar(g)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    const d = cardsOf(g, 'p1', 'deck');
    expect(d[0]).toBe(DP4); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([V.c1, DP4, V.c2, DP5].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('candidates: any {Donquixote Pirates} card (a Character or an Event); not other types', () => {
    const g = start();
    activate(g, sugar(g), 'search');
    payDon(g);
    expect(canPick(g, g.find('p1', 'deck', DP_EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', DP4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', DP5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom (the cost is paid)', () => {
    const g = start();
    activate(g, sugar(g), 'search');
    payDon(g);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
    expect(g.card(sugar(g)).rested).toBe(true);
  });

  it('must not be usable when Sugar is rested, or with no active DON!! to rest', () => {
    const a = start({ characters: [{ card: ID, rested: true }] });
    expect(offeredAb(a, a.find('p1', 'characters', ID), 'search')).toBe(false);
    const b = start({ costArea: { active: 0, rested: 3 } });
    expect(offeredAb(b, sugar(b), 'search')).toBe(false);
    const c = start();
    expect(offeredAb(c, sugar(c), 'search')).toBe(true);
  });
});
