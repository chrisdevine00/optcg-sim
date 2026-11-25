import type { CardScript } from '../../src/dsl.ts';

/** OP10-006 Caesar Clown. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_006: CardScript = {
  cardId: 'OP10-006',
  textHash: '1ae40d144f6a11',
  verified: {
    source: 'cards/overrides/OP10-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 [Smiley] and add it to your hand; the rest to the bottom in any order; play up to 1 [Smiley] from your hand',
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
                    name: 'Smiley',
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
                      name: 'Smiley',
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
    'reading: "Then, place the rest ... and play up to 1 [Smiley] from your hand" is one sequence with no condition: the play happens after the rest go to the bottom, whether or not a [Smiley] was added (a [Smiley] already in hand can be played)',
  ],
};
