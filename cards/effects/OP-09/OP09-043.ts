import type { CardScript } from '../../src/dsl.ts';

/** OP09-043 Alvida. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_043: CardScript = {
  cardId: 'OP09-043',
  textHash: '0c3c474254bc77',
  verified: {
    source: 'cards/overrides/OP09-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'If your Leader has the {Cross Guild} type, play up to 1 Character with a cost of 5 or less other than [Alvida] from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            leader: {
              type: 'Cross Guild',
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
                          cost: {
                            lte: 5,
                          },
                        },
                        {
                          not: {
                            name: 'Alvida',
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
  rulings: [
    'reading: any K.O. (battle or effect) triggers it; no colon, so an effect `if` on the Leader (checked as it resolves); "cost of 5 or less" is inclusive and Characters only; another card named [Alvida] is excluded too',
  ],
};
