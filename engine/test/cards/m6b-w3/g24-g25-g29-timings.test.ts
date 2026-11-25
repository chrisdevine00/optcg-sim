/**
 * M6b wave 3: event timings.
 *  - G24 `rested`: "when this Character becomes rested", with the cause and the effect's source.
 *  - G25 `cardPlayed` qualifiers: where it was played from (`from`) and how (`via`).
 *  - G29 `removed` / `leftField`: a Character or Stage leaves the field by any move.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  endCounter,
  game,
  hand,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

/** An auto that draws one card when `when` happens (not checked by the validator). */
const rawDraws = (when: object, id = 'w'): Ability =>
  ({ id, kind: 'auto', when: [when], effect: [{ do: { draw: 1 } }] }) as Ability;
/** The same, checked as a script first: the planted ability is a legal one. */
const draws = (when: object, id = 'w'): Ability => {
  const ab = rawDraws(when, id);
  expectValid([ab]);
  return ab;
};
const activate = (effect: object[], cost?: object[], id = 'a'): Ability => {
  const ab = {
    id,
    kind: 'activate',
    when: 'activateMain',
    effect,
    ...(cost ? { cost } : {}),
  } as Ability;
  expectValid([ab]);
  return ab;
};
const restOne = (owner: 'you' | 'opponent', name: string) => ({
  do: { rest: { from: 'characters', owner, filter: { name }, pick: { exactly: 1 } } },
});
const act = (g: ReturnType<typeof game>, who: 'p1' | 'p2', card: string, ability = 'a') =>
  g.act({ type: 'activate', card: g.find(who, 'characters', card), ability });
const drew = (g: ReturnType<typeof game>, p: 'p1' | 'p2', before: number) =>
  hand(g, p).length - before;

