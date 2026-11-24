import type { CardScript } from '../../src/dsl.ts';

/** EB05-021 Alvida. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_021: CardScript = {
  cardId: 'EB05-021',
  textHash: '0d9cf0259ec9a9',
  verified: {
    source: 'cards/overrides/EB05-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 2, play up to 1 {Cross Guild} Character cost 8 or less from hand; then you cannot play Characters this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Cross Guild',
                    },
                    {
                      cost: {
                        lte: 8,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
        {
          do: {
            restrict: {
              target: 'you',
              what: {
                cannotPlay: {
                  category: ['Character'],
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "Negate the effect of up to 1 of your opponent's Characters this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            negate: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, you cannot play Character cards" is unconditional (not gated by the play having happened); it follows the draw and the optional play',
  ],
};
