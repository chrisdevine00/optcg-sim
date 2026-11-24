/** OP14-023 Kikunojo. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-023';

describe('OP14-023 Kikunojo', () => {
  it('[End of Your Turn]: a rested Kikunojo is set as active', () => {
    const g = mk({ characters: [restedCard(ID)] });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    g.act({ type: 'endTurn' });
    // It is now the opponent's turn: p1's Refresh has not happened, so the untap is this effect.
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('stays rested during your own turn (the effect is at the end of the turn)', () => {
    const g = mk({ characters: [restedCard(ID)] });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('only this Character: other rested Characters stay rested until your next Refresh', () => {
    const g = mk({ characters: [restedCard(ID), restedCard(V.c1)] });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('an active Kikunojo simply stays active', () => {
    const g = mk({ characters: [ID] });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('not at the end of the opponent turn: rested on their turn it is set active only by your next Refresh', () => {
    const g = mk({ characters: [restedCard(ID)] }, {}, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'endTurn' });
    // Back on p1's turn 5 the Refresh untapped it; the point is that nothing else is asked.
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(g.decider).toBe('p1');
  });
});
