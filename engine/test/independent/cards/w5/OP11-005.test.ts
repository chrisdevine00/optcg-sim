/**
 * OP11-005 Smoker (Character, Red, cost 4, 5000, Counter +1000, {Navy}, Special).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)" "[DON!! x1] This Character cannot be K.O.'d by effects of Characters
 * without the <Special> attribute."
 *
 * Rules: [DON!! x1] needs at least 1 DON!! given to this card; only a K.O. by an effect of a
 * Character whose attribute is not <Special> is stopped; a K.O. in battle, by an Event, or by a
 * <Special> Character's effect is not (M6b-Q68: the source is read where it is when the K.O. is
 * checked). Whether the protected Character is offered as a target is left open: the tests pick it
 * when it is offered and assert only that it stays.
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import { withAbilities, type Ability } from '../../../../src/testing.ts';
import {
  at,
  attack,
  blockers,
  canFinish,
  chars,
  choices,
  kind,
  kw,
  LW,
  mine,
  need,
  none,
  passBlock,
  pickInst,
  playRaw,
  theirs,
  trash,
  V13,
  yes,
  type Place,
} from './kit-w5b.ts';

const SMOKER = 'OP11-005';
/** OP16-008 Squard: Red, cost 5, 7000, Slash (not <Special>). [On Play] You may trash 1 of your Characters with 10000 base power: K.O. up to 1 with 8000 power or less. */
const SQUARD = 'OP16-008';
/** OP12-005 Shiki: Red, cost 8, 10000 base power, vanilla. */
const SHIKI = 'OP12-005';
/** OP09-026 Sakazuki: Green, cost 6, 7000, Special. [On Play] If you have 2 or more rested Characters, K.O. up to 1 with cost 5 or less. */
const SAKAZUKI = 'OP09-026';
/** OP12-096 Ursa Shock: Black Event, cost 4, [Main] K.O. up to 1 with cost 4 or less. */
const URSA = 'OP12-096';
/** OP14-102 Kumacy: Yellow, cost 1, 2000, inert (a control target). */
const KUMACY = 'OP14-102';

/** p2's turn: p1 has an active Smoker with `don` DON!! given and Kumacy; p2 holds `hand` and `p2chars`. */
function board(
  hand: string[],
  p2chars: Place[] = [],
  don = 1,
  p1chars: Place[] = [{ card: SMOKER, don }, KUMACY],
) {
  return theirs(
    LW.luffy,
    { characters: p1chars },
    { hand, characters: p2chars, costArea: { active: 10, rested: 0 } },
  );
}

/** Pick `card` of p1 as the K.O. target if it is offered, else choose nothing. */
function aimAt(g: ReturnType<typeof board>, card: string) {
  const target = at(g, 'p1', 'characters', card);
  if (choices(g).includes(target)) pickInst(g, [target]);
  else if (canFinish(g)) none(g);
}

/** Squard: accept, trash Shiki as the cost, stop at the K.O. target prompt. */
function squard(g: ReturnType<typeof board>) {
  playRaw(g, SQUARD);
  yes(g, 'p2');
  // The cost is a pick among p2's Characters (Shiki is the only one: it may be paid on its own).
  if (decision(g)?.purpose === 'cost') pickInst(g, [at(g, 'p2', 'characters', SHIKI)]);
  expect(g.zone('p2', 'characters').some((c) => c.card === SHIKI)).toBe(false);
  need(g, 'choose', 'p2');
}

const alive = (g: ReturnType<typeof board>) =>
  g.zone('p1', 'characters').some((c) => c.card === SMOKER);

