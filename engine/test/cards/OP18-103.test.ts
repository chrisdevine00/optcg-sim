/** OP18-103 Jabra. */
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
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { koBy } from './helpers-w3s.ts';
import { COST10, COST8, CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-103';
const ko = (p2: Parameters<typeof game>[1] = { leader: PLAIN_BLUE }) => {
  const g = game({ leader: CP_L, characters: [ID], deck: [V.c2, V.c3] }, p2);
  koBy(g, 'p1', ID, 'p2');
  return g;
};

describe('OP18-103 Jabra', () => {
  it("[On K.O.] adds the top card of your deck to your Life, then trashes the top of the opponent's Life", () => {
    const g = ko({ leader: PLAIN_BLUE, life: [V.c5, V.c6, V.c7] });
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c2);
    accept(g);
    expect(g.life('p2')).toBe(2);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(hand(g, 'p2')).toEqual([]); // not damage
  });

  it('each "up to 1" may be declined on its own', () => {
    const g = ko({ leader: PLAIN_BLUE, life: [V.c5, V.c6, V.c7] });
    decline(g);
    expect(g.life('p1')).toBe(3);
    accept(g);
    expect(g.life('p2')).toBe(2);
    const g2 = ko({ leader: PLAIN_BLUE, life: [V.c5, V.c6, V.c7] });
    accept(g2);
    decline(g2);
    expect(g2.life('p1')).toBe(4);
    expect(g2.life('p2')).toBe(3);
  });

  it('the Life trash still happens when your deck is empty', () => {
    const g = game(
      { leader: CP_L, characters: [ID], deck: [] },
      { leader: PLAIN_BLUE, life: [V.c5, V.c6] },
    );
    koBy(g, 'p1', ID, 'p2');
    if (g.legal().some((a) => a.type === 'optional')) accept(g);
    expect(g.life('p1')).toBe(3);
  });

  it("[Trigger] with a {CP} Leader: draw 1, then place a Character with a cost of 8 or less at the bottom of its owner's deck", () => {
    const g = trig(ID, { deck: [BLUE, V.c1] }, [COST8, COST10]);
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', COST8), g.find('p2', 'characters', V.c7)].sort(),
    ); // cost 10 is not offered
    pick(g, [g.find('p2', 'characters', COST8)]);
    expect(zoneOf(g, 'p2', 'deck').at(-1)).toBe(COST8);
    expect(zoneOf(g, 'p2', 'characters')).toEqual([V.c7, COST10]);
  });

  it('[Trigger] "up to 1": may place nothing; without a {CP} Leader nothing happens at all', () => {
    const g = trig(ID, { deck: [BLUE, V.c1] }, [COST8]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    const g2 = trig(ID, { leader: 'ST04-001', deck: [BLUE, V.c1] }, [COST8]);
    g2.act({ type: 'trigger', activate: true });
    expect(hand(g2, 'p1')).toEqual([]);
    expectDecision(g2, 'main', 'p2');
  });
});
