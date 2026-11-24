/** EB04-033 Groggy Monsters: [On Play] DON!! -1: with 3 or more {Foxy Pirates} Characters, K.O. up to 1 of the opponent's Characters with 6000 base power or less. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, payDon, expectDecision, none, pick, play, V } from './helpers.ts';
import { boost, canPick, FOXY1, ids, mine, OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-033';

const setup = (foxy: number, theirs: string[]) =>
  mine(
    { leader: OTHER_LEADER, hand: [ID], characters: Array(foxy).fill(FOXY1) },
    { characters: theirs },
  );

describe('EB04-033 Groggy Monsters', () => {
  it('with 3 {Foxy Pirates} Characters (itself included): DON!! -1 and K.O. a Character with 6000 base power or less', () => {
    const g = setup(2, [V.c4, V.c5]);
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c4]);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('the limit is base power: a 6000 base Character boosted to 7000 is a target, a 7000 base one lowered to 5000 is not', () => {
    const g = setup(2, [V.c4, V.c5]);
    boost(g, g.find('p2', 'characters', V.c4), 1000);
    boost(g, g.find('p2', 'characters', V.c5), -2000);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    none(g);
  });

  it('with only 2 {Foxy Pirates} Characters the DON!! is still returned but nothing is K.O.d', () => {
    const g = setup(1, [V.c4]);
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('a non-{Foxy Pirates} Character does not count towards the 3', () => {
    const g = mine(
      { leader: OTHER_LEADER, hand: [ID], characters: [FOXY1, V.c3] },
      { characters: [V.c4] },
    );
    play(g, ID);
    accept(g);
    payDon(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('the DON!! -1 can be declined: no DON!! returned and no K.O.', () => {
    const g = setup(2, [V.c4]);
    play(g, ID);
    decline(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = setup(2, [V.c4]);
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });
});