describe("OP11-005 Smoker: [Blocker]; with [DON!! x1] it cannot be K.O.'d by effects of non-<Special> Characters", () => {
  it('printed values: cost 4, 5000 power, Counter +1000, has [Blocker]', () => {
    const g = board([]);
    const s = at(g, 'p1', 'characters', SMOKER);
    expect(g.card(s).cost).toBe(4);
    expect(g.power(s)).toBe(5000);
    expect(g.card(s).counter).toBe(1000);
    expect(kw(g, s)).toContain('Blocker');
  });

  it('[Blocker] works: it can be declared as the blocker of an attack on my Leader', () => {
    const g = board([], [V13.hajrudin], 0);
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    expect(blockers(g)).toContain(at(g, 'p1', 'characters', SMOKER));
  });

  it('control: without DON!! the same Squard effect K.O.s Smoker', () => {
    const g = board([SQUARD], [SHIKI], 0);
    squard(g);
    aimAt(g, SMOKER);
    expect(alive(g)).toBe(false);
    expect(trash(g, 'p1')).toContain(SMOKER);
  });

  it('with 1 DON!! given, a non-<Special> Character (Squard, Slash) cannot K.O. it by its effect', () => {
    const g = board([SQUARD], [SHIKI], 1);
    squard(g);
    aimAt(g, SMOKER);
    expect(alive(g)).toBe(true);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('[DON!! x1] means at least 1: with 2 DON!! given it is protected as well', () => {
    const g = board([SQUARD], [SHIKI], 2);
    squard(g);
    aimAt(g, SMOKER);
    expect(alive(g)).toBe(true);
  });

  it('a <Special> Character (Sakazuki) can K.O. it even with DON!! given', () => {
    const g = board(
      [SAKAZUKI],
      [
        { card: V13.sai, rested: true },
        { card: V13.marco, rested: true },
      ],
      1,
    );
    playRaw(g, SAKAZUKI);
    need(g, 'choose', 'p2');
    aimAt(g, SMOKER);
    expect(alive(g)).toBe(false);
    expect(trash(g, 'p1')).toContain(SMOKER);
  });

  it('an Event is not a Character: Ursa Shock K.O.s it even with DON!! given', () => {
    const g = board([URSA], [], 1);
    playRaw(g, URSA);
    need(g, 'choose', 'p2');
    aimAt(g, SMOKER);
    expect(alive(g)).toBe(false);
  });

  it("a K.O. in battle is not an effect: a rested Smoker with DON!! hit by a 10000 attacker is K.O.'d", () => {
    const g = board([], [SHIKI], 1, [{ card: SMOKER, don: 1, rested: true }]);
    attack(g, at(g, 'p2', 'characters', SHIKI), at(g, 'p1', 'characters', SMOKER));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(chars(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([SMOKER]);
  });

  it('must not: Kumacy beside Smoker gets no protection from the same non-<Special> effect', () => {
    const g = board([SQUARD], [SHIKI], 1);
    squard(g);
    aimAt(g, KUMACY);
    expect(chars(g, 'p1')).toEqual([SMOKER]);
    expect(kind(g)).toBe('main');
  });

  it("W57-R9: \"effects\" is either player's: Smoker's own non-<Special> Character cannot K.O. it either (kills cause 'effect' to 'opponentEffect')", () => {
    const g = mine(
      LW.luffy,
      { characters: [{ card: SMOKER, don: 1 }, SQUARD], costArea: { active: 9, rested: 0 } },
      {},
    );

    g.state = withAbilities(g.state, SQUARD, [
      {
        id: 'k',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              ko: {
                from: 'characters',
                owner: 'you',
                filter: { name: 'Smoker' },
                pick: { exactly: 1 },
              },
            },
          },
        ],
      } as Ability,
    ]);
    act(g, { type: 'activate', card: g.find('p1', 'characters', SQUARD), ability: 'k' });
    expect(chars(g, 'p1').sort()).toEqual([SMOKER, SQUARD].sort());
    expect(trash(g, 'p1')).toEqual([]);
    // Control: with no DON!! given the same effect K.O.s it.
    const c = mine(LW.luffy, { characters: [{ card: SMOKER, don: 0 }, SQUARD] }, {});

    c.state = withAbilities(c.state, SQUARD, [
      {
        id: 'k',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              ko: {
                from: 'characters',
                owner: 'you',
                filter: { name: 'Smoker' },
                pick: { exactly: 1 },
              },
            },
          },
        ],
      } as Ability,
    ]);
    act(c, { type: 'activate', card: c.find('p1', 'characters', SQUARD), ability: 'k' });
    expect(chars(c, 'p1')).toEqual([SQUARD]);
  });
});
