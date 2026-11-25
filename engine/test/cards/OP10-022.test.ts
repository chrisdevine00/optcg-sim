/** OP10-022 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, game, hand, pick, PLAIN_BLUE, V } from './helpers.ts';
import { activate, atMain, EVENT_1, ids, offeredAb, SN3, SN4, SN5, SN6 } from './helpers-w7c1.ts';

const ID = 'OP10-022';

describe('OP10-022 Trafalgar Law', () => {
  /** Characters total cost 5 (SN3 + V.c2), 1 DON!! given, the given card on top of Life. */
  const mk = (top: string, p1: object = {}) =>
    game(
      {
        leader: { card: ID, don: 1 },
        characters: [SN3, V.c2],
        life: [top, V.c1, V.c2],
        ...p1,
      },
      { leader: PLAIN_BLUE },
    );
  const law = (g: ReturnType<typeof mk>) => g.leader('p1');
  /** Activate and return V.c2 to the hand as the cost. */
  const go = (g: ReturnType<typeof mk>) => {
    activate(g, law(g), 'activate');
    pick(g, [g.find('p1', 'characters', V.c2)]);
  };

  it('returns a Character to your hand, reveals the top of Life, and may play a {Supernovas} Character of cost 5 or less from it', () => {
    const g = mk(SN5);
    go(g);
    expect(g.eventsOfType('CardRevealed').some((e) => e.reason === 'effect')).toBe(true);
    expect(dec(g)?.kind).toBe('optional');
    accept(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([SN3, SN5].sort());
    expect(ids(g, 'p1', 'hand')).toEqual([V.c2]);
    // The Life card left Life without damage: 2 Life cards remain.
    expect(g.life('p1')).toBe(2);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('"you may play": declining leaves the revealed card on top of Life', () => {
    const g = mk(SN5);
    go(g);
    decline(g);
    expect(ids(g, 'p1', 'life')[0]).toBe(SN5);
    expect(g.life('p1')).toBe(3);
    expect(ids(g, 'p1', 'characters')).toEqual([SN3]);
  });

  it('boundary: a cost of 5 is played, a cost of 6 is not; a Character of another type and an Event are not', () => {
    const six = mk(SN6);
    go(six);
    expect(atMain(six)).toBe(true);
    expect(ids(six, 'p1', 'life')[0]).toBe(SN6);
    expect(ids(six, 'p1', 'characters')).toEqual([SN3]);

    const other = mk(V.c3);
    go(other);
    expect(atMain(other)).toBe(true);
    expect(ids(other, 'p1', 'life')[0]).toBe(V.c3);

    const event = mk(EVENT_1);
    go(event);
    expect(atMain(event)).toBe(true);
    expect(ids(event, 'p1', 'life')[0]).toBe(EVENT_1);
    expect(ids(event, 'p1', 'characters')).toEqual([SN3]);
  });

  it('a cost 4 {Supernovas} Character (also {Straw Hat Crew}) qualifies too', () => {
    const g = mk(SN4);
    go(g);
    accept(g);
    expect(ids(g, 'p1', 'characters')).toContain(SN4);
  });

  it('boundary of the condition: a total cost of 5 is enough, 4 is not; it needs [DON!! x1]', () => {
    const four = mk(SN5, { characters: [SN3, V.c1] });
    expect(offeredAb(four, law(four), 'activate')).toBe(false);

    const five = mk(SN5);
    expect(offeredAb(five, law(five), 'activate')).toBe(true);

    const noDon = mk(SN5, { leader: ID });
    expect(offeredAb(noDon, law(noDon), 'activate')).toBe(false);
  });

  it('once per turn: with the total still 5 or more after the cost, it is not offered again', () => {
    const g = mk(SN5, { characters: [SN3, V.c2, V.c3] });
    go(g);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(offeredAb(g, law(g), 'activate')).toBe(false);
    // The same position before using it: offered.
    const fresh = mk(SN5, { characters: [SN3, V.c2, V.c3] });
    expect(offeredAb(fresh, law(fresh), 'activate')).toBe(true);
  });

  it('must not be offered with no Character to return, and nothing is revealed unless it is activated', () => {
    const none = mk(SN5, { characters: [] });
    expect(offeredAb(none, law(none), 'activate')).toBe(false);

    const g = mk(SN5);
    expect(g.eventsOfType('CardRevealed')).toHaveLength(0);
    expect(ids(g, 'p1', 'life')[0]).toBe(SN5);
  });
});
