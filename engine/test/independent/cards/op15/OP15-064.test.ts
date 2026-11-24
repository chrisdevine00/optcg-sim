/**
 * OP15-064 Kotori (Character, Purple, cost 1, 2000, Counter +1000, {Sky Island}).
 *
 * Card text: "[Activate: Main] DON!! -2, You may rest this Character: If you have [Satori] and [Hotori],
 * rest up to 1 of your opponent's Characters with 5000 power or less."
 *
 * Rules: CR 8-3-1 (activation costs, paid in text order), CR 8-3-1-3 (an unpayable cost part makes the whole
 * cost unpayable), CR 8-3-1-4 (a "may" cost can be skipped but then the effect does not activate), CR 8-3-3
 * (a failed "if" stops the text), CR 8-4-4-1 ("up to"), CR 10-2-2-1 ([Activate: Main] only in the Main Phase).
 * Scenery: OP15-066 Satori (Purple, cost 1, {Vassals}) and OP15-072 Hotori (Purple, cost 1), both placed
 * in the scenario so their own text never fires.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BAT,
  BLUE,
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
  useAbility,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const KOTORI = 'OP15-064';
const SATORI = 'OP15-066';
const HOTORI = 'OP15-072';
const kotori = (g: TestGame) => at(g, 'p1', 'characters', KOTORI);

function start(
  own: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[] = [
    KOTORI,
    SATORI,
    HOTORI,
  ],
  p2: (string | { card: string; rested?: boolean })[] = [SCN.c3],
  donActive = 4,
  p2extra: Record<string, unknown> = {},
): TestGame {
  return mine(
    LD15.purple,
    { characters: own, costArea: { active: donActive, rested: 0 } },
    { characters: p2, ...p2extra },
  );
}

/**
 * Use the ability (choosing to activate is choosing to pay the "may rest" cost, no separate question)
 * and pay DON!! -2; the target choice (if any) is left pending.
 */
function run(g: TestGame): void {
  useAbility(g, kotori(g));
  payDon(g, 2);
}

describe('OP15-064 Kotori: [Activate: Main] DON!! -2, may rest this: with [Satori] and [Hotori], rest an opposing Character with 5000 power or less', () => {
  it('happy path: pays DON!! -2 and rests itself, then rests the chosen opposing Character', () => {
    const g = start();
    run(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(inst(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
    expect(g.card(kotori(g)).rested).toBe(true);
    expect(donOnField(g)).toBe(2);
  });

  it('boundary: a Character with exactly 5000 power is offered, one with 6000 is not', () => {
    const g = start([KOTORI, SATORI, HOTORI], [SCN.c3, SCN.c4]);
    run(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('without [Satori] on my field the effect does nothing', () => {
    const g = start([KOTORI, HOTORI]);
    if (offeredAbilities(g, kotori(g)).length) {
      run(g);
      if (kind(g) === 'choose') {
        expect(choices(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.card(inst(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('without [Hotori] on my field the effect does nothing', () => {
    const g = start([KOTORI, SATORI]);
    if (offeredAbilities(g, kotori(g)).length) {
      run(g);
      if (kind(g) === 'choose') {
        expect(choices(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.card(inst(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('the opponent’s [Satori] and [Hotori] do not count', () => {
    const g = start([KOTORI], [SCN.c3, SATORI, HOTORI]);
    if (offeredAbilities(g, kotori(g)).length) {
      run(g);
      if (kind(g) === 'choose') {
        expect(choices(g)).toEqual([]);
        none(g);
      }
    }
    expect(g.card(inst(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('another printing of [Satori] / [Hotori] (same name, OP05-105 and OP05-111) counts', () => {
    const g = start([KOTORI, 'OP05-105', 'OP05-111']);
    run(g);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(g.card(inst(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
  });

  it('"up to 1": choosing nobody is legal, and never more than one Character is rested', () => {
    const g = start([KOTORI, SATORI, HOTORI], [SCN.c3, BAT.dadan2000]);
    run(g);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('the DON!! -2 and the rest are both paid when the ability is used', () => {
    const g = start();
    run(g);
    expect(g.card(kotori(g)).rested).toBe(true);
    expect(donOnField(g)).toBe(2);
    expect(don(g)).toMatchObject({ active: 2 });
  });

  it('CR 8-3-1-3: an already rested Kotori cannot pay the rest cost, so nothing can happen', () => {
    const g = start([{ card: KOTORI, rested: true }, SATORI, HOTORI]);
    expect(offeredAbilities(g, kotori(g))).toEqual([]);
  });

  it('CR 8-3-1-3: with only 1 DON!! on my field DON!! -2 cannot be paid', () => {
    const g = start([KOTORI, SATORI, HOTORI], [SCN.c3], 1);
    expect(offeredAbilities(g, kotori(g))).toEqual([]);
  });

  it('a Kotori played this turn may still use its [Activate: Main]', () => {
    const g = start([{ card: KOTORI, playedThisTurn: true }, SATORI, HOTORI]);
    expect(offeredAbilities(g, kotori(g))).toHaveLength(1);
  });

  it('[Activate: Main] is not offered on the opponent’s turn', () => {
    const g = theirs(LD15.purple, {
      characters: [KOTORI, SATORI, HOTORI],
      costArea: { active: 4, rested: 0 },
    });
    expect(offeredAbilities(g, kotori(g))).toEqual([]);
  });

  it('must not: the opponent’s Leader is not a candidate (Characters only)', () => {
    const g = start();
    run(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
  });
});

void BLUE;
