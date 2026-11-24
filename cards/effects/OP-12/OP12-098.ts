import type { CardScript } from '../../src/dsl.ts';

/** OP12-098 Hair Removal Fist. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_098: CardScript = {
  cardId: 'OP12-098',
  textHash: '19abb48436f6f5',
  verified: {
    source: 'cards/overrides/OP12-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +2000 power during this battle; with a Revolutionary Army Character of cost 8+, that card gains an additional +2000',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
                bind: 'buffed',
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Revolutionary Army',
                  },
                  {
                    cost: {
                      gte: 8,
                    },
                  },
                ],
              },
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: {
                      ref: 'buffed',
                    },
                  },
                  amount: 2000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card and trash 1 card from the top of your deck',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            mill: {
              player: 'you',
              n: 1,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "that card" is the card chosen for the first +2000, so no card chosen means no second boost; the cost-8 check is on current cost and is read after the first boost resolves',
  ],
};
