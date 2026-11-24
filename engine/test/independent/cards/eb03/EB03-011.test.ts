/**
 * EB03-011 But If We Ever See Each Other Again... Will You Call Me Your Shipmate?!! (Event, Red,
 * cost 1, {Alabasta}).
 *
 * Card text: "[Counter] If your Leader is [Nefeltari Vivi], up to 1 of your Leader or Character cards
 * gains +4000 power during this battle.
 * [Trigger] Give up to 1 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: CR 7-1-3-1-2 (Event [Counter]), RL-08 ("during this battle"), CR 8-4-4-1 ("up to"),
 * CR 10-1-5 ([Trigger]), "during this turn" ends in the End Phase (CR 6-6-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  attack,
  BLUE,
  canCounterWith,
  chooseIfAsked,
  choiceCards,
  chr,
  declineTrigger,
  fill,
  hand,
  inst,
  kind,
  LA,
  mine,
  need,
  none,
  passBlock,
  passCounter,
  pickInst,
  SA,
  theirs,
  useCounter,
  zoneIds,
} from './kit-eb03a.ts';

const EVENT = 'EB03-011';

/** p2 attacks p1's Leader with its Leader; p1 is at the Counter Step with the Event in hand. */
function underAttack(leader: string, chars: string[] = [], active = 3) {
  const g = theirs(
    leader,
    { hand: [EVENT], characters: chars, costArea: { active, rested: 0 }, life: fill(BLUE, 4) },
    {},
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('EB03-011: [Counter] if your Leader is [Nefeltari Vivi], up to 1 Leader or Character +4000 during this battle', () => {
  it('printed values: Event, cost 1', () => {
    const g = mine(LA.vivi, { hand: [EVENT] });
    expect(g.card(inst(g, 'p1', 'hand', EVENT)).cost).toBe(1);
  });

  it('Leader [Nefeltari Vivi]: the Leader gains +4000 (5000 -> 9000) and the 5000 attack fails', () => {
    const g = underAttack(LA.vivi);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(true);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('a Character may take the boost instead (the Leader stays at 5000)', () => {
    const g = underAttack(LA.vivi, [SA.marco]);
    const marco = chr(g, 'p1', SA.marco);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), marco);
    chooseIfAsked(g, [marco]);
    expect(g.power(marco)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the other [Nefeltari Vivi] Leader (EB03-001) satisfies the condition too', () => {
    const g = underAttack('EB03-001');
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('offers my Leader and my Characters only', () => {
    const g = theirs(
      LA.vivi,
      { hand: [EVENT], characters: [SA.marco], costArea: { active: 3, rested: 0 } },
      { characters: [SA.sai] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toEqual([LA.vivi, SA.marco].sort());
    }
  });

  it('"up to 1": may boost nobody', () => {
    const g = underAttack(LA.vivi);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts during the battle only', () => {
    const g = underAttack(LA.vivi);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the condition is the Leader: a Vivi Character on the field does not satisfy it (no boost)', () => {
    const g = underAttack(LA.croc, [SA.viviChar]);
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVENT))) {
      useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
      if (kind(g) === 'choose') {
        // Whatever is asked, picking the Leader must not raise its power.
        chooseIfAsked(g, [g.leader('p1')]);
      }
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', SA.viviChar))).toBe(4000);
  });

  it('with another Leader the 5000 attack lands even after using the Event', () => {
    const g = underAttack(LA.croc);
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVENT))) {
      useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
      chooseIfAsked(g, [g.leader('p1')]);
    }
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with 0 active DON!! the Event cannot be used (cost 1)', () => {
    const g = underAttack(LA.vivi, [], 0);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(false);
  });

  it('it is not a Main Phase card: not activatable on my own turn', () => {
    const g = mine(LA.vivi, { hand: [EVENT] });
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === inst(g, 'p1', 'hand', EVENT)),
    ).toBe(false);
  });
});

describe("EB03-011: [Trigger] give up to 1 of your opponent's Characters -2000 power during this turn", () => {
  /** p2's Marco hits p1's Leader; the Event is p1's top Life card. */
  function hit() {
    const g = theirs(
      LA.croc,
      { life: [EVENT, BLUE, BLUE, BLUE], deck: fill(BLUE, 10), characters: [SA.sai] },
      { characters: [SA.marco, SA.kingdew] },
    );
    attack(g, chr(g, 'p2', SA.marco), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('activating gives the chosen opposing Character -2000 power (7000 -> 5000) for the turn', () => {
    const g = hit();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([SA.kingdew, SA.marco].sort());
    pickInst(g, [chr(g, 'p2', SA.kingdew)]);
    expect(g.power(chr(g, 'p2', SA.kingdew))).toBe(5000);
    expect(g.power(chr(g, 'p2', SA.marco))).toBe(5000);
    expect(zoneIds(g, 'p1', 'trash')).toContain(EVENT);
  });

  it("only my opponent's Characters are offered (never my own or a Leader)", () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).not.toContain(SA.sai);
    expect(choiceCards(g)).not.toContain(LA.croc);
    expect(choiceCards(g)).not.toContain(LA.supernovas);
  });

  it('"up to 1": may pick nobody', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(chr(g, 'p2', SA.kingdew))).toBe(7000);
  });

  it('declining the [Trigger] gives no penalty and the card goes to hand', () => {
    const g = hit();
    declineTrigger(g);
    expect(g.power(chr(g, 'p2', SA.kingdew))).toBe(7000);
    expect(hand(g)).toContain(EVENT);
  });

  it("-2000 lasts this turn only: it is gone on the opponent's next turn", () => {
    const g = hit();
    activateTrigger(g);
    pickInst(g, [chr(g, 'p2', SA.kingdew)]);
    expect(g.power(chr(g, 'p2', SA.kingdew))).toBe(5000);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(g.power(chr(g, 'p2', SA.kingdew))).toBe(7000);
  });

  it('the [Trigger] has no Leader condition: it works with a non-[Vivi] Leader (used above) and gives a Character -2000', () => {
    const g = hit();
    activateTrigger(g);
    pickInst(g, [chr(g, 'p2', SA.marco)]);
    expect(g.power(chr(g, 'p2', SA.marco))).toBe(3000);
  });
});
