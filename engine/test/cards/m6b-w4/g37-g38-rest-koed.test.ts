/**
 * M6b wave 4, G37 (a replacement for being rested by an opponent's Character's effect, PRB02-006)
 * and G38 (`koed` for the opponent's Characters, EB04-044). Planted on vanilla cards; each test
 * fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main } from '../m6b-w1/probe.ts';

const self = { from: 'self', owner: 'you' } as const;

describe('G37 replacement for being rested', () => {
  // PRB02-006 Roronoa Zoro: "If this Character would be rested by your opponent's Character's
  // effect, you may rest 1 of your other Characters instead."
  const zoro = {
    id: 'r',
    kind: 'replacement',
    replaces: { rest: self, cause: 'opponentCharacterEffect' },
    optional: true,
    instead: [
      {
        do: {
          rest: {
            from: 'characters',
            owner: 'you',
            filter: { not: { isSelf: true } },
            pick: { exactly: 1 },
          },
        },
      },
    ],
  } as Ability;
  const restZoro = (extra: object = {}) => ({
    do: {
      rest: { from: 'characters', owner: 'opponent', filter: { name: 'Blugori' }, ...extra },
    },
  });

  /** p2's turn: p2's `BLUE` (a Character) rests p1's `V.c1`, which carries the replacement. */
  const mk = (effect: object = restZoro(), who: 'character' | 'leader' = 'character') => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1, BLUE] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [zoro]);
    const src = who === 'leader' ? PLAIN_BLUE : BLUE;
    g.state = withAbilities(g.state, src, [main([effect] as never)]);
    g.act({
      type: 'activate',
      card: who === 'leader' ? g.leader('p2') : g.find('p2', 'characters', BLUE),
      ability: 'a',
    });
    return g;
  };
  const rested = (g: ReturnType<typeof mk>, card: string, p: 'p1' | 'p2' = 'p1') =>
    g.card(g.find(p, 'characters', card)).rested;

  it('validates, and refuses the causes and combinations it does not build', () => {
    expectValid([zoro]);
    const rep = (replaces: unknown) =>
      errorsOf({ id: 'r', kind: 'replacement', replaces, optional: true, instead: [] });
    expect(rep({ rest: self, cause: 'effect' })).not.toEqual([]);
    expect(rep({ rest: self })).not.toEqual([]);
    // A list covers K.O. and removal events only.
    expect(rep([{ ko: self }, { rest: self, cause: 'opponentCharacterEffect' }])).not.toEqual([]);
  });

  it('is offered when an opponent’s Character rests it; declining rests it', () => {
    const g = mk();
    expect(dec(g)?.kind).toBe('optional');
    expect(dec(g)?.player).toBe('p1');
    expect(rested(g, V.c1)).toBe(false); // not yet: the rest is held while the offer is open
    g.act({ type: 'optional', accept: false });
    expect(rested(g, V.c1)).toBe(true);
  });

  it('accepting rests one of your other Characters instead', () => {
    const g = mk();
    g.act({ type: 'optional', accept: true });
    expect(rested(g, V.c1)).toBe(false);
    expect(rested(g, BLUE)).toBe(true);
    expect(g.events.some((e) => e.type === 'ReplacementApplied' && e.replaced === 'rest')).toBe(
      true,
    );
  });

  it('a Leader’s effect is not a Character’s effect: it rests the Character', () => {
    const g = mk(restZoro(), 'leader');
    expect(rested(g, V.c1)).toBe(true);
    expect(g.events.some((e) => e.type === 'ReplacementApplied')).toBe(false);
  });

  it('your own Character’s effect is not an opponent’s: no offer', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [V.c1, BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, V.c1, [zoro]);
    g.state = withAbilities(g.state, BLUE, [
      main([
        { do: { rest: { from: 'characters', owner: 'you', filter: { name: 'Blugori' } } } },
      ] as never),
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
    expect(g.events.some((e) => e.type === 'ReplacementApplied')).toBe(false);
  });

  it('only the card the replacement is about is held: its neighbours are rested at once', () => {
    const g = mk(
      {
        do: {
          rest: { from: 'characters', owner: 'opponent' },
        },
      },
      'character',
    );
    // Both p1 Characters are rested by the one effect; Zoro's rest is the one that is offered.
    expect(dec(g)?.kind).toBe('optional');
    expect(rested(g, BLUE)).toBe(true);
    expect(rested(g, V.c1)).toBe(false);
  });

  it('an already-rested card is not offered a replacement', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: V.c1, rested: true }, BLUE] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [zoro]);
    g.state = withAbilities(g.state, BLUE, [main([restZoro()] as never)]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'a' });
    expect(g.events.some((e) => e.type === 'ReplacementApplied')).toBe(false);
  });
});

describe('G38 koed for the opponent’s Characters', () => {
  const watcher = (owner?: 'opponent' | 'you') =>
    ({
      id: 'w',
      kind: 'auto',
      when: [{ event: 'koed', filter: { category: ['Character'] }, ...(owner ? { owner } : {}) }],
      effect: [{ do: { draw: 1 } }],
    }) as Ability;
  const mk = (owner?: 'opponent' | 'you') => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1, BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, V.c1, [watcher(owner)]);
    return g;
  };
  const ko = (g: ReturnType<typeof mk>, p: 'p1' | 'p2', card: string) =>
    (g.state = applyOp(g.state, { op: 'ko', card: g.find(p, 'characters', card), by: 'p2' }).state);

  it('validates the owner', () => {
    expectValid([watcher('opponent'), { ...watcher('you'), id: 'w2' }]);
    expect(
      errorsOf({ ...watcher(), when: [{ event: 'koed', filter: {}, owner: 'me' }] }),
    ).not.toEqual([]);
  });

  it('"when one of your opponent’s Characters is K.O.’d": fires for their Character, not yours', () => {
    const theirs = mk('opponent');
    const before = hand(theirs, 'p1').length;
    ko(theirs, 'p2', PURPLE);
    expect(hand(theirs, 'p1')).toHaveLength(before + 1);
    const mine = mk('opponent');
    ko(mine, 'p1', BLUE);
    expect(hand(mine, 'p1')).toHaveLength(before);
  });

  it('without an owner it is still your own Characters (unchanged)', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    ko(g, 'p2', PURPLE);
    expect(hand(g, 'p1')).toHaveLength(before);
    ko(g, 'p1', BLUE);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('a battle K.O. of their Character counts too', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1, V.c7] },
      { leader: PLAIN_BLUE, characters: [{ card: PURPLE, rested: true }] },
    );
    g.state = withAbilities(g.state, V.c1, [watcher('opponent')]);
    const before = hand(g, 'p1').length;
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c7),
      target: g.find('p2', 'characters', PURPLE),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });
});
