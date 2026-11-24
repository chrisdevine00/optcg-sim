/** OP12-062 Vinsmoke Sora. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, hand, option, play } from './helpers.ts';
import { mine, OTHER_LEADER, SANJI_LEADER } from './helpers-op12g2.ts';

const ID = 'OP12-062';

describe('OP12-062 Vinsmoke Sora', () => {
  // p1 plays Sora (cost 1) from 5 active DON!!: it still has 5 DON!! on the field afterwards.
  const start = (leader: string, oppActive: number) =>
    mine({ leader, hand: [ID] }, { costArea: { active: oppActive, rested: 0 } });

  it("Leader [Sanji] and DON!! equal to the opponent's: add 1 DON!! rested, then draw 1", () => {
    const g = start(SANJI_LEADER, 5);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    addMost(g);
    // 1 rested by the cost, 1 added rested.
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('fewer DON!! than the opponent also qualifies', () => {
    const g = start(SANJI_LEADER, 8);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('boundary: 1 more DON!! than the opponent: nothing is added and, "Then" being inside the "If", nothing is drawn', () => {
    const g = start(SANJI_LEADER, 4);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('"up to 1": declining the DON!! still draws (Then, not If you do)', () => {
    const g = start(SANJI_LEADER, 5);
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options!.at(-1)!.id);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('must not do anything when the Leader is not [Sanji]', () => {
    const g = start(OTHER_LEADER, 5);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
