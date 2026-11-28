/**
 * OP18-040 Diable Jambe Flambé Shot (Green Event, cost 4, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Main] K.O. up to 1 of your opponent's rested Characters with a cost of 7 or less.
 *    [Trigger] Rest up to 1 of your opponent's Characters with a cost of 7 or less."
 *
 * Reading: [Main] K.O.s a RESTED opposing Character with cost <= 7 (current cost). [Trigger] rests
 * any opposing Character (active ones) with cost <= 7 when the card is revealed from Life and used.
 *
 * Scenery: OP02-007 Thatch (cost 6), OP02-020 LittleOars Jr. (cost 7), OP12-005 Shiki (cost 8),
 * OP02-006 Kingdew (cost 5), OP01-023 Marco (cost 3).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  cardIds,
  declineTrigger,
  fill,
  hand,
  kind,
  LC,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playCard,
  theirs,
  trash,
  VC,
} from './kit-c.ts';

const FLAMBE = 'OP18-040';

function main(oppChars: (string | { card: string; rested?: boolean })[]) {
  const g = mine(LC.luffy, { hand: [FLAMBE] }, { characters: oppChars });
  playCard(g, FLAMBE);
  return g;
}

describe('OP18-040 Diable Jambe Flambé Shot: [Main] K.O. a rested opposing Character with cost 7 or less', () => {
  it('K.O.s a rested cost 6 Character', () => {
    const g = main([{ card: VC.thatch6, rested: true }]);
    need(g, 'choose', 'p1');
    pickCards(g, [VC.thatch6]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([VC.thatch6]);
  });

  it('boundary: cost 7 is offered, cost 8 is not', () => {
    const g = main([
      { card: VC.oars7, rested: true },
      { card: VC.shiki8, rested: true },
    ]);
    expect(offeredIds(g)).toEqual([VC.oars7]);
    pickCards(g, [VC.oars7]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.shiki8]);
  });

  it('only rested Characters: an active one is not offered', () => {
    const g = main([
      { card: VC.thatch6, rested: false },
      { card: VC.kingdew5, rested: true },
    ]);
    expect(offeredIds(g)).toEqual([VC.kingdew5]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = main([{ card: VC.thatch6, rested: true }]);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.thatch6]);
  });

  it('only one Character is K.O.’d when two qualify', () => {
    const g = main([
      { card: VC.thatch6, rested: true },
      { card: VC.kingdew5, rested: true },
    ]);
    pickCards(g, [VC.thatch6]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VC.kingdew5]);
  });

  it('with no rested Character with cost 7 or less nothing is asked', () => {
    const g = main([VC.thatch6, { card: VC.shiki8, rested: true }]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });
});

describe('OP18-040 Diable Jambe Flambé Shot: [Trigger] rest up to 1 opposing Character with cost 7 or less', () => {
  /** p2's Kingdew hits p1's Leader and the top Life card is the Event; p2 has an active Thatch and Shiki. */
  function hit() {
    const g = theirs(
      LC.luffy,
      { life: [FLAMBE, ...fill(BLUE, 3)] },
      { characters: [VC.kingdew5, VC.thatch6, VC.shiki8] },
    );
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), g.leader('p1'));
    g.act({ type: 'block', blocker: null });
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    return g;
  }

  it('rests an active opposing Character with cost 7 or less', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [VC.thatch6]);
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(true);
  });

  it('cost 8 is not offered; the already rested attacker is not a useful target', () => {
    const g = hit();
    activateTrigger(g);
    expect(offeredIds(g)).not.toContain(VC.shiki8);
    expect(offeredIds(g)).toContain(VC.thatch6);
  });

  it('"up to 1": may rest nothing', () => {
    const g = hit();
    activateTrigger(g);
    none(g);
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(false);
  });

  it('not activating: the card goes to hand and nothing is rested', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toContain(FLAMBE);
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(false);
  });
});
