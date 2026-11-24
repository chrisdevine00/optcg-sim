import type { CardScript } from '../../src/dsl.ts';

/** OP12-086 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_086: CardScript = {
  cardId: 'OP12-086',
  textHash: '0e6500c69e77e1',
  verified: {
    source: 'cards/overrides/OP12-086.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a Revolutionary Army Leader: look at 3, reveal up to 1 Revolutionary Army card other than [Koala] or [Nico Robin], add it, trash the rest',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Revolutionary Army',
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
                            all: [
                              {
                                type: 'Revolutionary Army',
                              },
                              {
                                not: {
                                  name: 'Koala',
                                },
                              },
                            ],
                          },
                          {
                            name: 'Nico Robin',
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
  rulings: [
    'reading: "up to 1 ... or up to 1 [Nico Robin]" is one pick of up to 1 card that is either',
  ],
};
