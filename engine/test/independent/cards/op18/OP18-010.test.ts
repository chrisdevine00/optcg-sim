/**
 * OP18-010 Tony Tony.Chopper (Red Character, cost 4, 5000, {Alabasta}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[On K.O.] Add up to 1 Character card with 4000 power or less from your trash to your hand."
 *
 * Reading: fires when this Character is K.O.'d (battle or effect, either turn); "up to 1" Character
 * card from the trash with printed power <= 4000 (not Events, not the 5000 power ones).
 *
 * Scenery: OP04-007 Sanji (3000), ST01-009 Vivi (4000), OP01-023 Marco (5000), OP18-018 Event,
 * OP02-007 Thatch (8000 attacker).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  atMain,
  cardIds,
  endBattle,
  hand,
  lightning,
  LC,
  need,
  none,
  offeredIds,
  pickCards,
  theirs,
  trash,
  VC,
} from './kit-c.ts';

const CHOPPER = 'OP18-010';
const EVENT = 'OP18-018';

/** p2's Thatch (8000) K.O.'s p1's rested Chopper (5000). */
function koChopper(trashCards: string[]) {
  const g = theirs(
    LC.luffy,
    { characters: [{ card: CHOPPER, rested: true }], trash: trashCards },
    { characters: [VC.thatch6] },
  );
  attack(g, at(g, 'p2', 'characters', VC.thatch6), at(g, 'p1', 'characters', CHOPPER));
  endBattle(g);
  return g;
}

describe('OP18-010 Chopper: [On K.O.] add up to 1 Character with 4000 power or less from trash', () => {
  it('K.O.’d in battle: add a 3000 power Character from the trash to hand', () => {
    const g = koChopper([VC.sanji1]);
    need(g, 'choose', 'p1');
    pickCards(g, [VC.sanji1]);
    expect(hand(g)).toEqual([VC.sanji1]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([CHOPPER]);
  });

  it('boundary: 4000 is offered, 5000 is not', () => {
    const g = koChopper([VC.vivi2, VC.marco3, VC.sanji1]);
    expect(offeredIds(g)).toEqual([VC.sanji1, VC.vivi2].sort());
  });

  it('only Character cards: an Event in the trash is not offered', () => {
    const g = koChopper([EVENT, VC.sanji1]);
    expect(offeredIds(g)).toEqual([VC.sanji1]);
  });

  it('the K.O.’d Chopper itself (5000) is not eligible', () => {
    const g = koChopper([VC.sanji1]);
    expect(offeredIds(g)).not.toContain(CHOPPER);
  });

  it('"up to 1": may take nothing', () => {
    const g = koChopper([VC.sanji1]);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([CHOPPER, VC.sanji1].sort());
  });

  it('only one card is added even with several eligible', () => {
    const g = koChopper([VC.sanji1, VC.vivi2, VC.karoo1]);
    pickCards(g, [VC.vivi2]);
    expect(hand(g)).toEqual([VC.vivi2]);
    expect(trash(g)).toHaveLength(3);
  });

  it('with no eligible card in the trash nothing is asked', () => {
    const g = koChopper([VC.marco3, EVENT]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('also when K.O.’d by an opponent’s effect (OP09-077 Gum-Gum Lightning, 6000 or less)', () => {
    const g = theirs(
      LC.luffy,
      { characters: [CHOPPER], trash: [VC.sanji1] },
      { hand: ['OP09-077'] },
      'ST04-001',
    );
    lightning(g, at(g, 'p1', 'characters', CHOPPER));
    need(g, 'choose', 'p1');
    pickCards(g, [VC.sanji1]);
    expect(hand(g)).toEqual([VC.sanji1]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});
