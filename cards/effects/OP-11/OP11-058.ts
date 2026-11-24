import type { CardScript } from '../../src/dsl.ts';

/** OP11-058 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_058: CardScript = {
  cardId: 'OP11-058',
  textHash: '1db46c4da15652',
  verified: {
    source: 'cards/overrides/OP11-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cannot-attack',
      label: 'With 5 or more cards in your hand, this Character cannot attack',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              hand: 'you',
            },
            '>=',
            5,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotAttack',
          },
        },
      ],
    },
  ],
};
