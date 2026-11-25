/**
 * M6b wave 5, G39: a `delayed` body reads the selections its creating effect bound (OP11-092: "play
 * up to 1 ... from your trash. Then, place the 1 Character played by this effect at the bottom of
 * the owner's deck at the end of this turn"). Planted on vanilla cards; each test fails with the
 * gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities } from '../../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const effect = (ref = 'p') =>
  [
    {
      do: {
        play: {
          what: {
            from: 'trash',
            owner: 'you',
            filter: { category: ['Character'] },
            pick: { exactly: 1 },
            bind: 'p',
          },
        },
      },
    },
    {
      delayed: { at: 'endOfThisTurn' },
      do: [
        {
          do: {
            move: {
              what: { from: 'characters', owner: 'any', filter: { ref } },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ],
    },
  ] as never;

const mk = () => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], trash: [V.c2] },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect())]);
  return g;
};

describe('G39 delayed steps that remember bound cards', () => {
  it('validates a ref inside the delayed body, and still refuses an unbound one', () => {
    main(effect());
    expect(
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: effect('nothing') }),
    ).not.toEqual([]);
  });

  it('places the Character the effect played at the bottom of the deck at the end of the turn', () => {
    const g = mk();
    run(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE, V.c2]);
    g.act({ type: 'endTurn' });
    // Only the Character that was played goes; the one that activated the effect stays.
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BLUE]);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(V.c2);
  });

  it('does nothing when the Character has left the field by then', () => {
    const g = mk();
    run(g);
    g.state = applyOp(g.state, {
      op: 'trashFromField',
      card: g.find('p1', 'characters', V.c2),
      by: 'p2',
    }).state;
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'deck').at(-1)?.card).not.toBe(V.c2);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(V.c2);
  });

  it('a body with no bound card still works (nothing is carried that was not bound)', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([{ delayed: { at: 'endOfThisTurn' }, do: [{ do: { draw: 1 } }] }] as never),
    ]);
    const before = g.zone('p1', 'hand').length;
    run(g);
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'hand').length).toBe(before + 1);
  });
});
