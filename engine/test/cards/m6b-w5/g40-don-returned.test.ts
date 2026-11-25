/**
 * M6b wave 5, G40: the `donReturned` timing's qualifiers, `min` ("2 or more DON!! cards ... are
 * returned", OP09-061, EB02-035) and `cause` ("by your effect", EB03-033). Planted on vanilla
 * cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, don, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const watcher = (timing: object): Ability =>
  ({ id: 'w', kind: 'auto', when: [timing], effect: [{ do: { draw: 1 } }] }) as Ability;
const ret = (n: number) => ({ do: { returnDon: { n } } });

/** p1's [Activate: Main] returns `n` of p1's DON!!; p1's V.c1 watches with `timing`. */
const mine = (timing: object, n: number, cost?: object[]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 4, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [PURPLE] },
  );
  g.state = withAbilities(g.state, V.c1, [watcher(timing)]);
  g.state = withAbilities(g.state, BLUE, [
    cost ? main([{ do: { draw: 0 } }] as never, cost as never) : main([ret(n)] as never),
  ]);
  return g;
};

describe('G40 donReturned: minimum count at once', () => {
  it('validates min and refuses the nonsense', () => {
    expectValid([watcher({ event: 'donReturned', owner: 'you', min: 2 })]);
    expect(errorsOf(watcher({ event: 'donReturned', owner: 'you', min: 1 }))).not.toEqual([]);
    expect(errorsOf(watcher({ event: 'donReturned', owner: 'you', min: 2.5 }))).not.toEqual([]);
    // `min` belongs to the donReturned event alone.
    expect(errorsOf(watcher({ event: 'lifeRemoved', owner: 'you', min: 2 }))).not.toEqual([]);
    expect(errorsOf(watcher({ event: 'donReturned', owner: 'you', cause: 'battle' }))).not.toEqual(
      [],
    );
  });

  it('2 or more at once fires; 1 does not', () => {
    const t = { event: 'donReturned', owner: 'you', min: 2 };
    const two = mine(t, 2);
    const before = hand(two, 'p1').length;
    run(two);
    expect(hand(two, 'p1').length).toBe(before + 1);

    const one = mine(t, 1);
    const b1 = hand(one, 'p1').length;
    run(one);
    expect(hand(one, 'p1').length).toBe(b1);
  });

  it('two separate returns of 1 do not add up to 2', () => {
    const t = { event: 'donReturned', owner: 'you', min: 2 };
    const g = mine(t, 1);
    g.state = withAbilities(g.state, BLUE, [
      main([ret(1), ret(1)] as never), // two instructions, one DON!! each
    ]);
    const before = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1').length).toBe(before);
  });

  it('a DON!! −N cost that returns 2 is one event of 2', () => {
    const t = { event: 'donReturned', owner: 'you', min: 2 };
    const g = mine(t, 0, [{ donMinus: 2 }]);
    const before = hand(g, 'p1').length;
    run(g);
    expect(don(g, 'p1').deck).toBe(8);
    expect(hand(g, 'p1').length).toBe(before + 1);
  });
});

describe('G40 donReturned: by whose effect', () => {
  const OPP = { event: 'donReturned', owner: 'you', cause: 'opponentEffect' };
  const OWN = { event: 'donReturned', owner: 'you', cause: 'yourEffect' };
  /** p2's turn: p2's Character makes p1 return 1 DON!!, p1's V.c1 watches. */
  const forced = (timing: object) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [watcher(timing)]);
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { returnDon: { n: 1, player: 'opponent' } } }] as never),
    ]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'a' });
    return g;
  };

  it('your own effect (or cost) fires "by your effect" and not "by an opponent’s effect"', () => {
    const own = mine(OWN, 1);
    const b = hand(own, 'p1').length;
    run(own);
    expect(hand(own, 'p1').length).toBe(b + 1);

    const notOpp = mine(OPP, 1);
    const b2 = hand(notOpp, 'p1').length;
    run(notOpp);
    expect(hand(notOpp, 'p1').length).toBe(b2);

    // A DON!! −N cost is part of the effect (RL-16, M6b-Q31).
    const cost = mine(OWN, 0, [{ donMinus: 1 }]);
    const b3 = hand(cost, 'p1').length;
    run(cost);
    expect(hand(cost, 'p1').length).toBe(b3 + 1);
  });

  it('the opponent making you return DON!! fires "by an opponent’s effect" only', () => {
    const count = (timing: object) => hand(forced(timing), 'p1').length;
    expect(count(OPP)).toBe(1);
    expect(count(OWN)).toBe(0);
    expect(count({ event: 'donReturned', owner: 'you', cause: 'effect' })).toBe(1);
    expect(count({ event: 'donReturned', owner: 'you' })).toBe(1);
  });

  it('owner "opponent" watches the other player’s DON!! (it fired for your own before)', () => {
    // p1's own effect makes p2 return DON!!: a watcher of "your opponent's DON!!" fires, one of
    // "your DON!!" does not.
    const make = (owner: 'you' | 'opponent') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
        { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 3, rested: 0 } },
      );
      g.state = withAbilities(g.state, V.c1, [watcher({ event: 'donReturned', owner })]);
      g.state = withAbilities(g.state, BLUE, [
        main([{ do: { returnDon: { n: 1, player: 'opponent' } } }] as never),
      ]);
      const before = hand(g, 'p1').length;
      run(g);
      return hand(g, 'p1').length - before;
    };
    expect(make('opponent')).toBe(1);
    expect(make('you')).toBe(0);
    // And your own DON!! returned does not fire the "opponent" watcher.
    const g = mine({ event: 'donReturned', owner: 'opponent' }, 1);
    const before = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1').length).toBe(before);
  });
});
