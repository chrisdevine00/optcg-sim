import type { CardScript } from '../../src/dsl.ts';

/** OP16-053 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_053: CardScript = {
  cardId: 'OP16-053',
  textHash: '170f8fc570bb7d',
  verified: {
    source: 'cards/overrides/OP16-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label: 'If you have 6 or less cards in your hand, draw 1',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              6,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
};
