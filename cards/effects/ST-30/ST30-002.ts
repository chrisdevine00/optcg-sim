import type { CardScript } from '../../src/dsl.ts';

/** ST30-002 Inazuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_002: CardScript = {
  cardId: 'ST30-002',
  textHash: '1ca601986ff59a',
  verified: {
    source: 'cards/overrides/ST30-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; reveal up to 1 Character with 6000 power to hand, the rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        category: ['Character'],
                      },
                      {
                        power: {
                          eq: 6000,
                        },
                      },
                    ],
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
    'reading: "Character card with 6000 power" is read on the card in the deck, so its printed power; "in any order" is the owner\'s order (engine lookAtTop bottomAnyOrder)',
  ],
};
