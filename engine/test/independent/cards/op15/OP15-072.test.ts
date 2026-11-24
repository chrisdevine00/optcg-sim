/**
 * OP15-072 Hotori (Character, Purple, cost 1, 2000, Counter +1000, {Sky Island}).
 *
 * Card text: "[Activate: Main] DON!! -2, You may rest this Character: If you have [Kotori] and [Satori],
 * give up to 1 of your opponent's Characters -3000 power during this turn."
 *
 * Rules: CR 8-3-1 (costs, text order), CR 8-3-1-3 (an unpayable part makes the whole cost unpayable), CR
 * 8-3-3 (a failed "if" stops the text), CR 8-4-4-1 ("up to"), CR 8-1-4-2 ("during this turn"), CR 7-1-4
 * (battle: attacker wins ties).
 * Scenery: OP15-064 Kotori and OP15-066 Satori (placed in the scenario, never played).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  at,
  atMain,
  BAT,
  choices,
  don,
  donOnField,
  inst,
  kind,
  LD15,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payDon,
  pickInst,
  reachablePickSets,
  SCN,
  theirs,
  toMyNextMain,
  useAbility,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HOTORI = 'OP15-072';
const KOTORI = 'OP15-064';
const SATORI = 'OP15-066';
const hotori = (g: TestGame) => at(g, 'p1', 'characters', HOTORI);

function start(
  own: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[] = [
    HOTORI,
    KOTORI,
    SATORI,
  ],
  p2: (string | { card: string; rested?: boolean })[] = [SCN.c3],
  donActive = 4,
): TestGame {
  return mine(
    LD15.purple,
    { characters: own, costArea: { active: donActive, rested: 0 } },
    { characters: p2 },
  );
}

/** Use the ability and pay DON!! -2; the target choice (if any) is left pending. */
function run(g: TestGame): void {
  useAbility(g, hotori(g));
  payDon(g, 2);
}

describe('OP15-072 Hotori: [Activate: Main] DON!! -2, may rest this: with [Kotori] and [Satori], an opposing Character gets -3000 power', () => {
  it('happy path: pays the cost, rests itself, the chosen Character gets -3000 (5000 -> 2000)', () => {
    const g = start();
    run(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(atMain(g)).toBe(true);
    expect(g.power(inst(g, 'p2', 'characters', SCN.c3))).toBe(2000);
    expect(g.card(hotori(g)).rested).toBe(true);
    expect(donOnField(g)).toBe(2);
    expect(don(g)).toMatchObject({ active: 2 });
  });

  it('it is -3000 exactly: a 3000-power Character goes to 0 and stays on the field', () => {
    const g = start([HOTORI, KOTORI, SATORI], [SCN.c1]);
    run(g);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c1)]);
    expect(g.power(inst(g, 'p2', 'characters', SCN.c1))).toBe(0);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('the reduction decides a battle: my 4000 Character K.O.s a rested 5000 one only after the -3000', () => {
    const win = start([HOTORI, KOTORI, SATORI, SCN.c2], [{ card: SCN.c3, rested: true }]);
    run(win);
    pickInst(win, [inst(win, 'p2', 'characters', SCN.c3)]);
    attack(win, inst(win, 'p1', 'characters', SCN.c2), inst(win, 'p2', 'characters', SCN.c3));
    passBlock(win);
    passCounter(win);
    expect(win.zone('p2', 'characters')).toHaveLength(0);

    const lose = start([HOTORI, KOTORI, SATORI, SCN.c2], [{ card: SCN.c3, rested: true }]);
    attack(lose, inst(lose, 'p1', 'characters', SCN.c2), inst(lose, 'p2', 'characters', SCN.c3));
    passBlock(lose);
    passCounter(lose);
    expect(lose.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"during this turn": the reduction is gone on my next turn', () => {
    const g = start();
    run(g);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    toMyNextMain(g);
    expect(g.power(inst(g, 'p2', 'characters', SCN.c3))).toBe(5000);
  });

  it('without [Kotori] on my field nothing happens', () => {
    const g = start([HOTORI, SATORI]);
    if (offeredAbilities(g, hotori(g)).length) {
      run(g);
      if (kind(g) === 'choose') {
        expect(choices(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.power(inst(g, 'p2', 'characters', SCN.c3))).toBe(5000);
  });

  it('without [Satori] on my field nothing happens', () => {
    const g = start([HOTORI, KOTORI]);
    if (offeredAbilities(g, hotori(g)).length) {
      run(g);
      if (kind(g) === 'choose') {
        expect(choices(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.power(inst(g, 'p2', 'characters', SCN.c3))).toBe(5000);
  });

  it('the opponent’s [Kotori] and [Satori] do not count', () => {
    const g = start([HOTORI], [SCN.c3, KOTORI, SATORI]);
    if (offeredAbilities(g, hotori(g)).length) {
      run(g);
      if (kind(g) === 'choose') {
        expect(choices(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.power(inst(g, 'p2', 'characters', SCN.c3))).toBe(5000);
  });

  it('another printing of [Kotori] / [Satori] (same name, OP05-103 and OP05-105) counts', () => {
    const g = start([HOTORI, 'OP05-103', 'OP05-105']);
    run(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(g.power(inst(g, 'p2', 'characters', SCN.c3))).toBe(2000);
  });

  it('"up to 1": nobody may be chosen, and at most one Character is reduced', () => {
    const g = start([HOTORI, KOTORI, SATORI], [SCN.c3, BAT.dadan2000]);
    run(g);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only Characters of the opponent are candidates, with no power limit', () => {
    const g = start([HOTORI, KOTORI, SATORI], [SCN.c3, SCN.c8]);
    run(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c8].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(kotoriOf(g));
  });

  it('CR 8-3-1-3: a rested Hotori cannot pay the rest cost; with 1 DON!! DON!! -2 cannot be paid', () => {
    const rested = start([{ card: HOTORI, rested: true }, KOTORI, SATORI]);
    expect(offeredAbilities(rested, hotori(rested))).toEqual([]);
    const poor = start([HOTORI, KOTORI, SATORI], [SCN.c3], 1);
    expect(offeredAbilities(poor, hotori(poor))).toEqual([]);
  });

  it('[Activate: Main] is not offered on the opponent’s turn', () => {
    const g = theirs(LD15.purple, {
      characters: [HOTORI, KOTORI, SATORI],
      costArea: { active: 4, rested: 0 },
    });
    expect(offeredAbilities(g, hotori(g))).toEqual([]);
  });
});

function kotoriOf(g: TestGame) {
  return at(g, 'p1', 'characters', KOTORI);
}