describe('G24 rested', () => {
  const self = { event: 'rested', owner: 'you', filter: { isSelf: true } };

  it('any cause: an attack, a cost and an effect all rest it', () => {
    // An attack (the rules rest the attacker).
    const a = game(
      { leader: PLAIN_PURPLE, characters: [V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    a.state = withAbilities(a.state, V.c1, [draws(self)]);
    const before = hand(a, 'p1').length;
    a.act({ type: 'attack', attacker: a.find('p1', 'characters', V.c1), target: a.leader('p2') });
    expect(drew(a, 'p1', before)).toBe(1);
    // A cost.
    const c = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
    c.state = withAbilities(c.state, V.c1, [
      draws(self),
      activate([{ do: { draw: 0 } }], [{ restSelf: true }]),
    ]);
    const bc = hand(c, 'p1').length;
    act(c, 'p1', V.c1);
    expect(drew(c, 'p1', bc)).toBe(1);
    // An effect of another card.
    const e = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c1] }, { leader: PLAIN_BLUE });
    e.state = withAbilities(e.state, V.c1, [draws(self)]);
    e.state = withAbilities(e.state, BLUE, [activate([restOne('you', 'Blugori')])]);
    const be = hand(e, 'p1').length;
    act(e, 'p1', BLUE);
    expect(drew(e, 'p1', be)).toBe(1);
  });

  it('a "by" limits it to a rest by an effect: not an attack, not a cost', () => {
    const byEffect = { ...self, by: 'effect' };
    const a = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
    a.state = withAbilities(a.state, V.c1, [draws(byEffect)]);
    const before = hand(a, 'p1').length;
    a.act({ type: 'attack', attacker: a.find('p1', 'characters', V.c1), target: a.leader('p2') });
    expect(drew(a, 'p1', before)).toBe(0);
    const c = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
    c.state = withAbilities(c.state, V.c1, [
      draws(byEffect),
      activate([{ do: { draw: 0 } }], [{ restSelf: true }]),
    ]);
    const bc = hand(c, 'p1').length;
    act(c, 'p1', V.c1);
    expect(drew(c, 'p1', bc)).toBe(0);
  });

  it('whose effect: your effect or the opponent\u2019s, read from the watcher', () => {
    const drawn = (by: 'yourEffect' | 'opponentEffect', owner: 'p1' | 'p2'): number => {
      // p1's Mohji rests one Character of `owner`; that Character watches for being rested.
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
      );
      const target = owner === 'p1' ? V.c1 : PURPLE;
      g.state = withAbilities(g.state, target, [draws({ ...self, by })]);
      g.state = withAbilities(g.state, BLUE, [
        activate([
          {
            do: {
              rest: {
                from: 'characters',
                owner: owner === 'p1' ? 'you' : 'opponent',
                filter: { name: owner === 'p1' ? 'Blugori' : 'Gordon' },
                pick: { exactly: 1 },
              },
            },
          },
        ]),
      ]);
      const before = hand(g, owner).length;
      act(g, 'p1', BLUE);
      return drew(g, owner, before);
    };
    expect(drawn('opponentEffect', 'p2')).toBe(1); // p1's effect is p2's opponent's
    expect(drawn('yourEffect', 'p2')).toBe(0);
    expect(drawn('yourEffect', 'p1')).toBe(1);
    expect(drawn('opponentEffect', 'p1')).toBe(0);
  });

  it('the source of the effect: "by your opponent’s Character’s effect"', () => {
    const make = (source: 'Character' | 'Leader') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE] },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
      );
      g.state = withAbilities(g.state, PURPLE, [
        draws({
          ...self,
          by: 'opponentEffect',
          sourceFilter: { category: ['Character'] },
        }),
      ]);
      const rest = activate([{ do: { rest: { from: 'characters', owner: 'opponent' } } }]);
      g.state = withAbilities(g.state, source === 'Character' ? BLUE : PLAIN_PURPLE, [rest]);
      const before = hand(g, 'p2').length;
      if (source === 'Character') act(g, 'p1', BLUE);
      else g.act({ type: 'activate', card: g.leader('p1'), ability: 'a' });
      return drew(g, 'p2', before);
    };
    expect(make('Character')).toBe(1);
    expect(make('Leader')).toBe(0);
  });

  it('a Character of either player rested by your effect (owner "any")', () => {
    const watcher = draws({
      event: 'rested',
      owner: 'any',
      by: 'yourEffect',
      filter: { category: ['Character'] },
    });
    const make = (target: 'you' | 'opponent') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
        { leader: PLAIN_BLUE, characters: [PURPLE] },
      );
      g.state = withAbilities(g.state, V.c1, [watcher]);
      g.state = withAbilities(g.state, BLUE, [
        activate([
          { do: { rest: { from: 'characters', owner: target, filter: { cost: { lte: 1 } } } } },
        ]),
      ]);
      const before = hand(g, 'p1').length;
      act(g, 'p1', BLUE);
      return drew(g, 'p1', before);
    };
    expect(make('opponent')).toBe(1);
    expect(make('you')).toBeGreaterThanOrEqual(1);
    // A Leader is not a Character.
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c1] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, V.c1, [watcher]);
    g.state = withAbilities(g.state, BLUE, [
      activate([{ do: { rest: { from: 'leader', owner: 'opponent' } } }]),
    ]);
    const before = hand(g, 'p1').length;
    act(g, 'p1', BLUE);
    expect(drew(g, 'p1', before)).toBe(0);
  });

  it('a card that is already rested, or cannot be rested, does not become rested', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [{ card: PURPLE, rested: true }] },
    );
    g.state = withAbilities(g.state, PURPLE, [draws(self)]);
    g.state = withAbilities(g.state, BLUE, [
      activate([{ do: { rest: { from: 'characters', owner: 'opponent' } } }]),
    ]);
    const before = hand(g, 'p2').length;
    act(g, 'p1', BLUE);
    expect(drew(g, 'p2', before)).toBe(0);
    const h = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    h.state = withAbilities(h.state, PURPLE, [draws(self)]);
    h.state = applyOp(h.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeRested',
        target: h.find('p2', 'characters', PURPLE),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    h.state = withAbilities(h.state, BLUE, [
      activate([{ do: { rest: { from: 'characters', owner: 'opponent' } } }]),
    ]);
    const b2 = hand(h, 'p2').length;
    act(h, 'p1', BLUE);
    expect(drew(h, 'p2', b2)).toBe(0);
  });

  it('the validator', () => {
    expectValid([
      draws(self),
      draws({ ...self, by: 'opponentEffect', sourceFilter: { category: ['Character'] } }, 'x'),
    ]);
    const bad = (w: object) => errorsOf(rawDraws(w));
    expect(bad({ event: 'rested' })).not.toEqual([]); // owner is required
    expect(bad({ ...self, by: 'anyEffect' })).not.toEqual([]);
    expect(bad({ ...self, sourceFilter: { category: ['Character'] } })).not.toEqual([]); // needs a by
    expect(bad({ ...self, cause: 'effect' })).not.toEqual([]); // belongs to removed
    expect(bad({ ...self, owner: 'both' })).not.toEqual([]);
    expect(bad({ ...self, owner: 'any' })).toEqual([]);
  });
});

