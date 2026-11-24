/** ST29-011 Brook. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, V } from './helpers.ts';
import { mk } from './helpers-st29old.ts';

const ID = 'ST29-011';

describe('ST29-011 Brook', () => {
  it('prints [Blocker]: it can block an attack on the Leader and becomes the target', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('a rested Brook cannot block', () => {
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

  it('has no other ability: no Activate is offered on the field', () => {
    const g = mk({ characters: [ID] });
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });

  it('is a 2000-power, cost 2 Character with Counter 1000', () => {
    const g = mk({ hand: [ID] });
    const c = g.card(g.find('p1', 'hand', ID));
    expect(c.power).toBe(2000);
    expect(c.cost).toBe(2);
    expect(c.counter).toBe(1000);
  });
});
