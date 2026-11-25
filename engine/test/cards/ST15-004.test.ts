/** ST15-004 Thatch. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, hand, none, pick, play, times, V } from './helpers.ts';
import { mk, PLAIN_PURPLE_LEADER, WHITEBEARD_LEADER } from './helpers-prbst.ts';

const ID = 'ST15-004';

describe('ST15-004 Thatch', () => {
  const start = (leader: string = WHITEBEARD_LEADER, life = times(3, BLUE)) =>
    mk({ leader, hand: [ID], life }, { characters: [V.c3] });

  it('[On Play]: with a Leader whose type includes "Whitebeard Pirates": -2000 power to an opponent\'s Character, then the top Life card to your hand', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('"up to 1": the power may be skipped, and the Life card is still added ("Then")', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('must not fire: with another Leader neither the -2000 nor the Life card happens', () => {
    const g = start(PLAIN_PURPLE_LEADER);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with no Life cards nothing is added', () => {
    const g = start(WHITEBEARD_LEADER, []);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(0);
  });

  it('the added Life card is the top one (no [Trigger], not damage)', () => {
    const g = start(WHITEBEARD_LEADER, [V.c2, V.c1, BLUE]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c1, BLUE]);
    expect(g.eventsOfType('TriggerActivated')).toHaveLength(0);
  });
});
