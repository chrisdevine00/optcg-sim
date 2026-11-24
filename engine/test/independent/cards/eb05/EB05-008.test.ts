/**
 * EB05-008 Luffy, Now's Your Chance (Event, Red, cost 1, {Kuja Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] You may give 1 active DON!! card to 1 of your Leader and reveal 2 red Event cards
 * from your hand: Give up to 1 of your opponent's rested Characters -7000 power during this turn.
 * [Counter] If you have no Characters with a cost of 5 or more, up to 1 of your Leader or up to 1 of
 * your Characters gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 11-2-2, RL-08 ("during this battle"), RL-09, CR 8-3-3, CR 7-1-3-1-2.
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, fill, passBlock } from '../../helpers.ts';
import {
  BLUE,
  canCounterWith,
  chars,
  chooseIfAsked,
  chooseNone,
  choiceCards,
  choose,
  don,
  EL,
  EV,
  hand,
  inHand,
  kind,
  mine,
  offeredInstance,
  p2power,
  payWith,
  playEvent,
  reachablePickSets,
  RED,
  settleYes,
  skipUnusable,
  theirs,
  trash,
  useCounter,
  VAN,
} from './kit-eb05a.ts';

const LUFFY_EV = 'EB05-008';

describe('EB05-008 Luffy, Now’s Your Chance: [Main] give a DON!! to the Leader and reveal 2 red Events: -7000 to a rested Character', () => {
  const OPP = [{ card: VAN.kingdew, rested: true }, VAN.marco];
  function reveal(g: ReturnType<typeof start>) {
    payWith(g, [inHand(g, EV.redA), inHand(g, EV.redB)]);
  }
  function start(inHandCards: string[] = [EV.redA, EV.redB], active = 3, use = true) {
    const g = mine(
      EL.croc,
      { hand: [LUFFY_EV, ...inHandCards], costArea: { active, rested: 0 }, deck: fill(BLUE, 10) },
      { characters: OPP },
    );
    playEvent(g, LUFFY_EV, use);
    return g;
  }

  it('paying: 1 active DON!! goes to the Leader, the 2 red Events are revealed (stay in hand), the target gets -7000', () => {
    const g = start();
    reveal(g);
    settleYes(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 1, rested: 1, given: 1 });
    expect(hand(g)).toEqual([EV.redA, EV.redB].sort());
    expect(p2power(g, VAN.kingdew)).toBe(0);
    expect(trash(g)).toEqual([LUFFY_EV]);
  });

  it('power may go below 0: -7000 on a rested 5000 Character leaves it at -2000', () => {
    const g = mine(
      EL.croc,
      { hand: [LUFFY_EV, EV.redA, EV.redB], costArea: { active: 3, rested: 0 } },
      { characters: [{ card: VAN.marco, rested: true }] },
    );
    playEvent(g, LUFFY_EV);
    reveal(g as ReturnType<typeof start>);
    choose(g, [offeredInstance(g, VAN.marco)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.marco)).toBe(-2000);
  });

  it('only RESTED opposing Characters are candidates', () => {
    const g = start();
    reveal(g);
    expect(choiceCards(g)).toEqual([VAN.kingdew]);
  });

  it('"up to 1": may give -7000 to nobody (the cost is still paid)', () => {
    const g = start();
    reveal(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.kingdew)).toBe(7000);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('CR 8-3-1-3: with only 1 red Event in hand the cost cannot be paid', () => {
    const g = start([EV.redA, VAN.mohji]);
    skipUnusable(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('a non-red Event does not count as a "red Event card"', () => {
    const g = start([EV.redA, EV.yellow]);
    skipUnusable(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('CR 8-3-1-3: with no active DON!! left after paying the Event’s own cost, the cost cannot be paid', () => {
    const g = start([EV.redA, EV.redB], 1);
    skipUnusable(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('CR 8-3-1-4: declining the cost does nothing (the Event is still spent)', () => {
    const g = start([EV.redA, EV.redB], 3, false);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
    expect(trash(g)).toEqual([LUFFY_EV]);
  });

  it('"during this turn": the -7000 ends with the turn', () => {
    const g = start();
    reveal(g);
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.kingdew)).toBe(0);
    endTurn(g);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('only 2 red Events are revealed even with 3 in hand', () => {
    const g = start([EV.redA, EV.redB, EV.redC]);
    const sets = [...reachablePickSets(g)].filter(Boolean);
    expect(sets.length).toBeGreaterThan(0);
    const events: string[] = [EV.redA, EV.redB, EV.redC];
    for (const s of sets) expect(s.split('+').filter((c) => events.includes(c))).toHaveLength(2);
  });
});

describe('EB05-008 Luffy, Now’s Your Chance: [Counter] with no Characters of cost 5 or more: +4000 during this battle', () => {
  /** p2's Leader (5000) attacks p1's Leader (5000). */
  function underAttack(own: string[], active = 2) {
    const g = theirs(
      EL.croc,
      { hand: [LUFFY_EV], characters: own, costArea: { active, rested: 0 }, life: fill(RED, 4) },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('no Characters: the Leader gains +4000 during the battle and the attack fails', () => {
    const g = underAttack([]);
    expect(kind(g)).toBe('counter');
    expect(canCounterWith(g, inHand(g, LUFFY_EV))).toBe(true);
    useCounter(g, inHand(g, LUFFY_EV), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('cost boundary: a cost-4 Character does not block the condition; a cost-5 Character does', () => {
    const g4 = underAttack([VAN.hajrudin]);
    useCounter(g4, inHand(g4, LUFFY_EV), g4.leader('p1'));
    chooseIfAsked(g4, [g4.leader('p1')]);
    expect(g4.power(g4.leader('p1'))).toBe(9000);

    const g5 = underAttack([VAN.kingdew]);
    if (canCounterWith(g5, inHand(g5, LUFFY_EV))) {
      useCounter(g5, inHand(g5, LUFFY_EV), g5.leader('p1'));
      chooseIfAsked(g5, [g5.leader('p1')]);
    }
    expect(g5.power(g5.leader('p1'))).toBe(5000);
  });

  it('may boost one of my Characters instead of the Leader', () => {
    const g = underAttack([VAN.hajrudin]);
    const target = g.find('p1', 'characters', VAN.hajrudin);
    useCounter(g, inHand(g, LUFFY_EV), target);
    chooseIfAsked(g, [target]);
    expect(g.power(target)).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost ends with the battle', () => {
    const g = underAttack([]);
    useCounter(g, inHand(g, LUFFY_EV), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('without the Counter the same attack hits the Leader', () => {
    const g = underAttack([]);
    g.act({ type: 'endCounter' });
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('the [Counter] needs 1 DON!! to be paid: with no active DON!! it cannot be used', () => {
    const g = underAttack([], 0);
    expect(canCounterWith(g, inHand(g, LUFFY_EV))).toBe(false);
  });

  it('[Counter] is not usable in my own Main Phase (the [Main] is used instead)', () => {
    const g = mine(
      EL.croc,
      { hand: [LUFFY_EV, EV.redA, EV.redB] },
      { characters: [{ card: VAN.kingdew, rested: true }] },
    );
    playEvent(g, LUFFY_EV);
    expect(chars(g, 'p1')).toEqual([]);
  });
});
