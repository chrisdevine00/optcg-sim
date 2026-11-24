import type { CardScript } from '../../src/dsl.ts';

/** EB04-047 Helmeppo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_047: CardScript = {
  cardId: 'EB04-047',
  textHash: '177d167fc651a9',
  verified: {
    source: 'cards/overrides/EB04-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Trash this Character: play up to 1 {SWORD} Character with cost 3 or less other than [Helmeppo] from hand or trash',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: ['hand', 'trash'],
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'SWORD',
                    },
                    {
                      cost: {
                        lte: 3,
                      },
                    },
                    {
                      not: {
                        name: 'Helmeppo',
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
};
