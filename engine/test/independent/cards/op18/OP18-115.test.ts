/**
 * OP18-115 Ten Finger Pistol (Yellow Event, cost 4, {CP9}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's Characters with a cost of 5 or less.
 *             [Trigger] If your Leader's type includes "CP", draw 1 card and place up to 1
 *             Character with a cost of 7 or less at the bottom of the owner's deck."
 *
 * Scenery: opposing Characters of cost 2 / 5 / 6 / 7 / 8 (OP01-012, OP02-006, OP02-007, OP02-020,
 * OP12-005); OP03-076 CP Leader; ST01-001.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  donOf,
  need,
  none,
  offeredIds,
  pickCards,
  play,
  LDR,
} from './kit-e.ts';
import { LE, mineE, PLACE, triggerHit, X } from './kit-e.ts';

const T = 'OP18-115';
const MISS = 'OP02-060';

describe('OP18-115 Ten Finger Pistol: [Main] K.O. up to 1 opposing Character with cost 5 or less', () => {
  const start = (p1: object = {}) => {
    const g = mineE(
      LDR.luffy,
      { hand: [T], costArea: { active: 4, rested: 0 }, ...p1 },
      { characters: [PLACE.c2, PLACE.c5, PLACE.c6, PLACE.c8] },
    );
    play(g, at(g, 'p1', 'hand', T));
    return g;
  };

  it('costs 4 DON!!, offers opposing Characters with cost <= 5 (5 in, 6 out) and K.O.s the pick', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PLACE.c2, PLACE.c5].sort());
    pickCards(g, [PLACE.c5]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([PLACE.c5]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([T]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('"up to 1": may K.O. nothing; the Event is still used', () => {
    const g = start();
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([T]);
  });

  it('K.O.s only one Character', () => {
    const g = start();
    pickCards(g, [PLACE.c2]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('only opposing Characters: my own cost-2 Character is not offered', () => {
    const g = start({ characters: ['OP01-012'] });
    expect(offeredIds(g)).toEqual([PLACE.c2, PLACE.c5].sort());
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('it cannot be played with fewer than 4 active DON!!', () => {
    const g = mineE(LDR.luffy, { hand: [T], costArea: { active: 3, rested: 0 } });
    const inst = at(g, 'p1', 'hand', T);
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === inst)).toBe(false);
  });
});

describe('OP18-115 Ten Finger Pistol: [Trigger] if your Leader’s type includes "CP", draw 1 and place up to 1 Character cost <= 7 at the bottom of its owner’s deck', () => {
  const deck = [X.cp4, MISS, MISS, MISS, MISS];

  it('CP Leader: draws, then offers Characters of either player with cost <= 7 (7 in, 8 out)', () => {
    const g = triggerHit(
      T,
      LE.cp,
      { deck, characters: [PLACE.c5] },
      { characters: [PLACE.c7, PLACE.c8] },
    );
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PLACE.c5, PLACE.c7].sort());
    pickCards(g, [PLACE.c7]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(PLACE.c7);
    expect(cardIds(g, 'p1', 'trash')).toEqual([T]);
  });

  it('"up to 1": the draw still happens when nothing is placed', () => {
    const g = triggerHit(T, LE.cp, { deck }, { characters: [PLACE.c7] });
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([PLACE.c7]);
  });

  it('a Leader without a CP type: nothing is drawn or placed', () => {
    const g = triggerHit(T, LDR.luffy, { deck }, { characters: [PLACE.c7] });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([PLACE.c7]);
  });

  it('declining the Trigger adds the Event to hand', () => {
    const g = triggerHit(T, LE.cp, { deck }, { characters: [PLACE.c7] });
    act(g, { type: 'trigger', activate: false });
    expect(cardIds(g, 'p1', 'hand')).toEqual([T]);
  });
});
