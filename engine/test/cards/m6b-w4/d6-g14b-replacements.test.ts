/**
 * M6b wave 4: D6 (`addReplacement`: an Event creates a replacement for the rest of the turn,
 * EB02-030) and G14 (b) (one replacement covering several events with a single Once Per Turn,
 * OP13-046 Vista; M6b-Q6 stays open: this is the mechanism). Planted on vanilla cards; each test
 * fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, internals, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  trash,
  V,
} from '../helpers.ts';
import { EVENT_RED } from '../../support/game.ts';
import { errorsOf, expectValid, main } from '../m6b-w1/probe.ts';

const selfSel = { from: 'characters', owner: 'you', filter: { isSelf: true } } as const;

describe('D6 addReplacement (EB02-030)', () => {
  // [Counter] If any of your Characters would be K.O.'d in battle during this turn, you may trash 1
  // card from your hand instead.
  const counter = {
    id: 'c',
    kind: 'activate',
    when: 'counter',
    effect: [
      {
        do: {
          addReplacement: {
            replaces: { ko: { from: 'characters', owner: 'you' }, cause: 'battle' },
            optional: true,
            instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
            duration: 'thisTurn',
          },
        },
      },
    ],
  } as Ability;

  /** p2 attacks p1's rested Characters; p1 has the Event and two spare hand cards. */
  const mk = () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [
          { card: V.c1, rested: true },
          { card: V.c2, rested: true },
        ],
        hand: [EVENT_RED, V.c3, V.c4],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c6] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, EVENT_RED, [counter]);
    return g;
  };
  const attack = (g: ReturnType<typeof mk>, by: string, on: string) => {
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', by),
      target: g.find('p1', 'characters', on),
    });
    passBlock(g);
  };
  const playEvent = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'activate', card: g.find('p1', 'hand', EVENT_RED), ability: 'c' });
  const asked = (g: ReturnType<typeof mk>) =>
    dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';

  it('validates, and refuses what is not built', () => {
    expectValid([counter]);
    const add = (addReplacement: object) =>
      errorsOf({
        id: 'c',
        kind: 'activate',
        when: 'counter',
        effect: [{ do: { addReplacement } }],
      });
    const ok = {
      replaces: { ko: { from: 'characters', owner: 'you' }, cause: 'battle' },
      optional: true,
      instead: [{ returnDon: 1 }],
      duration: 'thisTurn',
    };
    expect(add(ok)).toEqual([]);
    expect(add({ ...ok, duration: 'battle' })).not.toEqual([]);
    expect(add({ ...ok, replaces: { damage: 'you' } })).not.toEqual([]);
    expect(
      add({ ...ok, replaces: { rest: selfSel, cause: 'opponentCharacterEffect' } }),
    ).not.toEqual([]);
    expect(add({ ...ok, optional: 'yes' })).not.toEqual([]);
  });

  it('a Character that would be K.O.’d in battle this turn is offered the replacement', () => {
    const g = mk();
    attack(g, V.c7, V.c1);
    expectDecision(g, 'counter', 'p1');
    playEvent(g);
    expect(internals(g.state).mods.some((m) => m.kind === 'replacement')).toBe(true);
    endCounter(g);
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    // The cost is a card from the hand: choose it.
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(trash(g, 'p1')).toContain(V.c3);
    expect(g.zone('p1', 'characters')).toHaveLength(2); // the K.O. did not happen
  });

  it('declining lets the K.O. happen', () => {
    const g = mk();
    attack(g, V.c7, V.c1);
    playEvent(g);
    endCounter(g);
    g.act({ type: 'optional', accept: false });
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('it may apply to every K.O. of the turn: the second battle is offered it again', () => {
    const g = mk();
    attack(g, V.c7, V.c1);
    playEvent(g);
    endCounter(g);
    g.act({ type: 'optional', accept: true });
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expectDecision(g, 'main', 'p2');
    attack(g, V.c6, V.c2);
    endCounter(g);
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('does not cover an effect K.O. (the cause is battle), and ends with the turn', () => {
    const g = mk();
    attack(g, V.c7, V.c1);
    playEvent(g);
    endCounter(g);
    g.act({ type: 'optional', accept: false });
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c2),
      by: 'p2',
    }).state;
    expect(asked(g)).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    // p2 ends the turn: nothing of it is left in the state.
    g.act({ type: 'endTurn' });
    expect(internals(g.state).mods.some((m) => m.kind === 'replacement')).toBe(false);
  });

  it('with no card in hand to pay, the replacement is not offered and the K.O. happens', () => {
    const empty = game(
      {
        leader: PLAIN_PURPLE,
        characters: [{ card: V.c1, rested: true }],
        hand: [EVENT_RED],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { activePlayer: 'p2', turn: 4 },
    );
    empty.state = withAbilities(empty.state, EVENT_RED, [counter]);
    empty.act({
      type: 'attack',
      attacker: empty.find('p2', 'characters', V.c7),
      target: empty.find('p1', 'characters', V.c1),
    });
    passBlock(empty);
    empty.act({ type: 'activate', card: empty.find('p1', 'hand', EVENT_RED), ability: 'c' });
    endCounter(empty);
    // A hand cost is secret (ADR 0005): it is offered with accept unavailable, not silently skipped.
    if (asked(empty)) {
      expect(empty.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      empty.act({ type: 'optional', accept: false });
    }
    expect(empty.zone('p1', 'characters')).toHaveLength(0);
  });
});

describe('G14 (b) one replacement covering two events (OP13-046 Vista)', () => {
  // "[Once Per Turn] If this Character would be K.O.'d or would be removed from the field by your
  // opponent's effect, you may ... instead."
  const vista = (extra: Partial<Ability> = {}): Ability =>
    ({
      id: 'r',
      kind: 'replacement',
      replaces: [{ ko: selfSel }, { leaveField: selfSel, cause: 'opponentEffect' }],
      optional: true,
      oncePerTurn: true,
      instead: [{ returnDon: 1 }],
      ...extra,
    }) as Ability;

  /** The active player's BLUE has a real effect of its own that puts V.c1 in its owner's hand. */
  const mk = (abilities: Ability[], active: 'p1' | 'p2' = 'p1') => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c7, BLUE] },
      {
        leader: PLAIN_BLUE,
        characters: [{ card: V.c1, rested: true }, BLUE],
        costArea: { active: 3, rested: 0 },
      },
      active === 'p2' ? { activePlayer: 'p2', turn: 4 } : {},
    );
    g.state = withAbilities(g.state, V.c1, abilities);
    const bounce = (owner: 'you' | 'opponent') =>
      main([
        {
          do: {
            move: {
              what: { from: 'characters', owner, filter: { name: 'Blugori' } },
              to: { zone: 'hand' },
            },
          },
        },
      ] as never);
    g.state = withAbilities(g.state, BLUE, [bounce(active === 'p1' ? 'opponent' : 'you')]);
    return g;
  };
  const target = (g: ReturnType<typeof mk>) => g.find('p2', 'characters', V.c1);
  const asked = (g: ReturnType<typeof mk>) =>
    dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';
  const gone = (g: ReturnType<typeof mk>) =>
    !g.zone('p2', 'characters').some((c) => c.card === V.c1);
  const ko = (g: ReturnType<typeof mk>, by: 'p1' | 'p2') =>
    (g.state = applyOp(g.state, { op: 'ko', card: target(g), by }).state);
  /** The active player's BLUE puts V.c1 in its owner's hand with an effect. */
  const bounce = (g: ReturnType<typeof mk>, by: 'p1' | 'p2') =>
    g.act({ type: 'activate', card: g.find(by, 'characters', BLUE), ability: 'a' });

  it('validates a list of at least 2 K.O. and removal events, and refuses the rest', () => {
    expectValid([vista()]);
    expect(errorsOf(vista({ replaces: [{ ko: selfSel }] } as never))).not.toEqual([]);
    expect(
      errorsOf(vista({ replaces: [{ ko: selfSel }, { damage: 'you' }] } as never)),
    ).not.toEqual([]);
    expect(errorsOf(vista({ replaces: [{ ko: selfSel }, 5] } as never))).not.toEqual([]);
  });

  it('covers a K.O. (any cause) and a removal by an opponent’s effect', () => {
    const a = mk([vista()]);
    ko(a, 'p1');
    expect(asked(a)).toBe(true);
    const b = mk([vista()]);
    bounce(b, 'p1');
    expect(asked(b)).toBe(true);
    // A battle K.O. is a K.O.: the first event covers it.
    const c = mk([vista()]);
    c.act({ type: 'attack', attacker: c.find('p1', 'characters', V.c7), target: target(c) });
    c.act({ type: 'block', blocker: null });
    c.act({ type: 'endCounter' });
    expect(asked(c)).toBe(true);
  });

  it('does not cover your own effect’s removal (only the second event is "by the opponent")', () => {
    const g = mk([vista()], 'p2');
    bounce(g, 'p2');
    expect(asked(g)).toBe(false);
    expect(g.zone('p2', 'hand').some((c) => c.card === V.c1)).toBe(true);
  });

  it('one event offers it once, although both events match', () => {
    const g = mk([vista()]);
    ko(g, 'p1'); // a K.O. by the opponent's effect matches both entries
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    expect(asked(g)).toBe(false);
    expect(gone(g)).toBe(false);
    expect(don(g, 'p2').deck).toBe(7 + 1); // one DON!! returned, once
  });

  it('a single Once Per Turn: using it for one event leaves none for the other', () => {
    const g = mk([vista()]);
    ko(g, 'p1');
    g.act({ type: 'optional', accept: true });
    bounce(g, 'p1'); // the other event, same turn
    expect(asked(g)).toBe(false);
    expect(g.zone('p2', 'hand').some((c) => c.card === V.c1)).toBe(true);
  });

  it('the contrast: two separate replacements are two uses', () => {
    const g = mk([
      vista({ replaces: { ko: selfSel }, id: 'k' } as never),
      vista({ replaces: { leaveField: selfSel, cause: 'opponentEffect' }, id: 'l' } as never),
    ]);
    ko(g, 'p1'); // both match; the first is offered, then the second is spent on the same event? no:
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    bounce(g, 'p1');
    // The other ability is still unspent: the second event is offered.
    expect(asked(g)).toBe(true);
  });
});
