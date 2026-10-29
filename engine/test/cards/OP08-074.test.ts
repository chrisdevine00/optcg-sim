/** OP08-074 Black Maria. QA-OP08 OP08-074 (two rows). */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, KAIDO, PLAIN_BLUE, pick, V } from './helpers.ts';

describe('OP08-074 Black Maria', () => {
  it("adds 5 rested DON!!; at the end of the turn returns DON!! down to the opponent's count", () => {
    const g = game(
      { leader: KAIDO, characters: ['OP08-074'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 4, rested: 0 } },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP08-074'), ability: 'ramp' });
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 5, deck: 2 });
    g.act({ type: 'endTurn' });
    // 8 on the field vs 4: return 4, chosen by location (active and rested both hold DON!!).
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.min).toBe(4);
    for (let i = 0; i < 4; i++) g.act({ type: 'pick', choice: { from: 'costRested' } });
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
    expectDecision(g, 'main', 'p2');
  });

  it('QA: the return still happens after Black Maria has left the field', () => {
    const g = game(
      {
        leader: KAIDO,
        characters: ['OP08-074', V.c1, V.c1, V.c1, V.c1],
        hand: [V.c2],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    const bm = g.find('p1', 'characters', 'OP08-074');
    g.act({ type: 'activate', card: bm, ability: 'ramp' });
    expect(don(g, 'p1').rested).toBe(5);
    // Play a sixth Character and trash Black Maria to make room (CR 3-7-6-1).
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c2) });
    pick(g, [bm]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP08-074']);
    g.act({ type: 'endTurn' });
    // 7 DON!! on p1's field, 0 on p2's: all 7 return (one location class each time, so no choice).
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it('with another [Black Maria] nothing happens', () => {
    const g = game({ leader: KAIDO, characters: ['OP08-074', 'OP08-074'] }, { leader: PLAIN_BLUE });
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP08-074'), ability: 'ramp' });
    expect(don(g, 'p1').deck).toBe(10);
  });
});
