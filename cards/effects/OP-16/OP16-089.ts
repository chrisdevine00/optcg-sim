import type { CardScript } from '../../src/dsl.ts';

/** OP16-089 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_089: CardScript = {
  cardId: 'OP16-089',
  textHash: '1a80b25c251a97',
  verified: {
    source: 'cards/overrides/OP16-089.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'on-play',
      label: "Draw 2, trash 2; give up to 1 of your opponent's Characters -4 cost during this turn",
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
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 2,
              },
            },
          },
        },
        {
          do: {
            cost: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -4,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
