/** OP17-047 Shiki. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, PLAIN_BLUE, pick, PURPLE, times, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-047';

/**
 * p1 ends their turn with `myHand` cards in hand. The opponent then draws for their turn (a PURPLE
 * from the top of their deck), after the End of Turn effect has resolved.
 */
describe('OP17-047 Shiki', () => {
  const endTurn = (myHand: number, oppHand: string[]) => {
    const g = game(
      { leader: OTHER_LEADER, characters: [ID], hand: times(myHand, BLUE) },
      { leader: PLAIN_BLUE, hand: oppHand },
    );
    g.act({ type: 'endTurn' });
    return g;
  };

  it('[End of Your Turn]: with 2 or less cards in hand, your opponent places 1 card from their hand at the bottom of their deck (their choice)', () => {
    const g = endTurn(2, [V.c1, V.c2, V.c3]);
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    // Two kept cards, plus the card drawn for the new turn.
    expect(hand(g, 'p2')).toEqual([V.c1, V.c3, PURPLE]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(V.c2);
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(10); // 10 - 1 drawn + 1 placed
  });

  it('works with 0 cards in hand too', () => {
    const g = endTurn(0, [V.c1, V.c2]);
    pick(g, [g.find('p2', 'hand', V.c1)]);
    expect(hand(g, 'p2')).toEqual([V.c2, PURPLE]);
  });

  it('with 3 cards in hand the effect does nothing', () => {
    const g = endTurn(3, [V.c1, V.c2]);
    expect(hand(g, 'p2')).toEqual([V.c1, V.c2, PURPLE]);
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(9);
  });

  it('with an empty opponent hand nothing happens', () => {
    const g = endTurn(1, []);
    expect(hand(g, 'p2')).toEqual([PURPLE]);
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(9);
  });

  it("does not fire at the end of your opponent's turn", () => {
    const g = game(
      { leader: OTHER_LEADER, characters: [ID], hand: [] },
      { leader: PLAIN_BLUE, hand: [PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'endTurn' });
    expect(hand(g, 'p2')).toEqual([PURPLE]);
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(10);
  });
});
