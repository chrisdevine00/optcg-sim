/**
 * OP09-116 Never Underestimate the Power of Miracles!! (Event, Yellow, cost 1, {Revolutionary Army}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * [Trigger] Play up to 1 "Revolutionary Army" type Character card with a cost of 4 or less from your
 * hand."
 *
 * Rules: CR 10-2-4 ([Counter]), CR 8-4-4 ("up to"), CR 10-1-5 ([Trigger]); an "up to" pick over the
 * hidden hand is asked even when no card qualifies (max 0): a prompt must not depend on hidden cards.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  askedEmpty,
  atMain,
  BLUE,
  C9,
  canCounterNow,
  chars,
  choices,
  counterSpot,
  don,
  endCounter,
  hand,
  hitLeader,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playable,
  reachablePickSets,
  theirs,
  trash,
  useEvent,
} from './kit-op09d.ts';

const ID = 'OP09-116';

describe('OP09-116 Never Underestimate the Power of Miracles!!: [Counter] +2000 during this battle', () => {
  function spot(o: { mine?: string[]; active?: number } = {}) {
    return counterSpot(L9.neutral, {
      hand: [ID],
      characters: o.mine ?? [],
      costArea: { active: o.active ?? 1, rested: 0 },
    });
  }

  it('printed effect: Leader +2000 (7000) beats the 6000 attacker; the Event is trashed and costs 1 DON!!', () => {
    const g = spot();
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('boundary: without it the same attack connects (5000 vs 6000)', () => {
    const g = spot();
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('boundary: a 7000 attacker against my Leader boosted to exactly 7000: the attacker wins a tie, the Leader is hit', () => {
    const g = counterSpot(
      L9.neutral,
      { hand: [ID], costArea: { active: 1, rested: 0 } },
      {},
      C9.c5,
    );
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('candidates are my Leader and my Characters only', () => {
    const g = spot({ mine: [C9.c2] });
    useEvent(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c2, L9.neutral].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('the boost can go to a Character instead of the Leader', () => {
    const g = spot({ mine: [C9.c2] });
    useEvent(g, ID);
    pickInst(g, [g.find('p1', 'characters', C9.c2)]);
    expect(g.power(g.find('p1', 'characters', C9.c2))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": at most one card gets the boost; choosing nothing gives none', () => {
    const g = spot({ mine: [C9.c2] });
    useEvent(g, ID);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"during this battle": the boost is gone after the battle', () => {
    const g = spot();
    useEvent(g, ID);
    pickInst(g, [g.leader('p1')]);
    endCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it costs 1 DON!!: with no active DON!! it cannot be used', () => {
    const g = spot({ active: 0 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('must not happen: it cannot be played in my own Main Phase (no [Main] effect)', () => {
    const g = mine(L9.neutral, { hand: [ID] });
    expect(playable(g, ID)).toBe(false);
  });
});

describe('OP09-116 [Trigger] play up to 1 {Revolutionary Army} Character with a cost of 4 or less from my hand', () => {
  function hit(h: string[], mineChars: string[] = []) {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      hand: h,
      characters: mineChars,
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers exactly the {Revolutionary Army} Characters of cost 4 or less in my hand (cost 5, other types and Events are not)', () => {
    const g = hit([C9.ra2, C9.ra3, C9.ra4, C9.ra5, C9.c3, ID]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.ra2, C9.ra3, C9.ra4].sort());
  });

  it('the chosen Character enters the field active (not rested) from the hand; the Event is trashed', () => {
    const g = hit([C9.ra4, C9.c3]);
    activateTrigger(g);
    pickCards(g, [C9.ra4]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([C9.ra4]);
    expect(g.card(g.find('p1', 'characters', C9.ra4)).rested).toBe(false);
    expect(hand(g)).toEqual([C9.c3]);
    expect(trash(g)).toEqual([ID]);
  });

  it('cost boundary: cost 4 qualifies, cost 5 does not (a hand with only the cost-5 one: the empty pick is still asked)', () => {
    const g = hit([C9.ra5]);
    activateTrigger(g);
    askedEmpty(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([C9.ra5]);
  });

  it('an empty hand: the "up to 1" pick is still asked, with nothing to pick (the hand is hidden)', () => {
    const g = hit([]);
    activateTrigger(g);
    askedEmpty(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": at most one Character is played even when several qualify, and none is allowed', () => {
    const g = hit([C9.ra2, C9.ra3]);
    activateTrigger(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([C9.ra2, C9.ra3].sort());
  });

  it('no Leader type is needed (a plain Leader plays the Character)', () => {
    const g = hit([C9.ra2]);
    activateTrigger(g);
    pickCards(g, [C9.ra2]);
    expect(chars(g)).toEqual([C9.ra2]);
  });

  it('with a full Character area the played Character forces a trash choice (5 is the limit)', () => {
    const g = hit([C9.ra2], [C9.c1, C9.c2, C9.c3, C9.c4, C9.c5]);
    activateTrigger(g);
    pickCards(g, [C9.ra2]);
    // The 6th Character cannot stay: the engine asks which of mine to trash (CR 3-7-6-1).
    need(g, 'choose', 'p1');
    expect(offeredIds(g).length).toBeGreaterThan(0);
  });

  it('declining the [Trigger] puts the Event into my hand and plays nothing', () => {
    const g = hit([C9.ra2]);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID, C9.ra2].sort());
    expect(chars(g)).toEqual([]);
  });
});
