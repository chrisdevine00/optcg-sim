/** OP11-075 Jaguar.D.Saul. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, play, PLAIN_BLUE } from './helpers.ts';
import { damageGame, ROBIN_LEADER } from './helpers-op11g3.ts';

const ID = 'OP11-075';

describe('OP11-075 Jaguar.D.Saul', () => {
  const start = (leader: string, active: number, rested = 0) =>
    game({ leader, hand: [ID], costArea: { active, rested } }, { leader: PLAIN_BLUE });

  it('[On Play]: with [Nico Robin] and 7 or more DON!! on your field, draw 2 (exactly 7 after paying the cost 6)', () => {
    const g = start(ROBIN_LEADER, 7);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('6 DON!! is not enough (the boundary)', () => {
    const g = start(ROBIN_LEADER, 6);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('rested DON!! count: the cost rests 6 of 7 and all 7 are still on the field', () => {
    const g = start(ROBIN_LEADER, 6, 1);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('does nothing with a Leader that is not [Nico Robin]', () => {
    const g = start(PLAIN_BLUE, 10);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('[Trigger]: activates the [On Play] effect (conditions apply) without playing the card', () => {
    const g = damageGame(ID, { leader: ROBIN_LEADER, costArea: { active: 7, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('[Trigger] with fewer than 7 DON!! draws nothing', () => {
    const g = damageGame(ID, { leader: ROBIN_LEADER, costArea: { active: 6, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
