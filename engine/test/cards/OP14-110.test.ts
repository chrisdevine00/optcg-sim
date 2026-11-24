/** OP14-110 Dr. Hogback. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import {
  describeTbpTrigger,
  ids,
  koByEffect,
  OTHER_LEADER,
  start,
  TBP4,
  TRIG2,
  TRIG4,
  TRIG5,
} from './helpers-op14g4.ts';

const ID = 'OP14-110';
const run = (trash: string[]) => {
  const g = start({ leader: OTHER_LEADER, characters: [ID], trash });
  koByEffect(g, 'p1', ID);
  return g;
};
const offered = (g: ReturnType<typeof run>) => g.legal().filter((a) => a.type === 'pick');

describe('OP14-110 Dr. Hogback', () => {
  it('[On K.O.] plays a Character with cost 4 or less and a [Trigger] from the trash (active)', () => {
    const g = run([TRIG2]);
    pick(g, [g.find('p1', 'trash', TRIG2)]);
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([TRIG2]);
    expect(c[0]!.rested).toBe(false);
  });

  it('cost 4 is allowed, cost 5 is not; a Character without a [Trigger] is not', () => {
    const g = run([TRIG4, TRIG5, TBP4, V.c2]);
    expect(offered(g)).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', TRIG4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([TRIG4]);
  });

  it("never offers [Dr. Hogback] himself (the K.O.'d card is in the trash with a [Trigger]): excluded by name", () => {
    const g = run([V.c1]);
    expect(offered(g)).toHaveLength(0);
    expectDecision(g, 'main', 'p1'); // nothing to choose: the step ends
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": may play nothing', () => {
    const g = run([TRIG2]);
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});

describeTbpTrigger(ID);
