import type { CardScript } from '../../src/dsl.ts';

/** OP12-033 Helmeppo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_033: CardScript = {
  cardId: 'OP12-033',
  textHash: '1dcc93410b5a48',
  verified: {
    source: 'cards/overrides/OP12-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-block',
      label: "Rest up to 1 of your opponent's Characters with cost 5 or less",
      kind: 'auto',
      when: ['onBlock'],
      effect: [
        {
          do: {
            rest: {
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
      ],
    },
  ],
};
