/**
 * M6b wave 6: the hidden-zone classification (cards/src/hidden.ts) and the hidden-gate check
 * (cards/src/hidden-gate.ts) understand the new shapes. The top card of the deck or Life that a
 * `reveal` showed, a play by the opponent from their own hand and "add this card to your hand" read
 * a hidden zone; a filter on printed text, a bound name, a total power, a permanent "played rested",
 * the opponent's DON!! and a timing do not; and a prompt only the opponent sees is still a prompt.
 */
import { describe, expect, it } from 'vitest';
import type { Ability, CardScript } from '../src/dsl.ts';
import { hiddenGateProblems } from '../src/hidden-gate.ts';
import { abilityReadsHiddenZone } from '../src/hidden.ts';

const act = (effect: object[], extra: object = {}): Ability =>
  ({ id: 'a', kind: 'activate', when: 'activateMain', effect, ...extra }) as unknown as Ability;
const reads = (effect: object[], extra: object = {}) => abilityReadsHiddenZone(act(effect, extra));

describe('new shapes and hidden zones', () => {
  it('reads a hidden zone: the revealed top of the deck or Life, the opponent’s hand', () => {
    for (const from of ['deckTop', 'lifeTop'])
      expect(
        reads([
          { do: { reveal: { from, n: 1, bind: 'r' } } },
          {
            do: {
              play: { what: { from, owner: 'you', filter: { ref: 'r' }, pick: { exactly: 1 } } },
            },
          },
        ]),
      ).toBe(true);
    expect(
      reads([
        {
          do: {
            play: {
              player: 'opponent',
              what: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { upTo: 1 } },
            },
          },
        },
      ]),
    ).toBe(true);
  });

  it('"add this card to your hand" moves a card into a hidden zone', () => {
    const ab = {
      id: 't',
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: { from: 'self', owner: 'you', pick: { exactly: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    } as unknown as Ability;
    expect(abilityReadsHiddenZone(ab)).toBe(true);
  });

  it('reads none: printed-text filters, a bound name, a total power, DON!!, the new timing, the permanent', () => {
    const sel = (filter: object, pick: object = { upTo: 1 }) => ({
      from: 'characters',
      owner: 'you',
      filter,
      pick,
    });
    expect(
      reads([{ do: { ko: sel({ all: [{ hasBaseEffect: false }, { hasTiming: 'onPlay' }] }) } }]),
    ).toBe(false);
    expect(reads([{ do: { ko: sel({ sameNameAs: 'x' }) } }], { cost: [{ trashSelf: true }] })).toBe(
      false,
    );
    expect(
      reads([
        {
          do: {
            ko: { ...sel({}), owner: 'opponent', pick: { upTo: 2, totalPower: { lte: 4000 } } },
          },
        },
      ]),
    ).toBe(false);
    expect(reads([{ do: { addDon: [{ n: 1, state: 'active' }], player: 'opponent' } }])).toBe(
      false,
    );
    expect(
      abilityReadsHiddenZone({
        id: 'w',
        kind: 'auto',
        when: [{ event: 'triggerActivated', by: 'opponent' }],
        effect: [{ do: { draw: 1 } }],
      } as unknown as Ability),
    ).toBe(false);
    expect(
      abilityReadsHiddenZone({
        id: 'p',
        kind: 'permanent',
        apply: [{ playRested: { category: ['Character'] } }],
      } as unknown as Ability),
    ).toBe(false);
    // Placing this card at the deck bottom as a cost reads the field card and puts it in a deck.
    expect(
      reads([{ do: { draw: 1 } }], {
        cost: [
          {
            move: { from: 'self', owner: 'you', pick: { exactly: 1 } },
            to: { zone: 'deck', position: 'bottom' },
          },
        ],
      }),
    ).toBe(true);
  });
});

describe('the gate check', () => {
  const inHand = { exists: { from: 'hand', owner: 'you', filter: { category: ['Event'] } } };
  const script = (ab: object): CardScript =>
    ({ cardId: 'T-1', abilities: [{ id: 'x', ...ab }] }) as unknown as CardScript;
  const oppPlay = {
    do: {
      play: {
        player: 'opponent',
        what: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { upTo: 1 } },
      },
    },
  };

  it('the revealed card’s condition is public: the play after it is not a gate', () => {
    const e = [
      { do: { reveal: { from: 'deckTop', n: 1, bind: 'r' } } },
      {
        if: { ref: 'r', matches: { category: ['Character'] } },
        then: [
          {
            may: [
              {
                do: {
                  play: {
                    what: {
                      from: 'deckTop',
                      owner: 'you',
                      filter: { ref: 'r' },
                      pick: { exactly: 1 },
                    },
                  },
                },
              },
            ],
            label: 'play',
          },
        ],
      },
    ];
    expect(
      hiddenGateProblems({ cardId: 'T-1', abilities: [act(e)] } as unknown as CardScript),
    ).toEqual([]);
  });

  it('a hidden condition that decides whether the opponent is asked to play is a gate', () => {
    expect(
      hiddenGateProblems(
        script({ kind: 'auto', when: ['onPlay'], effect: [{ if: inHand, then: [oppPlay] }] }),
      ),
    ).toHaveLength(1);
  });

  it('the same play asked either way is not', () => {
    expect(
      hiddenGateProblems(
        script({
          kind: 'auto',
          when: ['onPlay'],
          effect: [{ if: inHand, then: [oppPlay], else: [oppPlay] }],
        }),
      ),
    ).toEqual([]);
  });
});
