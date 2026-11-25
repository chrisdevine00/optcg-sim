/** EB02-024 Sogeking. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  C1,
  C2,
  C3,
  canPick,
  cardsOf,
  dec,
  expectDecision,
  finishOrder,
  hand,
  mk,
  none,
  pick,
  V,
} from './helpers-aeb2g1.ts';
import { play } from './helpers.ts';

const ID = 'EB02-024';
const DECK = [V.c5, V.c6, V.c7, V.c4, V.c3, V.c2];
const start = (p1chars: string[] = [], p2chars: string[] = []) =>
  mk(
    { hand: [ID, C3], characters: p1chars, deck: DECK, costArea: { active: 4, rested: 0 } },
    { characters: p2chars },
  );

describe('EB02-024 Sogeking', () => {
  it("[On Play]: draws 2, places 2 cards from the hand at the bottom of the deck, then returns a cost 1 or less Character to the owner's hand", () => {
    const g = start([C1], [C1]);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3); // [C3] + 2 drawn
    // Exactly 2 of the 3 cards in hand are placed.
    expect(dec(g)?.min).toBe(2);
    expect(dec(g)?.max).toBe(2);
    pick(g, [g.find('p1', 'hand', C3), g.find('p1', 'hand', V.c5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([V.c6]);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(DECK.length - 2 + 2);
    expect(deck.slice(-2).sort()).toEqual([C3, V.c5].sort());
    // Then: a cost 1 Character of either side, up to 1.
    expect(canPick(g, g.find('p1', 'characters', C1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', C1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false); // cost 4
    pick(g, [g.find('p2', 'characters', C1)]);
    expect(hand(g, 'p2')).toEqual([C1]);
    expectDecision(g, 'main', 'p1');
  });

  it('"cost of 1 or less": cost 2 is not offered; the Character may be one of yours', () => {
    const g = start([C1, C2], [C2]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', C3), g.find('p1', 'hand', V.c5)]);
    finishOrder(g);
    expect(canPick(g, g.find('p1', 'characters', C2))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', C2))).toBe(false);
    pick(g, [g.find('p1', 'characters', C1)]);
    expect(hand(g, 'p1').sort()).toEqual([C1, V.c6].sort());
  });

  it('"up to 1": the Character return may be declined (the draw and the placing are not optional)', () => {
    const g = start([C1]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', C3), g.find('p1', 'hand', V.c5)]);
    finishOrder(g);
    none(g);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([C1, ID].sort());
  });

  it('"Then" is not an "If": with no cost 1 or less Character the draw and the placing still happen', () => {
    const g = start([], [C2]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c5), g.find('p1', 'hand', V.c6)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([C3]);
    expectDecision(g, 'main', 'p1');
  });

  it('is also named [Usopp] for the rules: a name condition sees it', () => {
    const g = mk({ characters: [ID, C2], deck: [C2, C2] });
    g.state = withAbilities(g.state, C2, [
      {
        id: 'chk',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            if: { exists: { from: 'characters', owner: 'you', filter: { name: 'Usopp' } } },
            then: [{ do: { draw: 1 } }],
          },
        ],
      } as Ability,
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', C2), ability: 'chk' });
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
