/**
 * OP18-044 Mr.Beans & Miss.Katherina (Character, Blue, cost 3, 4000, Counter +1000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [On Play] Draw 1 card and trash 1 card from your hand."
 *
 * Rules: [DON!! x1] needs 1 DON!! given to it (CR 10-2-?). [On Play] draws first, then trashes: the
 * card trashed is chosen by the player from the whole hand, including the card just drawn.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { cardIds, choices, describeDonPlus, kind, LDR, mine, need, VAN } from './kit-d.ts';

const BEANS = 'OP18-044';
const TOP = 'OP01-010';

function game(p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(LDR.luffy, {
    hand: [BEANS, VAN.sai, VAN.marco],
    deck: [TOP, VAN.thatch, VAN.thatch, VAN.thatch],
    ...p1,
  });
}

describeDonPlus(BEANS, 4000);

describe('OP18-044 Mr.Beans & Miss.Katherina: [On Play] draw 1 card and trash 1 card from your hand', () => {
  it('draws the top card, then asks for 1 card of the hand to trash (the played card has left the hand)', () => {
    const g = game();
    play(g, g.find('p1', 'hand', BEANS));
    need(g, 'choose', 'p1');
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([TOP, VAN.sai, VAN.marco].sort());
    expect(choices(g)).toHaveLength(3);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([TOP, VAN.marco].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(3);
    expect(kind(g)).toBe('main');
  });

  it('the card just drawn may be the one trashed', () => {
    const g = game();
    play(g, g.find('p1', 'hand', BEANS));
    act(g, { type: 'pick', choice: g.find('p1', 'hand', TOP) });
    expect(cardIds(g, 'p1', 'trash')).toEqual([TOP]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([VAN.marco, VAN.sai].sort());
  });

  it('the draw comes first: with an otherwise empty hand the drawn card is what gets trashed', () => {
    const g = game({ hand: [BEANS] });
    play(g, g.find('p1', 'hand', BEANS));
    // The only card in hand is the drawn one: either forced or a one-card pick.
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.find('p1', 'hand', TOP) });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([TOP]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([BEANS]);
  });

  it('hand size after the whole effect is unchanged (draw 1, trash 1), the deck is 1 smaller', () => {
    const g = game();
    const before = cardIds(g, 'p1', 'hand').length - 1;
    play(g, g.find('p1', 'hand', BEANS));
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.marco) });
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(before);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(3);
  });

  it('it is not an "up to" or "you may" effect: no yes/no question is asked', () => {
    const g = game();
    play(g, g.find('p1', 'hand', BEANS));
    expect(kind(g)).toBe('choose');
  });
});
