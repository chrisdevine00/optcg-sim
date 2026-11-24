import type { CardScript } from '../../src/dsl.ts';

/** OP11-115 You're Just Not My Type!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_115: CardScript = {
  cardId: 'OP11-115',
  textHash: '0f33d3068daa27',
  verified: {
    source: 'cards/overrides/OP11-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If your Leader is [Shirahoshi], up to 1 of your Leader or Character cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            leader: {
              name: 'Shirahoshi',
            },
          },
          then: [
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
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 2,
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
  ],
};
