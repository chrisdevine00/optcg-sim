/**
 * OP16-081 Otama (Character, Black, cost 2, 0 power, Counter +2000, {Land of Wano}).
 *
 * Card text: "[Activate: Main] You may rest this Character: If you have a Character with a cost of 8 or
 * more, give up to 1 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: CR 8-3-1 (a rest cost: an already rested card cannot pay), CR 8-3-3 (failed "if"; the cost is
 * already paid), CR 3-1-2-1 ("you have" is the field), CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this
 * turn"), CR 1-3-6-1 / CR 1-3-6-1-1 (power may go negative; no trashing for it), CR 3-7-4.
 */
import { describe, expect, it } from 'vitest';
import {
  abilities,
  at,
  BAT,
  choices,
  declineChoice,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  pickInst,
  rested,
  SCN,
  theirs,
  toMyNextMain,
  useAbility,
  backAtMain,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const OTAMA = 'OP16-081';

function start(
  own: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[],
  p2: string[] = [SCN.c4],
  hand: string[] = [],
): TestGame {
  return mine(LDR.luffy, { characters: own, hand }, { characters: p2 });
}
const otama = (g: TestGame) => at(g, 'p1', 'characters', OTAMA);
const opp = (g: TestGame, card: string) => g.power(inst(g, 'p2', 'characters', card));

describe('OP16-081 Otama: [Activate: Main] rest this: if you have a Character with cost 8 or more, an opposing Character gets -2000 power this turn', () => {
  it('with a cost-8 Character on my field: the chosen opposing Character gets -2000 (6000 -> 4000) and Otama is rested', () => {
    const g = start([OTAMA, SCN.c8]);
    useAbility(g, otama(g));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c4)]);
    expect(opp(g, SCN.c4)).toBe(4000);
    expect(rested(g, otama(g))).toBe(true);
    expect(backAtMain(g)).toBe(true);
  });

  it('boundary: a cost-7 Character is not enough: no power change (the rest cost is still paid)', () => {
    const g = start([OTAMA, SCN.c7]);
    useAbility(g, otama(g));
    if (kind(g) === 'choose') declineChoice(g);
    expect(opp(g, SCN.c4)).toBe(6000);
    expect(rested(g, otama(g))).toBe(true);
  });

  it('a cost-9 and a cost-10 Character also qualify', () => {
    for (const big of ['OP01-070', 'OP17-118']) {
      const g = start([OTAMA, big]);
      useAbility(g, otama(g));
      need(g, 'choose', 'p1');
      pickInst(g, [inst(g, 'p2', 'characters', SCN.c4)]);
      expect(opp(g, SCN.c4)).toBe(4000);
    }
  });

  it('CR 3-1-2-1: a cost-8 Character in my hand or on the opponent’s field does not count', () => {
    const g = start([OTAMA], [SCN.c4, SCN.c8], [SCN.c8]);
    useAbility(g, otama(g));
    if (kind(g) === 'choose') declineChoice(g);
    expect(opp(g, SCN.c4)).toBe(6000);
  });

  it('Otama (cost 2) does not satisfy the condition herself', () => {
    const g = start([OTAMA]);
    useAbility(g, otama(g));
    if (kind(g) === 'choose') declineChoice(g);
    expect(opp(g, SCN.c4)).toBe(6000);
  });

  it('"up to 1": may choose none; only the chosen Character is reduced', () => {
    const none = start([OTAMA, SCN.c8]);
    useAbility(none, otama(none));
    declineChoice(none);
    expect(opp(none, SCN.c4)).toBe(6000);
    const one = start([OTAMA, SCN.c8], [SCN.c4, SCN.c3]);
    useAbility(one, otama(one));
    need(one, 'choose', 'p1');
    expect(choices(one)).toHaveLength(2);
    pickInst(one, [inst(one, 'p2', 'characters', SCN.c3)]);
    expect(opp(one, SCN.c3)).toBe(3000);
    expect(opp(one, SCN.c4)).toBe(6000);
  });

  it('only the opponent’s Characters are offered (not my own, not either Leader)', () => {
    const g = start([OTAMA, SCN.c8], [SCN.c4]);
    useAbility(g, otama(g));
    expect(offeredNow(g)).toEqual([SCN.c4]);
  });

  it('a rested Otama cannot pay the rest cost: not offered', () => {
    const g = start([{ card: OTAMA, rested: true }, SCN.c8]);
    expect(abilities(g, otama(g))).toEqual([]);
  });

  it('the turn it is played it can still activate (resting is not attacking)', () => {
    const g = start([{ card: OTAMA, playedThisTurn: true }, SCN.c8]);
    expect(abilities(g, otama(g))).toHaveLength(1);
  });

  it('CR 1-3-6-1-1: -2000 on a 2000-power Character leaves it at 0 on the field; "during this turn" it is back to 2000 next turn', () => {
    const g = start([OTAMA, SCN.c8], [BAT.dadan2000]);
    useAbility(g, otama(g));
    pickInst(g, [inst(g, 'p2', 'characters', BAT.dadan2000)]);
    expect(opp(g, BAT.dadan2000)).toBe(0);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    toMyNextMain(g);
    expect(opp(g, BAT.dadan2000)).toBe(2000);
  });

  it('it is an [Activate: Main]: not usable in the opponent’s Main Phase', () => {
    const g = theirs(LDR.luffy, { characters: [OTAMA, SCN.c8] }, {});
    expect(abilities(g, otama(g))).toEqual([]);
  });
});
