import type { CardScript } from '../../src/dsl.ts';

/** OP11-076 Hannyabal. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_076: CardScript = {
  cardId: 'OP11-076',
  textHash: '10c9b81725c5a0',
  verified: {
    source: 'cards/overrides/OP11-076.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'If your Leader has the "Impel Down" type, play up to 1 "Impel Down" Character with cost 3 or less from your hand',
      effect: [
        {
          if: {
            leader: {
              type: 'Impel Down',
            },
          },
          then: [
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
                          type: 'Impel Down',
                        },
                        {
                          cost: {
                            lte: 3,
                          },
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
    },
  ],
};
