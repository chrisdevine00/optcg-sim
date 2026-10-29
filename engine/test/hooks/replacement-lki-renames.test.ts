/**
 * ADR 0013: replacement hooks, last-known information and renames. The replacement is registered
 * with a test-only helper, following OP12-061 Rosinante (RL-41): "[Once Per Turn] If your
 * [Trafalgar Law] would be K.O.'d, you may add 1 card from the top of your Life cards to your hand
 * instead." The real card script arrives in M4.
 */
import { describe, expect, it } from 'vitest';
import { queries } from '../../src/index.ts';
import { internals, type Ability } from '../../src/testing.ts';
import { scenario, type TestGame } from '../fixtures/index.ts';
import {
  give,
  KAIDO,
  LAW,
  LUFFY,
  noDefence,
  op,
  PUR_1,
  RED_5,
  ROSINANTE,
  times,
  types,
} from '../support/game.ts';

const ROSINANTE_REPLACEMENT: Ability = {
  id: 'law-ko',
  kind: 'replacement',
  oncePerTurn: true,
  optional: true,
  replaces: { ko: { owner: 'you', name: 'Trafalgar Law' } },
  instead: [{ op: 'lifeToHand', n: 1 }],
};

/** p2 (turn player) attacks p1's rested Law; p1's Leader is Rosinante. */
function lawUnderAttack(life = 3): TestGame {
  const g = scenario({
    turn: 4,
    activePlayer: 'p2',
    p1: {
      leader: ROSINANTE,
      characters: [
        { card: LAW, rested: true },
        { card: LAW, rested: true },
      ],
      life: times(life, PUR_1),
    },
    p2: { leader: KAIDO, characters: [{ card: 'OP15-062' }] },
  });
  give(g, ROSINANTE, [ROSINANTE_REPLACEMENT]);
  return g;
}

function attackLaw(g: TestGame, nth = 0): string {
  const law = g.find('p1', 'characters', LAW, nth);
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', 'OP15-062'), target: law });
  noDefence(g);
  return law;
}

