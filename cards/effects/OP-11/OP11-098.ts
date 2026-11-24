import type { CardScript } from '../../src/dsl.ts';

/** OP11-098 Blue Hole. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_098: CardScript = {
  cardId: 'OP11-098',
  textHash: '1af7763f5dd9e7',
  verified: {
    source: 'cards/overrides/OP11-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may trash 3 cards from the top of your deck: K.O. up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          mill: 3,
        },
      ],
      costOptional: true,
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
    {
      id: 'trigger',
      label: 'Up to 1 of your Leader or Character cards gains +1000 power during this turn',
      kind: 'trigger',
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
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
