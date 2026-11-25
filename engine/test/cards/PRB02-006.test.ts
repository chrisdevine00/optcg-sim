/** PRB02-006 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, dec, expectDecision, pick, V } from './helpers.ts';
import { mk, plantCharEffect, plantLeaderEffect } from './helpers-prbst.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';

const ID = 'PRB02-006';
const REST_MINE = { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };

describe('PRB02-006 Roronoa Zoro', () => {
  /** p2's turn: p2's BLUE Character rests one of p1's Characters (the planted effect). */
  const start = (p1chars: (string | { card: string; rested: boolean })[] = [ID, V.c3, V.c2]) =>
    mk({ characters: p1chars }, { characters: [BLUE] }, { turn: 4, activePlayer: 'p2' });
  const zoro = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);
  const isRested = (g: ReturnType<typeof start>, card: string) =>
    g.card(g.find('p1', 'characters', card)).rested;

  it('has [Blocker] (printed)', () => {
    const g = start();
    expect(g.card(zoro(g)).keywords).toContain('Blocker');
  });

  it("instead of being rested by the opponent's Character's effect, rest 1 of your other Characters", () => {
    const g = start();
    plantCharEffect(g, BLUE, REST_MINE);
    pick(g, [zoro(g)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // Any other active Character may be rested instead; Zoro himself is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(isRested(g, ID)).toBe(false);
    expect(isRested(g, V.c3)).toBe(true);
    expect(isRested(g, V.c2)).toBe(false);
  });

  it('"you may": declined, Zoro is rested', () => {
    const g = start();
    plantCharEffect(g, BLUE, REST_MINE);
    pick(g, [zoro(g)]);
    decline(g);
    expect(isRested(g, ID)).toBe(true);
    expect(isRested(g, V.c3)).toBe(false);
  });

  it("must not fire: a Leader's effect is not a Character's effect", () => {
    const g = start();
    plantLeaderEffect(g, REST_MINE);
    pick(g, [zoro(g)]);
    expect(dec(g)?.kind).toBe('main');
    expect(isRested(g, ID)).toBe(true);
  });

  it("must not fire: on your own turn (it is an [Opponent's Turn] effect)", () => {
    // p2's [On Your Opponent's Attack] rests one of p1's Characters while p1 attacks.
    const g = mk({ characters: [ID, V.c3] }, { characters: [BLUE] });
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'w',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [{ do: REST_MINE }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c3), target: g.leader('p2') });
    // The attacker is already rested; Zoro is the target of the planted rest.
    pick(g, [zoro(g)]);
    expect(isRested(g, ID)).toBe(true);
    expect(g.eventsOfType('ReplacementApplied')).toHaveLength(0);
  });

  it('with no other active Character of yours there is nothing to rest instead: Zoro is rested', () => {
    const g = start([ID, { card: V.c3, rested: true }]);
    plantCharEffect(g, BLUE, REST_MINE);
    pick(g, [zoro(g)]);
    // An already rested Character cannot be rested again: the replacement cannot be paid.
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    if (dec(g)?.kind === 'optional') decline(g);
    expect(isRested(g, ID)).toBe(true);
  });
});
