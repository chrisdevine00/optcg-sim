import type { CardScript } from '../../src/dsl.ts';

/** OP11-054 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_054: CardScript = {
  cardId: 'OP11-054',
  textHash: '1d0f539c2cb44a',
  verified: {
    source: 'cards/overrides/OP11-054.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is multicolored, draw 3 cards and place 2 cards from your hand at the top or bottom of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              multicolor: true,
            },
          },
          then: [
            {
              do: {
                draw: 3,
              },
            },
            {
              do: {
                move: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    pick: {
                      exactly: 2,
                    },
                  },
                  to: {
                    zone: 'deck',
                    position: 'topOrBottom',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'DECISIONS 2026-11-16: topOrBottom is one choice for all the cards placed, then they go in the order picked',
  ],
};
