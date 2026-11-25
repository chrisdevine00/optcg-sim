import type { CardScript } from '../../src/dsl.ts';

/** OP10-119 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_119: CardScript = {
  cardId: 'OP10-119',
  textHash: '19bef818e85496',
  verified: {
    source: 'cards/overrides/OP10-119.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal up to 1 {Supernovas} Character card from your hand and add it to the top of your Life face-down; then give up to 1 rested DON!! to your {Supernovas} Leader',
      kind: 'auto',
      when: ['onPlay'],
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
                  ],
                },
                pick: {
                  upTo: 1,
                },
                reveal: true,
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
                filter: {
                  type: 'Supernovas',
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the DON!! is given even when no Character was added; the pick is asked at max 0 when no match is in hand (hidden-gate)',
    'reading: the chosen card is revealed to the opponent (a CardRevealed event, reason effect) and then goes face-down to the top of Life as the text says (B3B-R3)',
    'reading: the rested DON!! comes from the cost area; it does nothing when the Leader is not {Supernovas} or no rested DON!! is available',
  ],
};
