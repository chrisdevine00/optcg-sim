import type { CardScript } from '../../src/dsl.ts';

/** OP16-006 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_006: CardScript = {
  cardId: 'OP16-006',
  textHash: '1441640d678cb8',
  verified: {
    source: 'cards/overrides/OP16-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may rest 2 DON!!: K.O. up to 1 of your opponent's Characters with 4000 power or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 4000,
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
