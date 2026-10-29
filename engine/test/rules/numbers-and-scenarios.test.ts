/** CR 1-2, 1-3 numbers, 2-3-5, 4-5-3, 4-9-2-1, 6-5-4/10-2-2-1, and scenario validation (ADR 0013). */
import { describe, expect, it } from 'vitest';
import {
  createFromScenario,
  IllegalAction,
  InvalidSetup,
  legalActions,
  queries,
  reduce,
  whyNot,
} from '../../src/index.ts';
import { DefTable } from '../../src/defs.ts';
import { validateDeck } from '../../src/setup.ts';
import { internals } from '../../src/testing.ts';
import { cards, scenario } from '../fixtures/index.ts';
import {
  give,
  KAIDO,
  LUFFY,
  noDefence,
  op,
  PUR_1,
  RED_1,
  RED_5,
  times,
  vanillaDeck,
} from '../support/game.ts';

describe('numbers (CR 1-3)', () => {
  it('CR 1-2-1-1-1 / 9-2-1-1: a Leader taking damage at 0 Life loses', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(queries.result(g.state)).toEqual({ winner: 'p1', reason: 'damage at 0 Life' });
  });

  it('CR 1-3-5 / 1-3-5-1 / 4-8-1: an "up to" choice allows 0', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: times(5, RED_1),
        hand: [RED_1],
        costArea: { active: 1, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', RED_1) });
    const s = internals(g.state);
    const upTo = { ...s, decision: { ...s.decision!, min: 0, max: 2 } } as never;
    expect(legalActions(upTo)).toContainEqual({ type: 'done', player: 'p1' });
    expect(whyNot(upTo, 'p1', { type: 'done' })).toBeNull();
    expect(queries.decision(upTo)).toMatchObject({ min: 0, max: 2 });
  });

  it('CR 1-3-6-2 / 1-3-6-2-1: cost floors at 0, and a negative intermediate carries through', () => {
    const g = scenario({ p1: { leader: LUFFY, hand: [RED_5] }, p2: { leader: KAIDO } });
    const c = g.find('p1', 'hand', RED_5); // cost 5
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'cost',
        target: c,
        amount: -7,
        controller: 'p2',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    expect(g.card(c).cost).toBe(0);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'cost',
        target: c,
        amount: 3,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    expect(g.card(c).cost).toBe(1); // 5 - 7 + 3, not 0 + 3
  });

  it('CR 4-9-2-1: several base-power settings: the highest applies; modifiers stack on it (RL-33)', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    const l = g.leader('p1');
    const dur = { kind: 'thisTurn', turn: 3 } as const;
    op(g, {
      op: 'modifier',
      mod: { kind: 'basePower', target: l, amount: 7000, controller: 'p1', duration: dur },
    });
    op(g, {
      op: 'modifier',
      mod: { kind: 'basePower', target: l, amount: 6000, controller: 'p1', duration: dur },
    });
    expect(g.power(l)).toBe(7000);
    op(g, {
      op: 'modifier',
      mod: { kind: 'power', target: l, amount: 1000, controller: 'p1', duration: dur },
    });
    expect(g.power(l)).toBe(8000);
  });

  it('CR 4-5-3: draw 0 does nothing', () => {
    const g = scenario({ p1: { leader: LUFFY, deck: [RED_1] }, p2: { leader: KAIDO } });
    expect(op(g, { op: 'draw', player: 'p1', n: 0 }).filter((e) => e.type === 'CardMoved')).toEqual(
      [],
    );
  });

  it('CR 2-3-5: a multicolor Leader allows each of its colors (OP12-061 is Purple/Yellow)', () => {
    const defs = new DefTable(cards());
    const yellow = vanillaDeck('Purple').slice(0, 46).concat(times(4, 'P-088'));
    expect(validateDeck({ leader: 'OP12-061', main: yellow }, defs)).toEqual([]);
  });

  it('QA-GR: there is no hand-size limit', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: times(12, RED_1), deck: times(4, RED_1) },
      p2: { leader: KAIDO, deck: times(4, PUR_1) },
    });
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'hand')).toHaveLength(13);
  });
});

describe('activation windows (CR 6-5-4, 8-1-3-2, 10-2-2-1)', () => {
  it('[Activate: Main] is available in your Main Phase but never during a battle', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO, life: [PUR_1] } });
    give(g, LUFFY, [{ id: 'a', kind: 'activate', when: 'activateMain', effect: [] }]);
    expect(g.legal()).toContainEqual({
      type: 'activate',
      card: g.leader('p1'),
      ability: 'a',
      player: 'p1',
    });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expect(
      whyNot(g.state, 'p1', { type: 'activate', card: g.leader('p1'), ability: 'a' }),
    ).toBeTruthy();
  });

  it('CR 10-2-13-1: a [Once Per Turn] ability is offered once per turn', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    give(g, LUFFY, [
      { id: 'a', kind: 'activate', when: 'activateMain', oncePerTurn: true, effect: [] },
    ]);
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'a' });
    expect(
      whyNot(g.state, 'p1', { type: 'activate', card: g.leader('p1'), ability: 'a' }),
    ).toMatchObject({ rule: 'CR 10-2-13-1' });
  });
});

