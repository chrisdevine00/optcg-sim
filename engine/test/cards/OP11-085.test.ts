/** OP11-085 Kurozumi Orochi. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play } from './helpers.ts';
import { canPick, mk, SMILE3, SMILE5, SMILE6 } from './helpers-op11g3.ts';

const ID = 'OP11-085';

describe('OP11-085 Kurozumi Orochi', () => {
  const start = (trash: string[]) => mk({ hand: [ID], trash });

  it('[On Play]: add up to 1 "SMILE" card with a cost of 5 or less from your trash to your hand', () => {
    const g = start([SMILE3, SMILE5, SMILE6, BLUE]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'trash', SMILE3)]);
    expect(hand(g, 'p1')).toEqual([SMILE3]);
    expect(g.zone('p1', 'trash')).toHaveLength(3);
  });

  it('cost exactly 5 is allowed; cost 6 and a non-SMILE card are not candidates', () => {
    const g = start([SMILE5, SMILE6, BLUE]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'trash', SMILE5))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', SMILE6))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', BLUE))).toBe(false);
    pick(g, [g.find('p1', 'trash', SMILE5)]);
    expect(hand(g, 'p1')).toEqual([SMILE5]);
  });

  it('"up to 1": may take nothing', () => {
    const g = start([SMILE3]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'trash')).toHaveLength(1);
  });

  it('with no eligible card in the trash nothing can be added', () => {
    const g = start([SMILE6, BLUE]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    if (g.legal().some((a) => a.type === 'done')) none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only your own trash is searched', () => {
    const g = mk({ hand: [ID], trash: [] }, { trash: [SMILE3] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });
});
