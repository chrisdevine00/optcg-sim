/** ST02-007 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, expectDecision, hand, none, pick, PURPLE, times } from './helpers.ts';
import { activate, canPick, cardsIn, finishOrder, GREEN_SN1, mk, SN3 } from './helpers-st29old.ts';

const ID = 'ST02-007';
const OTHER_SN = 'OP01-019'; // red {Supernovas}, cost 2

describe('ST02-007 Bonney', () => {
  // Top 5: filler, a {Supernovas} Character, a non-{Supernovas}, another {Supernovas}, filler.
  // 6th card: a {Supernovas} that must not be looked at.
  const deck = [PURPLE, SN3, BLUE, GREEN_SN1, PURPLE, OTHER_SN, ...times(4, BLUE)];
  const start = (costArea = { active: 3, rested: 0 }) => mk({ characters: [ID], deck, costArea });

  it('[Activate: Main]: rest (1) DON!! and this Character: look at 5, add up to 1 {Supernovas} card to your hand', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'search');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', SN3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SN3]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(9);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(OTHER_SN); // the 6th card is now on top
  });

  it('only {Supernovas} cards of the top 5 are offered (any colour, any category)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'search');
    expect(canPick(g, g.find('p1', 'deck', SN3))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', GREEN_SN1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', BLUE))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', OTHER_SN))).toBe(false); // 6th: not looked at
  });

  it('may add nothing; the costs stay paid', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'search');
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('a rested Bonney cannot activate (the rest cost cannot be paid)', () => {
    const g = mk({
      characters: [{ card: ID, rested: true }],
      deck,
      costArea: { active: 3, rested: 0 },
    });
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('with no active DON!! the (1) cost cannot be paid', () => {
    const g = start({ active: 0, rested: 3 });
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });
});
