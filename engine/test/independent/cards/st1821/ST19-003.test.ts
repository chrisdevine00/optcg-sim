/**
 * ST19-003 Tashigi (Black Character, cost 5, 6000, Counter +1000, {Navy}).
 * "[On Play] If your Leader is [Smoker], give up to 1 of your opponent's Characters −4 cost during
 * this turn.
 * [Activate: Main] [Once Per Turn] If this Character was played on this turn, trash up to 1 of your
 * opponent's Characters with a cost of 0."
 * Rules: a cost below 0 is treated as 0 (CR 1-3-6-2). A colon-less "If" is an effect condition: the
 * [Activate: Main] can be used and spends its Once Per Turn even when it was not played this turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  cost,
  inst,
  LD,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  playId,
  SC,
  settleEmptyChoose,
  trash,
  useAbility,
  mainFor,
} from './kit-st1821a.ts';

const ID = 'ST19-003';
const OPP = [SC.c1, SC.c2, SC.c4, SC.c5];

function start(leader: string = LD.smoker, opp: string[] = OPP) {
  return mine(leader, { hand: [ID], ...cost(10) }, { characters: opp });
}

describe('ST19-003 Tashigi: [On Play] with [Smoker]: -4 cost; [Activate: Main] trash a cost-0 Character', () => {
  it('with a [Smoker] Leader it offers every opposing Character and gives the pick -4 cost this turn', () => {
    const g = start();
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...OPP].sort());
    const target = inst(g, 'p2', 'characters', SC.c5);
    pickCards(g, [SC.c5]);
    expect(atMain(g)).toBe(true);
    expect(g.card(target).cost).toBe(1);
    expect(g.card(inst(g, 'p2', 'characters', SC.c4)).cost).toBe(4);
  });

  it('a cost reduced below 0 reads as 0', () => {
    const g = start();
    playId(g, ID);
    pickCards(g, [SC.c2]);
    expect(g.card(inst(g, 'p2', 'characters', SC.c2)).cost).toBe(0);
  });

  it('without a [Smoker] Leader (another {Navy} Leader) nothing is asked and no cost changes', () => {
    const g = start(LD.navy);
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    for (const c of g.zone('p2', 'characters')) {
      expect(c.cost).toBe(g.card(c.instance).cost);
    }
    expect(g.card(inst(g, 'p2', 'characters', SC.c5)).cost).toBe(5);
    expect(g.card(inst(g, 'p2', 'characters', SC.c1)).cost).toBe(1);
  });

  it('"during this turn": the opponent Character has its printed cost again on the opponent turn', () => {
    const g = start();
    playId(g, ID);
    pickCards(g, [SC.c5]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(inst(g, 'p2', 'characters', SC.c5)).cost).toBe(5);
  });

  it('"up to 1": choosing nothing changes no cost', () => {
    const g = start();
    playId(g, ID);
    none(g);
    expect(g.card(inst(g, 'p2', 'characters', SC.c1)).cost).toBe(1);
  });

  it('[Activate: Main] offers only Characters whose cost is 0 now (cost 1 does not qualify) and trashes the pick', () => {
    const g = start();
    playId(g, ID);
    pickCards(g, [SC.c1]); // Mohji: cost 1 -> 0
    mainFor(g);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c1]);
    pickCards(g, [SC.c1]);
    expect(trash(g, 'p2')).toEqual([SC.c1]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('Once Per Turn: after one activation the ability is no longer offered', () => {
    const g = start();
    playId(g, ID);
    pickCards(g, [SC.c1]);
    const t = inst(g, 'p1', 'characters', ID);
    useAbility(g, t);
    pickCards(g, [SC.c1]);
    mainFor(g);
    expect(offeredAbilities(g, t)).toEqual([]);
  });

  it('the [Activate: Main] with no cost-0 Character: asks "up to" empty or nothing, and trashes nobody', () => {
    const g = start();
    playId(g, ID);
    none(g);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    settleEmptyChoose(g);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('not played this turn: the effect condition fails (nothing trashed) yet the Once Per Turn is spent', () => {
    // One Tashigi is already on the field; a second one is played to make the cost-1 Mohji cost 0.
    const g = mine(
      LD.smoker,
      { hand: [ID], characters: [ID], ...cost(10) },
      { characters: [SC.c1] },
    );
    playId(g, ID);
    pickCards(g, [SC.c1]);
    mainFor(g);
    expect(g.card(inst(g, 'p2', 'characters', SC.c1)).cost).toBe(0);
    const old = g.zone('p1', 'characters').find((c) => c.card === ID && (c.played ?? -1) < 3)!;
    useAbility(g, old.instance);
    settleEmptyChoose(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g, 'p2')).toEqual([]);
    mainFor(g);
    expect(offeredAbilities(g, old.instance)).toEqual([]);
  });
});
