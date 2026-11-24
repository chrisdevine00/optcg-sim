import type { CardScript } from '../../src/dsl.ts';

/** OP16-011 Vista. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_011: CardScript = {
  cardId: 'OP16-011',
  textHash: '0cb2d570d043b4',
  verified: {
    source: 'cards/overrides/OP16-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may reveal 1 Character card with 8000 power from your hand: draw 1',
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
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "[DON!! x1] K.O. up to 2 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
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
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
