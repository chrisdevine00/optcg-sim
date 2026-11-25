import type { CardScript } from '../../src/dsl.ts';

/** OP10-116 Damned Punk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_116: CardScript = {
  cardId: 'OP10-116',
  textHash: '16d448a617112a',
  verified: {
    source: 'cards/overrides/OP10-116.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Look at up to 1 card from the top of your or your opponent's Life cards and place it at the top or bottom of the Life cards. Then, K.O. up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtLife: {
              owner: 'any',
              n: 1,
              place: 'topOrBottom',
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
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
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G64): the look is "up to 1", so you may look at none; "Then" follows the look as a step of the same [Main]: the K.O. happens whether or not you looked, since the look cannot fail',
    'reading: the K.O. target, "up to 1" of the opponent\'s Characters with a cost of 5 or less, is chosen when the effect resolves',
    'reading: the [Trigger] draws 2 and then trashes exactly 1 card from your hand (not "up to"; with an empty hand nothing)',
  ],
};
