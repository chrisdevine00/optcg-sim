/** EB03-044 Black Maria. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { canPick, cardsIn, finishOrder, mk, ODYSSEY_LEADER, ONIGASHIMA } from './helpers-eb03g2.ts';

const ID = 'EB03-044';
const top5 = [V.c1, ONIGASHIMA, V.c2, V.c3, V.c4];

describe('EB03-044 Black Maria', () => {
  it('[On Play]: reveals [Onigashima Island] from the top 5 into the hand, bottoms the rest, then plays it from the hand', () => {
    const g = mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', ONIGASHIMA))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', ONIGASHIMA)]);
    finishOrder(g);
    // Then "play up to 1 [Onigashima Island] from your hand": the one just added.
    pick(g, [g.find('p1', 'hand', ONIGASHIMA)]);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([ONIGASHIMA]);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = cardsIn(g, 'p1', 'deck');
    expect(deck).toHaveLength(9);
    expect(deck.slice(5).sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('"up to 1": may take nothing; the card stays in the deck and goes to the bottom with the rest', () => {
    const g = mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });
    play(g, ID);
    none(g);
    finishOrder(g);
    // Nothing in hand to play: still asked (at most 0), not gated.
    expect(cardsIn(g, 'p1', 'stage')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(5)).toContain(ONIGASHIMA);
  });

  it('boundary: the 6th card is not looked at', () => {
    const g = mk({
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5, ONIGASHIMA, ...times(4, BLUE)],
    });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('plays an [Onigashima Island] already in the hand even when none is taken from the deck', () => {
    const g = mk({ hand: [ID, ONIGASHIMA], deck: [...top5, ...times(5, BLUE)] });
    play(g, ID);
    none(g);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', ONIGASHIMA)]);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([ONIGASHIMA]);
  });

  it('with no [Onigashima Island] anywhere nothing is played and the turn goes on', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, ...times(5, BLUE)] });
    play(g, ID);
    none(g);
    finishOrder(g);
    // The play pick is asked even with no candidate (hand contents are never gated on): at most 0.
    expect(dec(g)?.max).toBe(0);
    none(g);
    expect(dec(g)?.kind).toBe('main');
  });

  it('with a multicolored Leader this Character gains [Blocker]; otherwise it does not', () => {
    const g = mk({ leader: ODYSSEY_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    const h = mk({ characters: [ID] });
    expect(h.card(h.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});
