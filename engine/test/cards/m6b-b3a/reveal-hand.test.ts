/**
 * Block 3 batch A fix round, B3B-R3: "Reveal up to N ... from your hand" (OP10-119 Law, OP10-058
 * Rebecca) as an effect. A selector with `reveal: true` emits a `CardRevealed` (reason `effect`)
 * for each chosen card, once chosen, as a cost `reveal` does; the other cards of the hand and a
 * pick that was declined reveal nothing. Planted on vanilla cards; each test fails with the
 * runtime change reverted.
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '@optcg/engine';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, dec, game, none, PLAIN_BLUE, PLAIN_PURPLE, pick, PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const hand = (reveal: boolean, extra: object = {}) => ({
  from: 'hand',
  owner: 'you',
  pick: { upTo: 1 },
  ...(reveal ? { reveal: true } : {}),
  ...extra,
});

/** "Reveal up to 1 from your hand and add it to the top of your Life" as a probe. */
const toLife = (reveal: boolean) =>
  main([{ do: { move: { what: hand(reveal), to: { zone: 'life', position: 'top' } } } }] as never);
/** "Reveal up to 2 from your hand" and nothing else (a bound selection). */
const selectTwo = (reveal: boolean) =>
  main([{ do: { select: hand(reveal, { pick: { upTo: 2 }, bind: 'r' }) } }] as never);

const two = () =>
  game(
    { leader: PLAIN_PURPLE, characters: [BLUE], hand: [V.c1, V.c2, V.c3] },
    { leader: PLAIN_BLUE, characters: [PURPLE] },
  );

const revealed = (g: ReturnType<typeof two>) =>
  g.events
    .filter((e) => e.type === 'CardRevealed')
    .map((e) => ({ card: e.card, reason: e.reason }));

describe('B3B-R3 reveal from the hand as an effect', () => {
  it('validates only for your own hand and only as true', () => {
    for (const bad of [
      { from: 'characters', owner: 'you', pick: { upTo: 1 }, reveal: true },
      { from: 'hand', owner: 'opponent', pick: { upTo: 1 }, reveal: true },
      { from: 'hand', owner: 'you', pick: { upTo: 1 }, reveal: false },
    ])
      expect(
        errorsOf({
          id: 'a',
          kind: 'activate',
          when: 'activateMain',
          effect: [{ do: { select: bad } }],
        }),
      ).not.toEqual([]);
  });

  it('a move to Life announces the chosen card, and only it', () => {
    const g = two();
    g.state = withAbilities(g.state, BLUE, [toLife(true)]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(revealed(g)).toEqual([{ card: V.c2, reason: 'effect' }]);
    // The opponent's projected events carry the identity (the card went face-down into Life).
    expect(
      projectEvents(g.events, 'p2').some((e) => e.type === 'CardRevealed' && e.card === V.c2),
    ).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('without the flag nothing is announced (control)', () => {
    const g = two();
    g.state = withAbilities(g.state, BLUE, [toLife(false)]);
    run(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(revealed(g)).toEqual([]);
    expect(g.life('p1')).toBe(4);
  });

  it('declining the pick reveals nothing', () => {
    const g = two();
    g.state = withAbilities(g.state, BLUE, [toLife(true)]);
    run(g);
    none(g);
    expect(revealed(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('a select of 2 announces both cards chosen, not the third one in hand', () => {
    const g = two();
    g.state = withAbilities(g.state, BLUE, [selectTwo(true)]);
    run(g);
    expect(dec(g)?.kind).toBe('choose');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c3)]);
    expect(revealed(g).map((r) => r.card)).toEqual([V.c1, V.c3]);
    expect(revealed(g).every((r) => r.reason === 'effect')).toBe(true);
  });
});
