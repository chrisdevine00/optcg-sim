/**
 * ST26-002 Tony Tony.Chopper (Character, Purple, cost 3, 4000, Counter +1000, {Animal}/{Straw Hat
 * Crew}, Wisdom).
 *
 * Card text: "[Blocker] [On Play] DON!! -2 (You may return the specified number of DON!! cards from
 * your field to your DON!! deck.): Rest up to 1 of your opponent's DON!! cards or Characters with a
 * cost of 1 or less."
 *
 * Rules: CR 10-1-3 ([Blocker]), CR 8-3 ("DON!! -N" is a cost paid from DON!! on the field, active,
 * rested or given), CR 1-3-5 ("up to" allows 0). The candidates are the opponent's DON!! cards or
 * Characters (not the Leader); a cost of 1 or less includes 0. The effect rests, it does not K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  choices,
  costOffered,
  decline,
  donChoices,
  donOf,
  fieldDon,
  fill,
  kw,
  kind,
  mine,
  need,
  none,
  offeredIds,
  payDonCost,
  pickDonClass,
  pickInst,
  playCard,
  restedChar,
  RED,
  SL,
  SS,
  skipEmpty,
  theirs,
  useDonCost,
  waitingAtMain,
  yes,
} from './kit-st2627a.ts';

const CHOPPER = 'ST26-002';

function start(
  p1: { characters?: string[]; costArea?: { active: number; rested: number } } = {},
  p2: {
    characters?: (string | { card: string; rested?: boolean; don?: number })[];
    costArea?: { active: number; rested: number };
  } = {},
) {
  return mine(
    SL.shanks,
    { hand: [CHOPPER], ...p1 },
    { deck: fill(RED, 10), costArea: { active: 0, rested: 0 }, ...p2 },
  );
}

describe('ST26-002 Tony Tony.Chopper: [Blocker]', () => {
  it('has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(
      SL.shanks,
      { characters: [CHOPPER] },
      { characters: [SS.c4], costArea: { active: 10, rested: 0 } },
    );
    const chopper = at(g, 'p1', 'characters', CHOPPER);
    expect(kw(g, chopper)).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SS.c4), g.leader('p1'));
    expect(blockers(g)).toEqual([chopper]);
  });
});

describe('ST26-002 Tony Tony.Chopper: [On Play] DON!! -2: rest up to 1 DON!! or cost 1 Character', () => {
  it('the effect is optional: declining pays nothing and rests nothing', () => {
    const g = start({}, { characters: [SS.c1], costArea: { active: 3, rested: 0 } });
    playCard(g, CHOPPER);
    expect(costOffered(g)).toBe(true);
    decline(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(donOf(g, 'p1').deck).toBe(0);
    expect(fieldDon(g, 'p1')).toBe(10);
    expect(restedChar(g, 'p2', SS.c1)).toBe(false);
    expect(donOf(g, 'p2').rested).toBe(0);
  });

  it('paying returns 2 DON!! from my field to my DON!! deck', () => {
    const g = start({ costArea: { active: 10, rested: 0 } }, { characters: [SS.c1] });
    playCard(g, CHOPPER);
    const before = donOf(g, 'p1');
    expect(before.deck).toBe(0);
    useDonCost(g, 2);
    pickInst(g, [at(g, 'p2', 'characters', SS.c1)]);
    const after = donOf(g, 'p1');
    expect(after.deck).toBe(2);
    expect(after.active + after.rested + after.given).toBe(8);
  });

  it('a Character with cost 1 can be rested', () => {
    const g = start({ costArea: { active: 10, rested: 0 } }, { characters: [SS.c1] });
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.c1]);
    pickInst(g, [at(g, 'p2', 'characters', SS.c1)]);
    expect(restedChar(g, 'p2', SS.c1)).toBe(true);
  });

  it('candidates: cost 1 or less only. A cost-2 Character, my own Characters and both Leaders are not offered', () => {
    const g = start(
      { characters: [SS.c1], costArea: { active: 10, rested: 0 } },
      { characters: [SS.c1, SS.c2] },
    );
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SS.c1]);
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SS.c1));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(at(g, 'p2', 'characters', SS.c2));
  });

  it("an opponent's active DON!! card is a candidate: resting it moves one DON!! from active to rested", () => {
    const g = start(
      { costArea: { active: 10, rested: 0 } },
      { characters: [SS.c2], costArea: { active: 3, rested: 0 } },
    );
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    need(g, 'choose');
    expect(donChoices(g).map((c) => c.from)).toContain('costActive');
    pickDonClass(g, 'costActive');
    expect(waitingAtMain(g)).toBe(true);
    expect(donOf(g, 'p2').active).toBe(2);
    expect(donOf(g, 'p2').rested).toBe(1);
    expect(restedChar(g, 'p2', SS.c2)).toBe(false);
  });

  it('"up to 1": picks one target at most; the other cost-1 Character and the DON!! stay as they were', () => {
    const g = start(
      { costArea: { active: 10, rested: 0 } },
      { characters: [SS.c1, SS.c1], costArea: { active: 3, rested: 0 } },
    );
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    pickInst(g, [at(g, 'p2', 'characters', SS.c1, 0)]);
    expect(waitingAtMain(g)).toBe(true);
    expect(restedChar(g, 'p2', SS.c1, 0)).toBe(true);
    expect(restedChar(g, 'p2', SS.c1, 1)).toBe(false);
    expect(donOf(g, 'p2').rested).toBe(0);
  });

  it('"up to 1": choosing nothing is allowed; the DON!! cost has already been paid', () => {
    const g = start({ costArea: { active: 10, rested: 0 } }, { characters: [SS.c1] });
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    need(g, 'choose');
    none(g);
    expect(restedChar(g, 'p2', SS.c1)).toBe(false);
    expect(donOf(g, 'p1').deck).toBe(2);
  });

  it('only 3 DON!! on my field (all rested by the play cost) can still pay DON!! -2 (rested DON!! count)', () => {
    const g = start({ costArea: { active: 3, rested: 0 } }, { characters: [SS.c1] });
    playCard(g, CHOPPER);
    expect(donOf(g, 'p1').rested).toBe(3);
    expect(costOffered(g)).toBe(true);
    yes(g);
    payDonCost(g, 2, 'costRested');
    pickInst(g, [at(g, 'p2', 'characters', SS.c1)]);
    expect(restedChar(g, 'p2', SS.c1)).toBe(true);
    expect(fieldDon(g, 'p1')).toBe(1);
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('with no opposing Character of cost 1 or less and no opposing DON!! on the field, nothing can be rested', () => {
    const g = start({ costArea: { active: 10, rested: 0 } }, { characters: [SS.c2, SS.c3] });
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    skipEmpty(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(restedChar(g, 'p2', SS.c2)).toBe(false);
    expect(restedChar(g, 'p2', SS.c3)).toBe(false);
  });

  it('opposing DON!! that is already rested is not a rest target: no active DON!! is offered', () => {
    const g = start(
      { costArea: { active: 10, rested: 0 } },
      { characters: [SS.c2], costArea: { active: 0, rested: 3 } },
    );
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    if (kind(g) === 'choose') {
      expect(donChoices(g).filter((c) => c.from === 'costActive')).toHaveLength(0);
      none(g);
    }
    expect(donOf(g, 'p2').rested).toBe(3);
    expect(donOf(g, 'p2').active).toBe(0);
  });

  it("must not: the Character that rests is not K.O.'d, the Leader is not rested", () => {
    const g = start({ costArea: { active: 10, rested: 0 } }, { characters: [SS.c1] });
    playCard(g, CHOPPER);
    useDonCost(g, 2);
    pickInst(g, [at(g, 'p2', 'characters', SS.c1)]);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });
});
