import type { CardScript } from '../../src/dsl.ts';

/** OP17-016 Rakuyo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_016: CardScript = {
  cardId: 'OP17-016',
  textHash: '1790a13bf7ccec',
  verified: {
    source: 'cards/overrides/OP17-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "K.O. up to 2 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 2000,
                },
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
