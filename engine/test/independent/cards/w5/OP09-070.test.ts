/**
 * OP09-070 Nami (Character, Purple, cost 3, 2000, Counter +2000, Special, {Straw Hat Crew}).
 *
 * Card text: "[On Play] You may return 1 or more DON!! cards from your field to your DON!! deck: Give
 * up to 2 rested DON!! cards to your Leader or 1 of your Characters."
 *
 * Rules: CR 8-3-1 / 8-3-1-6 (cost: DON!! returned from the field, given DON!! included), CR 4-4-2
 * (given DON!! are neither active nor rested), CR 6-5-5-2 (+1000 power per given DON!! on my turn),
 * CR 4-8-1 ("up to" allows 0).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, myTurn, side } from '../kit.ts';
import {
  answerCount,
  asksCount,
  BLUE,
  countOptions,
  donOf,
  LW,
  need,
  no,
  put,
  RED,
  returnDon,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'OP09-070';

function start(o: { active?: number; characters?: PlayerSpec['characters'] } = {}) {
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID],
      costArea: { active: o.active ?? 5, rested: 0 },
      characters: o.characters ?? [SW.marco],
    }),
    side(LW.luffy, RED, { characters: [SW.sai] }),
  );
}

/** Pick the one target of the "give DON!!" question. */
function giveTo(g: ReturnType<typeof start>, target: string) {
  need(g, 'choose');
  expect(choices(g)).toContain(target);
  act(g, { type: 'pick', choice: target });
}

describe('OP09-070 Nami: [On Play] you may return 1+ DON!!: give up to 2 rested DON!! to my Leader or 1 Character', () => {
  it('returns 1 active DON!! and gives 2 rested DON!! to my Leader (+2000 power)', () => {
    const g = start();
    put(g, ID);
    // 5 active: 3 rested for Nami's cost, 2 active left.
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3 });
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 2);
    giveTo(g, g.leader('p1'));
    expect(decision(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(donOf(g)).toMatchObject({ active: 1, rested: 1, given: 2, deck: 6 });
  });

  it('can give them to one of my Characters instead', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 2);
    const marco = g.find('p1', 'characters', SW.marco);
    giveTo(g, marco);
    expect(g.card(marco).don).toBe(2);
    expect(g.power(marco)).toBe(7000);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('the targets are my Leader and my Characters (Nami herself included), never the opponent', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 1);
    const offered = choices(g);
    expect(offered).toContain(g.leader('p1'));
    expect(offered).toContain(g.find('p1', 'characters', SW.marco));
    expect(offered).toContain(g.find('p1', 'characters', ID));
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(g.find('p2', 'characters', SW.sai));
    expect(offered).toHaveLength(3);
  });

  it('"up to 2": the count offered is 2, 1, 0; giving 1 gives exactly 1', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    expect(countOptions(g)).toEqual(['2', '1', '0']);
    answerCount(g, 1);
    giveTo(g, g.leader('p1'));
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g)).toMatchObject({ active: 1, rested: 2, given: 1 });
  });

  it('giving 0 gives nothing, but the returned DON!! stay returned', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 0);
    // No target is needed for 0 DON!!; if one is asked it must allow choosing nothing.
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ active: 1, rested: 3, given: 0, deck: 6 });
  });

  it('only RESTED DON!! are given: active DON!! stay active', () => {
    const g = start({ active: 8 });
    put(g, ID);
    // 5 active, 3 rested.
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 2);
    giveTo(g, g.leader('p1'));
    expect(donOf(g)).toMatchObject({ active: 4, rested: 1, given: 2 });
  });

  it('returning rested DON!! lowers what can be given: 3 rested, 2 returned, at most 1 can be given', () => {
    const g = start({ active: 3 });
    put(g, ID);
    // All 3 DON!! are rested now.
    expect(donOf(g)).toMatchObject({ active: 0, rested: 3 });
    yes(g);
    returnDon(g, 2, 'costRested');
    // Only 1 rested DON!! is left. The engine either asks the count (1 or 0) or goes straight to an
    // "up to 1" target pick; in both, giving nothing must stay possible ("up to").
    if (asksCount(g)) {
      expect(countOptions(g)).toEqual(['1', '0']);
      answerCount(g, 1);
    } else {
      expect(canFinish(g)).toBe(true);
    }
    giveTo(g, g.leader('p1'));
    expect(donOf(g)).toMatchObject({ rested: 0, given: 1, deck: 9 });
  });

  it('with 1 rested DON!! left, giving nothing is still allowed ("up to 2")', () => {
    const g = start({ active: 3 });
    put(g, ID);
    yes(g);
    returnDon(g, 2, 'costRested');
    if (asksCount(g)) answerCount(g, 0);
    else expect(canFinish(g)).toBe(true);
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ rested: 1, given: 0, deck: 9 });
  });

  it('returning every rested DON!!: nothing is left to give', () => {
    const g = start({ active: 3 });
    put(g, ID);
    yes(g);
    returnDon(g, 3, 'costRested');
    // Either no question is asked or the count can only be 0.
    if (asksCount(g)) {
      expect(countOptions(g)).toEqual(['0']);
      answerCount(g, 0);
    }
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ rested: 0, given: 0, deck: 10 });
  });

  it('DON!! already given to a Character can be returned for the cost, and the rested ones are given', () => {
    const g = start({ active: 3, characters: [{ card: SW.marco, don: 1 }] });
    put(g, ID);
    expect(donOf(g)).toMatchObject({ active: 0, rested: 3, given: 1 });
    yes(g);
    returnDon(g, 1, 'given');
    expect(countOptions(g)).toEqual(['2', '1', '0']);
    answerCount(g, 2);
    giveTo(g, g.leader('p1'));
    expect(g.card(g.find('p1', 'characters', SW.marco)).don).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(donOf(g)).toMatchObject({ rested: 1, given: 2 });
  });

  it('declining the cost: no DON!! are returned or given, and Nami is still played', () => {
    const g = start();
    put(g, ID);
    no(g);
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3, given: 0, deck: 5 });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
  });
});
