/**
 * OP15-066 Satori (Character, Purple, cost 1, 2000, Counter +1000, {Sky Island}/{Vassals}).
 *
 * Card text:
 *   "[On Play] DON!! −1: Draw 1 card.
 *    [When Attacking] If you have 6 or less DON!! cards on your field, look at 2 cards from the
 *    top of your deck and place them at the top or bottom of your deck in any order."
 *
 * Rules: CR 8-3-1-6 / 8-3-1-4 (optional DON!! −1); CR 4-10-1 (failed "if"); CR 8-4-4-4 (looking at
 * deck cards); the decision encoding is left open by the API, so the look is checked through the
 * set of deck orders that can be reached (kit `outcomes`).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { donOf, myTurn, outcomes } from '../kit.ts';
import { C, deckCards, deckOf, drive, FILLER, playCard, side, V } from './kit-c.ts';

const ID = 'OP15-066';

describe('OP15-066 Satori: [On Play] DON!! −1 → draw 1', () => {
  function game() {
    return myTurn(
      side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }),
      side(C.luffy, FILLER),
    );
  }

  it('happy path: returns 1 DON!! and draws 1', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(donOf(g, 'p1').deck).toBe(8);
  });

  it('CR 8-3-1-4: declining draws nothing', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(donOf(g, 'p1').deck).toBe(7);
  });
});

describe('OP15-066 Satori: [When Attacking] 6 or less DON!! → look at 2, top or bottom in any order', () => {
  const TOP = [V.sai, V.marco, V.hajrudin, V.kingdew];
  function attacking(costActive: number) {
    return myTurn(
      side(C.shanks, FILLER, {
        characters: [ID],
        costArea: { active: costActive, rested: 0 },
        deck: deckOf(TOP),
      }),
      side(C.luffy, FILLER),
    );
  }
  const fp = (g: ReturnType<typeof attacking>) => deckCards(g, 'p1').join(',');

  it('both looked-at cards go together on top or together on the bottom, in either order (same reading as the M4a OP17-050 test: no split), nothing else changes', () => {
    const g = attacking(3);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    const filler = Array(11).fill(FILLER);
    const [a, b, c, d] = TOP as [string, string, string, string];
    const expected = new Set(
      [
        [a, b, c, d, ...filler], // both top, original order
        [b, a, c, d, ...filler], // both top, swapped
        [c, d, ...filler, a, b], // both bottom
        [c, d, ...filler, b, a], // both bottom, swapped
      ].map((x) => x.join(',')),
    );
    const reached = outcomes(g, 'p1', fp);
    expect(reached).toEqual(expected);
  });

  it('the 3rd and 4th cards are never touched', () => {
    const g = attacking(3);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    for (const deck of outcomes(g, 'p1', fp)) {
      const cards = deck.split(',');
      expect(cards.indexOf(V.hajrudin) - cards.indexOf(V.kingdew)).toBe(-1);
    }
  });

  it('with exactly 6 DON!! on the field (boundary) the look happens', () => {
    const g = attacking(6);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    expect(outcomes(g, 'p1', fp).size).toBeGreaterThan(1);
  });

  it('with 7 DON!! on the field nothing happens: the deck is unchanged', () => {
    const g = attacking(7);
    const before = fp(g);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', {});
    expect(fp(g)).toBe(before);
  });
});
