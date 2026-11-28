/**
 * OP18-107 Nero (Yellow Character, cost 4, 4000, Counter +1000, {CP9}, [Blocker]).
 *
 * Card text: "[Blocker]
 *             [Trigger] If your Leader's type includes "CP", place up to 1 Character with a cost of 5
 *             or less at the bottom of the owner's deck."
 *
 * Scenery: OP02-006 Kingdew (cost 5, 7000; the attacker), OP02-007 Thatch (cost 6), OP01-012 Sai
 * (cost 2), OP01-070 Mihawk (cost 9); OP03-076 CP Leader; ST01-001.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  blockers,
  cardIds,
  kw,
  need,
  none,
  offeredIds,
  passCounter,
  pickCards,
  LDR,
  CH,
} from './kit-e.ts';
import { LE, PLACE, theirsE, triggerHit } from './kit-e.ts';

const N = 'OP18-107';

describe('OP18-107 Nero: [Blocker]', () => {
  it('has [Blocker] and can block an attack on the Leader; a 7000 attacker K.O.s its 4000', () => {
    const g = theirsE(LDR.luffy, { characters: [N] }, { characters: [CH.kingdew5] });
    expect(kw(g, at(g, 'p1', 'characters', N))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', N)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', N) });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([N]);
  });

  it('a rested Nero cannot block', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: N, rested: true }] },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});

describe('OP18-107 Nero: [Trigger] if your Leader’s type includes "CP", place up to 1 Character with cost 5 or less at the bottom of the owner’s deck', () => {
  it('offers Characters of both players with cost <= 5 (5 in, 6 out)', () => {
    const g = triggerHit(
      N,
      LE.cp,
      { characters: [PLACE.c2, PLACE.c6] },
      { characters: [PLACE.c5, PLACE.c7] },
    );
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PLACE.c2, PLACE.c5].sort());
  });

  it('an opposing Character goes to the bottom of the opposing deck; no draw happens', () => {
    const g = triggerHit(N, LE.cp, {}, { characters: [PLACE.c5] });
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [PLACE.c5]);
    const d = cardIds(g, 'p2', 'deck');
    expect(d[d.length - 1]).toBe(PLACE.c5);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('my own Character can be chosen and goes to the bottom of my deck', () => {
    const g = triggerHit(N, LE.cp, { characters: [PLACE.c2] }, { characters: [PLACE.c5] });
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [PLACE.c2]);
    const d = cardIds(g, 'p1', 'deck');
    expect(d[d.length - 1]).toBe(PLACE.c2);
  });

  it('"up to 1": may choose nothing', () => {
    const g = triggerHit(N, LE.cp, {}, { characters: [PLACE.c5] });
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([PLACE.c5]);
  });

  it('a Leader without a CP type: nothing happens', () => {
    const g = triggerHit(N, LDR.luffy, {}, { characters: [PLACE.c5] });
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([PLACE.c5]);
  });

  it('only cost-6+ Characters on the field: nothing to choose, the Trigger ends', () => {
    const g = triggerHit(N, LE.cp, {}, { characters: [PLACE.c6, PLACE.c9] });
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });
});
