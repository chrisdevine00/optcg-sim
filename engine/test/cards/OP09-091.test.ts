/** OP09-091 Vasco Shot. */
import { describe, expect, it } from 'vitest';
import { canActivate, mk, V } from './helpers-a09g3.ts';

const ID = 'OP09-091';

describe('OP09-091 Vasco Shot', () => {
  it('has [Blocker] and nothing else', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toEqual(['Blocker']);
  });

  it('can block an attack on the Leader (rests to become the new target)', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, undefined, 0);
    g.act({ type: 'endTurn' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('has no [Activate: Main]', () => {
    const g = mk({ characters: [ID] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
