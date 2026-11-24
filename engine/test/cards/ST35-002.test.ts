/** ST35-002 Lindbergh. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { offers, WB_LEADER } from './helpers-stg2.ts';

const ID = 'ST35-002';
const start = () =>
  game(
    { leader: WB_LEADER, hand: [ID], characters: [V.c3], costArea: { active: 4, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c4, V.c1] },
  );

describe('ST35-002 Lindbergh', () => {
  it('[On Play] gives up to 1 opposing Character -3000 power this turn (exact amount)', () => {
    const g = start();
    play(g, ID);
    const t = g.find('p2', 'characters', V.c4);
    pick(g, [t]);
    expect(g.power(t)).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    expectDecision(g, 'main', 'p1');
  });

  it('the effect ends with the turn: back to 6000 on the opponent turn', () => {
    const g = start();
    play(g, ID);
    const t = g.find('p2', 'characters', V.c4);
    pick(g, [t]);
    g.act({ type: 'endTurn' });
    expect(g.power(t)).toBe(6000);
  });

  it('only opposing Characters are candidates (not your Character or either Leader)', () => {
    const g = start();
    play(g, ID);
    expect(new Set(offers(g))).toEqual(
      new Set([g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c1)]),
    );
  });

  it('"up to 1": may be skipped and a second Character is never affected', () => {
    const g = start();
    play(g, ID);
    g.act({ type: 'done' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('a Character with less than 3000 power goes below 0 rather than stopping at 0', () => {
    const g = game(
      { leader: WB_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: ['OP14-102'] },
    );
    play(g, ID);
    pick(g, [g.find('p2', 'characters', 'OP14-102')]);
    expect(g.power(g.find('p2', 'characters', 'OP14-102'))).toBe(-1000);
  });
});
