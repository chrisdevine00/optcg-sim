/** ST35-003 Karasu. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, pick, PURPLE, V } from './helpers.ts';
import { attackLeader, finishBattle, idsOf, WB_LEADER } from './helpers-stg2.ts';

const ID = 'ST35-003';
const start = (oppHand: number, deck: string[] = [V.c1, V.c2, V.c3]) =>
  attackLeader({ leader: WB_LEADER, characters: [ID], deck }, ID, {
    hand: Array.from({ length: oppHand }, () => PURPLE),
  });

describe('ST35-003 Karasu', () => {
  it('trash 2 from the top of your deck: with 7 cards in the opponent hand, they trash 1 (their choice)', () => {
    const g = start(7);
    accept(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c2, V.c1]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c3]);
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.zone('p2', 'hand')[0]!.instance]);
    expect(g.zone('p2', 'hand')).toHaveLength(6);
    expect(idsOf(g, 'p2', 'trash')).toEqual([PURPLE]);
    expectDecision(g, 'block', 'p2');
  });

  it('with 6 cards in the opponent hand the deck cards are still trashed but they trash nothing', () => {
    const g = start(6);
    accept(g);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(2);
    expect(g.zone('p2', 'hand')).toHaveLength(6);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
    expectDecision(g, 'block', 'p2');
  });

  it('declining the cost trashes nothing from either deck or hand', () => {
    const g = start(8);
    decline(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(3);
    expect(g.zone('p2', 'hand')).toHaveLength(8);
  });

  it('the attack goes on as normal afterwards', () => {
    const g = start(3);
    decline(g);
    finishBattle(g);
    expect(g.life('p2')).toBe(3); // 4000 power does not beat the 5000 Leader
    expectDecision(g, 'main', 'p1');
  });

  it('with only 1 card in the deck the cost cannot be paid (2 cards are required)', () => {
    const g = start(7, [BLUE]);
    expectDecision(g, 'block', 'p2'); // the ability is not offered at all
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(g.zone('p2', 'hand')).toHaveLength(7);
  });
});
