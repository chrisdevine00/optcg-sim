import type { CardScript } from '../../src/dsl.ts';

/** OP05-098 Enel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP05_098: CardScript = {
  cardId: 'OP05-098',
  textHash: '166455dcb9a5be',
  verified: {
    source: 'cards/overrides/OP05-098.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'life-zero',
      label: 'Add 1 deck card to your Life, then trash 1 card from your hand',
      kind: 'auto',
      when: [
        {
          event: 'lifeBecameZero',
          owner: 'you',
        },
      ],
      oncePerTurn: true,
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
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
    'RL-42 / QA-OP05 OP05-098 (four rows), QA-OP11 OP11-102: fires after all damage processing; after a Life [Trigger]; once per turn; empty hand trashes nothing',
  ],
};
