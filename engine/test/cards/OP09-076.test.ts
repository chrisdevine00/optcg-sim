/** OP09-076 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  dec,
  decline,
  don,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
} from './helpers.ts';
import { countOptions, payReturn } from './helpers-w5c1.ts';

const ID = 'OP09-076';
const start = (active = 6, donDeck?: number) =>
  game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID],
      costArea: { active, rested: 0 },
      ...(donDeck === undefined ? {} : { donDeck }),
    },
    { leader: PLAIN_BLUE },
  );

describe('OP09-076 Roronoa Zoro', () => {
  it('[On Play] returning 1 DON!! adds up to 1 DON!! from the deck as active', () => {
    const g = start();
    play(g, ID);
    // 6 DON!! on the field (3 active, 3 rested after the cost 3), 4 in the deck.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3, deck: 4 });
    expectDecision(g, 'optional', 'p1');
    payReturn(g, 1);
    expect(don(g, 'p1').deck).toBe(5);
    addMost(g);
    const d = don(g, 'p1');
    expect(d.deck).toBe(4);
    expect(d.active + d.rested).toBe(6);
    // The DON!! added is active: never more rested than before.
    expect(d.rested).toBeLessThanOrEqual(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('the number returned is chosen: 3 go back and still only 1 is added', () => {
    const g = start();
    play(g, ID);
    payReturn(g, 3);
    expect(don(g, 'p1').deck).toBe(7);
    addMost(g);
    const d = don(g, 'p1');
    expect(d.deck).toBe(6);
    expect(d.active + d.rested).toBe(4);
  });

  it('declining the cost does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3, deck: 4 });
    expect(hand(g, 'p1')).toEqual([]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('boundary: 1 to every DON!! on the field can be returned, 0 cannot', () => {
    const g = start(3);
    play(g, ID);
    accept(g);
    expect(countOptions(g)).toEqual(['1', '2', '3']);
  });

  it('with the DON!! deck empty the returned DON!! is what comes back as the added one', () => {
    const g = start(10, 0);
    play(g, ID);
    payReturn(g, 1);
    addMost(g);
    expect(don(g, 'p1').deck).toBe(0);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(10);
  });
});
