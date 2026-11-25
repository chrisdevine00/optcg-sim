import type { CardScript } from '../../src/dsl.ts';

/** OP09-034 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_034: CardScript = {
  cardId: 'OP09-034',
  textHash: '18b0b968919dae',
  verified: {
    source: 'cards/overrides/OP09-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 [Dracule Mihawk] or {Thriller Bark Pirates} card and add it to your hand; the rest to the bottom in any order; trash 1 card from your hand',
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
                    any: [
                      {
                        name: 'Dracule Mihawk',
                      },
                      {
                        type: 'Thriller Bark Pirates',
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
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the trash of 1 card is not conditioned on a card having been taken ("and trash", not "if you do"); it is taken from the hand after the rest went to the bottom, so the card just added may be the one trashed; with an empty hand nothing is trashed',
  ],
};
