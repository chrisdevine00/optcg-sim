/**
 * OP18-114 Wanze (Yellow Character, cost 3, 4000, no Counter, {CP7}).
 *
 * Card text: "[On Play] Look at all of your Life cards and place them back in your Life area in any
 *             order.
 *             [Trigger] If your Leader's type includes "CP", place up to 1 Character with a cost of
 *             5 or less at the bottom of the owner's deck."
 *
 * The order prompt asks for the Life cards one at a time from the top. Scenery: Life cards
 * OP03-082 Kumadori, OP03-087 Nero, OP02-060 Mohji, OP01-012 Sai (all different, so order shows).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  kind,
  need,
  none,
  offeredIds,
  pickCards,
  play,
  LDR,
} from './kit-e.ts';
import { LE, mineE, orderBy, PLACE, triggerHit, X } from './kit-e.ts';

const W = 'OP18-114';
const A = X.cp4;
const B = X.cp3;
const C = 'OP02-060';
const D = 'OP01-012';

function played(life: string[], p2life?: string[]) {
  const g = mineE(
    LE.cp,
    { hand: [W], life, costArea: { active: 3, rested: 0 } },
    p2life ? { life: p2life } : {},
  );
  play(g, at(g, 'p1', 'hand', W));
  return g;
}
const lifeOrder = (g: ReturnType<typeof played>, who: 'p1' | 'p2' = 'p1') =>
  cardIds(g, who, 'life');

describe('OP18-114 Wanze: [On Play] look at all your Life cards and place them back in any order', () => {
  it('asks for the new order from the top; the Life area ends in exactly the chosen order', () => {
    const g = played([A, B, C, D]);
    need(g, 'order', 'p1');
    orderBy(g, [D, C, B, A]);
    expect(atMain(g, 'p1')).toBe(true);
    expect(lifeOrder(g)).toEqual([D, C, B, A]);
  });

  it('keeping the same order is possible', () => {
    const g = played([A, B, C, D]);
    orderBy(g, [A, B, C, D]);
    expect(lifeOrder(g)).toEqual([A, B, C, D]);
  });

  it('every one of the 4 Life cards is offered as the first (top) card', () => {
    const g = played([A, B, C, D]);
    need(g, 'order', 'p1');
    const names = (g.legal().filter((a) => a.type === 'order') as { first: string }[]).map(
      (a) => g.card(a.first).card,
    );
    expect(names.sort()).toEqual([A, B, C, D].sort());
  });

  it('the number of Life cards does not change and they stay face-down', () => {
    const g = played([A, B, C, D]);
    orderBy(g, [C, A, D, B]);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life').every((c) => !c.faceUp)).toBe(true);
  });

  it('only my Life is rearranged: the opponent’s Life keeps its order', () => {
    const g = played([A, B, C, D], [D, C, B, A]);
    orderBy(g, [B, A, D, C]);
    expect(lifeOrder(g, 'p2')).toEqual([D, C, B, A]);
  });

  it('with a single Life card there is nothing to order', () => {
    const g = played([A]);
    expect(kind(g)).not.toBe('order');
    expect(lifeOrder(g)).toEqual([A]);
    expect(atMain(g, 'p1')).toBe(true);
  });
});

describe('OP18-114 Wanze: [Trigger] if your Leader’s type includes "CP", place up to 1 Character with cost 5 or less at the bottom of the owner’s deck', () => {
  it('offers Characters of either player with cost <= 5 (5 in, 6 out); no draw happens', () => {
    const g = triggerHit(
      W,
      LE.cp,
      { characters: [PLACE.c2] },
      { characters: [PLACE.c5, PLACE.c6] },
    );
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PLACE.c2, PLACE.c5].sort());
    pickCards(g, [PLACE.c5]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(PLACE.c5);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = triggerHit(W, LE.cp, {}, { characters: [PLACE.c5] });
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([PLACE.c5]);
  });

  it('a Leader without a CP type: nothing happens', () => {
    const g = triggerHit(W, LDR.luffy, {}, { characters: [PLACE.c5] });
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([PLACE.c5]);
  });
});
