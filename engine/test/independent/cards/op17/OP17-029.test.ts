/**
 * OP17-029 Hongo (Character, Green, cost 4, 4000, Counter +2000, {Red-Haired Pirates}, Strike,
 * [Blocker]).
 *
 * Card text: "[Blocker]
 * [On Play] Set up to 1 of your DON!! cards as active. Then, rest up to 2 of your opponent's
 * Characters with a cost of 2 or less."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-4-4-1 ("up to"), CR 4-10-2 (a "Then" clause that cannot be
 * resolved does not stop the next one; here both are "up to"), RL-17.
 */
import { takeMost } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import { blockers } from '../../helpers.ts';
import {
  attack,
  choiceCards,
  choices,
  choose,
  chooseNone,
  don,
  expectMain,
  isRested,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  SC2,
  theirs,
  WB,
} from './kit-op17a.ts';

const HONGO = 'OP17-029';

function play(opp: string[] = [SC2.cobra0, SC2.komachiyo], costArea = { active: 4, rested: 0 }) {
  const g = mine(LD.shanks, { hand: [HONGO], costArea }, { characters: opp });
  playCard(g, HONGO);
  takeMost(g);
  return g;
}

describe('OP17-029 Hongo: [On Play] set up to 1 DON!! active, then rest up to 2 opposing Characters with cost 2 or less', () => {
  // The engine sets the (only possible, identical) rested DON!! itself and asks only for the targets.
  it('sets 1 of my rested DON!! active (4 paid for Hongo, 1 set active: 1 active, 3 rested)', () => {
    const g = play();
    expect(don(g)).toMatchObject({ active: 1, rested: 3 });
    expect(kind(g)).toBe('choose');
  });

  it('then rests the two chosen cost-2-or-less Characters', () => {
    const g = play();
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', SC2.cobra0), g.find('p2', 'characters', SC2.komachiyo)]);
    expectMain(g);
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(true);
    expect(isRested(g, 'p2', SC2.komachiyo)).toBe(true);
  });

  it('the DON!! step does not depend on the targets: with no opposing Character the DON!! is still set active', () => {
    const g = play([]);
    expectMain(g);
    expect(don(g)).toMatchObject({ active: 1, rested: 3 });
  });

  it('"up to 2": may rest just one, or nobody', () => {
    const g = play();
    choose(g, [g.find('p2', 'characters', SC2.komachiyo)]);
    expectMain(g);
    expect(isRested(g, 'p2', SC2.komachiyo)).toBe(true);
    expect(isRested(g, 'p2', SC2.cobra0)).toBe(false);
    const h = play();
    chooseNone(h);
    expect(isRested(h, 'p2', SC2.cobra0)).toBe(false);
    expect(don(h)).toMatchObject({ active: 1, rested: 3 });
  });

  it('never more than 2 even with three candidates', () => {
    const g = play([SC2.cobra0, SC2.komachiyo, SC2.dadan2000]);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('boundary: cost 2 and 1 are candidates, cost 3 is not', () => {
    const g = play([SC2.cobra0, SC2.komachiyo, WB.namule]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.komachiyo].sort());
  });

  it('only opposing Characters are candidates (not the Leader, not my own)', () => {
    const g = play([SC2.cobra0]);
    expect(choices(g)).toEqual([g.find('p2', 'characters', SC2.cobra0)]);
  });

  it('with 10 active DON!! the 4 rested to pay for Hongo can be set active again (7 active, 3 rested)', () => {
    const g = play([SC2.cobra0], { active: 10, rested: 0 });
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });
});

describe('OP17-029 Hongo: [Blocker]', () => {
  it('can block an attack on my Leader', () => {
    const g = theirs(LD.shanks, { characters: [HONGO] }, { characters: [WB.kingdew] });
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', HONGO)]);
  });

  it('a Hongo rested by the opponent’s effect cannot block', () => {
    const g = theirs(
      LD.shanks,
      { characters: [{ card: HONGO, rested: true }] },
      { characters: [WB.kingdew] },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
