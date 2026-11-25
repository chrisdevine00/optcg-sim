/** OP10-080 Little Black Bears. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, endCounter, hand, pick, V } from './helpers.ts';
import { counterGame, finish, times, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-080';
const H = (n: number) => times(n, V.c1);

/**
 * p1 holds this Event plus `others` other cards and `active`/`rested` DON!!; the Event costs 3.
 * After the Event is played the hand is `others` cards.
 */
const counter = (others: number, active: number, rested = 0) => {
  const g = counterGame(
    ID,
    { hand: [ID, ...H(others)], costArea: { active, rested }, deck: [V.c4, V.c5, V.c3] },
    {},
    true,
    V.c6, // an 8000 attacker: the +4000 Leader (9000) holds
  );
  pick(g, [g.leader('p1')]);
  return g;
};

describe('OP10-080 Little Black Bears', () => {
  it('[Counter]: +4000 to your Leader this battle, then with 7+ DON!! on the field and 5 or less in hand draw 1', () => {
    const g = counter(5, 7);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g, 'p1')).toHaveLength(6); // 5 + the drawn card
    expect(hand(g, 'p1')).toContain(V.c4);
    endCounter(g);
    finish(g);
    expect(g.life('p1')).toBe(3); // 9000 vs 9000 holds
  });

  it('counts DON!! of every state on the field: 4 active + 3 rested is 7 (boundary)', () => {
    const g = counter(2, 4, 3);
    expect(hand(g, 'p1')).toHaveLength(3);
    const h = counter(2, 3, 3); // 6: no draw
    expect(hand(h, 'p1')).toHaveLength(2);
  });

  it('must not draw with 6 or more cards left in hand (boundary 5), or with only 6 DON!!', () => {
    const g = counter(6, 7);
    expect(hand(g, 'p1')).toHaveLength(6);
    expect(hand(g, 'p1')).not.toContain(V.c4);
    const h = counter(5, 6);
    expect(hand(h, 'p1')).toHaveLength(5);
  });

  it('the hand is counted after this Event has left it', () => {
    // Event + 5 others = 6 in hand before; 5 once the Event is being played: the draw happens.
    const g = counter(5, 7);
    expect(hand(g, 'p1')).toContain(V.c4);
    void dec;
  });

  it('[Trigger]: add up to 1 DON!! card from your DON!! deck and set it as active', () => {
    const g = trigGame(ID, { costArea: { active: 2, rested: 1 } });
    g.act({ type: 'trigger', activate: true });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
  });
});
