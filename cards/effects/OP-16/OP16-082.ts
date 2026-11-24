import type { CardScript } from '../../src/dsl.ts';

/** OP16-082 Kin'emon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_082: CardScript = {
  cardId: 'OP16-082',
  textHash: '1536200bb1b56f',
  verified: {
    source: 'cards/overrides/OP16-082.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-up',
      label: 'This Character gains +3 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'With a {Land of Wano} Leader: look at 5, reveal up to 1 {Land of Wano} card to your hand, trash the rest',
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
                  n: 5,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        type: 'Land of Wano',
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
