/**
 * An "up to" pick over the hidden hand is asked (at max 0 when nothing qualifies) whatever the hand
 * holds, in every frame: alone, after an optional cost, and after a cost paid from the hand. The
 * opponent's projected view and events must not tell a hand with a match from one without
 * (ADR 0005, DECISIONS "Empty picks"). Two positions each: only a hidden hand card differs.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents } from '../../src/index.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { BLUE, expectDecision, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';

const PLAY_CHEAP = {
  do: {
    play: {
      what: {
        from: 'hand',
        owner: 'you',
        filter: { all: [{ category: ['Character'] }, { cost: { lte: 1 } }] },
        pick: { upTo: 1 },
      },
    },
  },
};

const shapes: Record<string, { cost?: unknown[]; hand: [string[], string[]]; pay?: string }> = {
  'no cost': {
    hand: [
      [V.c3, V.c4],
      [V.c1, V.c4],
    ],
  },
  'optional cost paid from the hand': {
    cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    hand: [
      [V.c3, V.c4],
      [V.c1, V.c4],
    ],
    pay: V.c4,
  },
};

describe.each(Object.entries(shapes))('empty hidden pick: %s', (_name, shape) => {
  const run = (hand: string[]) => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], hand }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'x',
        kind: 'activate',
        when: 'activateMain',
        ...(shape.cost ? { cost: shape.cost, costOptional: true } : {}),
        effect: [PLAY_CHEAP],
      } as unknown as Ability,
    ]);
    activate(g, g.find('p1', 'characters', BLUE), 'x');
    if (shape.cost) {
      expectDecision(g, 'optional', 'p1');
      g.act({ type: 'optional', accept: true });
      expectDecision(g, 'choose', 'p1');
      g.act({ type: 'pick', choice: g.find('p1', 'hand', shape.pay!) });
    }
    return g;
  };

  it('is asked with and without a qualifying card (max 0 without one)', () => {
    const none = run(shape.hand[0]);
    const d = expectDecision(none, 'choose', 'p1');
    expect(d.max).toBe(0);
    const some = run(shape.hand[1]);
    expect(expectDecision(some, 'choose', 'p1').max).toBe(1);
  });

  it('the opponent sees the same view, decision and events in both positions', () => {
    const seen = (hand: string[]) => {
      const g = run(hand);
      return JSON.stringify([project(g.state, 'p2'), projectEvents(g.events, 'p2')]);
    };
    expect(seen(shape.hand[0])).toEqual(seen(shape.hand[1]));
  });
});
