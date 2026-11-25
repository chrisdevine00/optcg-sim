import type { CardScript } from '../../src/dsl.ts';

/** PRB02-009 Mr.3(Galdino). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_009: CardScript = {
  cardId: 'PRB02-009',
  textHash: '1ba3bbe5b9ab7a',
  verified: {
    source: 'cards/overrides/PRB02-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'rested',
      label:
        "When this Character is rested by your opponent's effect, you may trash this Character and draw 2 cards",
      kind: 'auto',
      when: [{ event: 'rested', owner: 'you', filter: { isSelf: true }, by: 'opponentEffect' }],
      effect: [
        {
          may: [
            {
              do: {
                move: {
                  what: { from: 'characters', owner: 'you', filter: { isSelf: true } },
                  to: { zone: 'trash' },
                },
              },
            },
            { do: { draw: 2 } },
          ],
          label: 'trash',
        },
      ],
    },
  ],
  rulings: [
    'reading: "You may trash this Character and draw 2 cards" has no colon; it is one optional unit (a `may` of the trash and the draw), not a cost: nothing is drawn unless the player accepts',
    'M6b-Q30/Q41: "rested by your opponent\'s effect" is a rest by an effect of the opponent (any source); an attack, a block or a cost does not count; a Character already rested is not rested again',
  ],
};
