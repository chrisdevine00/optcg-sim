/**
 * ST26-004 General Franky (Character, Purple, cost 8, 10000, no Counter, {Straw Hat Crew}, Ranged).
 *
 * Card text: "[On Play] DON!! -2 (You may return the specified number of DON!! cards from your field to
 * your DON!! deck.): Give up to 2 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: CR 8-3 (DON!! -N cost), CR 1-3-5 ("up to 2" allows 0, 1 or 2 targets), CR 6-6-1-3 ("during
 * this turn" ends with the turn), CR 7-1-4-1 (the attacker wins a power tie), CR 1-3-6-1 (power may
 * go below 0 and the card stays).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  choices,
  costOffered,
  decline,
  donOf,
  endTurn,
  fill,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  pickInst,
  playCard,
  pw,
  RED,
  SL,
  SS,
  useDonCost,
  waitingAtMain,
} from './kit-st2627a.ts';
import { reachablePickSets } from '../kit.ts';

const FRANKY = 'ST26-004';

function start(
  p2chars: (string | { card: string; rested?: boolean })[],
  p1: { characters?: string[] } = {},
) {
  return mine(SL.shanks, { hand: [FRANKY], ...p1 }, { characters: p2chars, deck: fill(RED, 10) });
}

function reach(g: ReturnType<typeof start>) {
  playCard(g, FRANKY);
  useDonCost(g, 2, 'costRested');
  need(g, 'choose');
}

describe('ST26-004 General Franky: [On Play] DON!! -2: up to 2 opposing Characters -2000 power', () => {
  it('the effect is optional: declining leaves every power as printed and the DON!! alone', () => {
    const g = start([SS.thatch8]);
    playCard(g, FRANKY);
    expect(costOffered(g)).toBe(true);
    decline(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(pw(g, 'p2', SS.thatch8)).toBe(8000);
    expect(donOf(g, 'p1').deck).toBe(0);
  });

  it('two targets: both get exactly -2000 (8000 -> 6000, 6000 -> 4000)', () => {
    const g = start([SS.thatch8, SS.c4]);
    reach(g);
    pickInst(g, [at(g, 'p2', 'characters', SS.thatch8), at(g, 'p2', 'characters', SS.c4)]);
    expect(waitingAtMain(g)).toBe(true);
    expect(pw(g, 'p2', SS.thatch8)).toBe(6000);
    expect(pw(g, 'p2', SS.c4)).toBe(4000);
  });

  it('one target: only that Character is reduced', () => {
    const g = start([SS.thatch8, SS.c4]);
    reach(g);
    pickInst(g, [at(g, 'p2', 'characters', SS.thatch8)]);
    expect(pw(g, 'p2', SS.thatch8)).toBe(6000);
    expect(pw(g, 'p2', SS.c4)).toBe(6000);
  });

  it('"up to 2": choosing nothing is allowed; the DON!! cost is paid and no power changes', () => {
    const g = start([SS.thatch8, SS.c4]);
    reach(g);
    none(g);
    expect(pw(g, 'p2', SS.thatch8)).toBe(8000);
    expect(pw(g, 'p2', SS.c4)).toBe(6000);
    expect(donOf(g, 'p1').deck).toBe(2);
  });

  it('at most 2 of 3 opposing Characters can be chosen, in any combination', () => {
    const g = start([SS.thatch8, SS.c4, SS.c3]);
    reach(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has([SS.thatch8, SS.c4].sort().join('+'))).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it("candidates are the opponent's Characters only: not the Leader, not my Characters", () => {
    const g = start([SS.thatch8, SS.c4], { characters: [SS.c3] });
    reach(g);
    expect(offeredIds(g)).toEqual([SS.thatch8, SS.c4].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SS.c3));
  });

  it("must not: my own Characters and Leader keep their power (Franky's own 10000 included)", () => {
    const g = start([SS.thatch8], { characters: [SS.c3] });
    reach(g);
    pickInst(g, [at(g, 'p2', 'characters', SS.thatch8)]);
    expect(pw(g, 'p1', SS.c3)).toBe(5000);
    expect(pw(g, 'p1', FRANKY)).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('"during this turn": the reduction is gone when the opponent\'s turn begins', () => {
    const g = start([SS.thatch8]);
    reach(g);
    pickInst(g, [at(g, 'p2', 'characters', SS.thatch8)]);
    expect(pw(g, 'p2', SS.thatch8)).toBe(6000);
    endTurn(g);
    expect(pw(g, 'p2', SS.thatch8)).toBe(8000);
  });

  it('the -2000 is real in battle: a 6000 attacker K.O.s a rested 8000 Character it could not K.O. before', () => {
    const withFranky = start([{ card: SS.thatch8, rested: true }], { characters: [SS.c4] });
    reach(withFranky);
    pickInst(withFranky, [at(withFranky, 'p2', 'characters', SS.thatch8)]);
    attack(
      withFranky,
      at(withFranky, 'p1', 'characters', SS.c4),
      at(withFranky, 'p2', 'characters', SS.thatch8),
    );
    noDefence(withFranky);
    expect(withFranky.zone('p2', 'characters')).toHaveLength(0);

    const without = start([{ card: SS.thatch8, rested: true }], { characters: [SS.c4] });
    attack(
      without,
      at(without, 'p1', 'characters', SS.c4),
      at(without, 'p2', 'characters', SS.thatch8),
    );
    noDefence(without);
    expect(without.zone('p2', 'characters')).toHaveLength(1);
  });

  it('power may go below 0 and the Character stays on the field (a 0-power Character, -2000)', () => {
    const g = start(['OP04-012']);
    reach(g);
    pickInst(g, [at(g, 'p2', 'characters', 'OP04-012')]);
    expect(pw(g, 'p2', 'OP04-012')).toBe(-2000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
