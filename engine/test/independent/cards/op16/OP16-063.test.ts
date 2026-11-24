/**
 * OP16-063 Kuzan (Character, Purple, cost 7, 8000, no Counter, {Navy}/{Admiral}).
 *
 * Card text: "[On Play] Add up to 2 DON!! cards from your DON!! deck and rest them. [Activate: Main]
 * [Once Per Turn] DON!! −1: Up to 1 of your opponent's Characters cannot activate [Blocker] during
 * this turn."
 *
 * Rules: CR 6-4 / RD 69 (the DON!! deck), CR 8-4-4-1 ("up to"), CR 3-9-3 (added DON!! "rest them"),
 * CR 8-3-1-6 (DON!! -X), CR 10-2-13 ([Once Per Turn]), CR 1-3-3 (a prohibition wins), CR 6-6-1-3.
 * E-Q11: "add up to N DON!!" asks a count, most first.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, takeMost } from '../../helpers.ts';
import {
  abilities,
  at,
  choices,
  declineChoice,
  donCountOptions,
  don,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  payDon,
  pickInst,
  put,
  SCN,
  takeDon,
  toMyNextMain,
  useAbility,
  backAtMain,
  block,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const KUZAN = 'OP16-063';
/** OP09-072 Franky: cost 4, 5000, [Blocker]. */
const FRANKY = 'OP09-072';
/** ST10-010 Trafalgar Law: cost 4, 5000, [Blocker]. */
const LAW = 'ST10-010';

describe('OP16-063 Kuzan: [On Play] add up to 2 rested DON!!; [Activate: Main] [Once Per Turn] DON!! -1: an opposing Character cannot activate [Blocker] this turn', () => {
  it('[On Play]: adds 2 DON!! from the DON!! deck, and they come in RESTED', () => {
    const g = mine(LDR.navy, { hand: [KUZAN], costArea: { active: 7, rested: 0 } });
    put(g, KUZAN);
    takeMost(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 9, deck: 1 });
    expect(backAtMain(g)).toBe(true);
  });

  it('"up to 2": the count may be 2, 1 or 0', () => {
    const g = mine(LDR.navy, { hand: [KUZAN], costArea: { active: 7, rested: 0 } });
    put(g, KUZAN);
    expect(donCountOptions(g).sort()).toEqual(['0', '1', '2']);
  });

  it('adding 1 puts just 1 DON!! into the cost area, rested', () => {
    const g = mine(LDR.navy, { hand: [KUZAN], costArea: { active: 7, rested: 0 } });
    put(g, KUZAN);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ rested: 8, deck: 2 });
  });

  it('adding 0 adds nothing', () => {
    const g = mine(LDR.navy, { hand: [KUZAN], costArea: { active: 7, rested: 0 } });
    put(g, KUZAN);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ rested: 7, deck: 3 });
  });

  it('with only 1 DON!! left in the DON!! deck the count cannot exceed 1', () => {
    const g = mine(LDR.navy, { hand: [KUZAN], costArea: { active: 9, rested: 0 } });
    put(g, KUZAN);
    // 9 active: the cost of 7 leaves 2 active, 7 rested; the DON!! deck holds 1.
    expect(donCountOptions(g)).not.toContain('2');
    takeMost(g);
    expect(don(g)).toMatchObject({ deck: 0 });
  });

  function mainWithKuzan(opts: { p2?: string[]; donActive?: number } = {}): TestGame {
    return mine(
      LDR.navy,
      { characters: [KUZAN, SCN.c3], costArea: { active: opts.donActive ?? 4, rested: 0 } },
      { characters: opts.p2 ?? [FRANKY] },
    );
  }

  it('[Activate: Main]: with DON!! -1 paid, the chosen opposing [Blocker] Character cannot block this turn', () => {
    const g = mainWithKuzan();
    useAbility(g, at(g, 'p1', 'characters', KUZAN));
    payDon(g, 1, 'costActive');
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', FRANKY)]);
    expect(don(g)).toMatchObject({ active: 3, deck: 7 });
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('control: without the effect the same [Blocker] can block', () => {
    const g = mainWithKuzan();
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', FRANKY)]);
  });

  it('only the chosen Character is blocked from blocking: a second [Blocker] still can', () => {
    const g = mainWithKuzan({ p2: [FRANKY, LAW] });
    useAbility(g, at(g, 'p1', 'characters', KUZAN));
    payDon(g, 1, 'costActive');
    pickInst(g, [inst(g, 'p2', 'characters', FRANKY)]);
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', LAW)]);
    block(g, inst(g, 'p2', 'characters', LAW));
  });

  it('any opposing Character may be chosen, a Blocker or not (up to 1); I may also choose none', () => {
    const g = mainWithKuzan({ p2: [FRANKY, SCN.c4] });
    useAbility(g, at(g, 'p1', 'characters', KUZAN));
    payDon(g, 1, 'costActive');
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([FRANKY, SCN.c4].sort());
    declineChoice(g);
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', FRANKY)]);
  });

  it('[Once Per Turn]: not offered again in the same turn', () => {
    const g = mainWithKuzan();
    useAbility(g, at(g, 'p1', 'characters', KUZAN));
    payDon(g, 1, 'costActive');
    pickInst(g, [inst(g, 'p2', 'characters', FRANKY)]);
    expect(abilities(g, at(g, 'p1', 'characters', KUZAN))).toEqual([]);
  });

  it('DON!! -1 cannot be paid with no DON!! on my field: no activation', () => {
    const g = mainWithKuzan({ donActive: 0 });
    expect(abilities(g, at(g, 'p1', 'characters', KUZAN))).toEqual([]);
  });

  it('"during this turn": on my next turn the opposing [Blocker] can block again', () => {
    const g = mainWithKuzan();
    useAbility(g, at(g, 'p1', 'characters', KUZAN));
    payDon(g, 1, 'costActive');
    pickInst(g, [inst(g, 'p2', 'characters', FRANKY)]);
    toMyNextMain(g);
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', FRANKY)]);
    void choices;
  });
});
