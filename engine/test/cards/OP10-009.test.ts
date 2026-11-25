/** OP10-009 Smiley. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk, NAVY_L, PH_LEADER, PLAIN_LEADER } from './helpers-a10g1.ts';

const ID = 'OP10-009';

describe('OP10-009 Smiley', () => {
  it('[On Play]: with a {Punk Hazard} Leader, gives up to 1 opponent Character -3000 power this turn', () => {
    const g = mk({ leader: PH_LEADER, hand: [ID] }, { characters: [V.c5, V.c3] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('must not give -3000 without a {Punk Hazard} Leader (the Navy Leader or the Red one)', () => {
    for (const leader of [PLAIN_LEADER, NAVY_L]) {
      const g = mk({ leader, hand: [ID] }, { characters: [V.c5] });
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    }
  });

  it('"up to 1": may decline; only opponent Characters are candidates (not the Leaders)', () => {
    const g = mk({ leader: PH_LEADER, hand: [ID], characters: [V.c1] }, { characters: [V.c5] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });
});
