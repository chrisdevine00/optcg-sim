/**
 * OP18-116 Iron Body Empty Tree (Yellow Event, cost 0, {CP9}).
 *
 * Card text: "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Characters
 *             gains +3000 power during this battle.
 *             [Trigger] If your Leader's type includes "CP", rest up to 1 of your opponent's
 *             Characters."
 *
 * Reading: the trash is a cost paid from the hand left after the Event is used (the Event itself is
 * not in the hand any more). Cost 0, so no DON!! is needed. Scenery: OP02-006 Kingdew (7000
 * attacker), OP01-023 Marco (hand fodder), OP02-060 Mohji, OP01-018 Hajrudin (cost 4, 6000).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  atMain,
  attack,
  cardIds,
  decline,
  kind,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  payHand,
  pickCards,
  pickInst,
  unusable,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { LE, theirsE, triggerHit } from './kit-e.ts';

const E = 'OP18-116';
const MARCO = CH.marco3;

function defend(hand: string[], extra: object = {}) {
  const g = theirsE(LDR.luffy, { hand, ...extra }, { characters: [CH.kingdew5] });
  attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('OP18-116 Iron Body Empty Tree: [Counter] trash 1 card from hand: +3000 power during this battle', () => {
  it('pay with a hand card: the Leader gains +3000 (5000 -> 8000) and a 7000 attack fails', () => {
    const g = defend([E, MARCO]);
    activateCounter(g, at(g, 'p1', 'hand', E));
    yes(g, 'p1');
    payHand(g, [MARCO]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([E, MARCO].sort());
  });

  it('a Character can be the target; it is offered together with the Leader', () => {
    const g = defend([E, MARCO], { characters: [{ card: CH.hajrudin4, rested: true }] });
    activateCounter(g, at(g, 'p1', 'hand', E));
    yes(g, 'p1');
    payHand(g, [MARCO]);
    need(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pickInst(g, [at(g, 'p1', 'characters', CH.hajrudin4)]);
    expect(g.power(at(g, 'p1', 'characters', CH.hajrudin4))).toBe(9000);
  });

  it('declining the cost: the Event is spent but gives no power; the attack connects', () => {
    const g = defend([E, MARCO]);
    activateCounter(g, at(g, 'p1', 'hand', E));
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(cardIds(g, 'p1', 'hand')).toContain(MARCO); // not paid; the only addition is the damaged Life card
  });

  it('with no other card in hand the cost cannot be paid: no power', () => {
    const g = defend([E]);
    activateCounter(g, at(g, 'p1', 'hand', E));
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('"up to 1": after paying the cost the target may be left empty (the card is still trashed)', () => {
    const g = defend([E, MARCO]);
    activateCounter(g, at(g, 'p1', 'hand', E));
    yes(g, 'p1');
    payHand(g, [MARCO]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(cardIds(g, 'p1', 'trash')).toContain(MARCO);
  });

  it('the +3000 ends with the battle', () => {
    const g = defend([E, MARCO]);
    activateCounter(g, at(g, 'p1', 'hand', E));
    yes(g, 'p1');
    payHand(g, [MARCO]);
    pickInst(g, [g.leader('p1')]);
    passCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  void act;
  void kind;
  void offeredIds;
});

describe('OP18-116 Iron Body Empty Tree: [Trigger] if your Leader’s type includes "CP", rest up to 1 opposing Character', () => {
  const p2 = { characters: [CH.kingdew5, CH.hajrudin4] };

  it('rests the chosen opposing Character; only Characters are offered (not their Leader)', () => {
    const g = triggerHit(E, LE.cp, { characters: [CH.thatch6] }, p2);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CH.hajrudin4, CH.kingdew5].sort());
    pickCards(g, [CH.kingdew5]);
    expect(g.card(at(g, 'p2', 'characters', CH.kingdew5)).rested).toBe(true);
  });

  it('"up to 1": may choose nothing', () => {
    const g = triggerHit(E, LE.cp, {}, p2);
    act(g, { type: 'trigger', activate: true });
    none(g);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('a Leader without a CP type: nothing is rested', () => {
    const g = triggerHit(E, LDR.luffy, {}, p2);
    act(g, { type: 'trigger', activate: true });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});
