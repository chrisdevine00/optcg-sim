import type { CardScript } from '../../src/dsl.ts';

/** OP17-062 Kaido. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_062: CardScript = {
  cardId: 'OP17-062',
  textHash: '0322498cbeefa0',
  verified: {
    source: 'cards/overrides/OP17-062.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'don-back',
      label: 'Add up to 1 active DON!!; then set up to 1 of your DON!! active',
      kind: 'auto',
      when: [
        {
          event: 'donReturned',
          owner: 'you',
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      oncePerTurn: true,
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
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
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
