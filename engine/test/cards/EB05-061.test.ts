/** EB05-061 Nami: [Once Per Turn] If one of your Characters with 6000 base power or less would be removed from the field by your opponent, you may add 1 card from the top of your Life cards to your hand instead. [On Play] Play up to 1 red Character card with a cost of 2 or less from your hand. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';
import { PLAIN_BLUE, plantOpponentEffect } from './helpers-rgl-penel.ts';
import { ids } from './helpers-robin.ts';

const NAMI = 'EB05-061';
/** EB05-003 Pasia: red, cost 1. OP01-023 Marco: red, cost 3. OP01-012 Sai: red, cost 2. */
const RED1 = 'EB05-003';
const RED2 = 'OP01-012';
const RED3 = 'OP01-023';

describe('EB05-061 Nami', () => {
  /** p2 runs an effect that K.O.s the p1 Characters matching `filter`. */
  const koByEffect = (chars: string[], life: string[], filter: Record<string, unknown>) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [NAMI, ...chars], life },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent', filter } });
    return g;
  };

  it('a Character with 6000 base power or less K.O.ed by an opponent effect: add the top Life card to hand instead', () => {
    const g = koByEffect([V.c4], [BLUE, PURPLE, PURPLE], { basePower: { eq: 6000 } });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([NAMI, V.c4].sort());
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('may be declined: the Character is K.O.ed and the Life stays', () => {
    const g = koByEffect([V.c4], [PURPLE, PURPLE, PURPLE], { basePower: { eq: 6000 } });
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(g.life('p1')).toBe(3);
  });

  it('protects Nami herself (base power 4000)', () => {
    const g = koByEffect([], [PURPLE, PURPLE], { name: 'Nami' });
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([NAMI]);
  });

  it('does not protect a Character with 7000 base power', () => {
    const g = koByEffect([V.c5], [PURPLE, PURPLE], { basePower: { eq: 7000 } });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(ids(g, 'p1', 'characters')).toEqual([NAMI]);
  });

  it('is once per turn: a second removal the same turn is not replaced', () => {
    const g = koByEffect([V.c4, V.c3], [PURPLE, PURPLE, PURPLE], { basePower: { eq: 6000 } });
    accept(g);
    plantOpponentEffect(g, {
      ko: { from: 'characters', owner: 'opponent', filter: { basePower: { eq: 5000 } } },
    });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([NAMI, V.c4].sort());
    expect(g.life('p1')).toBe(2);
  });

  it('cannot be used with 0 Life cards', () => {
    const g = koByEffect([V.c4], [], { basePower: { eq: 6000 } });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(ids(g, 'p1', 'characters')).toEqual([NAMI]);
  });

  it('reading (M6b-Q7): a K.O. in battle is not replaced', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [NAMI, { card: V.c4, rested: true }],
        life: [PURPLE, PURPLE],
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', V.c4));
    expect(ids(g, 'p1', 'characters')).toEqual([NAMI]);
    expect(g.life('p1')).toBe(2);
  });

  describe('[On Play]', () => {
    const onPlay = (handExtra: string[]) =>
      game(
        { leader: PLAIN_PURPLE, hand: [NAMI, ...handExtra], costArea: { active: 3, rested: 0 } },
        { leader: PLAIN_BLUE },
      );

    it('plays a red Character with a cost of 2 or less from hand', () => {
      const g = onPlay([RED1, RED2, RED3, BLUE]);
      play(g, NAMI);
      // Candidates: the two red cost 1 and 2 cards only.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      pick(g, [g.find('p1', 'hand', RED2)]);
      expect(ids(g, 'p1', 'characters').sort()).toEqual([NAMI, RED2].sort());
    });

    it('with no red card of cost 2 or less nothing is played', () => {
      const g = onPlay([RED3, BLUE]);
      play(g, NAMI);
      none(g);
      expectDecision(g, 'main', 'p1');
      expect(ids(g, 'p1', 'characters')).toEqual([NAMI]);
    });
  });
});
