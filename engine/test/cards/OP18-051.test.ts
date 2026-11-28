/** OP18-051 Mr.4 & Miss.MerryChristmas. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, none, pick, play } from './helpers.ts';
import { orderAll as orderAllPending } from './helpers-w3s.ts';
import { candidates, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-051';
const start = (theirs: string[], mine: string[] = [], active = 7) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [ID], characters: mine, costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE, characters: theirs },
  );
  play(g, ID);
  return g;
};

describe('OP18-051 Mr.4 & Miss.MerryChristmas', () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000); // 3000 + 1000 DON!! + 1000
  });

  it('[On Play] rest 5 DON!!: places a cost 6 or less and another cost 5 or less Character at the bottom of their decks', () => {
    const g = start([V.c6, V.c5]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(candidates(g).length).toBeGreaterThan(0);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    orderAllPending(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(
      g
        .zone('p2', 'deck')
        .slice(-2)
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c5, V.c6].sort());
  });

  it('the second Character cannot be the first one again, and a cost 7 Character is never offered', () => {
    const g = start([V.c6, V.c7, V.c3]);
    accept(g);
    // Any Character with a cost of 6 or less, Mr.4 himself included.
    expect(candidates(g).sort()).toEqual(
      [
        g.find('p2', 'characters', V.c6),
        g.find('p2', 'characters', V.c3),
        g.find('p1', 'characters', ID),
      ].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c3)]);
    // Cost 5 or less and not the one already chosen: only Mr.4 is left.
    expect(candidates(g)).toEqual([g.find('p1', 'characters', ID)]);
    none(g);
    orderAllPending(g);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c6, V.c7].sort());
  });

  it("either field's Characters can be chosen, each to its owner's deck", () => {
    const g = start([V.c5], [V.c4]);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    orderAllPending(g);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(V.c4);
    expect(g.zone('p2', 'deck').at(-1)?.card).toBe(V.c5);
  });

  it('declining the cost, or lacking 5 DON!! to rest, does nothing', () => {
    const g = start([V.c5]);
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    const h = start([V.c5], [], 6); // 4 active left after the card's own cost
    expect(h.zone('p2', 'characters')).toHaveLength(1);
    expectDecision(h, 'main', 'p1');
  });
});
