/** OP12-009 Jinbe. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, pick, play, V } from './helpers.ts';
import { at, EVENTS, mk } from './helpers-op12g1.ts';

const ID = 'OP12-009';

describe('OP12-009 Jinbe', () => {
  const start = (hand: string[] = [ID, ...EVENTS, V.c1]) => mk({ hand });
  const go = (g: ReturnType<typeof start>) => {
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
  };

  it("[On Play]: reveal 2 Events: gains [Rush] this turn, then +1000 power until the end of the opponent's next End Phase", () => {
    const g = start();
    go(g);
    const jinbe = at(g, 'p1', 'characters', ID);
    expect(g.card(jinbe).keywords).toContain('Rush');
    expect(g.power(jinbe)).toBe(5000);
  });

  it("[Rush] ends with this turn; the +1000 lasts through the opponent's turn and ends with it", () => {
    const g = start();
    go(g);
    const jinbe = at(g, 'p1', 'characters', ID);
    g.act({ type: 'endTurn' });
    // The opponent's turn: no Rush any more, still +1000.
    expect(g.card(jinbe).keywords).not.toContain('Rush');
    expect(g.power(jinbe)).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(jinbe)).toBe(4000);
  });

  it('declining the cost gives neither [Rush] nor power', () => {
    const g = start();
    play(g, ID);
    decline(g);
    const jinbe = at(g, 'p1', 'characters', ID);
    expect(g.card(jinbe).keywords).not.toContain('Rush');
    expect(g.power(jinbe)).toBe(4000);
  });

  it('with fewer than 2 Events the cost cannot be paid (accept is not legal)', () => {
    const g = start([ID, EVENTS[0], V.c1]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('the revealed Events stay in the hand', () => {
    const g = start();
    go(g);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });
});
