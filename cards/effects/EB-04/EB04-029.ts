import type { CardScript } from '../../src/dsl.ts';

/** EB04-029 I Heard the Sound...of a Lady's Teardrops Falling. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_029: CardScript = {
  cardId: 'EB04-029',
  textHash: '05fdc4afcf6964',
  verified: {
    source: 'cards/overrides/EB04-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'With [Sanji] as Leader, look at 3; add up to 1 [Sanji] or Event card to your hand, trash the rest',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              name: 'Sanji',
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
                            name: 'Sanji',
                          },
                          {
                            category: ['Event'],
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
    {
      id: 'counter',
      label: 'Trash 1 card: up to 1 of your [Sanji] cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Sanji',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
