/**
 * OP18-100 Kalifa (Yellow Character, cost 6, 7000, Counter +1000, {CP9}).
 *
 * Card text: "[On Play] Draw 1 card, then add up to 1 card with a type including "CP" from your hand
 *             to the top or bottom of your Life cards face-up.
 *             [Trigger] If your Leader's type includes "CP", draw 1 card and rest up to 1 of your
 *             opponent's Leader or Characters."
 *
 * Scenery: CP hand cards OP03-082 / -087 / -085 / -084 and OP08-091 (Former CP9); OP03-076 Rob
 * Lucci (CP9 Leader, text inert); ST01-001 (not CP); OP02-006 Kingdew, OP01-018 Hajrudin.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  kind,
  none,
  need,
  offeredIds,
  pickCards,
  play,
  LDR,
  CH,
} from './kit-e.ts';
import { describeLifeAdd, LE, mineE, pickOption, triggerHit, X } from './kit-e.ts';

const K = 'OP18-100';
const MISS = 'OP02-060';

describeLifeAdd({
  id: 'OP18-100 Kalifa [On Play]',
  start: (hand) => {
    const g = mineE(LE.cp, { hand: [K, ...hand], costArea: { active: 6, rested: 0 } });
    play(g, at(g, 'p1', 'hand', K));
    return g;
  },
});

describe('OP18-100 Kalifa: [On Play] draw 1, then add', () => {
  it('draws first: a CP card drawn from the deck is itself eligible to be added', () => {
    const g = mineE(LE.cp, {
      hand: [K, MISS],
      deck: [X.cp5, MISS, MISS, MISS],
      costArea: { active: 6, rested: 0 },
    });
    play(g, at(g, 'p1', 'hand', K));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([X.cp5]);
    pickCards(g, [X.cp5]);
    pickOption(g, 'top');
    expect(g.zone('p1', 'life')[0]!.card).toBe(X.cp5);
    expect(cardIds(g, 'p1', 'hand')).toEqual([MISS]);
  });

  it('the draw happens even when nothing is added', () => {
    const g = mineE(LE.cp, {
      hand: [K, X.cp4],
      deck: [MISS, MISS, MISS, MISS],
      costArea: { active: 6, rested: 0 },
    });
    play(g, at(g, 'p1', 'hand', K));
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(3);
  });

  it('the draw happens when no CP card is in hand either', () => {
    const g = mineE(LE.cp, {
      hand: [K],
      deck: [MISS, MISS, MISS],
      costArea: { active: 6, rested: 0 },
    });
    play(g, at(g, 'p1', 'hand', K));
    if (kind(g) === 'choose') none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([MISS]);
    expect(atMain(g, 'p1')).toBe(true);
  });
});

describe('OP18-100 Kalifa: [Trigger] if your Leader’s type includes "CP", draw 1 card and rest up to 1 opposing Leader or Character', () => {
  const p2 = { characters: [CH.kingdew5, CH.hajrudin4] };
  const deck = [X.cp4, MISS, MISS, MISS, MISS];

  it('draws, then offers the opposing Leader and Characters (not my own cards)', () => {
    const g = triggerHit(K, LE.cp, { characters: [CH.thatch6], deck }, p2);
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    need(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    expect(offeredIds(g)).toEqual([CH.hajrudin4, CH.kingdew5, LDR.luffy].sort());
  });

  it('resting an opposing Character', () => {
    const g = triggerHit(K, LE.cp, { deck }, p2);
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [CH.kingdew5]);
    expect(g.card(at(g, 'p2', 'characters', CH.kingdew5)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', CH.hajrudin4)).rested).toBe(false);
  });

  it('resting the opposing Leader', () => {
    const g = triggerHit(K, LE.cp, { deck }, p2);
    act(g, { type: 'trigger', activate: true });
    const choices = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(choices).toContain(g.leader('p2'));
    act(g, { type: 'pick', choice: g.leader('p2') });
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('"up to 1": the draw still happens when nothing is rested', () => {
    const g = triggerHit(K, LE.cp, { deck }, p2);
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    expect(g.card(at(g, 'p2', 'characters', CH.kingdew5)).rested).toBe(false);
  });

  it('a Leader without a CP type: nothing is drawn and nothing is rested', () => {
    const g = triggerHit(K, LDR.luffy, { deck }, p2);
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(g.card(at(g, 'p2', 'characters', CH.kingdew5)).rested).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('declining the Trigger adds the card to hand and does nothing else', () => {
    const g = triggerHit(K, LE.cp, { deck }, p2);
    act(g, { type: 'trigger', activate: false });
    expect(cardIds(g, 'p1', 'hand')).toEqual([K]);
  });
});
