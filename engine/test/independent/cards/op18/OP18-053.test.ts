/**
 * OP18-053 Mr.7 & Miss.Father'sDay (Character, Blue, cost 2, 3000, Counter +2000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [On Play] Look at 3 cards from the top of your deck, reorganize them in any order and place
 *    them at the top or bottom of your deck."
 *
 * Rules: exactly the top 3 are looked at (privately, no reveal); I choose their order; the three
 * go together to the top or together to the bottom of the deck; the rest of the deck is untouched.
 *
 * Scenery: five distinct vanilla Characters tell the deck order apart: OP01-012 Sai, OP01-023
 * Marco, OP02-007 Thatch, OP02-006 Kingdew, OP01-018 Hajrudin.
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { cardIds, describeDonPlus, hasEvent, kind, mine, need, optionChoices } from './kit-d.ts';

const FD = 'OP18-053';
const A = 'OP01-012';
const B = 'OP01-023';
const C = 'OP02-007';
const D = 'OP02-006';
const E = 'OP01-018';

describeDonPlus(FD, 3000);

function start(deck: CardId[] = [A, B, C, D, E, 'P-015', 'P-015']): TestGame {
  const g = mine('ST03-001', { hand: [FD], deck });
  play(g, g.find('p1', 'hand', FD));
  return g;
}

/** Choose "top" or "bottom", then give the order of the 3 looked-at cards, top-most first. */
function place(g: TestGame, where: 'top' | 'bottom', order: CardId[]) {
  need(g, 'choose', 'p1');
  expect(optionChoices(g).sort()).toEqual(['bottom', 'top']);
  act(g, { type: 'pick', choice: { option: where } });
  const left = [...order];
  for (let i = 0; i < 4 && kind(g) === 'order'; i++) {
    const want = left[0]!;
    const action = g.legal().find((a) => a.type === 'order' && g.card(a.first).card === want);
    if (!action) throw new Error(`cannot place ${want} next`);
    g.act(action);
    left.shift();
  }
  expect(kind(g)).toBe('main');
}

describe('OP18-053 Mr.7 & Miss.Father’sDay: [On Play] look at 3, reorder, place at the top or bottom', () => {
  it('top, in the order I choose: the three looked-at cards sit on top in that order, the rest is untouched', () => {
    const g = start();
    place(g, 'top', [C, A, B]);
    expect(cardIds(g, 'p1', 'deck')).toEqual([C, A, B, D, E, 'P-015', 'P-015']);
  });

  it('bottom, in the order I choose: the three go below the rest, in that order; the 4th card is now on top', () => {
    const g = start();
    place(g, 'bottom', [B, C, A]);
    expect(cardIds(g, 'p1', 'deck')).toEqual([D, E, 'P-015', 'P-015', B, C, A]);
  });

  it('any order is possible: the reverse of the original order on top', () => {
    const g = start();
    place(g, 'top', [C, B, A]);
    expect(cardIds(g, 'p1', 'deck').slice(0, 3)).toEqual([C, B, A]);
  });

  it('only the top 3 are looked at: the 4th and 5th cards never appear among the ordered cards', () => {
    const g = start();
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: 'top' } });
    const offered = g.legal().flatMap((a) => (a.type === 'order' ? [g.card(a.first).card] : []));
    expect(offered.sort()).toEqual([A, B, C].sort());
  });

  it('the looked-at cards are not revealed (a look is private)', () => {
    const g = start();
    place(g, 'top', [A, B, C]);
    for (const c of [A, B, C]) expect(hasEvent(g, 'CardRevealed', { card: c })).toBe(false);
  });

  it('the deck size does not change and nothing enters the hand', () => {
    const g = start();
    place(g, 'bottom', [A, B, C]);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(7);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });
});
