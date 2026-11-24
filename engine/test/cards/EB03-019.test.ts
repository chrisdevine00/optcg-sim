/** EB03-019 Wanda. A vanilla [Blocker]. */
import { describe, expect, it } from 'vitest';
import { expectDecision, passBlock, V } from './helpers.ts';
import { mk } from './helpers-eb03g1.ts';

const ID = 'EB03-019';

describe('EB03-019 Wanda', () => {
  it('[Blocker]: can be chosen to block, becomes rested and takes the attack', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    const wanda = g.find('p1', 'characters', ID);
    g.act({ type: 'block', blocker: wanda });
    expect(g.card(wanda).rested).toBe(true);
    expect(g.life('p1')).toBe(3);
  });

  it('a rested Wanda cannot block', () => {
    const g = mk(
      { characters: [{ card: ID, rested: true }] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(false);
    passBlock(g);
  });

  it('has no other effect: playing it asks nothing', () => {
    const g = mk({ hand: [ID] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expectDecision(g, 'main', 'p1');
  });
});
