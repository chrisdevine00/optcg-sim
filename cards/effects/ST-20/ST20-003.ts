import type { CardScript } from '../../src/dsl.ts';

/** ST20-003 Charlotte Brulee. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST20_003: CardScript = {
  cardId: 'ST20-003',
  textHash: '05ea62b494f8a1',
  verified: {
    source: 'cards/overrides/ST20-003.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        "Look at up to 1 card from the top of your or your opponent's Life cards and place it at the top or bottom of the Life cards; add this card to your hand",
      kind: 'trigger',
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
            move: {
              what: {
                from: 'self',
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G64, G57): the look is "up to 1" (declined by choosing none); "Then, add this card to your hand" does not depend on the look, as OP12-109: the card goes to the hand either way',
  ],
};
