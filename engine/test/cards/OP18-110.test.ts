/** OP18-110 Blueno. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { CP_CHAR, CP_L, SPANDAM, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-110';
const main = (deck: string[]) =>
  game(
    { leader: CP_L, hand: [ID], deck, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP18-110 Blueno', () => {
  it('[On Play] looks at 4 and adds up to 1 card with a type including "CP" other than [Blueno]', () => {
    const g = main([BLUE, ID, CP_CHAR, SPANDAM, V.c1, V.c2]);
    play(g, ID);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'deck', CP_CHAR), g.find('p1', 'deck', SPANDAM)].sort(),
    ); // the other [Blueno] is excluded
    pick(g, [g.find('p1', 'deck', CP_CHAR)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([CP_CHAR]);
    expect(zoneOf(g, 'p1', 'deck')[0]).toBe(V.c1); // 5th and 6th were not looked at
  });

  it('only the top 4 are looked at', () => {
    const g = main([BLUE, BLUE, BLUE, BLUE, CP_CHAR]);
    play(g, ID);
    expect(candidates(g)).toEqual([]);
  });

  it('"up to 1": may add nothing', () => {
    const g = main([CP_CHAR, BLUE, BLUE, BLUE]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] draws 1 and K.O.s an opposing Character with a cost of 2 or less (3 is not offered)', () => {
    const g = trig(ID, { deck: [BLUE, V.c1] }, [V.c2, V.c3]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c2)]);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c2]);
  });

  it('[Trigger] has no Leader condition and the K.O. is "up to 1"', () => {
    const g = trig(ID, { leader: 'ST04-001', deck: [BLUE, V.c1] }, [V.c2]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    none(g);
    expect(zoneOf(g, 'p2', 'characters')).toContain(V.c2);
    expectDecision(g, 'main', 'p2');
  });
});
