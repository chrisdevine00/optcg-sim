import type { CardScript } from '../../src/dsl.ts';

/** OP11-061 Gum-Gum Jet Culverin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_061: CardScript = {
  cardId: 'OP11-061',
  textHash: '16eec2fc2cbc90',
  verified: {
    source: 'cards/overrides/OP11-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Place up to 1 of your opponent's Characters with a base cost of 4 or less at the bottom of the owner's deck",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  baseCost: {
                    lte: 4,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Place up to 1 Character with a cost of 1 or less at the bottom of the owner's deck",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 1,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the [Trigger] may place either player\'s Character (no "of your opponent"); base cost (printed) for the [Main], current cost for the [Trigger]',
  ],
};