describe('G25 cardPlayed from and via', () => {
  const played = (extra: object) => ({ event: 'cardPlayed', by: 'you', ...extra });
  /** p1 plays V.c1 by the rule from hand (cost 1). */
  const byRule = (extra: object): number => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [V.c1], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [draws(played(extra))]);
    const before = hand(g, 'p1').length;
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c1) });
    return drew(g, 'p1', before) + 1; // the played card left the hand
  };
  /** A source plays V.c1 from `zone` by an effect; returns the cards the Leader's watcher drew. */
  const byEffect = (source: 'Character' | 'Leader', zone: 'hand' | 'trash', extra: object) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        ...(zone === 'hand' ? { hand: [V.c1] } : { trash: [V.c1] }),
      },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      draws(played(extra)),
      ...(source === 'Leader'
        ? [
            activate([
              {
                do: { play: { what: { from: zone, owner: 'you', pick: { upTo: 1 } } } },
              },
            ]),
          ]
        : []),
    ]);
    if (source === 'Character')
      g.state = withAbilities(g.state, BLUE, [
        activate([{ do: { play: { what: { from: zone, owner: 'you', pick: { upTo: 1 } } } } }]),
      ]);
    const before = hand(g, 'p1').length;
    if (source === 'Character') act(g, 'p1', BLUE);
    else g.act({ type: 'activate', card: g.leader('p1'), ability: 'a' });
    pick(g, [g.find('p1', zone, V.c1)]);
    return drew(g, 'p1', before) + (zone === 'hand' ? 1 : 0);
  };

  it('via "rule": the normal play from hand, not a play by an effect', () => {
    expect(byRule({})).toBe(1);
    expect(byRule({ via: 'rule' })).toBe(1);
    expect(byRule({ via: 'effect' })).toBe(0);
    expect(byRule({ via: 'characterEffect' })).toBe(0);
    expect(byEffect('Character', 'hand', { via: 'rule' })).toBe(0);
  });

  it('via "effect": any effect; via "characterEffect": an effect whose source is a Character', () => {
    expect(byEffect('Character', 'hand', { via: 'effect' })).toBe(1);
    expect(byEffect('Leader', 'hand', { via: 'effect' })).toBe(1);
    expect(byEffect('Character', 'hand', { via: 'characterEffect' })).toBe(1);
    expect(byEffect('Leader', 'hand', { via: 'characterEffect' })).toBe(0);
  });

  it('from "trash": a card played from the trash, not from the hand', () => {
    expect(byEffect('Character', 'trash', { from: 'trash' })).toBe(1);
    expect(byEffect('Character', 'hand', { from: 'trash' })).toBe(0);
    expect(byEffect('Character', 'hand', { from: 'hand' })).toBe(1);
    expect(byEffect('Character', 'trash', { from: 'hand' })).toBe(0);
    expect(byRule({ from: 'hand' })).toBe(1);
    expect(byRule({ from: 'trash' })).toBe(0);
  });

  it('the validator takes the two qualifiers on cardPlayed only', () => {
    expectValid([draws(played({ from: 'trash', via: 'characterEffect' }))]);
    const bad = (w: object) => errorsOf(rawDraws(w));
    expect(bad(played({ from: 'deck' }))).not.toEqual([]);
    expect(bad(played({ via: 'rules' }))).not.toEqual([]);
    expect(bad({ event: 'eventActivated', by: 'you', from: 'trash' })).not.toEqual([]);
  });
});

