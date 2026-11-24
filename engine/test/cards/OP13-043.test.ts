/** OP13-043 Otama. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, pick, play, times, trash } from './helpers.ts';
import { expectDecision, mk, V } from './helpers-op13g2.ts';

const ID = 'OP13-043';

const start = (life: number) => mk({ hand: [ID, V.c1], life: times(life, BLUE) });

describe('OP13-043 Otama', () => {
  it('[On Play]: with 3 Life cards (boundary), draws 2 and trashes 1 from hand', () => {
    const g = start(3);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('must not fire with 4 Life cards', () => {
    const g = start(4);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toHaveLength(0);
  });

  it('fires with fewer Life cards (1, and 0)', () => {
    for (const n of [1, 0]) {
      const g = start(n);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(hand(g, 'p1')).toHaveLength(2);
    }
  });

  it("only your Life counts: the opponent's Life does not matter", () => {
    const g = mk({ hand: [ID, V.c1], life: times(4, BLUE) }, { life: times(1, BLUE) });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});
