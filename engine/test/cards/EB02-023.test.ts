/** EB02-023 Crocodile. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import {
  C1,
  C2,
  C3,
  C4,
  cardsOf,
  dec,
  expectDecision,
  finishOrder,
  hand,
  koBy,
  mk,
  V,
} from './helpers-aeb2g1.ts';
import { option } from './helpers.ts';

const ID = 'EB02-023';
const DECK = [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6];

const bounce = (owner: 'opponent' | 'you'): Ability =>
  ({
    id: 'b',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          move: { what: { from: 'characters', owner, pick: { exactly: 1 } }, to: { zone: 'hand' } },
        },
      },
    ],
  }) as Ability;

/** Crocodile plus two planters (C1, C2) on p1's side; p2 has C3 and C4. */
function start(): TestGame {
  const g = mk({ characters: [ID, C1, C2], deck: DECK }, { characters: [C3, C4] });
  for (const c of [C1, C2]) g.state = withAbilities(g.state, c, [bounce('opponent')]);
  return g;
}
const use = (g: TestGame, planter: string, target: string): void => {
  g.act({ type: 'activate', card: g.find('p1', 'characters', planter), ability: 'b' });
  g.act({ type: 'pick', choice: g.find('p2', 'characters', target) });
};

describe('EB02-023 Crocodile', () => {
  it("when your effect returns an opponent's Character to the hand: look at 3, all to the top or all to the bottom", () => {
    const g = start();
    use(g, C1, C3);
    expect(hand(g, 'p2')).toEqual([C3]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'bottom');
    finishOrder(g);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 3)).toEqual([V.c4, V.c5, V.c6]); // the 4th card is on top now
    expect(deck.slice(3).sort()).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('placing them on top keeps the same 3 cards above the rest', () => {
    const g = start();
    use(g, C1, C3);
    option(g, 'top');
    finishOrder(g);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 3).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(deck.slice(3)).toEqual([V.c4, V.c5, V.c6]);
  });

  it('[Once Per Turn]: a second return in the same turn does not trigger it again', () => {
    const g = start();
    use(g, C1, C3);
    option(g, 'top');
    finishOrder(g);
    g.act({ type: 'activate', card: g.find('p1', 'characters', C2), ability: 'b' }); // the only target: no pick
    expectDecision(g, 'main', 'p1'); // no look
    expect(hand(g, 'p2').sort()).toEqual([C3, C4].sort());
  });

  it("a K.O. of the opponent's Character, or a return of your own Character, does not trigger it", () => {
    const g = start();
    koBy(g, 'p2', C3, 'p1');
    expectDecision(g, 'main', 'p1');
    const h = mk({ characters: [ID, C1], deck: DECK });
    h.state = withAbilities(h.state, C1, [bounce('you')]);
    h.act({ type: 'activate', card: h.find('p1', 'characters', C1), ability: 'b' });
    h.act({ type: 'pick', choice: h.find('p1', 'characters', ID) });
    expectDecision(h, 'main', 'p1');
    expect(hand(h, 'p1')).toEqual([ID]);
  });

  it('it is [Your Turn] only: the opponent returning their own Character on their turn does not trigger it', () => {
    const g = mk(
      { characters: [ID], deck: DECK },
      { characters: [C3, C4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = withAbilities(g.state, C3, [
      {
        id: 'b',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              move: {
                what: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
                to: { zone: 'hand' },
              },
            },
          },
        ],
      } as Ability,
    ]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', C3), ability: 'b' });
    g.act({ type: 'pick', choice: g.find('p2', 'characters', C4) });
    expect(dec(g)?.player).toBe('p2');
    expect(dec(g)?.kind).toBe('main');
  });
});
