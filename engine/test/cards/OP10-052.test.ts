/** OP10-052 Bartolomeo. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { mk } from './helpers-a10g2.ts';

const ID = 'OP10-052';

describe('OP10-052 Bartolomeo', () => {
  const start = () => mk({ hand: [ID], characters: [V.c1, V.c2] }, { characters: [V.c1, V.c2] });

  it("[On Play] places up to 1 Character with a cost of 1 or less at the bottom of the owner's deck", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(V.c1);
    expect(hand(g, 'p2')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('may place your own Character: it goes to the bottom of your deck', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(V.c1);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2, ID]);
  });

  it('boundary: cost 1 is a candidate, cost 2 is not; a Leader is not', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('"up to 1": may place nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.zone('p2', 'deck')).toHaveLength(10);
  });

  it('has [Blocker]: it can block an attack on the Leader', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c7] }, { turn: 4, activePlayer: 'p2' });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
