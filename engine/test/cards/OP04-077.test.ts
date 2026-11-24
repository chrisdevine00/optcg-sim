/** OP04-077 Ideo. */
import { describe, expect, it } from 'vitest';
import { dec, V } from './helpers.ts';
import { mk } from './helpers-st29old.ts';

const ID = 'OP04-077';

describe('OP04-077 Ideo', () => {
  it('prints [Blocker]: he can block an attack on the Leader and becomes the target', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('a rested Ideo cannot block', () => {
    const g = mk(
      { characters: [{ card: ID, rested: true }] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(false);
  });

  it('has no other ability: no Activate is offered', () => {
    const g = mk({ characters: [ID] });
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });

  it('is a cost 2, 2000 power Character with Counter 1000', () => {
    const g = mk({ hand: [ID] });
    const c = g.card(g.find('p1', 'hand', ID));
    expect([c.cost, c.power, c.counter]).toEqual([2, 2000, 1000]);
  });
});
