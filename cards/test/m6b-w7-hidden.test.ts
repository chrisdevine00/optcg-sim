/**
 * M6b wave 7: the hidden-zone classification (cards/src/hidden.ts) and the hidden-gate check
 * (cards/src/hidden-gate.ts) understand the new shapes. Looking at Life cards reads a hidden zone;
 * a Character placed into a Life area moves into one; DON!! given, an attack's target, a stat of
 * the Leader, the total cost of the field, a power cost on the Leader, an attribute grant and the
 * permanent negate read none; and the prompts the new actions ask are prompts.
 */
import { describe, expect, it } from 'vitest';
import type { Ability, CardScript } from '../src/dsl.ts';
import { hiddenGateProblems, promptsOf } from '../src/hidden-gate.ts';
import { abilityReadsHiddenZone } from '../src/hidden.ts';

const act = (effect: object[], extra: object = {}): Ability =>
  ({ id: 'a', kind: 'activate', when: 'activateMain', effect, ...extra }) as unknown as Ability;
const reads = (effect: object[], extra: object = {}) => abilityReadsHiddenZone(act(effect, extra));
const own = { from: 'characters', owner: 'you', pick: { exactly: 1 } };

describe('wave 7 shapes and hidden zones', () => {
  it('looking at Life cards reads a hidden zone', () => {
    expect(reads([{ do: { lookAtLife: { owner: 'any', n: 1, place: 'topOrBottom' } } }])).toBe(
      true,
    );
    expect(reads([{ do: { lookAtLife: { owner: 'you', n: 'all', place: 'anyOrder' } } }])).toBe(
      true,
    );
  });

  it('a Character placed into a Life area moves into a hidden zone; one read from the field alone does not', () => {
    expect(
      reads([
        {
          do: {
            move: {
              what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top', faceUp: false },
            },
          },
        },
      ]),
    ).toBe(true);
    // As a cost too.
    expect(
      abilityReadsHiddenZone(
        act([{ do: { draw: 1 } }], {
          cost: [
            {
              move: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
              to: { zone: 'life', position: 'top', faceUp: true },
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ['moving DON!! between your cards', [{ do: { moveDon: { n: 1, from: own, to: own } } }]],
    [
      'an attribute grant',
      [{ do: { grant: { target: own, attribute: 'Slash', duration: 'thisTurn' } } }],
    ],
    [
      'a restriction on your own Life moves',
      [
        {
          do: {
            restrict: {
              target: 'you',
              what: 'cannotAddLifeToHandByOwnEffects',
              duration: 'thisTurn',
            },
          },
        },
      ],
    ],
    [
      'the Leader’s stat as an amount',
      [
        {
          do: {
            power: {
              target: own,
              amount: { statOf: { from: 'leader', owner: 'you' }, stat: 'basePower' },
              duration: 'thisTurn',
            },
          },
        },
      ],
    ],
    [
      'the total cost of the field in a condition',
      [
        {
          if: {
            cmp: [{ totalCost: { from: 'characters', owner: 'you' } }, '>=', 5],
          },
          then: [{ do: { draw: 1 } }],
        },
      ],
    ],
  ])('%s reads no hidden zone', (_name, effect) => {
    expect(reads(effect as object[])).toBe(false);
  });

  it('a redirect of an attack, a power cost on the Leader and the permanent negate read none', () => {
    expect(
      abilityReadsHiddenZone({
        id: 'r',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [{ do: { redirectAttack: { to: own } } }],
      } as unknown as Ability),
    ).toBe(false);
    expect(
      reads([{ do: { draw: 1 } }], {
        cost: [
          {
            power: {
              target: { from: 'leader', owner: 'you', pick: { exactly: 1 } },
              amount: -5000,
              duration: 'thisTurn',
            },
          },
        ],
      }),
    ).toBe(false);
    expect(
      abilityReadsHiddenZone({
        id: 'n',
        kind: 'permanent',
        apply: [{ negate: { target: { from: ['leader', 'characters'], owner: 'you' } } }],
      } as unknown as Ability),
    ).toBe(false);
  });

  it('a look at Life is a prompt, so a hidden condition that decides whether it is asked is a gate', () => {
    expect(
      promptsOf([{ do: { lookAtLife: { owner: 'any', n: 1, place: 'topOrBottom' } } }]),
    ).toEqual(expect.arrayContaining([expect.stringContaining('lifeLook')]));
    const script = {
      cardId: 'ZZ99-001',
      textHash: 'x',
      verified: { source: 't', date: '2026-11-25' },
      abilities: [
        {
          id: 'g',
          kind: 'auto',
          when: ['onPlay'],
          conditions: [{ exists: { from: 'hand', owner: 'you' } }],
          effect: [{ do: { lookAtLife: { owner: 'any', n: 1, place: 'topOrBottom' } } }],
        },
      ],
    } as unknown as CardScript;
    expect(hiddenGateProblems(script)).not.toEqual([]);
  });

  it('moving DON!! and redirecting an attack are prompts when they pick', () => {
    expect(promptsOf([{ do: { moveDon: { n: 1, from: own, to: own } } }] as never)).toHaveLength(2);
    expect(promptsOf([{ do: { redirectAttack: { to: own } } }] as never)).toHaveLength(1);
  });
});
