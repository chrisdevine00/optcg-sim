import type { CardScript } from '../../src/dsl.ts';

/** OP02-005 Curly.Dadan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP02_005: CardScript = {
  cardId: 'OP02-005',
  textHash: '09bdd6c5429341',
  verified: {
    source: 'cards/overrides/OP02-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; reveal up to 1 red Character with a cost of 1 and add it to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: {
                    all: [{ category: ['Character'] }, { color: 'Red' }, { cost: { eq: 1 } }],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "red" includes a multicolor card with red; the cost is the printed cost (a card in the deck has no modifiers)',
  ],
};
