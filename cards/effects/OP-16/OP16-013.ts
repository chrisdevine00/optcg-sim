import type { CardScript } from '../../src/dsl.ts';

/** OP16-013 McGuy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_013: CardScript = {
  cardId: 'OP16-013',
  textHash: '03f0bcf34bbd1d',
  verified: {
    source: 'cards/overrides/OP16-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "K.O. up to 1 of your opponent's Characters with 8000 base power or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 8000,
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
