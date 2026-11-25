import type { CardScript } from '../../src/dsl.ts';

/** OP10-070 Trebol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_070: CardScript = {
  cardId: 'OP10-070',
  textHash: '151fe1e3dfd6ac',
  verified: {
    source: 'cards/overrides/OP10-070.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "All of your Characters with 1000 base power or less cannot be K.O.'d by your opponent's effects until the end of your opponent's next turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'you', filter: { basePower: { lte: 1000 } } },
              what: { cannotBeKOd: { cause: 'opponentEffect' } },
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "1000 base power or less" is the printed base power (boundary: 1000 is in, 2000 is out); the protection goes to the Characters on the field at resolution only (Trebol himself has 5000 and gets none) and lasts until the end of the opponent\'s next turn; it stops a K.O. by the opponent\'s effects, not your own effects or battle',
  ],
};
