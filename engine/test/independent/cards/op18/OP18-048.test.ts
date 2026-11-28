/**
 * OP18-048 Mr.1 & Miss Doublefinger (Character, Blue, cost 6, 6000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[Rush] (This card can attack on the turn in which it is played.)
 *    [On Play] Play up to 1 Character card with a type including "Baroque Works" and a cost of 5
 *    or less from your hand."
 *
 * Rules: [Rush] lets it attack the turn it is played (CR 10-1-1). The [On Play] plays a card from
 * hand without paying its cost; "type including" is a substring match (Former Baroque Works counts);
 * cost 5 is allowed, cost 6 is not; "up to 1" may pick none. A card played by an effect fires its
 * own [On Play]. A full Character area asks which Character to trash (CR 3-7-6-1).
 *
 * Scenery: OP18-043 Accelegator (Blue, cost 4, {Baroque Works}); OP14-095 Mr.9 (Black, cost 5, BW);
 * OP09-055 Mr.1 (Blue, cost 5, {Former Baroque Works}); OP01-012 Sai (no type); OP18-044 Mr.Beans
 * (Blue, cost 3, BW, [On Play] draw 1 trash 1).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, canAttack, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  BW,
  cardIds,
  choiceCards,
  choices,
  donOf,
  kind,
  mine,
  need,
  settleEmpty,
  VAN,
} from './kit-d.ts';

const DF = 'OP18-048';
const CROC = 'ST03-001';
const BEANS = 'OP18-044';

function game(hand: string[], p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(CROC, { hand: [DF, ...hand], ...p1 }, {});
}

const playDf = (g: TestGame) => play(g, g.find('p1', 'hand', DF));

describe('OP18-048 Mr.1 & Miss Doublefinger: [Rush]', () => {
  it('it can attack the turn it is played', () => {
    const g = game([]);
    playDf(g);
    settleEmpty(g);
    expect(kind(g)).toBe('main');
    expect(canAttack(g, g.find('p1', 'characters', DF), g.leader('p2'))).toBe(true);
  });
});

describe('OP18-048 Mr.1 & Miss Doublefinger: [On Play] play up to 1 Baroque Works Character (cost 5 or less) from hand', () => {
  it('plays the chosen card for free: it enters the field, leaves the hand, no DON!! beyond the 6 paid for Mr.1', () => {
    const g = game([BW.accel4, VAN.sai]);
    playDf(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([BW.accel4]);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.accel4) });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([BW.accel4, DF].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expect(g.card(g.find('p1', 'characters', BW.accel4)).rested).toBe(false);
  });

  it('cost boundary: a cost 5 Baroque Works Character is offered; a cost 6 one (another Mr.1 & Miss Doublefinger) is not', () => {
    const g = game([BW.mr9, DF]);
    playDf(g);
    expect(choiceCards(g)).toEqual([BW.mr9]);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.mr9) });
    expect(cardIds(g, 'p1', 'hand')).toEqual([DF]);
  });

  it('"type including": {Former Baroque Works} (cost 5) is offered', () => {
    const g = game([BW.formerBw5]);
    playDf(g);
    expect(choiceCards(g)).toEqual([BW.formerBw5]);
  });

  it('a Character without a Baroque Works type is not offered (Sai, cost 2); an Event is not offered either', () => {
    const g = game([VAN.sai, 'OP09-077']);
    playDf(g);
    if (kind(g) === 'choose') expect(choices(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([DF]);
  });

  it('"up to 1": the pick may be empty and the candidate stays in hand', () => {
    const g = game([BW.accel4]);
    playDf(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.accel4]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([DF]);
  });

  it('only 1 card is played even with two candidates in hand', () => {
    const g = game([BW.accel4, BW.mr9]);
    playDf(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.accel4) });
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.mr9]);
  });

  it('the played Character’s own [On Play] fires (Mr.Beans draws 1 and trashes 1)', () => {
    const g = game([BEANS, VAN.sai], { deck: ['OP01-010', 'OP01-010', 'OP01-010'] });
    playDf(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BEANS) });
    need(g, 'choose', 'p1');
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });

  it('with 4 other Characters the area is full: after the play I must trash one Character', () => {
    const g = game([BW.accel4], { characters: [VAN.sai, VAN.sai, VAN.sai, VAN.sai] });
    playDf(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', BW.accel4) });
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    act(g, { type: 'pick', choice: g.find('p1', 'characters', VAN.sai, 0) });
    expect(cardIds(g, 'p1', 'characters')).toHaveLength(5);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });
});
