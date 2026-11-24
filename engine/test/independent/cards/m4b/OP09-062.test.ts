/**
 * OP09-062 Nico Robin (Leader, Purple/Yellow, 5000, 4 Life, {Straw Hat Crew}, [Banish]).
 *
 * Card text: "[Banish] ... [When Attacking] You may trash 1 card with a [Trigger] from your hand: Add up
 * to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rulings: RL-21 (Banish: the Life card is trashed, no [Trigger]), RL-50 (the cost can be paid with an
 * empty DON!! deck; the DON!! enters the cost area rested).
 * Rules: CR 8-3-1-3/-4 (costs), CR 10-1-3-1 (Banish), CR 2-11-2 (a card with a [Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, noDefence } from '../../helpers.ts';
import {
  accept,
  BLUE,
  canFinish,
  choiceCards,
  count,
  decline,
  don,
  hand,
  kind,
  mine,
  offered,
  payWith,
  RED,
  SC,
  skipUnusable,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';
import { takeMost } from '../../helpers.ts';

const EVENT_TRIG = 'OP07-077';

function attacking(handCards: string[], spec: object = {}, p2Life: string[] = fill(RED, 4)) {
  const g = mine(
    YL.robin,
    { hand: handCards, costArea: { active: 2, rested: 0 }, ...spec },
    { life: p2Life },
  );
  attack(g, g.leader('p1'), g.leader('p2'));
  return g;
}

describe('OP09-062 Nico Robin: [When Attacking] trash a [Trigger] card: add 1 DON!! from the DON!! deck, rested', () => {
  it('paying: the card is trashed and 1 DON!! enters the cost area RESTED (DON!! deck -1)', () => {
    const g = attacking([SC.speed, BLUE]);
    expect(don(g)).toMatchObject({ deck: 8, active: 2, rested: 0 });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    takeMost(g);
    expect(trash(g)).toEqual([SC.speed]);
    expect(hand(g)).toEqual([BLUE]);
    expect(don(g)).toMatchObject({ deck: 7, active: 2, rested: 1, given: 0 });
  });

  it('the cost needs a card WITH a [Trigger]: a hand of vanilla cards cannot pay', () => {
    const g = attacking([BLUE, VAN.sai]);
    skipUnusable(g, 'p1');
    expect(don(g)).toMatchObject({ deck: 8, active: 2, rested: 0 });
    expect(hand(g)).toHaveLength(2);
  });

  it('only [Trigger] cards are offered for the cost (Characters and Events with [Trigger] alike)', () => {
    const g = attacking([SC.speed, EVENT_TRIG, BLUE]);
    accept(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([SC.speed, EVENT_TRIG].sort());
  });

  it('declining the cost: nothing is trashed and no DON!! is added', () => {
    const g = attacking([SC.speed]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toEqual([SC.speed]);
    expect(don(g)).toMatchObject({ deck: 8, rested: 0 });
  });

  it('RL-50: with an empty DON!! deck the cost is still payable and the add does nothing', () => {
    const g = attacking([SC.speed], { costArea: { active: 5, rested: 5 }, donDeck: 0 });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    expect(trash(g)).toEqual([SC.speed]);
    expect(don(g)).toMatchObject({ deck: 0, active: 5, rested: 5 });
  });

  it('the DON!! is rested, not given: the Leader is not stronger in this battle', () => {
    const g = attacking([SC.speed]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('not on the opponent’s attack: when Robin is attacked nothing is offered', () => {
    const g = theirs(YL.robin, { hand: [SC.speed] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(canFinish(g)).toBe(false);
    expect(hand(g)).toEqual([SC.speed]);
  });
});

describe('OP09-062 Nico Robin: [Banish]', () => {
  it('RL-21: a Life card with [Trigger] hit by Robin’s Leader attack goes to the trash, no [Trigger] decision', () => {
    const g = attacking([BLUE], {}, [SC.speed, RED, RED, RED]);
    if (offered(g, 'p1')) decline(g);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(trash(g, 'p2')).toEqual([SC.speed]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('the keyword is on the Leader', () => {
    const g = mine(YL.robin);
    expect(g.card(g.leader('p1')).keywords).toContain('Banish');
  });

  it('a Banished Life card without [Trigger] also goes to the trash, not to hand', () => {
    const g = attacking([], {}, fill(RED, 4));
    if (offered(g, 'p1')) decline(g);
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([RED]);
    expect(count(g, 'p2', 'hand')).toBe(0);
  });
});
