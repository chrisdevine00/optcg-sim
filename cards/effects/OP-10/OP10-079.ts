import type { CardScript } from '../../src/dsl.ts';

/** OP10-079 God Thread. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_079: CardScript = {
  cardId: 'OP10-079',
  textHash: '19511a7f0c7974',
  verified: {
    source: 'cards/overrides/OP10-079.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "K.O. up to 1 of your opponent's Characters with a cost of 5 or less; then add up to 1 DON!! card from your DON!! deck and set it as active",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
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
  rulings: ['reading: "Then" is sequential: the DON!! is added even when nothing was K.O.\'d'],
};
