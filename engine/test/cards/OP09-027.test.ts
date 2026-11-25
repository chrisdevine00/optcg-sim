/** OP09-027 Sabo. */
import { describe, expect, it } from 'vitest';
import { dec, hand, pick, V } from './helpers.ts';
import { attackLeader, finishBattle, mk, plant, rested } from './helpers-a09g1.ts';

const ID = 'OP09-027';
const deck = [V.c2, V.c3, V.c4];
/** Sabo attacks p2's Leader; he is rested by attacking, so he counts himself. */
const attack = (others: unknown[]) => {
  const g = mk({ characters: [ID, ...others] as string[], deck });
  attackLeader(g, g.find('p1', 'characters', ID));
  return g;
};

describe('OP09-027 Sabo', () => {
  it('[When Attacking] [Once Per Turn]: with 3 or more rested Characters, draws 1 card', () => {
    const g = attack([rested(V.c1), rested(V.c2)]); // 2 rested + the attacking Sabo
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('boundary: 2 rested Characters in total (Sabo included) draws nothing', () => {
    const g = attack([rested(V.c1), V.c2]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(dec(g)?.kind).toBe('block');
  });

  it("only your own rested Characters count (not the opponent's)", () => {
    const g = mk(
      { characters: [ID, rested(V.c1)], deck },
      { characters: [rested(V.c1), rested(V.c2)] },
    );
    attackLeader(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('draws only once per turn: attacking a second time (set active again) draws nothing', () => {
    const g = attack([rested(V.c1), rested(V.c2)]);
    expect(hand(g, 'p1')).toHaveLength(1);
    finishBattle(g);
    plant(g, 'p1', { setActive: { from: 'characters', owner: 'you', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    attackLeader(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('a failed condition spends Once Per Turn too (no colon: an effect condition)', () => {
    const g = attack([rested(V.c1), V.c2]); // only 2 rested: nothing drawn, the ability is used
    expect(hand(g, 'p1')).toEqual([]);
    finishBattle(g);
    plant(g, 'p1', { setActive: { from: 'characters', owner: 'you', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    plant(g, 'p1', { rest: { from: 'characters', owner: 'you', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', V.c2)]);
    // now V.c1 and V.c2 are rested: with Sabo attacking again the count is 3, but the use is spent
    expect(g.zone('p1', 'characters').filter((c) => c.rested)).toHaveLength(2);
    attackLeader(g, g.find('p1', 'characters', ID));
    expect(g.zone('p1', 'characters').filter((c) => c.rested)).toHaveLength(3);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
