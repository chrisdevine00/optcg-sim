/**
 * OP14-003 Capone"Gang"Bege (Character, Red, cost 1, 2000, Counter +1000, {Firetank Pirates}/
 * {Supernovas}, Ranged).
 *
 * Card text: "This Character cannot be K.O.'d by effects of your opponent's Characters with 5000 base
 * power or less."
 *
 * Rules: only a K.O. by an effect of an opposing Character whose BASE power is 5000 or less is
 * stopped; a K.O. in battle, by an Event, or by an effect of a Character with a higher base power is
 * not (M6b-Q68: the source is read where it is when the K.O. is checked). Base power ignores DON!!
 * and other boosts (CR 2-10-2). Whether the protected Character is offered as a target is left open:
 * the tests pick it when it is offered and assert only that it stays.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import { withAbilities, type Ability } from '../../../../src/testing.ts';
import {
  at,
  attack,
  canFinish,
  chars,
  choices,
  kind,
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
} from './kit-w5b.ts';

const BEGE = 'OP14-003';
/** OP14-102 Kumacy: Yellow, cost 1, 2000, inert on the field (a control target). */
const KUMACY = 'OP14-102';
/** ST35-001 Hack: Red, cost 4, base 4000, [On Play] K.O. up to 1 with 2000 base power or less. */
const HACK = 'ST35-001';
/** OP16-006 Shanks: Red, cost 4, base 5000, [On Play] You may rest 2 DON!!: K.O. up to 1 with 4000 power or less. */
const SHANKS5 = 'OP16-006';
/** OP17-060 Ulti & Page One: Purple, cost 6, base 6000, [On Play] ... Then, K.O. up to 1 with 3000 power or less. */
const ULTI6 = 'OP17-060';
/** ST21-010 Nico Robin: Red, cost 3, base 4000, [DON!! x2][When Attacking] K.O. up to 1 with 4000 power or less. */
const ROBIN4 = 'ST21-010';
/** OP12-096 Ursa Shock: Black Event, cost 4, [Main] K.O. up to 1 with cost 4 or less. */
const URSA = 'OP12-096';
/** ST04-001 Kaido: Purple Leader, {Animal Kingdom Pirates}. */
const KAIDO = 'ST04-001';

/** p2's turn: p1 has Bege and Kumacy (both active); p2 holds `hand` with 10 active DON!!. */
function board(hand: string[], leader: string = LW.luffy) {
  return theirs(
    LW.luffy,
    { characters: [BEGE, KUMACY] },
    { leader, hand, costArea: { active: 10, rested: 0 } },
  );
}

/** Play `card` for p2 and answer the "you may" / cost prompts until the K.O. target prompt. */
function toTarget(g: ReturnType<typeof board>, card: string) {
  playRaw(g, card);
  for (let i = 0; i < 4 && kind(g) === 'optional'; i++) yes(g, 'p2');
  need(g, 'choose', 'p2');
}

/** Pick `card` of p1 as the K.O. target if it is offered, else choose nothing. */
function aimAt(g: ReturnType<typeof board>, card: string) {
  const target = at(g, 'p1', 'characters', card);
  if (choices(g).includes(target)) pickInst(g, [target]);
  else if (canFinish(g)) none(g);
}

const onField = (g: ReturnType<typeof board>, card: string) =>
  g.zone('p1', 'characters').some((c) => c.card === card);

describe('OP14-003 Capone"Gang"Bege: cannot be K.O.\'d by effects of opposing Characters with 5000 base power or less', () => {
  it('printed values: cost 1, 2000 power, Counter +1000', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'characters', BEGE));
    expect(c.cost).toBe(1);
    expect(g.power(c.instance)).toBe(2000);
    expect(c.counter).toBe(1000);
  });

  it('control: the same Hack effect K.O.s an unprotected 2000-base Character (Kumacy)', () => {
    const g = board([HACK]);
    toTarget(g, HACK);
    aimAt(g, KUMACY);
    expect(chars(g, 'p1')).toEqual([BEGE]);
    expect(trash(g, 'p1')).toEqual([KUMACY]);
  });

  it('a 4000-base Character (Hack) cannot K.O. Bege by its effect', () => {
    const g = board([HACK]);
    toTarget(g, HACK);
    aimAt(g, BEGE);
    expect(onField(g, BEGE)).toBe(true);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('boundary: exactly 5000 base power (Shanks) is still stopped', () => {
    const g = board([SHANKS5]);
    toTarget(g, SHANKS5);
    aimAt(g, BEGE);
    expect(onField(g, BEGE)).toBe(true);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('boundary: 6000 base power (Ulti & Page One) K.O.s it', () => {
    const g = board([ULTI6], KAIDO);
    toTarget(g, ULTI6);
    aimAt(g, BEGE);
    expect(onField(g, BEGE)).toBe(false);
    expect(trash(g, 'p1')).toEqual([BEGE]);
  });

  it('base power is what counts: a 4000-base Character with 2 DON!! (6000 power now) is still stopped', () => {
    const g = theirs(
      LW.luffy,
      { characters: [BEGE, KUMACY] },
      { characters: [{ card: ROBIN4, don: 2 }], costArea: { active: 8, rested: 0 } },
    );
    expect(g.power(at(g, 'p2', 'characters', ROBIN4))).toBe(6000);
    attack(g, at(g, 'p2', 'characters', ROBIN4), g.leader('p1'));
    need(g, 'choose', 'p2');
    aimAt(g, BEGE);
    expect(onField(g, BEGE)).toBe(true);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('an Event is not a Character: Ursa Shock K.O.s it', () => {
    const g = board([URSA]);
    toTarget(g, URSA);
    aimAt(g, BEGE);
    expect(onField(g, BEGE)).toBe(false);
    expect(trash(g, 'p1')).toEqual([BEGE]);
  });

  it("a K.O. in battle is not an effect: a rested Bege hit by a 6000 attacker is K.O.'d", () => {
    const g = theirs(
      LW.luffy,
      { characters: [{ card: BEGE, rested: true }] },
      { characters: [V13.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), at(g, 'p1', 'characters', BEGE));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(chars(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([BEGE]);
  });

  it('must not: Kumacy, beside Bege, is not protected by it', () => {
    const g = board([SHANKS5]);
    toTarget(g, SHANKS5);
    aimAt(g, KUMACY);
    expect(chars(g, 'p1')).toEqual([BEGE]);
  });

  it("W57-R9: only an OPPONENT's effect is stopped: my own 4000-base Character's effect K.O.s Bege (kills cause 'opponentEffect' to 'effect')", () => {
    const g = mine(LW.luffy, { characters: [BEGE, HACK] }, {});

    g.state = withAbilities(g.state, HACK, [
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
                filter: { name: 'Capone"Gang"Bege' },
                pick: { exactly: 1 },
              },
            },
          },
        ],
      } as Ability,
    ]);
    act(g, { type: 'activate', card: g.find('p1', 'characters', HACK), ability: 'k' });
    expect(chars(g, 'p1')).toEqual([HACK]);
    expect(trash(g, 'p1')).toEqual([BEGE]);
  });
});
