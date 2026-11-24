/** OP14-010 Basil Hawkins. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, none, pick, times, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { canPick, koBy } from './helpers-w3s.ts';
import { cardsIn, mk, RED0, SN2, SN2_GREEN, SN5 } from './helpers-op14g1.ts';

const ID = 'OP14-010';

// Top 5: a 2000 {Supernovas}, a 5000 {Supernovas}, a non-{Supernovas}, Basil himself, a green 2000 {Supernovas}.
const top5 = [SN2, SN5, RED0, ID, SN2_GREEN];
const start = (deck = [...top5, ...times(5, BLUE)], chars: string[] = [ID]) => {
  const g = mk({ characters: chars, deck });
  koBy(g, 'p1', ID, 'p2');
  return g;
};

describe('OP14-010 Basil Hawkins', () => {
  it('[On K.O.]: plays a {Supernovas} Character with 2000 power or less from the top 5; the rest go to the bottom', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', SN2)]);
    finishOrder(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([SN2]);
    const deck = cardsIn(g, 'p1', 'deck');
    expect(deck).toHaveLength(9);
    expect(deck.slice(0, 5)).toEqual(times(5, BLUE));
    expect(deck.slice(5).sort()).toEqual([SN5, RED0, ID, SN2_GREEN].sort());
    expect(g.card(g.find('p1', 'characters', SN2)).rested).toBe(false);
  });

  it('candidates: power 2000 or less, {Supernovas}, not [Basil Hawkins] (5000 power, other type, himself excluded)', () => {
    const g = start();
    expect(canPick(g, g.find('p1', 'deck', SN2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SN2_GREEN))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SN5))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', RED0))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
  });

  it('boundary: only the top 5 are looked at (an eligible card in 6th place is not offered)', () => {
    const g = start([SN5, RED0, ID, V.c1, V.c2, SN2, ...times(4, BLUE)]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('"up to 1": may play nothing; all 5 go to the bottom', () => {
    const g = start();
    none(g);
    finishOrder(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(5).sort()).toEqual([...top5].sort());
  });

  it('a full Character area has room again (Basil left it): no Character is trashed for the play', () => {
    const g = start(undefined, [ID, V.c1, V.c2, V.c3, V.c4]);
    pick(g, [g.find('p1', 'deck', SN2)]);
    finishOrder(g);
    expect(cardsIn(g, 'p1', 'characters')).toHaveLength(5);
    expect(cardsIn(g, 'p1', 'trash').filter((c) => c === ID)).toHaveLength(1);
  });
});
