/** OP16-060 Sengoku (Leader). */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, hand, payDon, pick, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { ADMIRAL_A, ADMIRAL_B, ADMIRAL_C, NAVY_LEADER, settle } from './helpers-op16g3.ts';

const start = (hand: string[], active = 8, rested = 0) =>
  game({ leader: NAVY_LEADER, hand, costArea: { active, rested } }, { leader: PLAIN_BLUE });
const go = (g: ReturnType<typeof start>) => {
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'admirals' });
  payDon(g);
};

describe('OP16-060 Sengoku', () => {
  it('[Activate: Main] return 8 active DON!!: plays up to 3 {Admiral} Characters with different names', () => {
    const g = start([ADMIRAL_A, ADMIRAL_B, ADMIRAL_C, PURPLE]);
    go(g);
    pick(g, [
      g.find('p1', 'hand', ADMIRAL_A),
      g.find('p1', 'hand', ADMIRAL_B),
      g.find('p1', 'hand', ADMIRAL_C),
    ]);
    settle(g);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ADMIRAL_A, ADMIRAL_B, ADMIRAL_C].sort());
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    // 8 DON!! went back to the DON!! deck (10 again), then Kuzan (2) and Borsalino (2) added their own.
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(4);
  });

  it('cards with the same name are not offered together (different card names)', () => {
    const g = start([ADMIRAL_A, ADMIRAL_A, ADMIRAL_B]);
    go(g);
    const first = g.find('p1', 'hand', ADMIRAL_A, 0);
    g.act({ type: 'pick', choice: first });
    const second = g.find('p1', 'hand', ADMIRAL_A, 1);
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered.some((a) => a.type === 'pick' && a.choice === second)).toBe(false);
    expect(
      offered.some((a) => a.type === 'pick' && a.choice === g.find('p1', 'hand', ADMIRAL_B)),
    ).toBe(true);
  });

  it('only {Admiral} Characters are offered', () => {
    const g = start([ADMIRAL_A, PURPLE]);
    go(g);
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(1);
  });

  it('needs 8 ACTIVE DON!!: 7 active and 1 rested cannot pay', () => {
    const g = start([ADMIRAL_A], 7, 1);
    expect(
      g.isLegal({ type: 'activate', card: g.leader('p1'), ability: 'admirals', player: 'p1' }),
    ).toBe(false);
  });

  it('the cost is paid even when no {Admiral} is chosen ("up to 3")', () => {
    const g = start([PURPLE]);
    go(g);
    settle(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });
});
