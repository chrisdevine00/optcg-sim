/**
 * OP18-105 Spandam (Yellow Character, cost 1, 1000, Counter +2000, {CP9}). No [On Play] text.
 *
 * Card text: "[Trigger] If your Leader's type includes "CP", reveal up to 1 card with a type
 *             including "CP" other than [Spandam] from your hand. Activate the [Trigger] effect of
 *             the revealed card."
 *
 * Reading (OPEN-QUESTIONS M6b-Q98): the revealed card's [Trigger] runs with that card as its
 * source and stays in the hand. Scenery as the revealed cards: OP18-110 Blueno ([Trigger] Draw 1
 * card and K.O. up to 1 opposing Character with cost 2 or less), OP18-115 Ten Finger Pistol
 * ([Trigger] if CP Leader: draw 1 and place a Character with cost 7 or less at the bottom of the
 * deck), OP18-094 (an Elbaph Event with [Trigger] Draw 1; not CP). OP03-076 is the CP Leader.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  hasEvent,
  need,
  none,
  offeredIds,
  pickCards,
  LDR,
} from './kit-e.ts';
import { LE, triggerHit, X } from './kit-e.ts';

const SP = 'OP18-105';
const BLUENO = 'OP18-110';
const TFP = 'OP18-115';
const NONCP = 'OP18-094';
const MISS = 'OP02-060';
const SAI = 'OP01-012';
const C7 = 'OP02-020';

describe('OP18-105 Spandam: [Trigger] reveal a CP card from hand and activate its [Trigger]', () => {
  it('offers CP cards other than [Spandam]; a non-CP card with a [Trigger] and another [Spandam] are not offered', () => {
    // OP03-086 is another card named [Spandam] (CP9): excluded by name like OP18-105 itself.
    const g = triggerHit(
      SP,
      LE.cp,
      { hand: [BLUENO, TFP, SP, 'OP03-086', NONCP] },
      { characters: [SAI] },
    );
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BLUENO, TFP].sort());
    none(g);
  });

  it('revealing Blueno runs its [Trigger]: draw 1, then K.O. an opposing Character with cost 2 or less', () => {
    const g = triggerHit(
      SP,
      LE.cp,
      { hand: [BLUENO, NONCP], deck: [X.cp4, MISS, MISS, MISS] },
      { characters: [SAI, 'OP02-006'] },
    );
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [BLUENO]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI]);
    pickCards(g, [SAI]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SAI]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([BLUENO, NONCP, X.cp4].sort());
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('the revealed card stays in hand (it is not trashed or played); Spandam itself is trashed', () => {
    const g = triggerHit(SP, LE.cp, { hand: [BLUENO] }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [BLUENO]);
    if (!atMain(g, 'p2')) none(g);
    expect(cardIds(g, 'p1', 'hand')).toContain(BLUENO);
    expect(cardIds(g, 'p1', 'trash')).toEqual([SP]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('the revealed card is shown (CR 11-2-1)', () => {
    const g = triggerHit(SP, LE.cp, { hand: [BLUENO] }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [BLUENO]);
    expect(hasEvent(g, 'CardRevealed', { card: BLUENO })).toBe(true);
  });

  it('revealing Ten Finger Pistol runs its [Trigger] (draw 1, place a Character with cost <= 7 at the bottom of its owner’s deck)', () => {
    const g = triggerHit(
      SP,
      LE.cp,
      { hand: [TFP], deck: [X.cp4, MISS, MISS, MISS] },
      { characters: [C7, 'OP12-005'] },
    );
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [TFP]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([TFP, X.cp4].sort());
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C7]);
    pickCards(g, [C7]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(C7);
  });

  it('"up to 1": may reveal nothing; no [Trigger] runs and nothing is drawn', () => {
    const g = triggerHit(
      SP,
      LE.cp,
      { hand: [BLUENO], deck: [X.cp4, MISS, MISS, MISS] },
      { characters: [SAI] },
    );
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BLUENO]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SAI]);
  });

  it('a Leader without a CP type: nothing is asked and nothing happens', () => {
    const g = triggerHit(SP, LDR.luffy, { hand: [BLUENO] }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BLUENO]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SAI]);
  });

  it('with no eligible CP card in hand, the Trigger does nothing', () => {
    const g = triggerHit(SP, LE.cp, { hand: [NONCP, MISS] }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    if (!atMain(g, 'p2')) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(cardIds(g, 'p2', 'characters')).toEqual([SAI]);
    void at;
  });
});
