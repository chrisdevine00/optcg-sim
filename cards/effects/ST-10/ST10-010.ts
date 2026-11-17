import type { CardScript } from '../../src/dsl.ts';

/** ST10-010 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST10_010: CardScript = {
  cardId: 'ST10-010',
  textHash: '183c0f66445a38',
  verified: {
    source: 'cards/overrides/ST10-010.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -1: if your opponent has 7 or more cards in hand, they trash 2',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              7,
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'you',
                  blind: true,
                  pick: {
                    exactly: 2,
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
    'QA-ST10 ST10-010 (E-Q5): the player who activated it chooses the 2 cards face-down (here: at random), not the opponent; the 7-card condition is checked on resolution, after the DON!! -1 is paid',
  ],
};
