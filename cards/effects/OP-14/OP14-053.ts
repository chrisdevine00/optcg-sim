import type { CardScript } from '../../src/dsl.ts';

/** OP14-053 Vista. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_053: CardScript = {
  cardId: 'OP14-053',
  textHash: '141a2f781d1bf0',
  verified: {
    source: 'cards/overrides/OP14-053.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'mirror',
      label:
        "[Opponent's Turn] With 7 or less cards in your hand, this Character's base power becomes the same as your Leader's base power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          cmp: [
            {
              hand: 'you',
            },
            '<=',
            7,
          ],
        },
      ],
      apply: [
        {
          setBasePower: {
            target: {
              from: 'self',
              owner: 'you',
            },
            value: {
              statOf: {
                from: 'leader',
                owner: 'you',
              },
              stat: 'basePower',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G67, M6b-Q84): the Leader\'s base power is its printed power (not raised by DON!! or effects), read when the layers are computed; "7 or less" counts the hand at that moment, so the base power flips back at 8 cards',
  ],
};
