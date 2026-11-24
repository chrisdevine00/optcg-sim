/** OP14-091 Mr.2.Bon.Kurei(Bentham). */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import {
  BENTHAM,
  BW5,
  BW5_FORMER,
  BW6,
  BW_LEADER,
  ids,
  koByEffect,
  start,
} from './helpers-op14g4.ts';

const ID = 'OP14-091';
const run = (hand: string[], trash: string[]) => {
  const g = start({ leader: BW_LEADER, characters: [ID], hand, trash });
  koByEffect(g, 'p1', ID);
  expectDecision(g, 'choose', 'p1');
  return g;
};
const offered = (g: ReturnType<typeof run>) => g.legal().filter((a) => a.type === 'pick');

describe('OP14-091 Mr.2.Bon.Kurei(Bentham)', () => {
  it('[On K.O.] plays a Baroque Works Character with cost 5 or less from the trash', () => {
    const g = run([], [BW5]);
    pick(g, [g.find('p1', 'trash', BW5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([BW5]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('or from the hand: both zones are offered as one choice', () => {
    const g = run([BW5], [BW5_FORMER]);
    expect(offered(g)).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', BW5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([BW5]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([ID, BW5_FORMER].sort());
  });

  it('never offers another [Mr.2.Bon.Kurei(Bentham)] (excluded by name), cost 6, or a non-Baroque card', () => {
    const g = run([BENTHAM, V.c4], [BW6, BENTHAM, V.c3, BW5]);
    // Only BW5 qualifies: BENTHAM shares the name, BW6 costs 6, V.c3 / V.c4 are not Baroque Works.
    expect(offered(g)).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', BW5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([BW5]);
  });

  it('"up to 1": may play nothing', () => {
    const g = run([], [BW5]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([BW5, ID].sort());
  });

  it('with no qualifying card nothing is played', () => {
    const g = run([V.c1], [BW6, BENTHAM]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
