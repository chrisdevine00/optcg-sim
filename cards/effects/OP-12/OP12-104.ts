import type { CardScript } from '../../src/dsl.ts';

/** OP12-104 Sentomaru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_104: CardScript = {
  cardId: 'OP12-104',
  textHash: '1c667342d13926',
  verified: {
    source: 'cards/overrides/OP12-104.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with cost 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
