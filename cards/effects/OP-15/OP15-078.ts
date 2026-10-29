import type { CardScript } from '../../src/dsl.ts';

/** OP15-078 Mamaragan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_078: CardScript = {
  cardId: 'OP15-078',
  textHash: '1202d3c2253cb3',
  verified: {
    source: 'cards/overrides/OP15-078.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      label: "Draw 1; then rest up to 1 of your opponent's Characters with 5000 power or less",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 5000,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: '+1000 power during this battle; then draw 1 with 6 or less DON!! on your field',
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
              amount: 1000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '<=',
              6,
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
  ],
  rulings: ['QA-OP15 OP15-078: the [Main] may be used with no target to rest'],
};
