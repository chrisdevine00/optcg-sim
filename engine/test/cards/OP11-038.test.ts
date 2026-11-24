/** OP11-038 Gum-Gum Elephant Gatling. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, counterStep, mk, useCounter } from './helpers-op11g2.ts';

const ID = 'OP11-038';
const start = (p2: string[], p1 = {}) => mk({ hand: [ID], ...p1 }, { characters: p2 });
const restedOf = (g: ReturnType<typeof mk>, c: string) =>
  g.card(g.find('p2', 'characters', c)).rested;

describe('OP11-038 Gum-Gum Elephant Gatling', () => {
  it('[Main]: rests 1 DON!! (after the Event itself) and rests up to 1 opposing Character with cost 5 or less', () => {
    const g = start([V.c5, V.c6]);
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // cost 5 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // cost 6
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(restedOf(g, V.c5)).toBe(true);
    expect(restedOf(g, V.c6)).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
  });

  it('declining the optional cost: the Event is played but nothing is rested and no extra DON!! is rested', () => {
    const g = start([V.c1]);
    play(g, ID);
    decline(g);
    expect(restedOf(g, V.c1)).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });

  it('"up to 1": may choose nothing (the DON!! stays rested)', () => {
    const g = start([V.c1]);
    play(g, ID);
    accept(g);
    none(g);
    expect(restedOf(g, V.c1)).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
  });

  it('cannot pay the DON!! cost (no DON!! left after the Event): the offer cannot be accepted', () => {
    const g = start([V.c1], { costArea: { active: 1, rested: 9 } });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(restedOf(g, V.c1)).toBe(false);
  });

  it('[Counter]: the Leader gains +3000 power during this battle and nothing is rested', () => {
    const g = counterStep(
      { leader: 'ST01-001', hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [V.c1] },
    );
    expect(g.power(g.leader('p1'))).toBe(5000);
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(restedOf(g, V.c1)).toBe(false);
  });
});
