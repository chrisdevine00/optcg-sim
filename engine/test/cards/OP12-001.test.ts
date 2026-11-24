/** OP12-001 Silvers Rayleigh (Leader). */
import { describe, expect, it } from 'vitest';
import { SCRIPTS, loadAllScripts } from '@optcg/cards';
import { DECK_RULES } from '../../src/defs.ts';
import { deckIssues } from '../../src/index.ts';
import { cards } from '../fixtures/index.ts';
import { expectDecision, pick, V } from './helpers.ts';
import { activateAb, at, canActivate, choices, EVENTS, mk, SHC } from './helpers-op12g1.ts';

const ID = 'OP12-001';

describe('OP12-001 Silvers Rayleigh', () => {
  const start = (p1: Record<string, unknown> = {}) =>
    mk({ leader: ID, hand: [...EVENTS, V.c1], characters: [SHC.sanji1, V.c4, V.c5], ...p1 });
  const reveal = (g: ReturnType<typeof start>) => {
    activateAb(g, g.leader('p1'), 'activate');
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
  };

  it('[Activate: Main]: reveal 2 Events: up to 1 Character with 4000 base power or less gains +2000 power', () => {
    const g = start();
    reveal(g);
    expectDecision(g, 'choose', 'p1');
    // Only [Sanji] (3000) qualifies: the cost 4 and cost 5 vanillas have 6000 and 7000.
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', SHC.sanji1)]);
    pick(g, [at(g, 'p1', 'characters', SHC.sanji1)]);
    expect(g.power(at(g, 'p1', 'characters', SHC.sanji1))).toBe(5000);
    // The revealed Events stay in the hand.
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual(expect.arrayContaining([...EVENTS]));
  });

  it('exactly 4000 base power qualifies; 5000 does not; the Leader is not a target', () => {
    const g = start({ characters: [V.c2, V.c3, SHC.jinbe2] });
    reveal(g);
    // V.c2 and SHC.jinbe2 are 4000; V.c3 is 5000.
    expect(choices(g).sort()).toEqual(
      [at(g, 'p1', 'characters', V.c2), at(g, 'p1', 'characters', SHC.jinbe2)].sort(),
    );
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": the target may be skipped after revealing', () => {
    const g = start();
    reveal(g);
    g.act({ type: 'done' });
    expect(g.power(at(g, 'p1', 'characters', SHC.sanji1))).toBe(3000);
  });

  it('with fewer than 2 Events in hand the Activate is not offered', () => {
    const g = start({ hand: [EVENTS[0], V.c1] });
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
  });

  it('[Once Per Turn]: a second activation in the same turn is not offered', () => {
    const g = start();
    reveal(g);
    pick(g, [at(g, 'p1', 'characters', SHC.sanji1)]);
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
  });

  it('deck rule: no card with a cost of 5 or more (4 is fine); the static table agrees', async () => {
    await loadAllScripts();
    expect(SCRIPTS[ID]!.rules).toEqual([{ deckRestriction: { cost: { gte: 5 } } }]);
    expect(DECK_RULES[ID]).toEqual(SCRIPTS[ID]!.rules);
    const all = cards();
    const banned = (main: string[]) =>
      deckIssues({ leader: ID, main }, all, 'free')
        .filter((i) => i.code === 'deckRestriction')
        .flatMap((i) => i.cards);
    expect(banned([V.c4, V.c4, V.c4, V.c1])).toEqual([]);
    expect(banned([V.c4, V.c5, V.c6])).toEqual([V.c5, V.c6]);
  });
});