describe('malformed actions (M2-06, M2-18)', () => {
  it('M2-18: reduce and whyNot reject a null or shapeless action with a reason, never a TypeError', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    expect(() => reduce(g.state, null as never)).toThrow(IllegalAction);
    expect(() => reduce(g.state, 'endTurn' as never)).toThrow(IllegalAction);
    expect(whyNot(g.state, 'p1', null as never)).not.toBeNull();
    // Fields of the wrong type are refused before they are read.
    expect(() => reduce(g.state, { type: 'attack', player: 'p1' } as never)).toThrow(IllegalAction);
    expect(() => reduce(g.state, { type: 'playCard', card: 3, player: 'p1' } as never)).toThrow(
      IllegalAction,
    );
    expect(whyNot(g.state, 'p1', { type: 'block' } as never)).not.toBeNull();
    expect(queries.decision(g.state)!.kind).toBe('main');
  });

  it('a concession from no player or an unknown player throws IllegalAction', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    expect(() => reduce(g.state, { type: 'concede', player: 'p3' } as never)).toThrow(
      IllegalAction,
    );
    expect(() => reduce(g.state, { type: 'concede' } as never)).toThrow(IllegalAction);
    expect(queries.result(g.state)).toBeNull();
  });

  it('a pick with a null or malformed choice throws IllegalAction, and whyNot explains', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: times(5, RED_1),
        hand: [RED_1],
        costArea: { active: 1, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', RED_1) });
    expect(() => reduce(g.state, { type: 'pick', choice: null, player: 'p1' } as never)).toThrow(
      IllegalAction,
    );
    expect(() =>
      reduce(g.state, { type: 'pick', choice: { x: 1 }, player: 'p1' } as never),
    ).toThrow(IllegalAction);
    expect(whyNot(g.state, 'p1', { type: 'pick', choice: null } as never)).not.toBeNull();
    expect(() => reduce(g.state, { type: 'nonsense', player: 'p1' } as never)).toThrow(
      IllegalAction,
    );
  });
});

describe('scenario validation (ADR 0013)', () => {
  const base = {
    seed: 1,
    cards: cards(),
    turn: 3,
    activePlayer: 'p1' as const,
    firstPlayer: 'p1' as const,
  };
  it('rejects impossible positions', () => {
    const bad = [
      { p1: { leader: RED_1 }, p2: { leader: KAIDO } },
      { p1: { leader: LUFFY, characters: times(6, RED_1) }, p2: { leader: KAIDO } },
      { p1: { leader: LUFFY, characters: ['OP03-020'] }, p2: { leader: KAIDO } },
      { p1: { leader: LUFFY, costArea: { active: 11, rested: 0 } }, p2: { leader: KAIDO } },
      { p1: { leader: LUFFY, stage: { card: 'OP03-020', don: 1 } }, p2: { leader: KAIDO } },
      { p1: { leader: 'OP15-058', costArea: { active: 7, rested: 0 } }, p2: { leader: KAIDO } },
      // M2-09: the DON!! total must equal the Leader's DON!! deck size.
      { p1: { leader: LUFFY, donDeck: 3 }, p2: { leader: KAIDO } },
    ];
    for (const spec of bad)
      expect(() => createFromScenario({ ...base, ...spec })).toThrow(InvalidSetup);
    expect(() =>
      createFromScenario({ ...base, turn: 2, p1: { leader: LUFFY }, p2: { leader: KAIDO } }),
    ).toThrow(/turn 2 belongs to p2/);
    expect(() =>
      createFromScenario({ ...base, phase: 'setup', p1: { leader: LUFFY }, p2: { leader: KAIDO } }),
    ).toThrow(InvalidSetup);
  });

  it('fills an omitted deck from the decklist minus placed cards, shuffled with the seed', () => {
    const list = vanillaDeck('Red');
    const g = createFromScenario({
      ...base,
      p1: { leader: LUFFY, hand: [list[0]!], decklist: list },
      p2: { leader: KAIDO },
    });
    expect(queries.zone(g.state, 'p1', 'deck')).toHaveLength(49);
    expect(internals(g.state).setup.deckSize.p1).toBe(50);
  });

  it('starts at the requested phase and runs forward to the next decision', () => {
    const g = createFromScenario({
      ...base,
      phase: 'end',
      p1: { leader: LUFFY, deck: [RED_1] },
      p2: { leader: KAIDO, deck: [PUR_1, PUR_1] },
    });
    expect(queries.turn(g.state)).toMatchObject({ number: 4, activePlayer: 'p2', phase: 'main' });
  });
});