describe('replacement hook: K.O. replaced (RL-41, CR 8-1-3-4)', () => {
  it("offers an optional decision to the replacement's controller mid-battle; accepting saves Law", () => {
    const g = lawUnderAttack();
    const law = attackLaw(g);
    expect(queries.decision(g.state)).toMatchObject({ kind: 'optional', player: 'p1' });
    expect(queries.turn(g.state).battleStep).toBe('damage');
    const ev = g.act({ type: 'optional', accept: true });
    expect(types(ev)).toContain('ReplacementApplied');
    expect(types(ev)).not.toContain('KO');
    expect(g.card(law).zone).toBe('characters');
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(types(ev)).not.toContain('TriggerRevealed'); // not damage: no [Trigger]
    expect(queries.decision(g.state)).toMatchObject({ kind: 'main', player: 'p2' });
  });

  it('[Once Per Turn]: a second Law K.O. the same turn offers nothing', () => {
    const g = lawUnderAttack();
    attackLaw(g, 0);
    g.act({ type: 'optional', accept: true });
    // Set the attacker active again by an effect, then attack the other Law.
    const att = g.find('p2', 'characters', 'OP15-062');
    give(g, 'OP15-062', [
      {
        id: 'up',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ op: 'setActive', target: 'self' }],
      },
    ]);
    g.act({ type: 'activate', card: att, ability: 'up' });
    const law2 = g.find('p1', 'characters', LAW, 1);
    g.act({ type: 'attack', attacker: att, target: law2 });
    const ev = [...g.act({ type: 'block', blocker: null }), ...g.act({ type: 'endCounter' })];
    expect(types(ev)).toContain('KO');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(internals(g.state).oncePerTurn).toHaveLength(1);
  });

  it('declining lets the K.O. happen (CR 8-1-3-4-1)', () => {
    const g = lawUnderAttack();
    attackLaw(g);
    const ev = g.act({ type: 'optional', accept: false });
    expect(types(ev)).toEqual(expect.arrayContaining(['ReplacementDeclined', 'KO']));
    expect(g.life('p1')).toBe(3);
    expect(internals(g.state).oncePerTurn).toEqual([]);
  });

  it("CR 8-1-3-4-5: impossible at 0 Life, so no decision and Law is K.O.'d", () => {
    const g = lawUnderAttack(0);
    attackLaw(g);
    expect(queries.decision(g.state)!.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('covers K.O. by effect too, but not trash or bounce (CR 10-2-1-3, RL-15)', () => {
    const g = lawUnderAttack();
    const law = g.find('p1', 'characters', LAW);
    op(g, { op: 'ko', card: law, by: 'p2' });
    expect(queries.decision(g.state)).toMatchObject({ kind: 'optional', player: 'p1' });
    g.act({ type: 'optional', accept: true });
    expect(g.card(law).zone).toBe('characters');
    const h = lawUnderAttack();
    op(h, { op: 'trashFromField', card: h.find('p1', 'characters', LAW), by: 'p2' });
    expect(queries.decision(h.state)!.kind).toBe('main');
    expect(h.zone('p1', 'trash')).toHaveLength(1);
  });

  it('CR 2-1-2: the name must match exactly', () => {
    const g = scenario({
      turn: 4,
      activePlayer: 'p2',
      p1: { leader: ROSINANTE, characters: [{ card: PUR_1, rested: true }], life: times(2, PUR_1) },
      p2: { leader: KAIDO },
    });
    give(g, ROSINANTE, [ROSINANTE_REPLACEMENT]);
    op(g, { op: 'ko', card: g.find('p1', 'characters', PUR_1), by: 'p2' });
    expect(queries.decision(g.state)!.kind).toBe('main');
  });

  it("CR 8-1-3-4-2: the K.O.'d card's own replacement goes first, then the turn player's", () => {
    const g = lawUnderAttack();
    const selfSave: Ability = {
      id: 'self',
      kind: 'replacement',
      optional: true,
      replaces: { ko: { owner: 'you', self: true } },
      instead: [],
    };
    give(g, LAW, [selfSave]);
    const law = attackLaw(g);
    expect(internals(g.state).decision!.replacement).toMatchObject({ card: law, ability: 'self' });
    g.act({ type: 'optional', accept: false });
    expect(internals(g.state).decision!.replacement).toMatchObject({ ability: 'law-ko' });
    // CR 8-1-3-4-3: each replacement applies to the event at most once.
    g.act({ type: 'optional', accept: false });
    expect(queries.decision(g.state)!.kind).toBe('main');
  });

  it('a mandatory replacement (no "may") applies with no decision (RL-31, OP08-045 Thatch pattern)', () => {
    const g = lawUnderAttack();
    give(g, LAW, [
      {
        id: 'thatch',
        kind: 'replacement',
        optional: false,
        replaces: { ko: { owner: 'you', self: true } },
        instead: [{ op: 'emit', label: 'instead' }],
      },
    ]);
    const law = attackLaw(g);
    expect(g.card(law).zone).toBe('characters');
    expect(g.events.some((e) => e.type === 'EffectResolved' && e.label === 'instead')).toBe(true);
  });
});

describe('last-known information and renames (ADR 0013, CR 3-1-6)', () => {
  it('a card leaving the field gets a new id; renames and the event map old to new', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [{ card: RED_5, don: 2 }] },
      p2: { leader: KAIDO },
    });
    const old = g.find('p1', 'characters', RED_5);
    const ev = op(g, { op: 'ko', card: old, by: 'p2' });
    const moved = ev.find((e) => e.type === 'CardMoved')!;
    const fresh = g.zone('p1', 'trash')[0]!.instance;
    expect(fresh).not.toBe(old);
    expect(moved).toMatchObject({ instance: old, newInstance: fresh });
    expect(internals(g.state).renames).toEqual([[old, fresh]]);
    expect(() => g.card(old)).toThrow();
  });

  it('the departure event carries a snapshot: power, cost, types, given DON!! and cause', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [{ card: RED_5, don: 2 }] },
      p2: { leader: KAIDO },
    });
    const old = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: old,
        amount: 500,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    const ev = op(g, { op: 'ko', card: old, by: 'p2' });
    const moved = ev.find((e) => e.type === 'CardMoved')!;
    expect(moved.lki).toMatchObject({
      card: RED_5,
      owner: 'p1',
      power: 8500,
      basePower: 6000,
      cost: 5,
      don: 2,
      cause: { kind: 'effect', by: 'p2' },
    });
    expect((moved.lki as { types: string[] }).types.length).toBeGreaterThan(0);
  });

  it('CR 3-1-6 / 6-5-5-4: the new object keeps no modifiers, and its DON!! go to the cost area rested', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: [{ card: RED_5, don: 2 }],
        costArea: { active: 0, rested: 1 },
      },
      p2: { leader: KAIDO },
    });
    const old = g.find('p1', 'characters', RED_5);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'cost',
        target: old,
        amount: -2,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    op(g, { op: 'bounce', card: old, by: 'p2' });
    const inHand = g.zone('p1', 'hand')[0]!;
    expect(inHand.cost).toBe(5);
    expect(internals(g.state).mods).toEqual([]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 3, given: 0 });
  });

  it('a K.O. records cause battle with the attacking player', () => {
    const g = scenario({
      p1: { leader: LUFFY },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.find('p2', 'characters', PUR_1) });
    const ev = [...g.act({ type: 'block', blocker: null }), ...g.act({ type: 'endCounter' })];
    expect(ev.find((e) => e.type === 'CardMoved')!.lki).toMatchObject({
      cause: { kind: 'battle', by: 'p1' },
      power: 3000,
    });
  });

  it('instance ids are stable through hidden zones (only the new-object rule renames)', () => {
    const g = scenario({ p1: { leader: LUFFY, deck: [RED_5, RED_5] }, p2: { leader: KAIDO } });
    const top = g.zone('p1', 'deck')[0]!.instance;
    op(g, { op: 'draw', player: 'p1', n: 1 });
    expect(g.card(top).zone).toBe('hand');
  });
});
