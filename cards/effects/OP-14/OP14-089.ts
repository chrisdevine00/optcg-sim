import type { CardScript } from '../../src/dsl.ts';

/** OP14-089 Ryuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_089: CardScript = {
  cardId: 'OP14-089',
  textHash: '16ec3f85b98d8b',
  verified: {
    source: 'cards/overrides/OP14-089.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 2 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
      ],
    },
    {
      id: 'trigger',
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 4 or less from your trash rested',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Thriller Bark Pirates' },
                    { cost: { lte: 4 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
