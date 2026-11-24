/**
 * OP16-052 Monkey.D.Luffy (Character, Blue, cost 2, 3000, Counter +1000, {Straw Hat Crew}/{Impel Down}).
 *
 * Card text: "[Activate:Main] [Once Per Turn] Give up to 1 rested DON!! card to your Leader or 1 of your
 * Characters."
 *
 * Rules: RD 55 / RD 81-84 (given DON!! are neither active nor rested; +1000 each on its owner's
 * turn), CR 10-2-13 ([Once Per Turn]), CR 8-4-4-1 ("up to"), CR 3-7-4 (summoning sickness is about
 * attacking), CR 8-3-1 (there is no cost, so a rested Luffy can still activate).
 */
import { describe, expect, it } from 'vitest';
import {
  abilities,
  at,
  choices,
  declineChoice,
  don,
  kind,
  LDR,
  mine,
  need,
  pickInst,
  SCN,
  useAbility,
  backAtMain,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LUFFY = 'OP16-052';

function start(
  o: {
    active?: number;
    rested?: number;
    chars?: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[];
  } = {},
): TestGame {
  return mine(
    LDR.luffy,
    {
      characters: o.chars ?? [LUFFY, SCN.c3],
      costArea: { active: o.active ?? 5, rested: o.rested ?? 3 },
    },
    { characters: [SCN.c4] },
  );
}
const luffy = (g: TestGame) => at(g, 'p1', 'characters', LUFFY);

describe('OP16-052 Monkey.D.Luffy: [Activate:Main] [Once Per Turn] give up to 1 rested DON!! to my Leader or a Character', () => {
  it('give it to my Leader: rested DON!! 3 -> 2, given 1, Leader 6000', () => {
    const g = start();
    useAbility(g, luffy(g));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(don(g)).toMatchObject({ active: 5, rested: 2, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('give it to one of my Characters: that Character gains +1000 on my turn', () => {
    const g = start();
    useAbility(g, luffy(g));
    pickInst(g, [at(g, 'p1', 'characters', SCN.c3)]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(6000);
    expect(don(g)).toMatchObject({ rested: 2, given: 1 });
  });

  it('Luffy himself is one of my Characters and may receive it', () => {
    const g = start();
    useAbility(g, luffy(g));
    expect(choices(g)).toContain(luffy(g));
    pickInst(g, [luffy(g)]);
    expect(g.power(luffy(g))).toBe(4000);
  });

  it('only a RESTED DON!! is given: the active DON!! are untouched', () => {
    const g = start({ active: 5, rested: 1 });
    useAbility(g, luffy(g));
    pickInst(g, [g.leader('p1')]);
    expect(don(g)).toMatchObject({ active: 5, rested: 0, given: 1 });
  });

  it('with no rested DON!! nothing can be given (active DON!! are not moved)', () => {
    const g = start({ active: 5, rested: 0 });
    if (abilities(g, luffy(g)).length) {
      useAbility(g, luffy(g));
      if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    }
    expect(don(g)).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('gives just 1 DON!!, even with 3 rested', () => {
    const g = start({ active: 2, rested: 3 });
    useAbility(g, luffy(g));
    pickInst(g, [g.leader('p1')]);
    expect(don(g)).toMatchObject({ rested: 2, given: 1 });
  });

  it('"up to 1": may give none; no DON!! moves', () => {
    const g = start();
    useAbility(g, luffy(g));
    declineChoice(g);
    expect(don(g)).toMatchObject({ active: 5, rested: 3, given: 0 });
    expect(backAtMain(g)).toBe(true);
  });

  it('only my own Leader and Characters are offered, not the opponent’s', () => {
    const g = start();
    useAbility(g, luffy(g));
    expect(choices(g).every((i) => g.card(i).owner === 'p1')).toBe(true);
    expect(choices(g)).toHaveLength(3);
  });

  it('CR 10-2-13: [Once Per Turn]: not offered a second time even with rested DON!! left', () => {
    const g = start();
    useAbility(g, luffy(g));
    pickInst(g, [g.leader('p1')]);
    expect(abilities(g, luffy(g))).toEqual([]);
  });

  it('there is no rest cost: a rested Luffy and a just-played Luffy can both activate', () => {
    const rested = start({ chars: [{ card: LUFFY, rested: true }] });
    expect(abilities(rested, luffy(rested))).toHaveLength(1);
    const fresh = start({ chars: [{ card: LUFFY, playedThisTurn: true }] });
    expect(abilities(fresh, luffy(fresh))).toHaveLength(1);
  });
});
