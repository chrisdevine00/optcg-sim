/** OP17-011 Blamenco. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  takeDamage,
  V,
} from './helpers.ts';
import { RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-011';

describe('OP17-011 Blamenco', () => {
  const start = (don: number) =>
    game(
      { leader: RED_LEADER, characters: [{ card: ID, don }], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6, V.c3] },
    );
  const attack = (g: ReturnType<typeof start>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it("[DON!! x2] [When Attacking] gives up to 1 of your opponent's Characters -4000 power during this turn", () => {
    const g = start(2);
    attack(g);
    const target = g.find('p2', 'characters', V.c6);
    pick(g, [target]);
    expect(g.power(target)).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('the -4000 lasts the whole turn, not just the battle', () => {
    const g = start(2);
    attack(g);
    const target = g.find('p2', 'characters', V.c6);
    pick(g, [target]);
    expect(dec(g)?.kind).toBe('block');
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(target)).toBe(4000);
    g.act({ type: 'endTurn' });
    expect(g.power(target)).toBe(8000);
  });

  it('with only 1 DON!! given the effect does not happen', () => {
    const g = start(1);
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });

  it('"up to 1": it may choose no Character', () => {
    const g = start(2);
    attack(g);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });

  it('only Characters are candidates (not the Leader), and never your own', () => {
    const g = start(2);
    attack(g);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null))
      .sort();
    expect(choices).toEqual(
      [g.find('p2', 'characters', V.c6), g.find('p2', 'characters', V.c3)].sort(),
    );
  });
});
