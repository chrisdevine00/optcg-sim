/** OP11-090 Briscola. A vanilla [Blocker]. */
import { describe, expect, it } from 'vitest';
import { expectDecision, passBlock, V } from './helpers.ts';
import { mk } from './helpers-op11g3.ts';

const ID = 'OP11-090';

describe('OP11-090 Briscola', () => {
  it('[Blocker]: can block, becomes rested and takes the attack', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    const me = g.find('p1', 'characters', ID);
    g.act({ type: 'block', blocker: me });
    expect(g.card(me).rested).toBe(true);
    expect(g.life('p1')).toBe(3);
  });

  it('a rested Briscola cannot block', () => {
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
