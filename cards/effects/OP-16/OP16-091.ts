import type { CardScript } from '../../src/dsl.ts';

/** OP16-091 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_091: CardScript = {
  cardId: 'OP16-091',
  textHash: '1f0ce98f63559f',
  verified: {
    source: 'cards/overrides/OP16-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a {Land of Wano} Leader: look at 4, reveal up to 1 {Land of Wano} card other than [Nami] to your hand, trash the rest',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Land of Wano',
            },
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 4,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        all: [
                          {
                            type: 'Land of Wano',
                          },
                          {
                            not: {
                              name: 'Nami',
                            },
                          },
                        ],
                      },
                      reveal: true,
                      to: 'hand',
                    },
                  ],
                  rest: 'trash',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
