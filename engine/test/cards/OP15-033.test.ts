/** OP15-033 Hody Jones. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, play, V } from './helpers.ts';
import { FISH_LEADER, mk, RED_LEADER } from './helpers-op15g1.ts';

const ID = 'OP15-033';

describe('OP15-033 Hody Jones', () => {
  const start = (leader: string, rested = true, life: string[] = [BLUE, V.c2, V.c3]) =>
    mk({ leader: { card: leader, rested }, hand: [ID], life });

  it('[On Play]: sets your {Fish-Man} Leader as active, then adds the top Life card to your hand', () => {
    const g = start(FISH_LEADER);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expectDecision(g, 'main', 'p1');
  });

  it('"Then" is not "If you do": a non-{Fish-Man} Leader stays rested but the Life card is still added', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('an already active Leader stays active and the Life card is still added', () => {
    const g = start(FISH_LEADER, false);
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.life('p1')).toBe(2);
  });

  it('adds exactly the TOP Life card (the order matters), and only 1', () => {
    const g = start(FISH_LEADER, true, [V.c3, BLUE, BLUE]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(g.life('p1')).toBe(2);
  });

  it('with no Life cards left nothing is added (no error, no loss)', () => {
    const g = start(FISH_LEADER, true, []);
    play(g, ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });
});
