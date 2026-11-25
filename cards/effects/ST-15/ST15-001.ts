import type { CardScript } from '../../src/dsl.ts';

/** ST15-001 Atmos. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST15_001: CardScript = {
  cardId: 'ST15-001',
  textHash: '0d36abed13e145',
  verified: {
    source: 'cards/overrides/ST15-001.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'no-life-to-hand',
      label:
        '[When Attacking] If your Leader is [Edward.Newgate], you cannot add Life cards to your hand using your own effects during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            leader: {
              name: 'Edward.Newgate',
            },
          },
          then: [
            {
              do: {
                restrict: {
                  target: 'you',
                  what: 'cannotAddLifeToHandByOwnEffects',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G60, M6b-Q77): the "If" has no colon, so it is an effect condition; the bar covers your own effects including a cost that adds a Life card to your hand (M6b-Q31) and lasts the turn; damage and the opponent\'s effects are not stopped',
  ],
};
