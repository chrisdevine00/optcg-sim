/** ST21-007 Sentomaru. */
import { describe, expect, it } from 'vitest';
import { expectDecision, V } from './helpers.ts';
import { mk, oppTurn } from './helpers-st1821.ts';

const ID = 'ST21-007';

describe('ST21-007 Sentomaru', () => {
  it('has [Blocker] and nothing else', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toEqual(['Blocker']);
  });

  it('can block an attack on the Leader (active), and the block rests it', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4] }, oppTurn);
    const att = g.find('p2', 'characters', V.c4);
    g.act({ type: 'attack', attacker: att, target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    const sento = g.find('p1', 'characters', ID);
    expect(g.isLegal({ type: 'block', blocker: sento, player: 'p1' })).toBe(true);
    g.act({ type: 'block', blocker: sento });
    expect(g.card(sento).rested).toBe(true);
  });

  it('a rested Sentomaru cannot block', () => {
    const g = mk({ characters: [{ card: ID, rested: true }] }, { characters: [V.c4] }, oppTurn);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(false);
  });

  it('has no [Activate], [On Play] or other ability to offer', () => {
    const g = mk({ characters: [ID] });
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('is a 2000-power, cost-2 Character', () => {
    const g = mk({ characters: [ID] });
    const c = g.card(g.find('p1', 'characters', ID));
    expect([c.power, c.cost]).toEqual([2000, 2]);
  });
});
