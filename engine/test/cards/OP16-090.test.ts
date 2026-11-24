/** OP16-090 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, play, PLAIN_BLUE, PURPLE, trash, V } from './helpers.ts';
import { NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-090';
const start = (opp: string[]) =>
  game(
    { leader: NOT_NAVY, hand: [ID, PURPLE, V.c1], costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );
const trash2 = (g: ReturnType<typeof start>) =>
  pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', V.c1)]);

describe('OP16-090 Tony Tony.Chopper', () => {
  it('[On Play] draws 2, trashes 2, then K.O.s an opponent Character with a cost of 1 or less', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    trash2(g);
    // The cost 2 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(trash(g, 'p2')).toEqual([V.c1]);
  });

  it('a cost 2 Character cannot be K.O.d', () => {
    const g = start([V.c2]);
    play(g, ID);
    trash2(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = start([V.c1]);
    play(g, ID);
    trash2(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
