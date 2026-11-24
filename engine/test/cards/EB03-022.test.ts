/** EB03-022 Isuka. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, cardsIn, mk } from './helpers-eb03g1.ts';

const ID = 'EB03-022';
const start = () =>
  mk({ hand: [ID], characters: [V.c4, V.c2] }, { characters: [V.c4, V.c5, V.c1] });
const bottomOf = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') => g.zone(p, 'deck').at(-1)!.card;

describe('EB03-022 Isuka', () => {
  it("[On Play]: places an opponent's Character with a cost of 4 or less at the bottom of its owner's deck", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c1, V.c5].sort());
    expect(bottomOf(g, 'p2')).toBe(V.c4);
    expect(cardsIn(g, 'p2', 'hand')).toEqual([]);
  });

  it('"a Character" is either side: one of your own goes to your own deck bottom', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false); // Isuka costs 6
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(bottomOf(g, 'p1')).toBe(V.c2);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('"up to 1": may place nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
    expect(cardsIn(g, 'p1', 'characters')).toHaveLength(3);
  });

  it('no Character with a cost of 4 or less (Isuka herself costs 6): nothing is asked or placed', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c5, V.c6] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('[Blocker]: printed', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
