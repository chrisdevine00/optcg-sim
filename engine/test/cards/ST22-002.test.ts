/** ST22-002 Izo. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import { oppAttack } from './helpers-op15g2.ts';
import { orderAll } from './helpers-prbst.ts';
import { ALLY1, choices, deckOf, FORMER3, mk, times, V, WB4, WB5 } from './helpers-lfb.ts';

const ID = 'ST22-002';

describe('ST22-002 Izo', () => {
  /** Top 5: the cards given; the deck continues with 3 filler cards. */
  const onPlay = (top5: string[]) => {
    const g = mk({ hand: [ID], deck: [...top5, ...times(3, V.c7)] as never });
    play(g, ID);
    return g;
  };

  it('[On Play]: look at 5, take up to 1 {Whitebeard Pirates} card other than [Izo] (revealed) and put the rest at the bottom', () => {
    const g = onPlay([V.c1, WB4, ID, WB5, V.c2]);
    expectDecision(g, 'choose', 'p1');
    // [Izo] and the non-{Whitebeard Pirates} cards cannot be taken.
    expect(choices(g).sort()).toEqual(
      [g.find('p1', 'deck', WB4), g.find('p1', 'deck', WB5)].sort(),
    );
    pick(g, [g.find('p1', 'deck', WB4)]);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: WB4 });
    // The rest go to the bottom in an order the player chooses.
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([WB4]);
    const deck = deckOf(g, 'p1');
    expect(deck.slice(0, 3)).toEqual(times(3, V.c7));
    expect([...deck.slice(3)].sort()).toEqual([V.c1, ID, WB5, V.c2].sort());
  });

  it('"up to 1": the take can be declined and all 5 cards go to the bottom', () => {
    const g = onPlay([WB4, V.c1, V.c2, V.c3, V.c4]);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(deckOf(g, 'p1').slice(0, 3)).toEqual(times(3, V.c7));
    expect(deckOf(g, 'p1')).toHaveLength(8);
  });

  it('types that include "Whitebeard Pirates" count (Allies, Former)', () => {
    const g = onPlay([ALLY1, FORMER3, V.c1, V.c2, V.c3]);
    expect(choices(g)).toHaveLength(2);
  });

  it('must not fire: with only [Izo] and other cards among the 5 nothing can be taken', () => {
    const g = onPlay([ID, V.c1, V.c2, V.c3, V.c4]);
    expect(choices(g)).toEqual([]);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  describe("[On Your Opponent's Attack]", () => {
    const attacked = (handCards: string[] = [V.c1]) =>
      oppAttack({
        leader: 'ST01-001',
        characters: [ID],
        hand: handCards as never,
        deck: [V.c2, V.c3],
      });

    it('you may trash this Character: draw 1 and place 1 card from your hand at the bottom of the deck', () => {
      const g = attacked();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g, 'p1')).toEqual([ID]);
      // Hand: V.c1 and the card drawn (V.c2): one goes to the bottom.
      expectDecision(g, 'choose', 'p1');
      expect(choices(g)).toHaveLength(2);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(hand(g, 'p1')).toEqual([V.c2]);
      expect(deckOf(g, 'p1').at(-1)).toBe(V.c1);
    });

    it('declining keeps Izo and changes nothing', () => {
      const g = attacked();
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
      expect(hand(g, 'p1')).toEqual([V.c1]);
      expect(dec(g)?.kind).toBe('block');
    });

    it('with an empty hand the drawn card is the one placed at the bottom', () => {
      const g = attacked([]);
      accept(g);
      // The drawn card is the only candidate (a hand pick is always asked).
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c2)]);
      expect(hand(g, 'p1')).toEqual([]);
      expect(deckOf(g, 'p1').at(-1)).toBe(V.c2);
    });
  });
});
