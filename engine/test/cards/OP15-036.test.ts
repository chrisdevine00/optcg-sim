/** OP15-036 Ryuma. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { mk } from './helpers-op15g1.ts';

const ID = 'OP15-036';

describe('OP15-036 Ryuma', () => {
  const rested = (c: string) => ({ card: c, rested: true });
  const p2chars = [rested(V.c4), rested(V.c5), V.c3];

  it("[On Play]: K.O.s up to 1 of your opponent's rested Characters with a cost of 4 or less", () => {
    const g = mk({ hand: [ID] }, { characters: p2chars });
    play(g, ID);
    // cost 5 rested and cost 3 ACTIVE are not candidates
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5, V.c3]);
  });

  it('[When Attacking]: the same effect', () => {
    const g = mk({ characters: [ID] }, { characters: p2chars });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5, V.c3]);
  });

  it('boundary: a rested cost-5 Character is not a target, a rested cost-4 one is', () => {
    const g = mk({ hand: [ID] }, { characters: [rested(V.c5)] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('active Characters are never targets, whatever their cost', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1, V.c2] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [rested(V.c4)] });
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
