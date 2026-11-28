/** OP18-113 Rob Lucci. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { koBy } from './helpers-w3s.ts';
import { COST10, COST8, CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-113';
const THEIR_LIFE = [V.c5, V.c6, V.c7];

describe('OP18-113 Rob Lucci', () => {
  it("[On Play] trashes up to 1 card from the top of your opponent's Life", () => {
    const g = game(
      { leader: CP_L, hand: [ID], costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE, life: THEIR_LIFE },
    );
    play(g, ID);
    accept(g);
    expect(g.life('p2')).toBe(2);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(zoneOf(g, 'p2', 'life')).toEqual([V.c6, V.c7]);
    expect(hand(g, 'p2')).toEqual([]); // not damage
  });

  it('[On K.O.] does the same, and each may be declined ("up to 1")', () => {
    const g = game({ leader: CP_L, characters: [ID] }, { leader: PLAIN_BLUE, life: THEIR_LIFE });
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(g.life('p2')).toBe(2);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c5]);
    const g2 = game({ leader: CP_L, characters: [ID] }, { leader: PLAIN_BLUE, life: THEIR_LIFE });
    koBy(g2, 'p1', ID, 'p2');
    decline(g2);
    expect(g2.life('p2')).toBe(3);
  });

  it('with the opponent at 0 Life nothing is asked', () => {
    const g = game(
      { leader: CP_L, hand: [ID], costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE, life: [] },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it("[Trigger] with a {CP} Leader: draw 1, then place a Character with a cost of 8 or less at the bottom of its owner's deck", () => {
    const g = trig(ID, { deck: [BLUE, V.c1] }, [COST8, COST10]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', COST8), g.find('p2', 'characters', V.c7)].sort(),
    );
    pick(g, [g.find('p2', 'characters', COST8)]);
    expect(zoneOf(g, 'p2', 'deck').at(-1)).toBe(COST8);
  });

  it('[Trigger] without a {CP} Leader nothing happens; with one the placing is "up to 1"', () => {
    const g = trig(ID, { leader: 'ST04-001', deck: [BLUE, V.c1] }, [COST8]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([]);
    const g2 = trig(ID, { deck: [BLUE, V.c1] }, [COST8]);
    g2.act({ type: 'trigger', activate: true });
    none(g2);
    expect(zoneOf(g2, 'p2', 'characters')).toContain(COST8);
  });
});
