import type { CardScript } from '../../src/dsl.ts';

/** OP16-051 Mohji & Cabaji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_051: CardScript = {
  cardId: 'OP16-051',
  textHash: '0422a570ef1e82',
  verified: {
    source: 'cards/overrides/OP16-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If you have 5 or less cards in your hand, draw 2',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              5,
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
};
