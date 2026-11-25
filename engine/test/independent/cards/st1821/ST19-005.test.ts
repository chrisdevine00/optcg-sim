/**
 * ST19-005 Monkey.D.Garp (Black Character, cost 3, 4000, Counter +1000, {Navy}, [Blocker]).
 * "[Blocker]
 * [Activate: Main] [Once Per Turn] You may place 1 card from your trash at the bottom of your deck:
 * Give up to 1 of your opponent's Characters −1 cost during this turn."
 * Rules: activating the ability is choosing to pay its cost; "up to 1" allows no target; the cost
 * change lasts for this turn only and a cost never reads below 0.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  blockers,
  cost,
  deck,
  inst,
  LD,
  mainFor,
  many,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickCards,
  SC,
  tail,
  theirs,
  trash,
  useAbility,
} from './kit-st1821a.ts';

const ID = 'ST19-005';

function start(trashCards: string[] = [SC.c2, SC.c3], opp: string[] = [SC.c1, SC.c4, SC.c5]) {
  return mine(
    LD.navy,
    { characters: [ID, SC.c3], trash: trashCards, deck: many(BLUE, 10), ...cost(5) },
    { characters: opp },
  );
}

describe('ST19-005 Monkey.D.Garp', () => {
  it('[Blocker]: it can block an attack on my Leader and is rested by blocking', () => {
    const g = theirs(LD.navy, { characters: [ID], life: many(BLUE, 4) });
    const garp = inst(g, 'p1', 'characters', ID);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([garp]);
    act(g, { type: 'block', blocker: garp });
    expect(g.card(garp).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('[Activate: Main]: pays 1 trash card to the bottom of the deck, then gives the pick -1 cost', () => {
    const g = start();
    const target = inst(g, 'p2', 'characters', SC.c5);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    payHand(g, [SC.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c1, SC.c4, SC.c5].sort());
    pickCards(g, [SC.c5]);
    mainFor(g);
    expect(g.card(target).cost).toBe(4);
    expect(g.card(inst(g, 'p2', 'characters', SC.c4)).cost).toBe(4);
    expect(trash(g)).toEqual([SC.c3]);
    expect(tail(deck(g), 1)).toEqual([SC.c2]);
    expect(deck(g)).toHaveLength(11);
  });

  it('only opposing Characters are offered, never my own', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    expect(offeredIds(g)).not.toContain(SC.c3);
  });

  it('"up to 1": choosing nobody changes no cost (the cost was still paid)', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    none(g);
    expect(g.card(inst(g, 'p2', 'characters', SC.c5)).cost).toBe(5);
    expect(trash(g)).toEqual([SC.c3]);
  });

  it('the reduction is exactly 1 and lasts this turn only', () => {
    const g = start();
    const target = inst(g, 'p2', 'characters', SC.c4);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    pickCards(g, [SC.c4]);
    expect(g.card(target).cost).toBe(3);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(target).cost).toBe(4);
  });

  it('a cost of 1 goes to 0', () => {
    const g = start([SC.c2, SC.c3], [SC.c1]);
    const target = inst(g, 'p2', 'characters', SC.c1);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    pickCards(g, [SC.c1]);
    expect(g.card(target).cost).toBe(0);
  });

  it('the trash card choice offers cards of my trash', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).toEqual([SC.c2, SC.c3].sort());
  });

  it('with an empty trash the cost cannot be paid: the ability is not offered', () => {
    const g = start([]);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('Once Per Turn: it cannot be activated twice in a turn', () => {
    const g = start();
    const garp = inst(g, 'p1', 'characters', ID);
    useAbility(g, garp);
    payHand(g, [SC.c2]);
    pickCards(g, [SC.c5]);
    mainFor(g);
    expect(offeredAbilities(g, garp)).toEqual([]);
  });
});
