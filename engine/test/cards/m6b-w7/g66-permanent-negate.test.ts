/**
 * M6b wave 7, G66: a permanent `negate` stage (OP13-064 Gol.D.Roger: "your Leader and all of your
 * Characters that do not have a type including "Roger Pirates" have their effects negated"). The
 * cards a permanent names are negated at the first stage of the layers; a negated source produces
 * nothing, and a source never negates itself. Planted on vanilla cards; each test fails with the
 * gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main, offered } from '../m6b-w1/probe.ts';

const R = V.c7; // Urashima: the vanilla that plays Roger
const negator = (target: object = {}): Ability =>
  ({
    id: 'n',
    kind: 'permanent',
    apply: [
      {
        negate: {
          target: {
            from: ['leader', 'characters'],
            owner: 'you',
            filter: { not: { name: 'Urashima' } },
            ...target,
          },
        },
      },
    ],
  }) as unknown as Ability;
const plusTwo = {
  id: 'p',
  kind: 'permanent',
  apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 2000 } }],
} as unknown as Ability;

const mk = (withR: boolean, extra: object = {}) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: withR ? [BLUE, R] : [BLUE],
      hand: withR ? [] : [R],
      ...extra,
    },
    { leader: PLAIN_BLUE, characters: [PURPLE] },
  );
  g.state = withAbilities(g.state, R, [negator()]);
  g.state = withAbilities(g.state, BLUE, [plusTwo, main([{ do: { draw: 1 } }] as never)]);
  return g;
};
const blue = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', BLUE);

describe('G66 a permanent negate stage', () => {
  it('validates, and refuses the nonsense', () => {
    expectValid([negator()]);
    const bad = (t: object) => errorsOf(negator(t));
    // A permanent names every match: no choice, no binding; printed values only.
    expect(bad({ pick: { upTo: 1 } })).not.toEqual([]);
    expect(bad({ bind: 'x' })).not.toEqual([]);
    expect(bad({ filter: { state: 'rested' } })).not.toEqual([]);
    expect(bad({ filter: { keyword: 'Blocker' } })).not.toEqual([]);
    expect(bad({ from: 'hand' })).not.toEqual([]);
    // A timed negate is the action; the permanent has no duration.
    expect(
      errorsOf({
        id: 'n',
        kind: 'permanent',
        apply: [{ negate: { target: { from: 'leader', owner: 'you' }, duration: 'thisTurn' } }],
      }),
    ).not.toEqual([]);
  });

  it('without the source, the Character’s effects work', () => {
    const g = mk(false);
    expect(g.power(blue(g))).toBe(5000);
    expect(g.card(blue(g)).negated).toBeFalsy();
    expect(offered(g)).toBe(true);
  });

  it('with the source, its effects are negated: no power from its permanent, no activation', () => {
    const g = mk(true);
    expect(g.card(blue(g)).negated).toBe(true);
    expect(g.power(blue(g))).toBe(3000);
    expect(offered(g)).toBe(false);
  });

  it('your Leader is named too', () => {
    const g = mk(true);
    expect(g.card(g.leader('p1')).negated).toBe(true);
  });

  it('the source is not named by its own filter, and the opponent’s cards are not yours', () => {
    const g = mk(true);
    expect(g.card(g.find('p1', 'characters', R)).negated).toBeFalsy();
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.card(g.find('p2', 'characters', PURPLE)).negated).toBeFalsy();
  });

  it('a source never negates itself, even if its filter would name it', () => {
    const g = mk(true);
    g.state = withAbilities(g.state, R, [
      negator({ filter: { category: ['Character'] } }),
      // keeps the +2000 test below honest: R has no other permanent
    ]);
    expect(g.card(g.find('p1', 'characters', R)).negated).toBeFalsy();
    expect(g.card(blue(g)).negated).toBe(true);
  });

  it('a negated source produces nothing: a timed negate on Roger lifts the negation', () => {
    // p2's turn: their Leader negates p1's Roger for the turn.
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, R] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, R, [negator()]);
    g.state = withAbilities(g.state, BLUE, [plusTwo]);
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      main([
        {
          do: {
            negate: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { name: 'Urashima' },
                pick: { exactly: 1 },
              },
              duration: 'thisTurn',
            },
          },
        },
      ] as never),
    ]);
    // On p2's turn the BLUE Character's permanent power does not show for p2's view of power, so
    // read it on p1's: BLUE has +2000 only when it is not negated.
    expect(g.card(g.find('p1', 'characters', BLUE)).negated).toBe(true);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'a' });
    expect(g.card(g.find('p1', 'characters', R)).negated).toBe(true);
    expect(g.card(g.find('p1', 'characters', BLUE)).negated).toBeFalsy();
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(5000);
  });

  it('a negated Leader’s and Characters’ [On Play] and [On K.O.] do nothing while Roger is out', () => {
    const onPlay = {
      id: 'o',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { draw: 2 } }],
    } as unknown as Ability;
    const g = game(
      { leader: PLAIN_PURPLE, characters: [R], hand: [BLUE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, R, [negator()]);
    g.state = withAbilities(g.state, BLUE, [onPlay]);
    const handBefore = g.zone('p1', 'hand').length;
    g.act({ type: 'playCard', card: g.find('p1', 'hand', BLUE) });
    // BLUE is played (the hand is one fewer) and its [On Play] is negated: nothing drawn.
    expect(g.zone('p1', 'hand')).toHaveLength(handBefore - 1);
  });
});
