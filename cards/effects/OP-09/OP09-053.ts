import type { CardScript } from '../../src/dsl.ts';

/** OP09-053 Mohji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_053: CardScript = {
  cardId: 'OP09-053',
  textHash: '11cd7f96140dd9',
  verified: {
    source: 'cards/overrides/OP09-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 [Richie] and add it to your hand; the rest to the bottom in any order; play up to 1 [Richie] from your hand',
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
                    name: 'Richie',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      name: 'Richie',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the play is not conditioned on a card having been revealed ("Then ... and play", not "if you do"): a [Richie] already in hand may be played; the card just added may be the one played',
  ],
};
