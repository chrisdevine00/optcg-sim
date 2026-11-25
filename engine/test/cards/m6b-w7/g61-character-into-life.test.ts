/**
 * M6b wave 7, G61: a Character from the field into a Life area (EB02-057 Mad Treasure, OP09-101
 * Kuzan as a cost, OP11-101 Bege as a replacement payload, OP11-116 Merman Combat Ultramarine,
 * OP12-117 Slam Gibson). `move` from `characters` to `life`: at the top, the bottom or either end
 * (the controller chooses), face-up or face-down, into the Life area of the card's owner. It is a
 * removal, so replacements and protection see it. Planted on vanilla cards; each test fails with
 * the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type ProjectedView } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  accept,
  BLUE,
  dec,
  game,
  hand,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, offered, run } from '../m6b-w1/probe.ts';

const intoLife = (over: object = {}, to: object = {}) => ({
  do: {
    move: {
      what: {
        from: 'characters',
        owner: 'opponent',
        filter: { cost: { lte: 3 } },
        pick: { upTo: 1 },
        ...over,
      },
      to: { zone: 'life', position: 'topOrBottom', faceUp: true, ...to },
    },
  },
});

const mk = (effect: unknown[] = [intoLife()], extra: object = {}) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], ...extra },
    { leader: PLAIN_BLUE, characters: [V.c1, V.c5], life: [V.c2, V.c3, V.c4] },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};

describe('G61 a Character into a Life area', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (to: object, over: object = {}, cost = false) =>
      errorsOf(
        cost
          ? {
              id: 'a',
              kind: 'activate',
              when: 'activateMain',
              cost: [
                {
                  move: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: { cost: { lte: 3 } },
                    pick: { exactly: 1 },
                    ...over,
                  },
                  to: { zone: 'life', position: 'topOrBottom', faceUp: true, ...to },
                },
              ],
              effect: [{ do: { draw: 1 } }],
            }
          : { id: 'a', kind: 'activate', when: 'activateMain', effect: [intoLife(over, to)] },
      );
    expect(bad({})).toEqual([]);
    expect(bad({ position: 'top', faceUp: false })).toEqual([]);
    expect(bad({}, { owner: 'any' })).toEqual([]);
    expect(bad({}, {}, true)).toEqual([]);
    // A position is needed; a Stage does not go into Life; one card; no mixed zones.
    expect(bad({ position: undefined })).not.toEqual([]);
    expect(bad({}, { from: 'stage' })).not.toEqual([]);
    expect(bad({}, { from: ['characters', 'hand'] })).not.toEqual([]);
    expect(bad({}, { pick: { upTo: 2 } })).not.toEqual([]);
    // A cost names the player whose Character it is; it takes exactly 1, from the Characters.
    expect(bad({}, { owner: 'any' }, true)).not.toEqual([]);
    expect(bad({}, { pick: { upTo: 1 } }, true)).not.toEqual([]);
    expect(bad({}, { from: 'stage' }, true)).not.toEqual([]);
  });

  it('the opponent’s Character goes to the opponent’s Life, face-up, at the end you choose (EB02-057)', () => {
    const g = mk();
    run(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    option(g, 'top');
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5]);
    const life = g.zone('p2', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c1, V.c2, V.c3, V.c4]);
    expect(life[0]!.faceUp).toBe(true);
    expect(g.life('p1')).toBe(3);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"bottom" puts it at the bottom', () => {
    const g = mk();
    run(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    option(g, 'bottom');
    expect(g.zone('p2', 'life').map((c) => c.card)).toEqual([V.c2, V.c3, V.c4, V.c1]);
  });

  it('"up to 1": none chosen, nothing moves and nothing is asked after', () => {
    const g = mk();
    run(g);
    g.act({ type: 'done' });
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.life('p2')).toBe(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('a fixed end asks nothing, and the card is face-down unless the text says face-up (OP12-117)', () => {
    const g = mk([intoLife({ owner: 'any' }, { position: 'top', faceUp: undefined })]);
    run(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    const life = g.zone('p2', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c1, V.c2, V.c3, V.c4]);
    expect(life[0]!.faceUp).toBe(false);
  });

  it('"Character with a cost of 6 or less ... of the owner’s Life": your own goes to your own (OP11-116)', () => {
    const g = mk([intoLife({ owner: 'any', filter: { cost: { lte: 6 } } })], {
      characters: [BLUE, V.c4],
    });
    run(g);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    option(g, 'top');
    expect(g.zone('p1', 'life').map((c) => c.card)[0]).toBe(V.c4);
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(3);
  });

  it('both players see the card come off the field; the face-down Life card has no handle and is known to both', () => {
    const g = mk([intoLife({}, { position: 'top', faceUp: undefined })]);
    run(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    for (const viewer of ['p1', 'p2'] as const) {
      const told = projectEvents(g.events, viewer);
      const moved = told.find((e) => e.type === 'CardMoved' && e.to === 'life')!;
      expect(moved.card).toBe(V.c1); // it was on the field: both saw it
      expect(moved.newInstance).toBeUndefined(); // but no handle for where it is now
      const view = project(g.state, viewer) as unknown as ProjectedView;
      expect(view.known['p2.life.0']).toBe(V.c1);
      expect(view.zones.p2.life[0]!.card).toBeNull();
    }
  });

  it('a cost: the opponent’s Character is placed into their Life to pay (OP09-101)', () => {
    const cost = [
      {
        move: {
          from: 'characters',
          owner: 'opponent',
          filter: { cost: { lte: 3 } },
          pick: { exactly: 1 },
        },
        to: { zone: 'life', position: 'top', faceUp: true },
      },
    ];
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c5] },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }] as never, cost as never)]);
    expect(offered(g)).toBe(true);
    const before = hand(g, 'p1').length;
    run(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5]);
    expect(g.zone('p2', 'life')[0]!.card).toBe(V.c1);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
    // With no Character to pay with, the ability is not offered.
    const none = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c5] },
    );
    none.state = withAbilities(none.state, BLUE, [
      main([{ do: { draw: 1 } }] as never, cost as never),
    ]);
    expect(offered(none)).toBe(false);
  });

  it('a Character that cannot be removed by your opponent’s effects cannot pay it: the effect does not resolve', () => {
    const cost = [
      {
        move: {
          from: 'characters',
          owner: 'opponent',
          filter: { cost: { lte: 3 } },
          pick: { exactly: 1 },
        },
        to: { zone: 'life', position: 'top', faceUp: true },
      },
    ];
    const guard = {
      do: {
        restrict: {
          target: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
          what: 'cannotBeRemovedByOpponentEffects',
          duration: 'thisTurn',
        },
      },
    };
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, PURPLE] },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }] as never, cost as never)]);
    g.state = withAbilities(g.state, PURPLE, [{ ...main([guard] as never), id: 'g' } as Ability]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', PURPLE), ability: 'g' });
    const before = hand(g, 'p1').length;
    run(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(before);
    expect(g.life('p2')).toBe(3);
  });

  it('a replacement payload: "add it to the top of your Life cards face-down instead" (OP11-101)', () => {
    const replacement = {
      id: 'r',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: { not: { name: 'Mohji' } },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'you',
                filter: { ref: 'replaced' },
                pick: { exactly: 1 },
              },
              to: { zone: 'life', position: 'top', faceUp: false },
            },
          },
        },
      ],
    } as unknown as Ability;
    expectValid([replacement]);
    // p2's turn: their Character returns p1's V.c3 to the hand.
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c3] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, BLUE, [replacement]);
    g.state = withAbilities(g.state, PURPLE, [
      main([
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 3 } },
                pick: { exactly: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ] as never),
    ]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', PURPLE), ability: 'a' });
    pick(g, [g.find('p1', 'characters', V.c3)]);
    accept(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE]);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c3);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(hand(g, 'p1')).not.toContain(V.c3);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});
