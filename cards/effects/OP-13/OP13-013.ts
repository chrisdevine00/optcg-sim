import type { CardScript } from '../../src/dsl.ts';

/** OP13-013 Higuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_013: CardScript = {
  cardId: 'OP13-013',
  textHash: '1e10caa507ff3c',
  verified: {
    source: 'cards/overrides/OP13-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'K.O. up to 1 opposing Character with 0 power or less',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
              filter: {
                power: {
                  lte: 0,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
