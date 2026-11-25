/**
 * M6b wave 8a, G69: the condition `handTrashedThisTurn` ("a card in your hand was trashed by an
 * effect during this turn", ST33-004 Borsalino), read by a permanent of a card in the hand.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const discount = (who: 'you' | 'opponent' = 'you'): Ability =>
  ({
    id: 'p',
    kind: 'permanent',
    zone: 'hand',
    conditions: [{ handTrashedThisTurn: who }],
    apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -3 } }],
  }) as unknown as Ability;

const trashOne = (owner: 'you' | 'opponent' = 'you') => ({
  do: {
    trashFromHand: {
      from: 'hand',
      owner,
      pick: { exactly: 1 },
      ...(owner === 'opponent' ? { chooser: 'opponent' } : {}),
    },
  },
});

/** p1 holds V.c6 (the discounted card), V.c1 and V.c2; BLUE runs the probe. */
const mk = (who: 'you' | 'opponent' = 'you') => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], hand: [V.c6, V.c1, V.c2] },
    { leader: PLAIN_BLUE, hand: [V.c3, V.c4] },
  );
  g.state = withAbilities(g.state, V.c6, [discount(who)]);
  return g;
};
const costOf = (g: ReturnType<typeof mk>) => g.card(g.find('p1', 'hand', V.c6)).cost;

describe('G69 a card in your hand was trashed by an effect this turn', () => {
  it('validates, and takes only a player', () => {
    expectValid([discount()]);
    expectValid([discount('opponent')]);
    expect(errorsOf({ ...discount(), conditions: [{ handTrashedThisTurn: 'me' }] })).not.toEqual(
      [],
    );
    expect(errorsOf({ ...discount(), conditions: [{ handTrashedThisTurn: true }] })).not.toEqual(
      [],
    );
  });

  it('the card costs its printed 6 until a card of your hand is trashed, then 3', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [main([trashOne()] as never)]);
    expect(costOf(g)).toBe(6);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(costOf(g)).toBe(3);
  });

  it('a cost trash counts (a cost is part of the effect, M6b-Q31)', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main(
        [{ do: { draw: 1 } }] as never,
        [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }] as never,
      ),
    ]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(costOf(g)).toBe(3);
  });

  it('whose hand: "you" ignores the opponent’s hand and "opponent" ignores yours', () => {
    const mine = mk('you');
    mine.state = withAbilities(mine.state, BLUE, [main([trashOne('opponent')] as never)]);
    run(mine);
    pick(mine, [mine.find('p2', 'hand', V.c3)]);
    expect(costOf(mine)).toBe(6); // the opponent's hand lost a card, not mine

    const theirs = mk('opponent');
    theirs.state = withAbilities(theirs.state, BLUE, [main([trashOne('opponent')] as never)]);
    run(theirs);
    pick(theirs, [theirs.find('p2', 'hand', V.c3)]);
    expect(costOf(theirs)).toBe(3);
  });

  it('a card that leaves the hand some other way (to the deck) does not count', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            move: {
              what: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ] as never),
    ]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(costOf(g)).toBe(6);
  });

  it('only this turn: the discount is gone on the next turn', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [main([trashOne()] as never)]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(costOf(g)).toBe(3);
    g.act({ type: 'endTurn' });
    expect(costOf(g)).toBe(6);
  });
});
