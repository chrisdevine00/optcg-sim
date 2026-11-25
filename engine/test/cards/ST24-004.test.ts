/** ST24-004 Law & Bepo. */
import { describe, expect, it } from 'vitest';
import { canPick, expectDecision, hand, mk, none, pick, play, V } from './helpers-lfc.ts';

const ID = 'ST24-004';
const rested = (card: string) => ({ card, rested: true });

describe('ST24-004 Law & Bepo', () => {
  const start = (p2chars: (string | { card: string; rested: boolean })[]) =>
    mk({ hand: [ID] }, { characters: p2chars });
  const leaderPower = (g: ReturnType<typeof start>, p: 'p1' | 'p2') => g.card(g.leader(p)).power;

  it("rests the chosen opposing Character, which stays rested through the opponent's next Refresh Phase", () => {
    const g = start([V.c5, V.c2]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true); // did not refresh
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false); // the Refresh after
  });

  it("then, with 2 or more rested opposing Characters, the Leader gains +2000 until the end of the opponent's next End Phase", () => {
    const g = start([V.c5, rested(V.c2)]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]); // now 2 rested
    expect(leaderPower(g, 'p1')).toBe(7000);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(leaderPower(g, 'p1')).toBe(7000); // still there on the opponent's turn
    g.act({ type: 'endTurn' });
    expect(leaderPower(g, 'p1')).toBe(5000); // gone after their End Phase
  });

  it('boundary: only 1 rested opposing Character after the rest gives no bonus', () => {
    const g = start([V.c5, V.c2]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('"up to 1": may rest nothing; the condition is still read (2 already rested gives the bonus, 1 does not)', () => {
    const g = start([rested(V.c5), rested(V.c2)]);
    play(g, ID);
    none(g);
    expect(leaderPower(g, 'p1')).toBe(7000);
    const h = start([rested(V.c5), V.c2]);
    play(h, ID);
    none(h);
    expect(leaderPower(h, 'p1')).toBe(5000);
    expect(hand(h, 'p1')).toEqual([]);
  });

  it("an already rested Character may be chosen: it stays rested through the Refresh Phase, and the opponent's Leader is never a target", () => {
    const g = start([rested(V.c5), rested(V.c2)]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });
});
