import type { CardScript } from '../../src/dsl.ts';

/** OP11-072 Charlotte Mont-d'or. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_072: CardScript = {
  cardId: 'OP11-072',
  textHash: '07d0b513464626',
  verified: {
    source: 'cards/overrides/OP11-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'DON!! -1, rest this Character: your opponent places 2 cards from their trash at the bottom of their deck; then add 1 Life card from the top to your hand',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          donMinus: 1,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'opponent',
                chooser: 'opponent',
                pick: {
                  exactly: 2,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
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
    'reading: "Then" is not "if you do": the Life card is added even if the opponent has fewer than 2 cards in their trash (they place as many as they can); the Life card is mandatory and the top card, with an empty Life nothing happens',
  ],
};
