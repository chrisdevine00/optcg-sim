import type { CardScript } from '../../src/dsl.ts';

/** OP10-062 Violet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_062: CardScript = {
  cardId: 'OP10-062',
  textHash: '173b005f736c49',
  verified: {
    source: 'cards/overrides/OP10-062.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'DON!! -1: if your Leader has the {Donquixote Pirates} type, add up to 1 purple Event from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Event'],
                        },
                        {
                          color: 'Purple',
                        },
                      ],
                    },
                    pick: {
                      upTo: 1,
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
    },
  ],
  rulings: [
    'reading: the DON!! -1 is paid whether or not the Leader has the type (the "If" is after the colon)',
  ],
};
