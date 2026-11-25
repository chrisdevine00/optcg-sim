/** OP10-046 Kyros. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { mk } from './helpers-a10g2.ts';

const ID = 'OP10-046';

describe('OP10-046 Kyros', () => {
  const start = () =>
    mk({ hand: [ID], characters: [V.c5, V.c6] }, { characters: [V.c5, V.c6, V.c3] });

  it("[On Play] returns up to 1 Character with a cost of 5 or less to the owner's hand (the opponent's)", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(hand(g, 'p2')).toEqual([V.c5]);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it("may return your own Character: it goes to your hand (the owner's)", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expect(hand(g, 'p1')).toEqual([V.c5]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('boundary: cost 5 is a candidate, cost 6 is not (either player)', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
  });

  it('"up to 1": may return nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('must not offer Kyros himself (cost 7) or a Leader', () => {
    const g = start();
    const kyros = play(g, ID);
    expect(canPick(g, kyros)).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
  });
});
