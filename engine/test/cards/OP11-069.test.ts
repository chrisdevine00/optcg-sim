/** OP11-069 Charlotte Brulee. */
import { describe, expect, it } from 'vitest';
import { accept, addMost, decline, don, expectDecision, hand, play, V } from './helpers.ts';
import { BM_LEADER, mk, RED_LEADER } from './helpers-op11g2.ts';

const ID = 'OP11-069';
const start = (leader: string, life: string[] = [V.c1, V.c2, V.c3]) =>
  mk({ leader, hand: [ID], life, costArea: { active: 5, rested: 0 } });

describe('OP11-069 Charlotte Brulee', () => {
  it('[On Play]: adds the top Life card to your hand; with a {Big Mom Pirates} Leader adds 1 DON!! as active', () => {
    const g = start(BM_LEADER);
    play(g, ID);
    accept(g);
    expect(hand(g, 'p1')).toEqual([V.c1]); // the top Life card
    expect(g.life('p1')).toBe(2);
    addMost(g);
    // 5 in the cost area, 3 spent on Brulee (2 active left) + 1 added active.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3, deck: 4 });
  });

  it('with a Leader that is not {Big Mom Pirates}: the Life card is still added to hand but no DON!!', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    accept(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.life('p1')).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ deck: 5 });
    expectDecision(g, 'main', 'p1');
  });

  it('declining the optional cost: Life, hand and DON!! are unchanged', () => {
    const g = start(BM_LEADER);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(don(g, 'p1')).toMatchObject({ deck: 5 });
  });

  it('with no Life cards the cost cannot be paid (nothing is added)', () => {
    const g = start(BM_LEADER, []);
    play(g, ID);
    if (g.legal().some((a) => a.type === 'optional')) {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(don(g, 'p1')).toMatchObject({ deck: 5 });
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the Life card goes to the hand without a [Trigger] (it is not damage)', () => {
    const g = start(BM_LEADER, ['OP11-037', V.c2]);
    play(g, ID);
    accept(g);
    expect(hand(g, 'p1')).toEqual(['OP11-037']);
    addMost(g);
    expectDecision(g, 'main', 'p1');
  });
});
