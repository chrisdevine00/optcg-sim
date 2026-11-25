/** OP10-099 Eustass"Captain"Kid (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, V } from './helpers.ts';
import { canPick, mk, rested, SN } from './helpers-a10g1.ts';

const ID = 'OP10-099';
const start = (chars: (string | { card: string; rested?: boolean })[], life = 3) =>
  mk({ leader: ID, characters: chars, life: Array.from({ length: life }, () => V.c1) });
const topLife = (g: ReturnType<typeof start>) => g.zone('p1', 'life')[0];

describe('OP10-099 Eustass"Captain"Kid', () => {
  it('[End of Your Turn]: turns the top Life card face-up to set a "Supernovas" Character (cost 3 to 8) as active; it gains [Blocker] until the end of your opponent\'s next turn', () => {
    const g = start([rested(SN.c3)]);
    expect(topLife(g)!.faceUp).toBe(false);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(topLife(g)!.faceUp).toBe(true);
    pick(g, [g.find('p1', 'characters', SN.c3)]);
    const sn = g.find('p1', 'characters', SN.c3);
    expect(g.card(sn).rested).toBe(false);
    // The opponent's turn: [Blocker] is there.
    expectDecision(g, 'main', 'p2');
    expect(g.card(sn).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(g.card(sn).keywords).not.toContain('Blocker');
  });

  it('boundaries: cost 3 and 8 can be chosen, cost 2 and 10 cannot; other types cannot', () => {
    const g = start([rested(SN.c2), rested(SN.c3), rested(SN.c8), rested(SN.c10), rested(V.c4)]);
    g.act({ type: 'endTurn' });
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', SN.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', SN.c8))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', SN.c2))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', SN.c10))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false);
  });

  it('B3B-R7: cost 9 is over the upper bound of 8 (cost 8 is the last one that can be chosen)', () => {
    const g = start([rested(SN.c8), rested('OP14-009')]);
    g.act({ type: 'endTurn' });
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', SN.c8))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', 'OP14-009'))).toBe(false); // cost 9
  });

  it('declining the cost: nothing is turned, set or granted', () => {
    const g = start([rested(SN.c3)]);
    g.act({ type: 'endTurn' });
    decline(g);
    expect(topLife(g)!.faceUp).toBe(false);
    expect(g.card(g.find('p1', 'characters', SN.c3)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', SN.c3)).keywords).not.toContain('Blocker');
  });

  it('"up to 1": the Life card stays face-up when no Character is chosen; no Blocker is given', () => {
    const g = start([rested(SN.c3)]);
    g.act({ type: 'endTurn' });
    accept(g);
    none(g);
    expect(topLife(g)!.faceUp).toBe(true);
    expect(g.card(g.find('p1', 'characters', SN.c3)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', SN.c3)).keywords).not.toContain('Blocker');
  });

  it('with no Life cards the cost cannot be paid and nothing is offered', () => {
    const g = start([rested(SN.c3)], 0);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p1', 'characters', SN.c3)).rested).toBe(true);
  });

  it('an active chosen Character still gains [Blocker] ("That Character")', () => {
    const g = start([SN.c3]);
    g.act({ type: 'endTurn' });
    accept(g);
    pick(g, [g.find('p1', 'characters', SN.c3)]);
    expect(g.card(g.find('p1', 'characters', SN.c3)).keywords).toContain('Blocker');
  });
});
