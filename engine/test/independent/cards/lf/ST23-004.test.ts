/**
 * ST23-004 Monkey.D.Luffy (Character, Red, cost 1, 2000, Counter +1000, {FILM}/{Straw Hat Crew}/
 * {Supernovas}).
 *
 * Card text: "[Activate:Main] You may rest 1 of your DON!! cards and this Character: Give up to 1 of
 * your opponent's Characters -1000 power during this turn."
 *
 * Rules: CR 8-3-1 (costs), summoning sickness stops attacking only (CR 3-7-4), "during this turn"
 * ends with the turn.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  at,
  atMain,
  canFinish,
  choices,
  decision,
  donOf,
  kind,
  LB,
  mine,
  need,
  none,
  offeredAbilities,
  pickInst,
  SL,
  theirs,
  toMyNextMain,
} from './kit-lfb.ts';

const ID = 'ST23-004';
const TARGET = SL.c4; // 6000

/** Activate Luffy and pay the costs; the effect's target pick is left pending. */
function use(g: TestGame): void {
  const luffy = at(g, 'p1', 'characters', ID);
  const [ability] = offeredAbilities(g, luffy);
  if (!ability) throw new Error('Luffy not offered');
  act(g, { type: 'activate', card: luffy, ability });
  for (let i = 0; i < 6; i++) {
    const d = decision(g);
    if (d?.kind === 'optional') act(g, { type: 'optional', accept: true });
    else if (d?.kind === 'choose' && d.purpose === 'cost') {
      const p = g.legal().find((a) => a.type === 'pick');
      if (!p) break;
      g.act(p);
    } else break;
  }
}

function field(
  o: {
    luffy?: string | { card: string; rested?: boolean; playedThisTurn?: boolean };
    active?: number;
    theirs?: string[];
  } = {},
) {
  return mine(
    LB.luffy,
    {
      characters: [o.luffy ?? ID],
      costArea: { active: o.active ?? 5, rested: 10 - (o.active ?? 5) },
    },
    { characters: o.theirs ?? [TARGET] },
  );
}

describe('ST23-004 Monkey.D.Luffy: [Activate: Main] rest 1 DON!! and this Character: an opposing Character gets -1000 this turn', () => {
  it('pays 1 DON!! (rested) and rests Luffy; the target gets -1000 power', () => {
    const g = field();
    use(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', TARGET)]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.find('p2', 'characters', TARGET))).toBe(5000);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it("only the opponent's Characters are candidates (not mine, not Leaders)", () => {
    const g = mine(
      LB.luffy,
      { characters: [ID, SL.c1], costArea: { active: 5, rested: 5 } },
      { characters: [TARGET] },
    );
    use(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.find('p2', 'characters', TARGET)]);
  });

  it('"up to 1": the target may be skipped; the costs stay paid', () => {
    const g = field();
    use(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.power(g.find('p2', 'characters', TARGET))).toBe(6000);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(donOf(g, 'p1').rested).toBe(6);
  });

  it('with no active DON!! the cost cannot be paid: the ability is not offered', () => {
    const g = field({ active: 0 });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('with exactly 1 active DON!! it can be used (boundary)', () => {
    const g = field({ active: 1 });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
    use(g);
    pickInst(g, [g.find('p2', 'characters', TARGET)]);
    expect(donOf(g, 'p1').active).toBe(0);
  });

  it('an already rested Luffy cannot pay "rest this Character": the ability is not offered', () => {
    const g = field({ luffy: { card: ID, rested: true } });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('after use Luffy is rested, so it cannot be used a second time this turn', () => {
    const g = field();
    use(g);
    pickInst(g, [g.find('p2', 'characters', TARGET)]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('a Luffy played this turn can use it (summoning sickness only stops attacking)', () => {
    const g = field({ luffy: { card: ID, playedThisTurn: true } });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('the -1000 lasts this turn only', () => {
    const g = field();
    use(g);
    pickInst(g, [g.find('p2', 'characters', TARGET)]);
    expect(g.power(g.find('p2', 'characters', TARGET))).toBe(5000);
    toMyNextMain(g);
    expect(g.power(g.find('p2', 'characters', TARGET))).toBe(6000);
  });

  it("must not happen: it is not offered on the opponent's turn", () => {
    const g = theirs(LB.luffy, { characters: [ID] }, { characters: [TARGET] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
    expect(kind(g)).toBe('main');
  });
});
