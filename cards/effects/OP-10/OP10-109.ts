import type { CardScript } from '../../src/dsl.ts';

/** OP10-109 Basil Hawkins. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_109: CardScript = {
  cardId: 'OP10-109',
  textHash: '15c711651a597a',
  verified: {
    source: 'cards/overrides/OP10-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "Trash up to 1 card from the top of your opponent's Life cards",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'trash',
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
    'reading: the Life card is trashed, not damage: no [Trigger] activates (OP-wave 4 G30)',
  ],
};
