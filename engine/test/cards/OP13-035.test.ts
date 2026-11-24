/** OP13-035 Bepo. */
import { describe, expect, it } from 'vitest';
import { don, option } from './helpers.ts';
import { dec, expectDecision, mk, settle } from './helpers-op13g2.ts';

const ID = 'OP13-035';

const start = () =>
  mk({ characters: [{ card: ID, rested: true }], costArea: { active: 2, rested: 3 } });
const endTurn = (g: ReturnType<typeof start>) => {
  g.act({ type: 'endTurn' });
};

describe('OP13-035 Bepo', () => {
  it('[End of Your Turn]: offers this Character or a DON!! card', () => {
    const g = start();
    endTurn(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options).toHaveLength(2);
  });

  it('first mode sets this Character as active', () => {
    const g = start();
    endTurn(g);
    option(g, dec(g)!.options![0]!.id);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('second mode sets up to 1 DON!! card as active and leaves Bepo rested', () => {
    const g = start();
    endTurn(g);
    option(g, dec(g)!.options![1]!.id);
    settle(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it("must not ask again at the end of the opponent's turn", () => {
    const g = start();
    endTurn(g);
    option(g, dec(g)!.options![1]!.id);
    settle(g);
    g.act({ type: 'endTurn' }); // p2's turn: nothing of Bepo's fires
    expect(dec(g)?.kind).toBe('main');
    expect(dec(g)?.player).toBe('p1');
  });
});
