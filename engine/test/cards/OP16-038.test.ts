/** OP16-038 Let's Go!! To the Navy Headquarters!! */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, payDon, play, PURPLE, V } from './helpers.ts';
import { counterStep, endCounter, useCounter } from './helpers-luffyace.ts';
import {
  BUGGY_G,
  IMPEL_FIVE,
  IMPEL_LEADER,
  IVANKOV,
  MR2_G,
  MR3_G,
  PRISONER,
} from './helpers-op16g2.ts';
import { game } from './helpers.ts';
import { BLUE_LEADER } from './helpers-op16g2.ts';

const ID = 'OP16-038';

describe("OP16-038 Let's Go!! To the Navy Headquarters!!", () => {
  const start = (chars: string[]) =>
    game(
      {
        leader: { card: IMPEL_LEADER, rested: true },
        hand: [ID],
        characters: chars.map((card) => ({ card, rested: true })),
        costArea: { active: 9, rested: 0 },
      },
      { leader: BLUE_LEADER },
    );
  const run = (g: ReturnType<typeof start>) => {
    play(g, ID);
    accept(g);
    payDon(g);
  };

  it('[Main] rest 6 DON!!: with 5 {Impel Down} Characters of different names, sets your Leader and all Characters active', () => {
    const g = start(IMPEL_FIVE);
    run(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 7 }); // the event costs 1, the cost rests 6
    expect(g.card(g.leader('p1')).rested).toBe(false);
    for (const c of g.zone('p1', 'characters')) expect(c.rested).toBe(false);
  });

  it('4 Characters with different names is not enough (the cost is still paid)', () => {
    const g = start([BUGGY_G, MR2_G, MR3_G, IVANKOV]);
    run(g);
    expect(don(g, 'p1').rested).toBe(7);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    for (const c of g.zone('p1', 'characters')) expect(c.rested).toBe(true);
  });

  it('5 Characters sharing a name do not count twice', () => {
    const g = start([BUGGY_G, MR2_G, MR3_G, PRISONER, PRISONER]);
    run(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('only {Impel Down} Characters count', () => {
    const g = start([BUGGY_G, MR2_G, MR3_G, PRISONER, PURPLE]);
    run(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('the cost may be declined: nothing is rested and nothing set active', () => {
    const g = start(IMPEL_FIVE);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 1 });
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = counterStep(
      { leader: IMPEL_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } },
      {},
      V.c6,
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 ties the 8000 attacker: the Leader holds
  });
});
