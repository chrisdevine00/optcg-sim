import type { CardScript } from '../../src/dsl.ts';

/** OP17-007 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_007: CardScript = {
  cardId: 'OP17-007',
  textHash: '1fd0c0dd3c918c',
  verified: {
    source: 'cards/overrides/OP17-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Edward.Newgate] or has the {Land of Wano} type, play up to 1 {Land of Wano} Character or "Whitebeard Pirates" Character with 6000 power or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            any: [
              {
                leader: {
                  name: 'Edward.Newgate',
                },
              },
              {
                leader: {
                  type: 'Land of Wano',
                },
              },
            ],
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
                          any: [
                            {
                              type: 'Land of Wano',
                            },
                            {
                              typeIncludes: 'Whitebeard Pirates',
                            },
                          ],
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
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
