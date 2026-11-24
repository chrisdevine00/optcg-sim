/**
 * M6b wave 3, G22: the timing `trashedFromHand` ("when a card is trashed from your hand by an
 * effect"), fired once per instruction with the number trashed (`{ eventCount }`). Whether a cost
 * counts is M6b-Q31 (open): it counts only with `includeCosts`.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '../../../src/index.ts';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, hand, PLAIN_BLUE, PLAIN_PURPLE, pick, PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const trashN = (n: number, owner: 'you' | 'opponent' = 'you') => ({
  do: {
    trashFromHand: {
      from: 'hand',
      owner,
      pick: { exactly: n },
      ...(owner === 'opponent' ? { chooser: 'opponent' } : {}),
    },
  },
});

/** A watcher that draws as many cards as the event moved (checked as a script). */
const watcher = (when: object, id = 'w'): Ability => {
  const ab = {
    id,
    kind: 'auto',
    when: [{ event: 'trashedFromHand', owner: 'you', ...when }],
    effect: [{ do: { draw: { eventCount: true } } }],
  } as Ability;
  expectValid([ab]);
  return ab;
};

const cards5 = [V.c2, V.c3, V.c4, V.c5, V.c6];

describe('G22 trashedFromHand', () => {
  it('fires once per instruction with the number trashed', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], hand: cards5 },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, V.c1, [watcher({})]);
    g.state = withAbilities(g.state, BLUE, [main([trashN(2)] as never)]);
    run(g);
    const ids = [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)];
    pick(g, ids);
    // 5 - 2 trashed + 2 drawn (one event of 2, not two events of 1).
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(g.events.filter((e) => e.type === 'EffectActivated')).toHaveLength(2); // the Main, once the watcher
  });

  it('nothing trashed fires nothing', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], hand: cards5 },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, V.c1, [watcher({})]);
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            trashFromHand: { from: 'hand', owner: 'you', pick: { upTo: 2 } },
          },
        },
      ] as never),
    ]);
    run(g);
    g.act({ type: 'done' }); // choose none
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(g.events.some((e) => e.type === 'EffectActivated' && e.card === V.c1)).toBe(false);
  });

  it('"by you" ignores the opponent’s effect on your hand; "by your opponent" and no qualifier see it', () => {
    const run2 = (by?: 'you' | 'opponent') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE] },
        { leader: PLAIN_BLUE, characters: [PURPLE], hand: [V.c2, V.c3, V.c4] },
      );
      g.state = withAbilities(g.state, PURPLE, [watcher(by ? { by } : {})]);
      g.state = withAbilities(g.state, BLUE, [main([trashN(1, 'opponent')] as never)]);
      const before = hand(g, 'p2').length;
      run(g);
      pick(g, [g.find('p2', 'hand', V.c2)]); // the opponent chooses their own card
      return hand(g, 'p2').length - before;
    };
    expect(run2()).toBe(0); // -1 trashed, +1 drawn
    expect(run2('opponent')).toBe(0);
    expect(run2('you')).toBe(-1); // their own effect only: not this one
  });

  it('the source filter reads the card whose effect trashed them', () => {
    const make = (user: string) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1, V.c7], hand: cards5 },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, V.c7, [watcher({ sourceFilter: { name: 'Blugori' } })]);
      const ab = main([trashN(1)] as never);
      g.state = withAbilities(g.state, user, [ab]);
      const before = hand(g, 'p1').length;
      g.act({ type: 'activate', card: g.find('p1', 'characters', user), ability: 'a' });
      pick(g, [g.find('p1', 'hand', V.c2)]);
      return hand(g, 'p1').length - before;
    };
    expect(make(V.c1)).toBe(0); // Blugori's effect: 1 trashed, 1 drawn
    expect(make(BLUE)).toBe(-1); // Mohji's effect: the watcher is not interested
  });

  it('a cost counts only with includeCosts (M6b-Q31 stays open)', () => {
    const make = (extra: object) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], hand: cards5 },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, V.c1, [watcher(extra)]);
      g.state = withAbilities(g.state, BLUE, [
        main(
          [{ do: { draw: 0 } }],
          [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
        ),
      ]);
      const before = hand(g, 'p1').length;
      run(g);
      pick(g, [g.find('p1', 'hand', V.c2)]);
      return hand(g, 'p1').length - before;
    };
    expect(make({})).toBe(-1);
    expect(make({ includeCosts: true })).toBe(0);
  });

  it('a move from the hand to the trash is a trash by an effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], hand: cards5 },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, V.c1, [watcher({})]);
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            move: {
              what: { from: 'hand', owner: 'you', pick: { exactly: 2 } },
              to: { zone: 'trash' },
            },
          },
        },
      ] as never),
    ]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it('a card moved to the hand, or trashed from the field, is not a hand trash', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], hand: cards5 },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, V.c1, [watcher({})]);
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            move: {
              what: { from: 'characters', owner: 'you', filter: { name: 'Blugori' } },
              to: { zone: 'trash' },
            },
          },
        },
      ] as never),
    ]);
    run(g);
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(g.events.some((e) => e.type === 'EffectActivated' && e.card === V.c1)).toBe(false);
  });

  it('shows the other player nothing of the hand that the plain trash does not', () => {
    const play = (third: string) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], hand: [V.c2, V.c3, third] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, V.c1, [watcher({})]);
      g.state = withAbilities(g.state, BLUE, [main([trashN(2)] as never)]);
      run(g);
      pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
      return JSON.stringify(projectEvents(g.events, 'p2'));
    };
    // Only the third, untouched hand card differs between the two games.
    expect(play(V.c4)).toBe(play(V.c5));
  });

  it('the validator: owner is required, "eventCount" only in an ability that watches it', () => {
    expectValid([watcher({ by: 'opponent', sourceFilter: { type: 'Navy' }, includeCosts: true })]);
    const w = (when: object) => ({
      id: 'w',
      kind: 'auto',
      when: [when],
      effect: [{ do: { draw: { eventCount: true } } }],
    });
    expect(errorsOf(w({ event: 'trashedFromHand' }))).not.toEqual([]);
    expect(errorsOf(w({ event: 'trashedFromHand', owner: 'you', by: 'me' }))).not.toEqual([]);
    expect(
      errorsOf(w({ event: 'trashedFromHand', owner: 'you', includeCosts: false })),
    ).not.toEqual([]);
    expect(errorsOf(w({ event: 'trashedFromHand', owner: 'you', filter: {} }))).not.toEqual([]);
    expect(errorsOf(w({ event: 'lifeRemoved', owner: 'you' }))).not.toEqual([]); // no count there
    expect(errorsOf(w({ event: 'lifeRemoved', owner: 'you', includeCosts: true }))).not.toEqual([]);
  });
});
