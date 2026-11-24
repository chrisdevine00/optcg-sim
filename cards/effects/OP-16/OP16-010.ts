import type { CardScript } from '../../src/dsl.ts';

/** OP16-010 Namule. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_010: CardScript = {
  cardId: 'OP16-010',
  textHash: '06b372cd19ac54',
  verified: {
    source: 'cards/overrides/OP16-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may reveal 1 Character card with 8000 power from your hand: K.O. up to 1 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 8000,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
