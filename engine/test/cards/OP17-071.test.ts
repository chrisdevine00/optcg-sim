/** OP17-071 Who's.Who. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';

const ID = 'OP17-071';
const start = (opp: string[]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );
const inField = (g: ReturnType<typeof start>, c: string, nth = 0) =>
  g.zone('p2', 'characters').filter((x) => x.card === c)[nth];

describe("OP17-071 Who's.Who", () => {
  it('[On Play] DON!! −1: K.O.s up to 2 Characters with a cost of 2 or less', () => {
    const g = start([V.c1, V.c2, V.c3]);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(g.zone('p2', 'trash')).toHaveLength(2);
  });

  it('"up to 2": may K.O. just 1', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1]);
  });

  it('a Character with a cost of 3 is not a legal target', () => {
    const g = start([V.c3]);
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    expect(inField(g, V.c3)).toBeDefined();
  });

  it('declining the DON!! −1 K.O.s nothing', () => {
    const g = start([V.c1]);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('[Trigger] play this card', () => {
    const g = triggerHit(ID, { costArea: { active: 0, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
