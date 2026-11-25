/**
 * M6b wave 7, G63: "this card in your hand cannot be played by effects" (OP12-036 Roronoa Zoro).
 * A permanent of a card in the hand (`zone: 'hand'`) that bars the card itself from an effect's
 * play; playing it from the hand by the rules stays legal. Planted on vanilla cards; each test
 * fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, none, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const barred = (over: object = {}, zone: 'hand' | 'field' = 'hand') =>
  ({
    id: 'p',
    kind: 'permanent',
    zone,
    apply: [
      {
        restrict: {
          target: { from: 'self', owner: 'you', ...over },
          what: 'cannotBePlayedByEffects',
        },
      },
    ],
  }) as unknown as Ability;
const playSmall = {
  do: {
    play: {
      what: { from: 'hand', owner: 'you', filter: { cost: { lte: 2 } }, pick: { upTo: 1 } },
    },
  },
};

/** p1 holds V.c2 (barred) and V.c1 (not); BLUE plays a Character with a cost of 2 or less from the hand. */
const mk = () => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [BLUE],
      hand: [V.c2, V.c1],
      costArea: { active: 5, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main([playSmall] as never)]);
  g.state = withAbilities(g.state, V.c2, [barred()]);
  return g;
};

describe('G63 this card in your hand cannot be played by effects', () => {
  it('validates, and refuses the nonsense', () => {
    expectValid([barred()]);
    expect(errorsOf(barred({}, 'field'))).not.toEqual([]); // only a hand permanent
    expect(errorsOf(barred({ from: 'characters' }))).not.toEqual([]); // only this card
    expect(errorsOf(barred({ filter: { cost: { lte: 1 } } }))).not.toEqual([]);
    // Not for a while: a timed restriction on a card in a hand is not what the card says.
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              restrict: {
                target: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
                what: 'cannotBePlayedByEffects',
                duration: 'thisTurn',
              },
            },
          },
        ],
      }),
    ).not.toEqual([]);
  });

  it('an effect that plays a card from your hand cannot choose it', () => {
    const g = mk();
    run(g);
    // Only V.c1 can be played: the choice offers it alone.
    expect(dec(g)!.kind).toBe('choose');
    const offeredCards = g.legal().filter((a) => a.type === 'pick');
    expect(offeredCards.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p1', 'hand', V.c1),
    ]);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE, V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('with nothing else to play, the effect has no candidate', () => {
    const g = mk();
    run(g);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('the normal play from the hand stays legal', () => {
    const g = mk();
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', V.c2)),
    ).toBe(true);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c2) });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c2);
  });

  it('it bars only while the card is in the hand: from the trash an effect may play it', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        trash: [V.c2],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    const fromTrash = {
      do: {
        play: {
          what: { from: 'trash', owner: 'you', filter: { cost: { lte: 2 } }, pick: { upTo: 1 } },
        },
      },
    };
    g.state = withAbilities(g.state, BLUE, [main([fromTrash] as never)]);
    g.state = withAbilities(g.state, V.c2, [barred()]);
    run(g);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c2);
  });
});
