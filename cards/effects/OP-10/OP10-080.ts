import type { CardScript } from '../../src/dsl.ts';

/** OP10-080 Little Black Bears. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_080: CardScript = {
  cardId: 'OP10-080',
  textHash: '06bf387bbab957',
  verified: {
    source: 'cards/overrides/OP10-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +4000 power during this battle; then, if you have 7 or more DON!! cards on your field and 5 or less cards in your hand, draw 1 card',
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
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            all: [
              {
                cmp: [
                  {
                    donOnField: 'you',
                  },
                  '>=',
                  7,
                ],
              },
              {
                cmp: [
                  {
                    hand: 'you',
                  },
                  '<=',
                  5,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'trigger',
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "DON!! cards on your field" counts the cost area (active and rested) plus given DON!!; the hand is counted after this Event has left it',
  ],
};
