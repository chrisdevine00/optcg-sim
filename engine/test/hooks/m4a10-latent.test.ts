/**
 * M4a-10: engine gaps that no scripted card reaches yet, pinned with planted scripts so an M4b
 * script cannot hit them first.
 *  (a) one removal event over several Characters gets one replacement offer (QA-OP15 OP15-069);
 *  (b) the End Phase timings and delayed effects are one batch per player (CR 6-6-1-1, 8-6-1);
 *  (c) a created delayed effect does not depend on its source (negated by then or not).
 */
import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../src/index.ts';
import type { Ability } from '../../src/testing.ts';
import { op } from '../support/game.ts';
import {
  BLUE,
  don,
  expectDecision,
  game,
  hand,
  KAIDO,
  PLAIN_PURPLE,
  V,
  accept,
  decline,
} from '../cards/helpers.ts';
import { withAbilities } from '../../src/testing.ts';

const NOLA = 'OP15-069';

describe('M4a-10a: one removal event over several Characters is one replacement offer', () => {
  const sweep = (kind: 'ko' | 'bounce'): Ability => ({
    id: 'sweep',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do:
          kind === 'ko'
            ? { ko: { from: 'characters', owner: 'opponent' } }
            : { move: { what: { from: 'characters', owner: 'opponent' }, to: { zone: 'hand' } } },
      },
    ],
  });
  const setup = (kind: 'ko' | 'bounce', active: number) => {
    const g = game(
      { leader: KAIDO, characters: [NOLA, V.c5], costArea: { active, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = withAbilities(g.state, BLUE, [sweep(kind)]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'sweep' });
    return g;
  };

  it.each(['ko', 'bounce'] as const)(
    'QA-OP15 OP15-069: one DON!! return keeps both Characters (%s)',
    (kind) => {
      const g = setup(kind, 1);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      // Both stay, one DON!! went back, and nothing more is asked.
      expectDecision(g, 'main', 'p2');
      expect(
        g
          .zone('p1', 'characters')
          .map((c) => c.card)
          .sort(),
      ).toEqual([NOLA, V.c5].sort());
      expect(don(g, 'p1')).toMatchObject({ active: 0, deck: 10 });
      expect(g.events.filter((e: GameEvent) => e.type === 'ReplacementApplied')).toHaveLength(2);
    },
  );

  it('with two DON!! the player is still asked once, not once per Character', () => {
    const g = setup('ko', 2);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
  });

  it('declining lets the whole event happen, with no second offer', () => {
    // Nola is not a target here, so she could still answer for the second Character.
    const g = game(
      { leader: KAIDO, characters: [NOLA, V.c5, V.c4], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'sweep',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              ko: { from: 'characters', owner: 'opponent', filter: { not: { name: 'Nola' } } },
            },
          },
        ],
      },
    ]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'sweep' });
    expectDecision(g, 'optional', 'p1');
    decline(g);
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([NOLA]);
    expect(don(g, 'p1')).toMatchObject({ active: 2 });
  });
});

describe('M4a-10b and c: the End Phase', () => {
  const eoyt = (id: string): Ability => ({
    id,
    kind: 'auto',
    when: ['endOfYourTurn'],
    effect: [{ do: { draw: 1 } }],
  });
  const eoot = (id: string): Ability => ({
    id,
    kind: 'auto',
    when: ['endOfOpponentsTurn'],
    effect: [{ do: { draw: 1 } }],
  });
  const delay = (id: string): Ability => ({
    id,
    kind: 'activate',
    when: 'activateMain',
    effect: [{ delayed: { at: 'endOfThisTurn' }, do: [{ do: { draw: 1 } }] }],
  });
  const activated = (g: { events: GameEvent[] }) =>
    g.events
      .filter((e) => e.type === 'EffectActivated')
      .map((e) => (e as unknown as { ability: string }).ability);

  const position = () => {
    const g = game(
      { leader: KAIDO, characters: [BLUE, V.c1] },
      { leader: PLAIN_PURPLE, characters: [V.c2] },
    );
    g.state = withAbilities(g.state, BLUE, [eoyt('mine')]);
    g.state = withAbilities(g.state, V.c1, [delay('later')]);
    g.state = withAbilities(g.state, V.c2, [eoot('theirs')]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'later' });
    g.act({ type: 'endTurn' });
    return g;
  };

  // LF-R2 (official ST-23 to ST-28 Q&A, ST24-005): a delayed "at the end of this turn" effect
  // resolves after the turn player's [End of Your Turn] effects, so there is nothing to order.
  it("(b) the delayed effect comes after the turn player's [End of Your Turn] one, with no order choice", () => {
    const g = position();
    expectDecision(g, 'main', 'p2');
    // The opponent's [End of Your Opponent's Turn] follows both of the turn player's.
    expect(activated(g).slice(-3)).toEqual(['mine', 'later', 'theirs']);
  });

  it("(b) the turn player's effects all come before the opponent's", () => {
    const g = position();
    expect(activated(g).at(-1)).toBe('theirs');
  });

  it('(c) a delayed effect still resolves when its source was negated after it was created', () => {
    const g = game({ leader: KAIDO, characters: [V.c1] }, { leader: PLAIN_PURPLE });
    g.state = withAbilities(g.state, V.c1, [delay('later')]);
    const src = g.find('p1', 'characters', V.c1);
    g.act({ type: 'activate', card: src, ability: 'later' });
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'negate',
        target: src,
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    });
    const before = hand(g, 'p1').length;
    g.act({ type: 'endTurn' });
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });
});
