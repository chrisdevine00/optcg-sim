import type { CardScript } from '../../src/dsl.ts';

/** OP10-107 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_107: CardScript = {
  cardId: 'OP10-107',
  textHash: '13d1670d961f6e',
  verified: {
    source: 'cards/overrides/OP10-107.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Add 1 card from the top or bottom of your Life cards to your hand: add up to 1 Supernovas Character with a cost of 5 from your hand to the top of your Life cards face-up',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Supernovas',
                    },
                    {
                      cost: {
                        eq: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
                faceUp: true,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a cost of 5" is exactly 5 (not 5 or less); the card just added from Life may be the one put back',
  ],
};
