/** EB02-037 Franky. */
import { describe, expect, it } from 'vitest';
import { C1, don, expectDecision, finishBattle, mk, NAVY_LEADER, SHC } from './helpers-aeb2g1.ts';
import { addMost, dec, play } from './helpers.ts';

const ID = 'EB02-037';
// p1 has 3 DON!! on the field before Franky (cost 3) is played: the DON!! total stays 3.
const start = (p1: Parameters<typeof mk>[0] = {}, p2: Parameters<typeof mk>[1] = {}) =>
  mk(
    { hand: [ID], costArea: { active: 3, rested: 0 }, ...p1 },
    { costArea: { active: 3, rested: 0 }, ...p2 },
  );

describe('EB02-037 Franky', () => {
  it('[On Play] with a {Straw Hat Crew} Leader and as many DON!! as the opponent (equal): adds 1 DON!! rested', () => {
    const g = start();
    play(g, ID);
    expect(dec(g)?.max).toBe(1); // "how many DON!! will you add (up to 1)?"
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
    expectDecision(g, 'main', 'p1');
  });

  it('with fewer DON!! than the opponent: adds 1 DON!! rested', () => {
    const g = start({}, { costArea: { active: 5, rested: 0 } });
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1').rested).toBe(4);
  });

  it('with more DON!! than the opponent: nothing is added', () => {
    const g = start({}, { costArea: { active: 2, rested: 0 } });
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // no count is asked
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
  });

  it('DON!! given to cards count on the field; opposing DON!! given count too', () => {
    const g = start(
      { characters: [{ card: SHC.sanji1, don: 1 }] },
      {
        leader: 'ST03-001',
        costArea: { active: 2, rested: 0 },
        characters: [{ card: C1, don: 1 }],
      },
    );
    // p1: 3 cost area + 1 given = 4; p2: 2 + 1 given = 3: p1 has more, nothing is added.
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1').rested).toBe(3);
    const h = start(
      { characters: [{ card: SHC.sanji1, don: 1 }] },
      { costArea: { active: 3, rested: 0 }, characters: [{ card: C1, don: 1 }] },
    );
    play(h, ID); // 4 vs 4: equal, so it adds
    addMost(h);
    expect(don(h, 'p1').rested).toBe(4);
  });

  it('without a {Straw Hat Crew} Leader nothing is added', () => {
    const g = start({ leader: NAVY_LEADER });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ rested: 3, deck: 7 });
  });

  it('[When Attacking]: the same condition, adds 1 DON!! rested', () => {
    const g = mk(
      { characters: [ID], costArea: { active: 3, rested: 0 } },
      { costArea: { active: 3, rested: 0 } },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
    finishBattle(g);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[When Attacking] with more DON!! than the opponent: nothing', () => {
    const g = mk(
      { characters: [ID], costArea: { active: 4, rested: 0 } },
      { costArea: { active: 3, rested: 0 } },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });
});
