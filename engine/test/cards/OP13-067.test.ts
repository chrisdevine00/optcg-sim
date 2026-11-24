/** OP13-067 Scopper Gaban. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { mine, ROGER_LEADER } from './helpers-op13g3.ts';

const ID = 'OP13-067';

describe('OP13-067 Scopper Gaban', () => {
  const start = (leader: string, extraHand: string[] = [V.c1]) =>
    mine({ leader, hand: [ID, ...extraHand] });

  it('[On Play] with a {Roger Pirates} Leader: draw 2, trash 1 from your hand, then add up to 1 DON!! rested', () => {
    const g = start(ROGER_LEADER);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(2);
    const rested = don(g, 'p1').rested;
    addMost(g);
    expect(don(g, 'p1').rested).toBe(rested + 1);
  });

  it('with another Leader type nothing happens: no draw, no trash, no DON!!', () => {
    const g = start('ST01-001');
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('the trash is mandatory (exactly 1) and a just-drawn card is a legal choice', () => {
    const g = start(ROGER_LEADER, []);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pick(g, [g.zone('p1', 'hand')[0]!.instance]);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(trash(g, 'p1')).toHaveLength(1);
  });

  it('"Then" continues: the DON!! add is offered after the trash and may be declined', () => {
    const g = start(ROGER_LEADER);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const rested = don(g, 'p1').rested;
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1').rested).toBe(rested);
  });
});
