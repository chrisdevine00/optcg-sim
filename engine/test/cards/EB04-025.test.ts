/** EB04-025 Nefeltari Vivi. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play } from './helpers.ts';
import {
  ALA5,
  ALA8,
  BLUE,
  canPick,
  cardsOf,
  finishOrder,
  mk,
  PURPLE,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-025';

describe('EB04-025 Nefeltari Vivi', () => {
  const start = (oppHand = [BLUE, PURPLE]) =>
    mk(
      { leader: RED_LEADER, hand: [ID, ID, ALA5, ALA8, V.c3] },
      { hand: oppHand, deck: [PURPLE, PURPLE] },
    );

  it('[On Play]: plays an {Alabasta} Character of cost 8 or less other than [Nefeltari Vivi] from your hand, then the opponent places 1 card from their hand at the bottom of their deck', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', ALA8))).toBe(true); // cost 8: boundary
    expect(canPick(g, g.find('p1', 'hand', ALA5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ID))).toBe(false); // another [Nefeltari Vivi]
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // not {Alabasta}
    pick(g, [g.find('p1', 'hand', ALA8)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, ALA8]);
    // The opponent chooses which card to place.
    expect(dec(g)?.player).toBe('p2');
    pick(g, [g.find('p2', 'hand', BLUE)]);
    expect(hand(g, 'p2')).toEqual([PURPLE]);
    expect(cardsOf(g, 'p2', 'deck')).toEqual([PURPLE, PURPLE, BLUE]);
    expect(dec(g)?.player).toBe('p1');
  });

  it('"Then" is independent: with the play skipped the opponent still places a card', () => {
    const g = start();
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'hand', PURPLE)]);
    expect(hand(g, 'p2')).toEqual([BLUE]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it("with a single card in the opponent's hand it is placed (still their decision)", () => {
    const g = start([BLUE]);
    play(g, ID);
    none(g);
    if (dec(g)?.player === 'p2') pick(g, [g.find('p2', 'hand', BLUE)]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(BLUE);
  });

  it('with an empty opposing hand nothing is placed', () => {
    const g = start([]);
    play(g, ID);
    none(g);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsOf(g, 'p2', 'deck')).toEqual([PURPLE, PURPLE]);
  });

  it('exactly 1 card is placed (not more) when the opponent holds many', () => {
    const g = start([BLUE, BLUE, BLUE, PURPLE]);
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'hand', BLUE, 0)]);
    expect(hand(g, 'p2')).toHaveLength(3);
    finishOrder(g);
  });
});
