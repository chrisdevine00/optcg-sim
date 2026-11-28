/** OP18-048 Mr.1 & Miss Doublefinger. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, play } from './helpers.ts';
import { BW2, BW4, BW5, BW9, candidates, mine, V } from './helpers-op18-g2.ts';

const ID = 'OP18-048';
const start = (hand: string[]) => {
  const g = mine({ hand: [ID, ...hand], costArea: { active: 6, rested: 0 } });
  play(g, ID);
  return g;
};

describe('OP18-048 Mr.1 & Miss Doublefinger', () => {
  it('has [Rush]', () => {
    const g = start([]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('[On Play] plays a {Baroque Works} Character with a cost of 5 or less from your hand', () => {
    const g = start([BW5, BW2, BW9, V.c3]);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'hand', BW5), g.find('p1', 'hand', BW2)].sort(),
    );
    pick(g, [g.find('p1', 'hand', BW5)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, BW5]);
  });

  it('cost 6 or more and other types are not offered', () => {
    const g = start([BW9, V.c3]);
    expect(candidates(g)).toEqual([]);
  });

  it('it is played for free: no DON!! are spent on it', () => {
    const g = start([BW5]);
    pick(g, [g.find('p1', 'hand', BW5)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
  });

  it('"up to 1": may play nothing', () => {
    const g = start([BW4]);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
