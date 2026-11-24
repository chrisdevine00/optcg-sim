/** EB03-041 Kujyaku. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { canPick, mk, NAVY, SWORD6, SWORD8 } from './helpers-eb03g2.ts';

const ID = 'EB03-041';
/** Koby, {Navy}{SWORD}, cost 7. */
const SWORD7 = 'P-092';
const opp = { turn: 4, activePlayer: 'p2' } as const;

describe('EB03-041 Kujyaku', () => {
  it("[Opponent's Turn]: your {SWORD} Characters with a cost of 6 or less gain +2000 (herself included)", () => {
    const g = mk({ characters: [ID, SWORD6, V.c3] }, {}, opp);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', SWORD6))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000); // not {SWORD}
  });

  it('boundary: cost 6 gets it, cost 7 and 8 do not', () => {
    const g = mk({ characters: [ID, SWORD6, SWORD7, SWORD8] }, {}, opp);
    expect(g.power(g.find('p1', 'characters', SWORD6))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', SWORD7))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', SWORD8))).toBe(9000);
  });

  it('not on your own turn', () => {
    const g = mk({ characters: [ID, SWORD6] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', SWORD6))).toBe(7000);
  });

  it("only {SWORD} Characters of yours: the opponent's are not boosted", () => {
    const g = mk({ characters: [ID] }, { characters: [SWORD6] }, opp);
    expect(g.power(g.find('p2', 'characters', SWORD6))).toBe(7000);
  });

  it('[On Play] trash 1 {Navy} card from your hand: draw 2', () => {
    const g = mk({ hand: [ID, NAVY, V.c1], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', NAVY))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'hand', NAVY)]);
    expect(trash(g, 'p1')).toEqual([NAVY]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
  });

  it('the trash is optional: declining draws nothing', () => {
    const g = mk({ hand: [ID, NAVY], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([NAVY]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('with no {Navy} card in hand the cost cannot be paid: only declining is legal', () => {
    const g = mk({ hand: [ID, V.c1, BLUE], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1, BLUE]);
  });
});
