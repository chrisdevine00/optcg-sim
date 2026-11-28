import type { CardScript } from '../../src/dsl.ts';

/** OP18-009 Super Spot-Billed Duck Troops. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_009: CardScript = {
  cardId: 'OP18-009',
  textHash: '172c6e3e3b8534',
  verified: {
    source: 'cards/overrides/OP18-009.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'trash-self',
      label:
        'You may trash this Character: with 9 or more DON!! on your field, play up to 1 [Karoo] from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              9,
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
                          name: 'Karoo',
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
    'reading: "If you have 9 or more DON!! cards on your field" has no colon before it, so it is an effect condition: the trash cost is paid even when it fails; DON!! on the field = cost area plus given',
  ],
};
