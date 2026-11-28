/** OP18-033 Banban. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, pick, trash } from './helpers.ts';
import { candidates, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-033';
const endTurn = (chars: unknown[]) => {
  const g = game({ leader: PLAIN_PURPLE, characters: chars as string[] }, { leader: PLAIN_BLUE });
  g.act({ type: 'endTurn' });
  return g;
};

describe('OP18-033 Banban', () => {
  it('has [Blocker]', () => {
    const g = endTurn([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[End of Your Turn] trash it: set up to 1 of your Characters as active', () => {
    const g = endTurn([ID, { card: V.c3, rested: true }]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', V.c3)).rested).toBe(false);
  });

  it('declining keeps it and sets nothing', () => {
    const g = endTurn([ID, { card: V.c3, rested: true }]);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
    expect(g.card(g.find('p1', 'characters', V.c3)).rested).toBe(true);
  });

  it('Banban is trashed first, so a rested Banban is not offered as the Character to set', () => {
    const g = endTurn([
      { card: ID, rested: true },
      { card: V.c3, rested: true },
    ]);
    accept(g);
    expect(candidates(g)).toEqual([g.find('p1', 'characters', V.c3)]);
  });

  it('"up to 1": may set nothing, but the cost is paid', () => {
    const g = endTurn([ID, { card: V.c3, rested: true }]);
    accept(g);
    g.act({ type: 'done' });
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', V.c3)).rested).toBe(true);
  });
});
