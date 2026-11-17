/** OP12-071 Charlotte Pudding. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PURPLE, V } from './helpers.ts';
import { drainOrders, PLAIN_BLUE, SHC3 } from './helpers-rgl-penel.ts';

/** [Sanji] (OP04-007, Red) and a Purple Event (Sheep's Horn). */
const SANJI = SHC3;
const EVENT = 'OP01-117';

describe('OP12-071 Charlotte Pudding', () => {
  const start = () => {
    const g = game(
      {
        leader: 'ST05-001',
        hand: ['OP12-071'],
        deck: [PURPLE, SANJI, V.c2, EVENT, V.c1, BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP12-071');
    return g;
  };

  it('[On Play]: looks at 4, offers only [Sanji] and Event cards, and the rest go to the bottom', () => {
    const g = start();
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.purpose).toBe('target');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', EVENT)]);
    expect(hand(g, 'p1')).toEqual([EVENT]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(EVENT);
    drainOrders(g);
    expectDecision(g, 'main', 'p1');
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c1, BLUE]);
    expect(deck.slice(2).sort()).toEqual([PURPLE, SANJI, V.c2].sort());
  });

  it('may take [Sanji] instead', () => {
    const g = start();
    pick(g, [g.find('p1', 'deck', SANJI)]);
    expect(hand(g, 'p1')).toEqual([SANJI]);
  });

  it('may take nothing (CR 8-4-4-2): all 4 go to the bottom', () => {
    const g = start();
    none(g);
    drainOrders(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c1);
  });

  it('a card beyond the 4 looked at is not offered', () => {
    const g = game(
      {
        leader: 'ST05-001',
        hand: ['OP12-071'],
        deck: [PURPLE, PURPLE, PURPLE, PURPLE, EVENT],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP12-071');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });
});
