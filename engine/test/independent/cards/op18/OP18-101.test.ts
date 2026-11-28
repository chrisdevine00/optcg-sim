/**
 * OP18-101 Kumadori (Yellow Character, cost 4, 6000, no Counter, {CP9}).
 *
 * Card text: "[On K.O.] Add up to 1 card with a type including "CP" from your hand to the top or
 *             bottom of your Life cards face-up.
 *             [Trigger] If your Leader's type includes "CP", K.O. or rest up to 1 of your
 *             opponent's Characters with a cost of 6 or less."
 *
 * "K.O. or rest" is a choice of one of the two (the mode prompt offers both). Scenery: OP02-006
 * Kingdew (cost 5, 7000; also the K.O. attacker), OP02-007 Thatch (cost 6), OP02-020 LittleOars
 * (cost 7), OP01-012 Sai (cost 2); CP hand cards as in OP18-099.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  cardIds,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  LDR,
  CH,
} from './kit-e.ts';
import { describeLifeAdd, LE, pickOption, theirsE, triggerHit, X } from './kit-e.ts';

const KU = 'OP18-101';
const SAI = 'OP01-012';
const OARS = 'OP02-020';

describeLifeAdd({
  id: 'OP18-101 Kumadori [On K.O.]',
  main: 'p2',
  start: (hand) => {
    const g = theirsE(
      LE.cp,
      { characters: [{ card: KU, rested: true }], hand },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), at(g, 'p1', 'characters', KU));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  },
});

describe('OP18-101 Kumadori: [On K.O.] only fires when it is K.O.’d', () => {
  it('a 5000 attacker does not K.O. the 6000 Kumadori: no prompt, no change', () => {
    const g = theirsE(
      LE.cp,
      { characters: [{ card: KU, rested: true }], hand: [X.cp4] },
      { characters: [CH.marco3] },
    );
    attack(g, at(g, 'p2', 'characters', CH.marco3), at(g, 'p1', 'characters', KU));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.zone('p1', 'life')).toHaveLength(4);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KU]);
  });
});

describe('OP18-101 Kumadori: [Trigger] if your Leader’s type includes "CP", K.O. or rest up to 1 opposing Character with cost 6 or less', () => {
  const p2 = { characters: [SAI, CH.thatch6, OARS] };

  it('K.O. mode: offers opposing Characters of cost <= 6 only (6 in, 7 out) and K.O.s the pick', () => {
    const g = triggerHit(KU, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '0');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI, CH.thatch6].sort());
    pickCards(g, [CH.thatch6]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.thatch6]);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SAI, OARS].sort());
  });

  it('rest mode: the pick is rested, not K.O.’d', () => {
    const g = triggerHit(KU, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '1');
    pickCards(g, [SAI]);
    expect(g.card(at(g, 'p2', 'characters', SAI)).rested).toBe(true);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = triggerHit(KU, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '0');
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('only opposing Characters: my own are never offered', () => {
    const g = triggerHit(KU, LE.cp, { characters: [CH.mohji1] }, { characters: [SAI] });
    act(g, { type: 'trigger', activate: true });
    pickOption(g, '0');
    expect(offeredIds(g)).toEqual([SAI]);
  });

  it('a Leader without a CP type: the Trigger does nothing', () => {
    const g = triggerHit(KU, LDR.luffy, {}, p2);
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });
});
