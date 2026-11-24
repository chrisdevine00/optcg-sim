import type { CardScript } from '../../src/dsl.ts';

/** OP14-010 Basil Hawkins. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_010: CardScript = {
  cardId: 'OP14-010',
  textHash: '05866b67ef424c',
  verified: {
    source: 'cards/overrides/OP14-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Look at 5; play up to 1 {Supernovas} Character with 2000 power or less other than [Basil Hawkins]; the rest to the bottom',
      kind: 'auto',
      when: ['onKO'],
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
                        type: 'Supernovas',
                      },
                      {
                        power: {
                          lte: 2000,
                        },
                      },
                      {
                        not: {
                          name: 'Basil Hawkins',
                        },
                      },
                    ],
                  },
                  to: 'play',
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
    'reading: the card is played free and active (not rested); the rest (placed in any order) go to the bottom; "up to 1" may take nothing. A full Character area asks which to trash, as any play',
  ],
};
