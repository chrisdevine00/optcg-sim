/**
 * E-Q11 reopened (OP-17 review OP17-R2): "add up to N DON!!" asks a count (most first, as giveDon),
 * "add N" does not. Planted on vanilla test cards. Each test fails with the engine change reverted.
 */
import { describe, expect, it } from 'vitest';
import { validateScript, type CardScript, type Step } from '@optcg/cards';
import { project, projectEvents } from '../../../src/index.ts';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
} from '../helpers.ts';

type Part = { n: number; state: 'active' | 'rested'; upTo?: true };

function main(effect: Step[]): Ability {
  const ab = { id: 'a', kind: 'activate', when: 'activateMain', effect } as Ability;
  const script = {
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-24' },
    abilities: [ab],
  } as unknown as CardScript;
  expect(validateScript(script)).toEqual([]);
  return ab;
}

const add = (parts: Part[], donDeck = 10) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [BLUE],
      costArea: { active: 0, rested: 10 - donDeck },
      donDeck,
    },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main([{ do: { addDon: parts } }])]);
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
  return g;
};

describe('E-Q11: "add up to N DON!!" asks a count', () => {
  it('asks 0 to N, most first, and adds the chosen number', () => {
    const g = add([{ n: 3, state: 'rested', upTo: true }]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['3', '2', '1', '0']);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ rested: 1, active: 0, deck: 9 });
    expectDecision(g, 'main', 'p1');
  });

  it('"None" adds nothing', () => {
    const g = add([{ n: 2, state: 'active', upTo: true }]);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it('the most-first answer adds all N, as the old engine did', () => {
    const g = add([{ n: 2, state: 'active', upTo: true }]);
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });

  it('"up to 1" asks whether to add it', () => {
    const g = add([{ n: 1, state: 'rested', upTo: true }]);
    expect(expectDecision(g, 'choose', 'p1').options?.map((o) => o.id)).toEqual(['1', '0']);
    option(g, '0');
    expect(don(g, 'p1').rested).toBe(0);
  });

  it('the count is capped by what the DON!! deck holds', () => {
    const g = add([{ n: 4, state: 'rested', upTo: true }], 2);
    expect(expectDecision(g, 'choose', 'p1').options?.map((o) => o.id)).toEqual(['2', '1', '0']);
  });

  it('an empty DON!! deck asks nothing', () => {
    const g = add([{ n: 2, state: 'rested', upTo: true }], 0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('a multi-part add asks per part, in order, and each part keeps its own answer', () => {
    const g = add([
      { n: 1, state: 'active', upTo: true },
      { n: 2, state: 'rested', upTo: true },
    ]);
    expect(expectDecision(g, 'choose', 'p1').options?.map((o) => o.id)).toEqual(['1', '0']);
    option(g, '1');
    expect(expectDecision(g, 'choose', 'p1').options?.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0, deck: 9 });
  });

  it('an exact "add N" asks nothing and adds N', () => {
    const g = add([{ n: 2, state: 'rested' }]);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ rested: 2, deck: 8 });
  });

  it('the count is public information: the opponent view carries it and nothing hidden', () => {
    const a = add([{ n: 2, state: 'rested', upTo: true }]);
    const b = add([{ n: 2, state: 'rested', upTo: true }]);
    const from = a.events.length;
    option(a, '2');
    option(b, '0');
    const seen = (g: typeof a) => JSON.stringify(projectEvents(g.events.slice(from), 'p2'));
    expect(seen(a)).toContain('DonPlaced');
    expect(seen(b)).not.toContain('DonPlaced');
    // The mid-effect decision is the mover's, and p2 sees only that it waits (no hand cards).
    const mid = add([{ n: 2, state: 'rested', upTo: true }]);
    expect(JSON.stringify(project(mid.state, 'p2').decision)).not.toMatch(/OP|ST|EB/);
  });
});
