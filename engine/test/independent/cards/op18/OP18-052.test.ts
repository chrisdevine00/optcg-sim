/**
 * OP18-052 Mr.5 & Miss.Valentine (Character, Blue, cost 5, 4000, Counter +2000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [On Play] Play up to 1 Character card with a type including "Baroque Works" and a cost of 3 or
 *    less from your hand."
 *
 * Rules: the [On Play] plays a card from hand without paying its cost; "type including" is a
 * substring match ({Former Baroque Works} counts); cost 3 is allowed, cost 4 is not; "up to 1"
 * may pick none; the played card's own [On Play] fires.
 *
 * Scenery: OP01-080 Miss Doublefinger (Blue, cost 3, 4000, {Baroque Works}); OP18-043 Accelegator
 * (cost 4, BW); OP02-063 Mr.1 (Blue, cost 1, {Impel Down}/{Former Baroque Works}); OP01-012 Sai
 * (cost 2, no type); OP18-044 Mr.Beans (cost 3, BW, [On Play] draw 1 trash 1).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  BW,
  cardIds,
  choiceCards,
  choices,
  describeDonPlus,
  donOf,
  kind,
  mine,
  need,
  settleEmpty,
  VAN,
} from './kit-d.ts';

const VALENTINE = 'OP18-052';
const BEANS = 'OP18-044';

describeDonPlus(VALENTINE, 4000);

function game(hand: string[], p1: Partial<PlayerSpec> = {}): TestGame {
  const g = mine('ST03-001', { hand: [VALENTINE, ...hand], ...p1 });
  play(g, g.find('p1', 'hand', VALENTINE));
  return g;
}

describe('OP18-052 Mr.5 & Miss.Valentine: [On Play] play up to 1 Baroque Works Character (cost 3 or less) from hand', () => {
  it('plays the chosen card for free; it enters the field active and leaves the hand', () => {
    const g = game([BW.bw3, VAN.sai]);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([BW.bw3]);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.bw3) });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([BW.bw3, VALENTINE].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    expect(g.card(g.find('p1', 'characters', BW.bw3)).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('cost boundary: cost 3 is offered, cost 4 (Accelegator) is not', () => {
    const g = game([BW.bw3, BW.accel4]);
    expect(choiceCards(g)).toEqual([BW.bw3]);
  });

  it('"type including": a cost 1 {Former Baroque Works} card is offered', () => {
    const g = game([BW.bw1weak]);
    expect(choiceCards(g)).toEqual([BW.bw1weak]);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.bw1weak) });
    expect(cardIds(g, 'p1', 'characters')).toContain(BW.bw1weak);
  });

  it('a Character without a Baroque Works type (Sai) is not offered; with only such cards nothing is played', () => {
    const g = game([VAN.sai]);
    if (kind(g) === 'choose') expect(choices(g)).toEqual([]);
    settleEmpty(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VALENTINE]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
  });

  it('"up to 1": the pick may be empty', () => {
    const g = game([BW.bw3]);
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.bw3]);
    expect(kind(g)).toBe('main');
  });

  it('only 1 card is played even with two candidates', () => {
    const g = game([BW.bw3, BW.bw1weak]);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.bw3) });
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.bw1weak]);
  });

  it('the played Character’s own [On Play] fires (Mr.Beans: draw 1, trash 1)', () => {
    const g = game([BEANS, VAN.sai], { deck: ['OP01-010', 'OP01-010', 'OP01-010'] });
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BEANS) });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'hand')).toEqual(['OP01-010']);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });
});
