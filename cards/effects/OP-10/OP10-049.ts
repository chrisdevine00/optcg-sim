import type { CardScript } from '../../src/dsl.ts';

/** OP10-049 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_049: CardScript = {
  cardId: 'OP10-049',
  textHash: '04e91961908d68',
  verified: {
    source: 'cards/overrides/OP10-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your Character with a base cost of 7 or less other than [Sabo] would be removed from the field by your opponent's effect, you may return this Character to the owner's hand instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            all: [
              {
                baseCost: {
                  lte: 7,
                },
              },
              {
                not: {
                  name: 'Sabo',
                },
              },
            ],
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'you',
                filter: {
                  isSelf: true,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "other than [Sabo]" excludes every Character named [Sabo] (this one and any copy); no Once Per Turn is printed, so each removal may be answered',
  ],
};
