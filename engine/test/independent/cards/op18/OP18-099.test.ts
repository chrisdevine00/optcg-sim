/**
 * OP18-099 Kaku (Yellow Character, cost 7, 9000, no Counter, {CP9}).
 *
 * Card text: "[On Play] Add up to 1 card with a type including "CP" from your hand to the top or
 *             bottom of your Life cards face-up.
 *             [Trigger] If your Leader's type includes "CP", draw 1 card and place up to 1
 *             Character with a cost of 8 or less at the bottom of the owner's deck."
 *
 * Scenery: CP hand cards OP03-082 Kumadori, OP03-087 Nero, OP03-085 Jabra, OP03-084 Jerry (CP6),
 * OP08-091 Whos.Who (Former CP9); OP03-076 Rob Lucci (CP9 Leader, text inert); ST01-001 (not CP).
 * Characters for the Trigger: OP02-006 Kingdew (5), OP12-005 Shiki (8), OP01-070 Mihawk (9).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  need,
  none,
  offeredIds,
  pickCards,
  play,
  LDR,
  CH,
} from './kit-e.ts';
import { describeLifeAdd, LE, mineE, triggerHit, X } from './kit-e.ts';

const KAKU = 'OP18-099';
const MISS = 'OP02-060';
const C8 = 'OP12-005';
const C9 = 'OP01-070';

describeLifeAdd({
  id: 'OP18-099 Kaku [On Play]',
  start: (hand) => {
    const g = mineE(LE.cp, { hand: [KAKU, ...hand], costArea: { active: 7, rested: 0 } });
    play(g, at(g, 'p1', 'hand', KAKU));
    return g;
  },
});

describe('OP18-099 Kaku: [Trigger] if your Leader’s type includes "CP", draw 1 and place up to 1 Character cost <= 8 at the bottom of its owner’s deck', () => {
  const deckTop = [X.cp4, MISS, MISS, MISS, MISS, MISS, MISS];

  it('with a CP Leader: draws 1, then offers Characters of both players with cost <= 8', () => {
    const g = triggerHit(
      KAKU,
      LE.cp,
      { characters: [CH.kingdew5, C9], deck: deckTop },
      { characters: [C8] },
    );
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CH.kingdew5, C8].sort());
  });

  it('boundary: cost 8 is offered, cost 9 is not', () => {
    const g = triggerHit(KAKU, LE.cp, { characters: [C9] }, { characters: [C8] });
    act(g, { type: 'trigger', activate: true });
    expect(offeredIds(g)).toEqual([C8]);
  });

  it('an opponent’s Character goes to the bottom of the opponent’s deck', () => {
    const g = triggerHit(KAKU, LE.cp, {}, { characters: [C8] });
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [C8]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(C8);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('one of my own Characters goes to the bottom of my deck', () => {
    const g = triggerHit(KAKU, LE.cp, { characters: [CH.kingdew5] }, { characters: [C8] });
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [CH.kingdew5]);
    const d = cardIds(g, 'p1', 'deck');
    expect(d[d.length - 1]).toBe(CH.kingdew5);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([C8]);
  });

  it('"up to 1": the draw happens even when no Character is chosen', () => {
    const g = triggerHit(KAKU, LE.cp, { characters: [CH.kingdew5], deck: deckTop });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CH.kingdew5]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('a Leader without a CP type: the Trigger does nothing (no draw, nothing moved)', () => {
    const g = triggerHit(KAKU, LDR.luffy, { characters: [CH.kingdew5], deck: deckTop });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CH.kingdew5]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([KAKU]);
  });

  it('a Leader with the type CP0 also qualifies (the type merely includes "CP")', () => {
    const g = triggerHit(KAKU, 'OP07-079', { deck: deckTop });
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
  });
});
