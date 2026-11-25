/**
 * OP11-079 "When Two Men Are Fighting the Last Thing I Need Is Some Half-Hearted Assistance!!!!"
 * (Event, Purple, cost 1, {Big Mom Pirates}).
 *
 * Card text: "[Counter] Choose a cost and reveal 1 card from the top of your opponent's deck. If the
 * revealed card has the chosen cost, up to 1 of your Leader or Character cards gains +5000 power
 * during this battle." "[Trigger] Draw 1 card."
 *
 * Rules: an Event [Counter] is used from the hand in the Counter Step and its cost is paid then;
 * "choose a cost" is a number named before the reveal (M6b-Q67); "during this battle" ends with the
 * battle; the attacker wins on equal power (CR 7-1-4-1).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateCounter,
  activateTrigger,
  askingCost,
  at,
  attack,
  canCounterNow,
  chars,
  chooseCost,
  COST,
  deck,
  deckWith,
  declineTrigger,
  don,
  hand,
  hasEvent,
  kind,
  LW,
  need,
  none,
  offeredInsts,
  passBlock,
  pickInst,
  theirs,
  trash,
  V13,
  lifeCards,
  noDefenceUntilTrigger,
  takeDamage,
  type Spec,
} from './kit-w5b.ts';

const EVT = 'OP11-079';

/** p2's Leader (5000) attacks p1's Leader (5000); p1 holds the Event and `active` DON!!. */
function board(top: string, over: Spec = {}, active = 2) {
  return theirs(
    LW.luffy,
    { hand: [EVT], costArea: { active, rested: 0 }, ...over },
    { deck: deckWith(top) },
  );
}

/** p2's Leader attacks `target`; stops at p1's Counter Step. */
function intoCounter(g: ReturnType<typeof board>, target = g.leader('p1')) {
  attack(g, g.leader('p2'), target);
  passBlock(g);
  need(g, 'counter', 'p1');
}

describe('OP11-079 half-hearted assistance: [Counter] choose a cost, on a match +5000 during this battle; [Trigger] draw 1', () => {
  it('printed values: cost 1 Event', () => {
    const g = board(COST.c3);
    expect(g.card(at(g, 'p1', 'hand', EVT)).cost).toBe(1);
  });

  it('is usable in the Counter Step, and not as a [Main] on my own turn (it has no [Main])', () => {
    const g = board(COST.c3);
    const e = at(g, 'p1', 'hand', EVT);
    expect(
      g.legal().some((a) => (a.type === 'activate' || a.type === 'counter') && a.card === e),
    ).toBe(false);
    intoCounter(g);
    expect(canCounterNow(g, e)).toBe(true);
  });

  it('a match gives my Leader +5000 for the battle: 10000 beats the 5000 attacker, no Life is lost', () => {
    const g = board(COST.c3);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    chooseCost(g, 3);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(10000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(lifeCards(g)).toHaveLength(4);
    expect(trash(g)).toEqual([EVT]);
  });

  it('a miss gives nothing: no target is asked, the Leader stays at 5000 and the attack lands', () => {
    const g = board(COST.c3);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    chooseCost(g, 4);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(lifeCards(g)).toHaveLength(3);
    expect(trash(g)).toEqual([EVT]);
  });

  it('the target may be my Leader or one of my Characters, never an opposing card', () => {
    const g = board(COST.c3, { characters: [{ card: V13.marco, rested: true }] });
    const target = at(g, 'p1', 'characters', V13.marco);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    chooseCost(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1'), target].sort());
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
  });

  it('a Character can take the +5000: a rested Marco (5000) attacked by a 5000 Leader survives', () => {
    const g = board(COST.c3, { characters: [{ card: V13.marco, rested: true }] });
    const marco = at(g, 'p1', 'characters', V13.marco);
    intoCounter(g, marco);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    chooseCost(g, 3);
    pickInst(g, [marco]);
    expect(g.power(marco)).toBe(10000);
    act(g, { type: 'endCounter' });
    expect(chars(g, 'p1')).toEqual([V13.marco]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": on a match I may choose no target, and then nothing is boosted', () => {
    const g = board(COST.c3);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    chooseCost(g, 3);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('"during this battle": the +5000 is gone once the battle is over', () => {
    const g = board(COST.c3);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    chooseCost(g, 3);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs 1 DON!! (rested) and cannot be used with none to pay it', () => {
    const g = board(COST.c3);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    expect(askingCost(g)).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    const broke = board(COST.c3, {}, 0);
    intoCounter(broke);
    expect(canCounterNow(broke, at(broke, 'p1', 'hand', EVT))).toBe(false);
  });

  it('the number is named before the reveal, and the revealed card stays on top of their deck', () => {
    const g = board(COST.c3);
    intoCounter(g);
    activateCounter(g, at(g, 'p1', 'hand', EVT));
    expect(askingCost(g)).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: COST.c3 })).toBe(false);
    chooseCost(g, 9);
    expect(hasEvent(g, 'CardRevealed', { card: COST.c3 })).toBe(true);
    expect(deck(g, 'p2')[0]).toBe(COST.c3);
    expect(deck(g, 'p2')).toHaveLength(10);
  });

  it('[Trigger]: activated from Life it draws 1 card, and the Event goes to the trash', () => {
    const g = theirs(
      LW.luffy,
      { life: [EVT, V13.mohji, V13.mohji, V13.mohji], hand: [], deck: [V13.sai, V13.marco] },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([V13.sai]);
    expect(trash(g)).toEqual([EVT]);
    expect(askingCost(g)).toBe(false);
  });

  it('[Trigger] declined: the card goes to the hand and nothing is drawn', () => {
    const g = theirs(
      LW.luffy,
      { life: [EVT, V13.mohji, V13.mohji, V13.mohji], hand: [], deck: [V13.sai, V13.marco] },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVT]);
  });
});
