/**
 * A replacement whose cost is paid from hand is offered whenever its public conditions hold, so
 * whether the game pauses never shows the opponent what the hand holds (docs/research/
 * replacement-offer-leak.md; ADR 0005, `costIsSecret`). Planted: a test-only replacement on a
 * vanilla Leader, "if your Trafalgar Law would be K.O.'d, you may trash 1 Character from hand".
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, queries, type GameEvent } from '../../src/index.ts';
import { internals, type Ability } from '../../src/testing.ts';
import { scenario, type TestGame } from '../fixtures/index.ts';
import { EVENT_RED, give, KAIDO, LAW, PUR_1, ROSINANTE, times } from '../support/game.ts';

const HAND_COST: Ability = {
  id: 'hand-ko',
  kind: 'replacement',
  oncePerTurn: true,
  optional: true,
  replaces: { ko: { from: 'characters', owner: 'you', filter: { name: 'Trafalgar Law' } } },
  instead: [
    {
      trash: {
        from: 'hand',
        owner: 'you',
        filter: { category: ['Character'] },
        pick: { exactly: 1 },
      },
    },
  ],
};

interface Run {
  g: TestGame;
  events: GameEvent[];
}

/** p2 attacks p1's rested Law; p1's hand is the one card `held`. */
function lawUnderAttack(held: string): Run {
  const g = scenario({
    turn: 4,
    activePlayer: 'p2',
    p1: {
      leader: ROSINANTE,
      characters: [{ card: LAW, rested: true }],
      hand: [held],
      life: times(3, PUR_1),
    },
    p2: { leader: KAIDO, characters: [{ card: 'OP15-062' }] },
  });
  give(g, ROSINANTE, [HAND_COST]);
  const law = g.find('p1', 'characters', LAW);
  const events = [
    ...g.act({ type: 'attack', attacker: g.find('p2', 'characters', 'OP15-062'), target: law }),
    ...g.act({ type: 'block', blocker: null }),
    ...g.act({ type: 'endCounter' }),
  ];
  return { g, events };
}

describe('replacement offer with a hand-paid cost', () => {
  it('pauses either way; accept is unavailable without a payable card', () => {
    const payable = lawUnderAttack(PUR_1);
    const unpayable = lawUnderAttack(EVENT_RED);
    for (const { g } of [payable, unpayable])
      expect(queries.decision(g.state)).toMatchObject({ kind: 'optional', player: 'p1' });
    expect(internals(payable.g.state).decision?.noAccept).toBeUndefined();
    expect(internals(unpayable.g.state).decision?.noAccept).toBe(true);
    expect(internals(unpayable.g.state).decision?.secret).toBe(true);
    expect(() => unpayable.g.act({ type: 'optional', accept: true })).toThrow();
  });

  it('the opponent sees the same events and decision whatever the hidden hand holds', () => {
    const view = (r: Run) =>
      JSON.stringify({
        events: projectEvents(r.events, 'p2'),
        view: project(r.g.state, 'p2').decision,
        public: queries.decision(r.g.state),
      });
    expect(view(lawUnderAttack(EVENT_RED))).toBe(view(lawUnderAttack(PUR_1)));
  });

  it('declining an unpayable offer lets the K.O. proceed; accepting a payable one saves it', () => {
    const declined = lawUnderAttack(EVENT_RED).g.act({ type: 'optional', accept: false });
    expect(declined.map((e) => e.type)).toContain('KO');
    const g = lawUnderAttack(PUR_1).g;
    g.act({ type: 'optional', accept: true });
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
