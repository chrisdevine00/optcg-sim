/**
 * M6b wave 6, G50: "Your Character cards are played rested" (OP09-022 Lim). A permanent effect
 * read by the play: every matching card its controller plays, from the hand or by an effect, enters
 * rested. Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const rested = (filter: unknown = { category: ['Character'] }, extra: Partial<Ability> = {}) =>
  ({
    id: 'p',
    kind: 'permanent',
    apply: [{ playRested: filter }],
    ...extra,
  }) as Ability;

/** p1's Leader carries the permanent; p1 holds a cost 2 and a cost 5 Character, 6 active DON!!. */
const mk = (ab: Ability = rested()) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [BLUE],
      hand: [V.c2, V.c5],
      trash: [V.c4],
      costArea: { active: 9, rested: 0 },
    },
    { leader: PLAIN_BLUE, hand: [V.c3], costArea: { active: 9, rested: 0 } },
  );
  g.state = withAbilities(g.state, PLAIN_PURPLE, [ab]);
  return g;
};
const play = (g: ReturnType<typeof mk>, card: string) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', card) });

describe('G50 Characters you play enter rested', () => {
  it('validates, and refuses the nonsense', () => {
    expectValid([rested()]);
    expectValid([rested({ all: [{ category: ['Character'] }, { cost: { lte: 5 } }] })]);
    // The filter reads the card being played by its printed values: nothing relative, no state.
    expect(errorsOf(rested({ state: 'rested' }))).not.toEqual([]);
    expect(errorsOf(rested({ ref: 'x' }))).not.toEqual([]);
    expect(errorsOf(rested({ isSelf: true }))).not.toEqual([]);
    expect(errorsOf({ ...rested(), apply: [{ playRested: true }] })).not.toEqual([]);
  });

  it('a Character played from the hand enters rested', () => {
    const g = mk();
    play(g, V.c2);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(true);
  });

  it('a Character played from the trash by an effect enters rested', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([
        { do: { play: { what: { from: 'trash', owner: 'you', pick: { upTo: 1 } } } } },
      ] as never),
    ]);
    run(g);
    g.act({ type: 'pick', choice: g.find('p1', 'trash', V.c4) });
    expect(g.card(g.find('p1', 'characters', V.c4)).rested).toBe(true);
  });

  it('applies to a play by an effect (a [On Play] that plays from the hand)', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([
        { do: { play: { what: { from: 'hand', owner: 'you', pick: { upTo: 1 } } } } },
      ] as never),
    ]);
    run(g);
    g.act({ type: 'pick', choice: g.find('p1', 'hand', V.c2) });
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', BLUE)).rested).toBe(false);
  });

  it('the filter limits it: only cards it matches enter rested', () => {
    const g = mk(rested({ all: [{ category: ['Character'] }, { cost: { lte: 3 } }] }));
    play(g, V.c2);
    play(g, V.c5);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', V.c5)).rested).toBe(false);
  });

  it('is your own plays only: the opponent’s Characters enter active', () => {
    const g = mk();
    g.act({ type: 'endTurn' });
    g.act({ type: 'playCard', card: g.find('p2', 'hand', V.c3) });
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('applies while its source is on the field and stops when it is gone', () => {
    const g = mk(rested(undefined));
    g.state = withAbilities(g.state, PLAIN_PURPLE, []);
    g.state = withAbilities(g.state, BLUE, [rested()]);
    play(g, V.c2);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(true);
    g.state = applyOp(g.state, {
      op: 'trashFromField',
      card: g.find('p1', 'characters', BLUE),
      by: 'p2',
    }).state;
    play(g, V.c5);
    expect(g.card(g.find('p1', 'characters', V.c5)).rested).toBe(false);
  });

  it('a negated source plays nothing rested', () => {
    const g = mk();
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'negate',
        target: g.leader('p1'),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    play(g, V.c2);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(false);
  });

  it('a Character that enters rested cannot attack (it needs Rush and an active card)', () => {
    const g = mk();
    play(g, V.c2);
    const id = g.find('p1', 'characters', V.c2);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === id)).toBe(false);
  });
});
