import type { CardScript } from '../../src/dsl.ts';

/** OP18-084 Saint Gunko (Black). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_084: CardScript = {
  cardId: 'OP18-084',
  textHash: '11c130520ecc99',
  verified: {
    source: 'cards/overrides/OP18-084.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4 cards from the top of your deck; reveal up to 1 {Holy Knights of God} type card and add it to your hand. Then, trash the rest',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
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
                    type: 'Holy Knights of God',
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
    {
      id: 'activate',
      label:
        'You may rest 4 of your DON!! cards: play up to 1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 4,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Holy Knights of God',
                    },
                    {
                      cost: {
                        lte: 6,
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
  rulings: [
    'reading: no Once Per Turn on the [Activate: Main]; the rest of the looked-at cards all go to the trash (the {Holy Knights of God} card is optional, "up to 1")',
  ],
};
