import type { CardScript } from '../../src/dsl.ts';

/** OP10-106 Killer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_106: CardScript = {
  cardId: 'OP10-106',
  textHash: '15f157f05b0978',
  verified: {
    source: 'cards/overrides/OP10-106.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'With a Supernovas Leader: look at 3, reveal up to 1 Supernovas or Kid Pirates card and add it to your hand; place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            leader: {
              type: 'Supernovas',
            },
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 3,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        any: [
                          {
                            type: 'Supernovas',
                          },
                          {
                            type: 'Kid Pirates',
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
          ],
        },
      ],
    },
  ],
};
