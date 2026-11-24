/** OP15-031 Purinpurin. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, expectDecision, none, pick, play } from './helpers.ts';
import { choices, mk, rested } from './helpers-w4sa.ts';

const ID = 'OP15-031';

describe('OP15-031 Purinpurin', () => {
  // BLUE and PURPLE cost 1; V.c3 costs 3; V.c2 costs 2.
  const start = (chars: unknown[]) => mk({ hand: [ID] }, { characters: chars as never });
  const left = (g: ReturnType<typeof start>) => g.zone('p2', 'characters').map((c) => c.card);

  it('selects only rested Characters', () => {
    const g = start([rested(BLUE, { don: 1 }), { card: PURPLE, don: 1 }]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.find('p2', 'characters', BLUE)]);
  });

  it('K.O.s the chosen Character when its cost equals the DON!! given to it', () => {
    const g = start([rested(V.c3, { don: 3 })]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(left(g)).toEqual([]);
  });

  it('does nothing one DON!! short or one over (exact boundaries)', () => {
    for (const don of [2, 4]) {
      const g = start([rested(V.c3, { don })]);
      play(g, ID);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(left(g)).toEqual([V.c3]);
    }
  });

  it('a cost-1 Character with 1 DON!! given is K.O.’d, with none it is not', () => {
    const a = start([rested(BLUE, { don: 1 })]);
    play(a, ID);
    pick(a, [a.find('p2', 'characters', BLUE)]);
    expect(left(a)).toEqual([]);
    const b = start([rested(BLUE)]);
    play(b, ID);
    pick(b, [b.find('p2', 'characters', BLUE)]);
    expect(left(b)).toEqual([BLUE]);
  });

  it('"up to 1": selecting nothing K.O.s nothing', () => {
    const g = start([rested(V.c3, { don: 3 })]);
    play(g, ID);
    none(g);
    expect(left(g)).toEqual([V.c3]);
  });
});
