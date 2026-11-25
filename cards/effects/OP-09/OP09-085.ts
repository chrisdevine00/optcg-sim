import type { CardScript } from '../../src/dsl.ts';

/** OP09-085 Gecko Moria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_085: CardScript = {
  cardId: 'OP09-085',
  textHash: '1fb3b5e5ef3b4b',
  verified: {
    source: 'cards/overrides/OP09-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 2 or less from your trash rested',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Thriller Bark Pirates',
                    },
                    {
                      cost: {
                        lte: 2,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the cost bound is the card's printed cost in the trash (cost 2 is the boundary); the played Character enters rested",
  ],
};
