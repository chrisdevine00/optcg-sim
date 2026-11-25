/**
 * M6b wave 5: the hidden-zone classification (cards/src/hidden.ts) and the hidden-gate check
 * (cards/src/hidden-gate.ts) understand the new shapes. A shape that reads or moves a hidden card
 * is reported as reading a hidden zone; a number the controller names, a face-state change of
 * public cards and a count of DON!! are not; and a decision gated on a hidden condition is still
 * found when the new prompt (`chooseNumber`) sits behind it.
 */
import { describe, expect, it } from 'vitest';
import type { Ability, CardScript } from '../src/dsl.ts';
import { hiddenGateProblems } from '../src/hidden-gate.ts';
import { abilityReadsHiddenZone } from '../src/hidden.ts';

const act = (effect: object[], extra: object = {}): Ability =>
  ({ id: 'a', kind: 'activate', when: 'activateMain', effect, ...extra }) as unknown as Ability;
const reads = (effect: object[], extra: object = {}) => abilityReadsHiddenZone(act(effect, extra));

describe('new shapes and hidden zones', () => {
  it('reads a hidden zone: the opponent’s deck top, Life top or bottom', () => {
    expect(
      reads([{ do: { reveal: { from: 'deckTop', n: 1, bind: 'r', player: 'opponent' } } }]),
    ).toBe(true);
    expect(
      reads([
        {
          do: {
            move: {
              what: { from: 'lifeTopOrBottom', owner: 'you', pick: { exactly: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ]),
    ).toBe(true);
  });

  it('reads none: a named number, a face-state change, a face-up count, DON!! held back', () => {
    expect(reads([{ do: { chooseNumber: { min: 0, max: 10, bind: 'c' } } }])).toBe(false);
    expect(reads([{ do: { turnLifeFaceDown: 'all' } }])).toBe(false);
    expect(
      reads([{ if: { cmp: [{ lifeFaceUp: 'you' }, '>=', 1] }, then: [{ do: { draw: 1 } }] }]),
    ).toBe(false);
    expect(
      reads([
        {
          do: {
            skipRefresh: {
              from: 'donCostArea',
              owner: 'opponent',
              filter: { state: 'rested' },
              pick: { upTo: 1 },
            },
          },
        },
      ]),
    ).toBe(false);
    expect(reads([{ do: { draw: 1 } }], { cost: [{ returnDon: { atLeast: 1 } }] })).toBe(false);
    expect(
      reads([
        {
          do: {
            restrict: {
              target: { from: 'leader', owner: 'you' },
              what: { cannotAttackTarget: { baseCost: { lte: 7 } } },
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ).toBe(false);
  });

  it('a comparison against a chosen number reads nothing hidden (the revealed card is public)', () => {
    const e = [
      { do: { chooseNumber: { min: 0, max: 10, bind: 'c' } } },
      { do: { reveal: { from: 'deckTop', n: 1, bind: 'r', player: 'opponent' } } },
      {
        if: { ref: 'r', matches: { baseCost: { eq: { chosen: 'c' } } } },
        then: [{ do: { draw: 1 } }],
      },
    ];
    // The ability reads a hidden zone (it reveals one), but the comparison itself is a public fact.
    expect(reads(e)).toBe(true);
    const script = { cardId: 'T-1', abilities: [act(e)] } as unknown as CardScript;
    expect(hiddenGateProblems(script)).toEqual([]);
  });
});

describe('the gate check sees the new prompt', () => {
  const inHand = { exists: { from: 'hand', owner: 'you', filter: { category: ['Event'] } } };
  const script = (ab: object): CardScript =>
    ({ cardId: 'T-1', abilities: [{ id: 'x', ...ab }] }) as unknown as CardScript;
  const choose = { do: { chooseNumber: { min: 0, max: 10, bind: 'c' } } };

  it('a hidden condition that decides whether a number is asked is a gate', () => {
    expect(
      hiddenGateProblems(
        script({ kind: 'auto', when: ['onPlay'], effect: [{ if: inHand, then: [choose] }] }),
      ),
    ).toHaveLength(1);
  });
  it('the same number asked either way is not', () => {
    expect(
      hiddenGateProblems(
        script({
          kind: 'auto',
          when: ['onPlay'],
          effect: [{ if: inHand, then: [choose], else: [choose] }],
        }),
      ),
    ).toEqual([]);
  });
  it('holding back DON!! is a count, not a prompt', () => {
    const skip = {
      do: {
        skipRefresh: {
          from: 'donCostArea',
          owner: 'opponent',
          filter: { state: 'rested' },
          pick: { upTo: 1 },
        },
      },
    };
    expect(
      hiddenGateProblems(
        script({ kind: 'auto', when: ['onPlay'], effect: [{ if: inHand, then: [skip] }] }),
      ),
    ).toEqual([]);
  });
});
