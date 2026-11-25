import type { CardScript } from '../../src/dsl.ts';

/** OP10-115 Let's Meet Again in the New World. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_115: CardScript = {
  cardId: 'OP10-115',
  textHash: '1d26a1eda28fbb',
  verified: {
    source: 'cards/overrides/OP10-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +4000 power during this battle; then, if you have 0 Life cards, draw 1 card',
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
            cmp: [
              {
                life: 'you',
              },
              '=',
              0,
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
      label:
        "K.O. up to 1 of your opponent's Characters with a cost equal to or less than the number of your opponent's Life cards",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: {
                    life: 'opponent',
                  },
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
  rulings: [
    "reading: the [Trigger] reads the opponent's Life when it resolves (the card that triggered it has already left Life); with 0 Life only cost-0 Characters qualify",
  ],
};
