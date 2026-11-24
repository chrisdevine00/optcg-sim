/** OP15-017 Morgan. */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { activate, canPick, offeredAb } from './helpers-w3s.ts';

const ID = 'OP15-017';

describe('OP15-017 Morgan', () => {
  const start = (rested: number, chars: string[] = [PURPLE], active = 0) =>
    game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: chars, costArea: { active, rested } },
    );
  const go = (g: ReturnType<typeof start>) =>
    activate(g, g.find('p1', 'characters', ID), 'give-don');

  it('[Blocker]: it can block an attack on the Leader', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.leader('p1'),
    });
    expectDecision(g, 'block', 'p1');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
  });

  it('cost: give 1 rested DON!! of the opponent’s to one of their Characters; effect: up to 1 more to the Leader or a Character', () => {
    const g = start(3, [PURPLE, V.c1]);
    go(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(false); // the cost: Characters only
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(canPick(g, g.leader('p2'))).toBe(true); // the effect: the Leader too
    pick(g, [g.leader('p2')]);
    expect(g.card(g.find('p2', 'characters', V.c1)).don).toBe(1);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ rested: 1, given: 2 });
  });

  it('the effect is "up to 1": the cost is paid and nothing more is given', () => {
    const g = start(3);
    go(g);
    none(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
  });

  it('is not offered with no rested DON!! of the opponent’s (active ones do not count) or no opposing Character', () => {
    const active = start(0, [PURPLE], 3);
    expect(offeredAb(active, active.find('p1', 'characters', ID), 'give-don')).toBe(false);
    const noChar = start(2, []);
    expect(offeredAb(noChar, noChar.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });

  it('Once Per Turn', () => {
    const g = start(4);
    go(g);
    none(g);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });
});
