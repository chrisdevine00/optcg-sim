/** OP17-016 Rakuyo. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { P2000_A, P2000_B, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-016';

describe('OP17-016 Rakuyo', () => {
  const start = (opp: Parameters<typeof game>[1]['characters']) =>
    game(
      { leader: RED_LEADER, hand: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );
  const left = (g: ReturnType<typeof start>) => g.zone('p2', 'characters').map((c) => c.card);

  it("[On Play] K.O. up to 2 of your opponent's Characters with 2000 base power or less", () => {
    const g = start([P2000_A, P2000_B, V.c1]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', P2000_A), g.find('p2', 'characters', P2000_B)]);
    expect(left(g)).toEqual([V.c1]);
  });

  it('only the Characters with 2000 base power or less are candidates (3000 is not)', () => {
    const g = start([P2000_A, V.c1]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', P2000_A)]);
    expect(left(g)).toEqual([V.c1]);
  });

  it('"up to 2": it may K.O. only 1 of 2 candidates', () => {
    const g = start([P2000_A, P2000_B]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', P2000_B)]);
    expect(left(g)).toEqual([P2000_A]);
  });

  it('"up to 2": it may K.O. none', () => {
    const g = start([P2000_A, P2000_B]);
    play(g, ID);
    none(g);
    expect(left(g)).toHaveLength(2);
  });

  it('never K.O.s your own Characters', () => {
    const g = game(
      { leader: RED_LEADER, hand: [ID], characters: [P2000_A], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });
});
