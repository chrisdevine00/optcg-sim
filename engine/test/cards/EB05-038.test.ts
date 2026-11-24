/** EB05-038 Russian. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { donArea } from './helpers-luffyace.ts';
import { SENOR_PINK } from './helpers-eb05g2.ts';

const RUSSIAN = 'EB05-038';

describe('EB05-038 Russian', () => {
  it('[On Play] your [Senor Pink] gains +3000 power during this turn', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [RUSSIAN], characters: [SENOR_PINK, V.c1], ...donArea(1) },
      { leader: PLAIN_BLUE },
    );
    const pink = g.find('p1', 'characters', SENOR_PINK);
    const before = g.power(pink)!;
    play(g, RUSSIAN);
    // Only the [Senor Pink] is a candidate (no other card of yours has that name).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [pink]);
    expect(g.power(pink)).toBe(before + 3000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [RUSSIAN], characters: [SENOR_PINK], ...donArea(1) },
      { leader: PLAIN_BLUE },
    );
    const pink = g.find('p1', 'characters', SENOR_PINK);
    const before = g.power(pink)!;
    play(g, RUSSIAN);
    none(g);
    expect(g.power(pink)).toBe(before);
  });

  it('an opposing [Senor Pink] cannot be chosen', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [RUSSIAN], ...donArea(1) },
      { leader: PLAIN_BLUE, characters: [SENOR_PINK] },
    );
    const pink = g.find('p2', 'characters', SENOR_PINK);
    const before = g.power(pink)!;
    play(g, RUSSIAN);
    expect(g.power(pink)).toBe(before);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
