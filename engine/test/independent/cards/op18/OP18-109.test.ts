/**
 * OP18-109 Fukurou (Yellow Character, cost 5, 4000, Counter +2000, {CP9}, [Blocker]).
 *
 * Card text: "[Blocker]
 *             [Trigger] If your Leader's type includes "CP", K.O. or rest up to 1 of your opponent's
 *             Characters with a cost of 6 or less."
 *
 * "K.O. or rest" is a choice of one (mode prompt: option 0 = K.O., 1 = rest). Scenery: OP02-007
 * Thatch (cost 6), OP02-020 LittleOars (cost 7), OP01-012 Sai (cost 2), OP02-006 Kingdew (attacker).
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
import { LE, PLACE, pickOption, theirsE, triggerHit } from './kit-e.ts';

const F = 'OP18-109';

describe('OP18-109 Fukurou: [Blocker]', () => {
  it('can block an attack on the Leader (5000 attacker vs its 4000: Fukurou is K.O.’d, the Leader is safe)', () => {
    const g = theirsE(LDR.luffy, { characters: [F] }, { characters: [CH.kingdew5] });
    expect(kw(g, at(g, 'p1', 'characters', F))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', F)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', F) });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([F]);
  });

  it('a rested Fukurou cannot block', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: F, rested: true }] },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});

describe('OP18-109 Fukurou: [Trigger] if your Leader’s type includes "CP", K.O. or rest up to 1 opposing Character with cost 6 or less', () => {
  const p2 = { characters: [PLACE.c2, PLACE.c6, PLACE.c7] };

  it('K.O. mode: cost 6 is in, cost 7 is out; the pick is K.O.’d', () => {
    const g = triggerHit(F, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '0');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PLACE.c2, PLACE.c6].sort());
    pickCards(g, [PLACE.c6]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([PLACE.c6]);
  });

  it('rest mode: the pick is rested and stays on the field', () => {
    const g = triggerHit(F, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '1');
    pickCards(g, [PLACE.c6]);
    expect(g.card(at(g, 'p2', 'characters', PLACE.c6)).rested).toBe(true);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = triggerHit(F, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '0');
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('opposing Characters only: none of mine is offered', () => {
    const g = triggerHit(F, LE.cp, { characters: [PLACE.c4] }, { characters: [PLACE.c2] });
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '1');
    expect(offeredIds(g)).toEqual([PLACE.c2]);
  });

  it('a Leader without a CP type: the Trigger does nothing', () => {
    const g = triggerHit(F, LDR.luffy, {}, p2);
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });
});