describe('G29 removed / leftField', () => {
  const gone = (extra: object, event: 'removed' | 'leftField' = 'removed') => ({
    event,
    owner: 'you',
    ...extra,
  });
  /** p1's Leader watches; `how` removes one of p1's Characters. Returns the cards p1 drew. */
  const watch = (
    when: object,
    /** Removes the card; returns how many cards that put into p1's hand itself. */
    how: (g: ReturnType<typeof game>) => number,
    chars: string[] = [V.c1],
  ): number => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, ...chars] },
      { leader: PLAIN_BLUE, characters: [{ card: PURPLE, rested: true }] },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [draws(when)]);
    const before = hand(g, 'p1').length;
    const own = how(g) ?? 0;
    return drew(g, 'p1', before) - own;
  };
  const op = (kind: 'ko' | 'trashFromField' | 'bounce', by: 'p1' | 'p2', card = V.c1) => {
    return (g: ReturnType<typeof game>): number => {
      g.state = applyOp(g.state, { op: kind, card: g.find('p1', 'characters', card), by }).state;
      return kind === 'bounce' ? 1 : 0; // the returned card is in the hand
    };
  };

  it('any move off the field: a K.O., trashed, returned to hand', () => {
    for (const kind of ['ko', 'trashFromField', 'bounce'] as const)
      expect(watch(gone({}), op(kind, 'p2'))).toBe(1);
  });

  it('"leftField" is the same event', () => {
    expect(watch(gone({}, 'leftField'), op('bounce', 'p2'))).toBe(1);
    expect(watch(gone({ cause: 'effect' }, 'leftField'), op('ko', 'p2'))).toBe(1);
  });

  it('a battle K.O. is a move off the field too, but not an effect', () => {
    const battle = (g: ReturnType<typeof game>): number => {
      g.act({
        type: 'attack',
        attacker: g.find('p1', 'characters', BLUE),
        target: g.find('p2', 'characters', PURPLE),
      });
      passBlock(g);
      endCounter(g);
      return 0;
    };
    const opp = (extra: object) => watch({ event: 'removed', owner: 'opponent', ...extra }, battle);
    expect(opp({})).toBe(1);
    expect(opp({ cause: 'effect' })).toBe(0);
    expect(opp({ cause: 'yourEffect' })).toBe(0);
  });

  it('the cause is read from the watcher: your effect, or your opponent’s', () => {
    expect(watch(gone({ cause: 'opponentEffect' }), op('ko', 'p2'))).toBe(1);
    expect(watch(gone({ cause: 'opponentEffect' }), op('ko', 'p1'))).toBe(0);
    expect(watch(gone({ cause: 'yourEffect' }), op('ko', 'p1'))).toBe(1);
    expect(watch(gone({ cause: 'yourEffect' }), op('ko', 'p2'))).toBe(0);
    expect(watch(gone({ cause: 'effect' }), op('bounce', 'p1'))).toBe(1);
    expect(watch(gone({ cause: 'effect' }), op('bounce', 'p2'))).toBe(1);
  });

  it('your effect on the opponent’s Character: returned to hand (the owner is "opponent")', () => {
    const bounce = (g: ReturnType<typeof game>): number => {
      g.state = applyOp(g.state, {
        op: 'bounce',
        card: g.find('p2', 'characters', PURPLE),
        by: 'p1',
      }).state;
      return 0; // the card went to the opponent's hand
    };
    const w = (extra: object) => watch({ event: 'removed', owner: 'opponent', ...extra }, bounce);
    expect(w({ cause: 'yourEffect', to: 'hand' })).toBe(1);
    expect(w({ cause: 'opponentEffect', to: 'hand' })).toBe(0);
    expect(w({ cause: 'yourEffect', to: 'trash' })).toBe(0);
  });

  it('where it went: hand, deck or trash', () => {
    expect(watch(gone({ to: 'hand' }), op('bounce', 'p2'))).toBe(1);
    expect(watch(gone({ to: 'hand' }), op('ko', 'p2'))).toBe(0);
    expect(watch(gone({ to: 'trash' }), op('ko', 'p2'))).toBe(1);
    expect(watch(gone({ to: 'trash' }), op('bounce', 'p2'))).toBe(0);
  });

  it('the filter reads the removed card: its name, its type', () => {
    expect(watch(gone({ filter: { name: 'Blugori' } }), op('ko', 'p2'))).toBe(1);
    expect(watch(gone({ filter: { name: 'Mohji' } }), op('ko', 'p2'))).toBe(0);
    expect(watch(gone({ filter: { category: ['Stage'] } }), op('ko', 'p2'))).toBe(0);
  });

  it('the filter reads the card as it was on the field: last-known power, not the printed one (M4b-14)', () => {
    const lift = (g: ReturnType<typeof game>) => {
      g.state = applyOp(g.state, {
        op: 'modifier',
        mod: {
          kind: 'power',
          target: g.find('p1', 'characters', V.c1),
          amount: 2000,
          duration: { kind: 'thisTurn', turn: 3 },
          controller: 'p1',
        },
      }).state;
    };
    const strong = gone({ filter: { power: { gte: 5000 } } });
    // 3000 printed, 5000 on the field: it counts; the control stays at its printed 3000.
    expect(
      watch(strong, (g) => {
        lift(g);
        return op('bounce', 'p2')(g);
      }),
    ).toBe(1);
    expect(watch(strong, op('bounce', 'p2'))).toBe(0);
  });

  it('only the owner’s cards: the other player’s removal does not fire "owner: you"', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [draws(gone({}))]);
    const before = hand(g, 'p1').length;
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p2', 'characters', PURPLE),
      by: 'p1',
    }).state;
    expect(drew(g, 'p1', before)).toBe(0);
  });

  it('a cost is removed by your effect (part of the effect); a rule move is no effect', () => {
    const cost = (when: object): number => {
      const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c1] }, { leader: PLAIN_BLUE });
      g.state = withAbilities(g.state, PLAIN_PURPLE, [draws(when)]);
      g.state = withAbilities(g.state, V.c1, [
        activate([{ do: { draw: 0 } }], [{ trashSelf: true }]),
      ]);
      const before = hand(g, 'p1').length;
      act(g, 'p1', V.c1);
      return drew(g, 'p1', before);
    };
    expect(cost(gone({ cause: 'yourEffect' }))).toBe(1);
    expect(cost(gone({ cause: 'effect' }))).toBe(1);
    expect(cost(gone({ cause: 'opponentEffect' }))).toBe(0);
    // The Character area is full: one is trashed to make room (a rule, CR 3-7-6-1).
    const full = (when: object): number => {
      const g = game(
        {
          leader: PLAIN_PURPLE,
          characters: [BLUE, V.c1, V.c2, V.c3, V.c4],
          hand: [V.c5],
          costArea: { active: 6, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, PLAIN_PURPLE, [draws(when)]);
      const before = hand(g, 'p1').length;
      g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c5) });
      pick(g, [g.find('p1', 'characters', V.c1)]);
      return drew(g, 'p1', before) + 1;
    };
    expect(full(gone({}))).toBe(1);
    expect(full(gone({ cause: 'effect' }))).toBe(0);
  });

  it('the validator', () => {
    expectValid([draws(gone({ cause: 'yourEffect', to: 'hand', filter: { name: 'x' } }))]);
    const bad = (w: object) => errorsOf(rawDraws(w));
    expect(bad({ event: 'removed' })).not.toEqual([]); // owner is required
    expect(bad(gone({ cause: 'battle' }))).not.toEqual([]);
    expect(bad(gone({ to: 'life' }))).not.toEqual([]);
    expect(bad({ event: 'koed', filter: {}, to: 'hand' })).not.toEqual([]);
    expect(bad(gone({ owner: 'any' }))).not.toEqual([]);
  });
});
