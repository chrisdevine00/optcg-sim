import type { CardScript } from '../../src/dsl.ts';

/** EB03-005. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_005: CardScript = {
  cardId: 'EB03-005',
  textHash: '00005c493e5ed3',
  verified: {
    source: 'cards/overrides/EB03-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Sugar], play up to 1 {Donquixote Pirates} Character with 6000 power or less from your hand rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              name: 'Sugar',
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
                          type: 'Donquixote Pirates',
                        },
                        {
                          power: {
                            lte: 6000,
                          },
                        },
                      ],
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  rested: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader check is an `if` step (no colon); the pick inside is an unguarded "up to 1" on the hand (leak rule); "6000 power or less" is the printed power in hand',
  ],
};
